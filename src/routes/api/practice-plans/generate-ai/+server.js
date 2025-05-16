import { json } from '@sveltejs/kit';
import {
	ANTHROPIC_API_KEY,
	OPENAI_API_KEY,
	GOOGLE_VERTEX_PROJECT,
	GOOGLE_VERTEX_LOCATION
	// GOOGLE_APPLICATION_CREDENTIALS will be used by the Vertex SDK if set in the environment
} from '$env/static/private';
import { generateObject } from 'ai'; // Correct import
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createVertex } from '@ai-sdk/google-vertex';
import { drillService } from '$lib/server/services/drillService';
import { z } from 'zod';
import { kyselyDb } from '$lib/server/db';
import { sql } from 'kysely';
import fs from 'fs';
import path from 'path';
// Removed: import Anthropic from '@anthropic-ai/sdk';
// Removed: import { DatabaseError } from '$lib/server/errors.js'; (assuming not used elsewhere in this snippet after changes)

// --- Rate Limiting Configuration ---
const MAX_AI_PLAN_REQUESTS = 100; // Max requests per window
const AI_PLAN_WINDOW_SECONDS = 60 * 60 * 24; // 24 hour window

// Input validation schema
const ParameterSchema = z.object({
	durationMinutes: z.number().int().positive().optional(),
	goals: z.string().min(3).max(200).optional(),
	skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
	participantCount: z.number().int().positive().optional(),
	focusAreas: z.array(z.string().min(1).max(50)).optional(),
	modelId: z.enum(['claude-3.7-sonnet', 'gpt-4.1', 'gemini-2.5-pro']) // Added modelId
});

// Basic validation for the structure we expect back from the AI
const GeneratedPlanSchema = z.object({
	// Root level fields, matching createPracticePlanSchema expectations more closely
	name: z.string().min(1, 'Plan name is required'),
	description: z.string().optional(),
	phase_of_season: z.string().nullable().optional(), // AI might not always provide this, make optional
	estimated_number_of_participants: z.number().int().positive().nullable().optional(),
	practice_goals: z.array(z.string().min(1, 'Goal cannot be empty')), // Expecting an array of strings
	visibility: z.enum(['public', 'private', 'unlisted']).default('private'), // Default for new plans
	is_editable_by_others: z.boolean().default(false), // Default for new plans
	// user_id: z.string(), // user_id will be set by the server/session, not expected from AI directly in this structure.

	sections: z
		.array(
			z.object({
				name: z.string().min(1),
				// duration_minutes: z.number().int().positive(), // Section duration is calculated or implicit
				notes: z.string().optional(), // Renamed from description to notes
				// goals: z.array(z.string()).optional(), // Section goals can be added if AI can provide them
				items: z
					.array(
						z.object({
							type: z.enum(['activity', 'drill', 'break']), // Keep 'activity' as AI uses it. Map to 'one-off' or 'drill' later if needed.
							name: z.string().min(1),
							duration: z.number().int().positive(), // Renamed from duration_minutes
							drill_id: z.number().int().positive().nullable().optional(),
							parallel_group_id: z.string().nullable().optional()
						})
					)
					.min(1, 'Each section must have at least one item')
			})
		)
		.min(1, 'A practice plan must have at least one section')
});

// --- Model Mapping ---
const MODEL_MAP = {
	'claude-3.7-sonnet': {
		provider: 'anthropic',
		id: 'claude-3.7-sonnet-20250219' // User specified
	},
	'gpt-4.1': {
		provider: 'openai',
		id: 'gpt-4.1-2025-04-14' // User specified, may need adjustment if not available
	},
	'gemini-2.5-pro': {
		provider: 'vertex',
		id: 'gemini-2.5-pro-preview-05-06' // User specified
	}
};

// --- BEGIN ADDED CODE FOR GOOGLE AUTH ---
// Check if the base64 encoded env var exists
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
	try {
		// Decode the base64 string
		const decodedKey = Buffer.from(
			process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64,
			'base64'
		).toString('utf-8');

		// Define the path for the temporary key file in Vercel's writable directory
		const keyFilePath = path.join('/tmp', 'service-account-key.json');

		// Write the decoded key to the temporary file
		fs.writeFileSync(keyFilePath, decodedKey);

		// Set the GOOGLE_APPLICATION_CREDENTIALS environment variable for the current process
		// The Google Auth library will pick this up
		process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilePath;

		console.log(
			'[Auth Setup] Successfully set GOOGLE_APPLICATION_CREDENTIALS from base64 env var to:',
			keyFilePath
		);
	} catch (error) {
		console.error(
			'[Auth Setup] CRITICAL: Failed to decode/write GOOGLE_APPLICATION_CREDENTIALS_BASE64:',
			error
		);
		// Depending on your error handling strategy, you might want to:
		// - Throw an error to prevent the function from proceeding without auth
		// - Log and let it fail later (as it currently does)
		// For now, it will log and the subsequent GoogleAuth call will likely fail as before, but with this log for context.
	}
} else {
	console.warn(
		'[Auth Setup] GOOGLE_APPLICATION_CREDENTIALS_BASE64 environment variable not found.'
	);
	// The application will attempt to use other ADC methods, which will likely fail in Vercel if this was the intended auth method.
}
// --- END ADDED CODE FOR GOOGLE AUTH ---

export async function POST({ request, locals }) {
	const user = locals.user;

	// --- Rate Limiting Check (Logged-in users only) ---
	if (user) {
		try {
			const now = new Date();
			const windowDurationMs = AI_PLAN_WINDOW_SECONDS * 1000;
			const rateLimitCheckResult = await kyselyDb.transaction().execute(async (trx) => {
				const userResult = await trx
					.selectFrom('users')
					.select([
						'ai_plan_requests_count',
						'ai_plan_window_start',
						'cumulative_ai_plan_requests_count'
					])
					.where('id', '=', user.id)
					.executeTakeFirst();

				if (!userResult) {
					console.error(`Rate limit check failed: User not found for id ${user.id}`);
					return { allowed: false, status: 500, message: 'Internal server error.' };
				}
				let { ai_plan_requests_count: count, ai_plan_window_start: windowStart } = userResult;
				if (!windowStart || now.getTime() - new Date(windowStart).getTime() > windowDurationMs) {
					count = 0;
					windowStart = now;
				}
				if (count >= MAX_AI_PLAN_REQUESTS) {
					console.warn(`Rate limit exceeded for user ${user.id}`);
					return {
						allowed: false,
						status: 429,
						message: 'Rate limit exceeded. Please try again later.'
					};
				}
				await trx
					.updateTable('users')
					.set({
						ai_plan_requests_count: count + 1,
						ai_plan_window_start: windowStart,
						cumulative_ai_plan_requests_count: sql`cumulative_ai_plan_requests_count + 1`
					})
					.where('id', '=', user.id)
					.execute();
				return { allowed: true };
			});
			if (!rateLimitCheckResult.allowed) {
				return json(
					{ error: rateLimitCheckResult.message },
					{ status: rateLimitCheckResult.status }
				);
			}
		} catch (dbError) {
			console.error('Database error during rate limiting check:', dbError);
			return json({ error: 'Failed to check usage limits.' }, { status: 500 });
		}
	} else {
		console.log('Skipping rate limit check for anonymous user.');
	}

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const requestBody = await request.json();
		const validationResult = ParameterSchema.safeParse(requestBody.parameters);
		if (!validationResult.success) {
			console.error('Invalid input parameters:', validationResult.error.flatten());
			return json(
				{ error: 'Invalid input parameters.', issues: validationResult.error.flatten() },
				{ status: 400 }
			);
		}
		const parameters = validationResult.data;
		const selectedModelInfo = MODEL_MAP[parameters.modelId];

		console.log('Received valid parameters for AI generation:', parameters);

		// --- Initialize AI SDK Provider ---
		let llm;
		if (selectedModelInfo.provider === 'anthropic') {
			if (!ANTHROPIC_API_KEY) {
				console.error('Anthropic API key is not configured.');
				return json(
					{ error: 'AI generation service (Anthropic) not configured.' },
					{ status: 500 }
				);
			}
			const anthropic = createAnthropic({ apiKey: ANTHROPIC_API_KEY });
			llm = anthropic(selectedModelInfo.id);
		} else if (selectedModelInfo.provider === 'openai') {
			if (!OPENAI_API_KEY) {
				console.error('OpenAI API key is not configured.');
				return json({ error: 'AI generation service (OpenAI) not configured.' }, { status: 500 });
			}
			const openai = createOpenAI({ apiKey: OPENAI_API_KEY });
			llm = openai(selectedModelInfo.id);
		} else if (selectedModelInfo.provider === 'vertex') {
			// GOOGLE_APPLICATION_CREDENTIALS should be set in the environment for Node.js
			// For Edge, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY would be needed.
			// The SDK handles this.
			if (!GOOGLE_VERTEX_PROJECT || !GOOGLE_VERTEX_LOCATION) {
				console.error('Google Vertex project or location is not configured.');
				return json({ error: 'AI generation service (Vertex) not configured.' }, { status: 500 });
			}
			const vertex = createVertex({
				project: GOOGLE_VERTEX_PROJECT,
				location: GOOGLE_VERTEX_LOCATION
			});
			llm = vertex(selectedModelInfo.id);
		} else {
			console.error('Invalid model provider specified.');
			return json({ error: 'Invalid AI model provider.' }, { status: 500 });
		}

		let allDrillDetails = [];
		try {
			allDrillDetails = await drillService.getAllDrillDetailsForAI(user?.id);
			console.log(`Fetched details for ${allDrillDetails.length} existing drills for AI context.`);
		} catch (fetchError) {
			console.error('Failed to fetch drill details for AI prompt:', fetchError);
			return json(
				{ error: 'Failed to load necessary drill data for AI generation.' },
				{ status: 500 }
			);
		}

		const drillContextJson = JSON.stringify(allDrillDetails, null, 2);
		const estimatedTokens = Math.ceil(drillContextJson.length / 3.5);
		console.log(`Estimated token count for drill context: ${estimatedTokens}`);

		const systemPrompt = `You are an expert quadball coach. Generate a practice plan based on the user's specifications and the provided list of available drills.

Output the plan ONLY in JSON format, matching this EXACT structure:
{
  "name": "Generated Practice Plan Name",
  "description": "Optional: AI-generated plan based on user inputs.",
  "phase_of_season": null, // Or one of: "Offseason", "Early season, new players", "Mid season, skill building", "Tournament tuneup", "End of season, peaking"
  "estimated_number_of_participants": ${parameters.participantCount || 15},
  "practice_goals": ["Goal 1 as a string", "Goal 2 as a string"], // User goals as an array of strings. Original was: "${parameters.goals || 'General improvement'}"
  "visibility": "private", // Default to 'private' for new plans
  "is_editable_by_others": false, // Default to false for new plans
  // "user_id" should NOT be included by the AI in the output JSON.
  "sections": [
    {
      "name": "Warmup",
      // "duration_minutes" at the section level should NOT be included.
      "notes": "Optional: Dynamic stretching and light throwing.", // Renamed from description
      // "goals" at the section level can be omitted or an empty array if not applicable.
      "items": [
        { "type": "activity", "name": "Dynamic Stretching", "duration": 10, "drill_id": null, "parallel_group_id": null }, // "duration" not "duration_minutes"
        { "type": "drill", "name": "Basic Passing", "duration": 5, "drill_id": 101, "parallel_group_id": null }
      ]
    },
    {
      "name": "Positional Skill Work",
      "notes": "Optional: Beaters and Chasers work on different skills simultaneously, then come together.",
      "items": [
        // Parallel Block: Beaters (15 + 10 = 25 min), Chasers (20 + 5 = 25 min). This block runs for 25 minutes.
        // Ensure "duration" is used for items.
        { "type": "drill", "name": "Beater Dodgeball Precision", "duration": 15, "drill_id": 301, "parallel_group_id": "beaters" },
        { "type": "drill", "name": "Beater Zone Clearing", "duration": 10, "drill_id": 303, "parallel_group_id": "beaters" },

        { "type": "drill", "name": "Chaser 1v1 Offense", "duration": 20, "drill_id": 302, "parallel_group_id": "chasers" },
        { "type": "activity", "name": "Chaser Passing Triangle", "duration": 5, "drill_id": 304, "parallel_group_id": "chasers" },

        { "type": "activity", "name": "Conditioning Game", "duration": 15, "parallel_group_id": null }
      ]
    }
    // ... more sections and items as appropriate for the plan
  ]
}

Available Drills (use these for 'drill' type items, providing their 'id' as 'drill_id'):
${drillContextJson}

User's original goals (interpret these and formulate into the 'practice_goals' array): "${parameters.goals || 'General improvement'}"
User's focus areas (prioritize drills matching these): ${JSON.stringify(parameters.focusAreas || [])}

Constraints:
- The final JSON output MUST strictly adhere to the structure shown above.
- For items with \`type: "drill"\`, if you use an existing drill from the "Available Drills" list, include its \`id\` as the \`drill_id\`.
- If an item is a generic activity not from the list (e.g., "Dynamic Stretching", "Water Break"), set \`type: "activity"\` and \`drill_id: null\`.
- The \`visibility\` should be "private" and \`is_editable_by_others\` should be false.
- DO NOT include \`user_id\` in the output.
- DO NOT include \`duration_minutes\` at the section level. Item durations should be under the \`duration\` key.
- Ensure \`practice_goals\` is an array of strings.
- Section descriptions should be under the \`notes\` key.

Regarding \`parallel_group_id\`:
- Use \`parallel_group_id\` to designate different groups of players (e.g., "beaters", "chasers", "keepers", "group_A") performing distinct sequences of activities simultaneously within the same section.
- All items within a section that share the *same* \`parallel_group_id\` (e.g., all items for "beaters") are performed sequentially by that group.
- **Crucially**: For any given period of parallel work within a section, the sum of \`duration\` for all items assigned to one \`parallel_group_id\` (e.g., total time for "beaters" track) MUST be equal to the sum of \`duration\` for all items assigned to any other \`parallel_group_id\` that is active at the same time (e.g., total time for "chasers" track). This common sum represents the duration of that block of parallel activities.
- A section can have multiple such parallel blocks. Items with \`parallel_group_id: null\` (or omitted) represent full-team activities occurring before, between, or after parallel blocks.
// - The overall \`duration_minutes\` for a section (which you should NOT output) would be the sum of the durations of its full-team activities and the duration of each distinct parallel block it contains.
- Do not include item 'details' in the output beyond what's specified in the structure.

The total duration of all items should be close to the user's requested plan duration: ${parameters.durationMinutes || 90} minutes.
The plan should be suitable for skill level: "${parameters.skillLevel || 'intermediate'}" and participant count: ${parameters.participantCount || 15}.
Ensure the output is valid JSON; it will be parsed with JSON.parse(). Do NOT include any markdown formatting like \`\`\`json or \`\`\` around the JSON output.
Provide ONLY the JSON object as output.`;

		const userMessageContent = `Generate a practice plan.
User an array of strings for 'practice_goals'.
Use 'notes' for section descriptions.
Use 'duration' for item durations.
Do not include 'user_id' or section-level 'duration_minutes'.
Key parameters:
Duration: ${parameters.durationMinutes || 'Not specified'} minutes
Skill Level: ${parameters.skillLevel || 'Not specified'}
Participant Count: ${parameters.participantCount || 'Not specified'}
Goals to interpret: ${parameters.goals || 'Not specified'}
Focus Areas: ${parameters.focusAreas?.join(', ') || 'Not specified'}`;

		console.log(
			`Sending request to ${selectedModelInfo.provider} model: ${selectedModelInfo.id}...`
		);

		// Using generateObject from Vercel AI SDK
		const {
			object: rawGeneratedJson,
			usage,
			finishReason,
			warnings
		} = await generateObject({
			model: llm,
			schema: GeneratedPlanSchema, // Your Zod schema for the expected output
			prompt: userMessageContent, // User message can go here
			system: systemPrompt, // System prompt for overall instructions
			maxTokens: 8000 // Increased from 2500
			// temperature: 0.3, // Example: for more deterministic output
		});

		console.log('Received response from AI SDK.');
		console.log('AI Usage:', usage);
		console.log('Finish Reason:', finishReason);
		if (warnings) console.warn('AI Warnings:', warnings);

		// Log the raw JSON before validation (it's already parsed by generateObject)
		console.log('Parsed AI Response JSON:', JSON.stringify(rawGeneratedJson, null, 2));

		// Validation against Zod schema is implicitly handled by generateObject if schema is strict.
		// However, generateObject returns the object directly, so planValidation is not needed in the same way.
		// The `rawGeneratedJson` should already conform to `GeneratedPlanSchema`.
		const generatedPlan = rawGeneratedJson; // Already parsed and should be type-safe

		// Since the AI is now expected to return the correct structure (including drill_id),
		// the primary validation is handled by `generateObject` and `GeneratedPlanSchema`.
		// We still need to verify that any `drill_id` provided by the AI is valid.

		const validDrillIds = new Set(allDrillDetails.map((d) => d.id));
		let invalidDrillIdFound = null;

		generatedPlan.sections.forEach((section) => {
			section.items.forEach((item) => {
				if (item.type === 'drill' && item.drill_id !== null && item.drill_id !== undefined) {
					if (!validDrillIds.has(item.drill_id)) {
						console.warn(
							`AI returned invalid drill_id ${item.drill_id} for item "${item.name}". This ID was not in the provided context.`
						);
						invalidDrillIdFound = item.drill_id;
					} else {
						// Verify and correct name if drill_id is valid
						const expectedDrill = allDrillDetails.find((d) => d.id === item.drill_id);
						if (expectedDrill && expectedDrill.name !== item.name) {
							console.warn(
								`AI hallucination: Drill ID ${item.drill_id} expected name "${expectedDrill.name}", but AI returned "${item.name}". Correcting name.`
							);
							item.name = expectedDrill.name;
						}
					}
				}
			});
		});

		if (invalidDrillIdFound !== null) {
			// It's better to inform the user that the AI made a mistake with a specific ID from its given context.
			return json(
				{
					error: `AI generation error: The model referenced a drill (ID: ${invalidDrillIdFound}) that was not part of its available drill information. Please try generating again, or adjust parameters.`
				},
				{ status: 400 }
			);
		}

		console.log(
			'Skipping name-to-ID mapping as AI should provide IDs and generateObject provides structured output.'
		);

		// user_id is not expected from the AI anymore with the new schema.
		// It will be handled by the backend API when saving the plan, using the session user.
		/*
		if (generatedPlan.planDetails.user_id !== user.id) {
			console.warn(`AI generated plan had user_id ${generatedPlan.planDetails.user_id}, but logged in user is ${user.id}. Overriding.`);
			generatedPlan.planDetails.user_id = user.id;
		}
		*/

		return json(generatedPlan, { status: 200 });
	} catch (error) {
		// Check for AI SDK specific errors or general errors
		// The Vercel AI SDK might throw errors with specific structures.
		// For now, a general catch. You might want to refine this.
		let statusCode = 500;
		let message = 'An unexpected error occurred during AI plan generation.';

		// Basic check for common AI related status codes if available in error
		if (error.status === 401) {
			statusCode = 401;
			message = 'AI service authentication failed. Check API Key or credentials.';
		}
		if (error.status === 429) {
			statusCode = 429;
			message = 'AI service rate limit exceeded.';
		}
		if (error.status === 503) {
			statusCode = 503;
			message = 'AI service unavailable.';
		}
		if (error.status === 400) {
			// Potentially from API due to bad request (e.g. unsupported model, bad prompt)
			statusCode = 400;
			message = `AI service request invalid or content rejected: ${error.message || 'Bad request to AI model.'}`;
		}

		if (error.name === 'AIError') {
			// Generic AI SDK error
			console.error('Vercel AI SDK Error:', error);
			message = error.message || message; // Use SDK message if available
			if (error.type === 'গুলে_authentication') statusCode = 401;
			if (error.type === 'model_not_found') statusCode = 400;
		} else if (error instanceof z.ZodError) {
			console.error('Zod validation error (likely request body):', error.flatten());
			message = 'Invalid request format.';
			statusCode = 400;
			return json({ error: message, issues: error.flatten() }, { status: statusCode });
		} else if (error instanceof SyntaxError && error.message.includes('JSON')) {
			// This is for request.json() parsing error
			console.error('JSON parsing error in request body:', error);
			message = 'Invalid request format (malformed JSON).';
			statusCode = 400;
			return json({ error: message }, { status: statusCode });
		} else {
			console.error('Unexpected error during AI plan generation:', error);
		}

		return json({ error: message }, { status: statusCode });
	}
}
