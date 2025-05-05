import { json } from '@sveltejs/kit';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import Anthropic from '@anthropic-ai/sdk';
import { drillService } from '$lib/server/services/drillService';
import { z } from 'zod';
import { kyselyDb } from '$lib/server/db'; // Import database client

// --- Rate Limiting Configuration ---
const MAX_AI_PLAN_REQUESTS = 100; // Max requests per window
const AI_PLAN_WINDOW_SECONDS = 60 * 60 * 24; // 24 hour window

// Input validation schema
const ParameterSchema = z.object({
	durationMinutes: z.number().int().positive().optional(),
	goals: z.string().min(3).max(200).optional(),
	skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
	participantCount: z.number().int().positive().optional(),
	focusAreas: z.array(z.string().min(1).max(50)).optional()
});

// Basic validation for the structure we expect back from the AI
// This could be much more detailed
const GeneratedPlanSchema = z.object({
	planDetails: z.object({
		name: z.string().min(1),
		description: z.string().optional(),
		duration_minutes: z.number().int().positive(),
		skill_level: z.string().optional(),
		participant_count: z.number().int().positive().optional(),
		goals: z.string().optional(),
		focus_areas: z.array(z.string()).optional(),
		user_id: z.string() // Ensure user_id is present
	}),
	sections: z.array(z.object({
		name: z.string().min(1),
		duration_minutes: z.number().int().positive(),
		description: z.string().optional(),
		items: z.array(z.object({
			type: z.enum(['activity', 'drill']),
			name: z.string().min(1),
			duration_minutes: z.number().int().positive(),
			details: z.string().optional(),
			// drill_id will be added later if matched
			drill_id: z.number().int().positive().nullable().optional()
		}))
	}))
});

export async function POST({ request, locals }) {
	const user = locals.user;

	// --- Rate Limiting Check (Logged-in users only) ---
	if (user) {
		try {
			const now = new Date();
			const windowDurationMs = AI_PLAN_WINDOW_SECONDS * 1000;

			// Use a transaction for read-then-write consistency
			const rateLimitCheckResult = await kyselyDb.transaction().execute(async (trx) => {
				// Fetch current user rate limit status using Kysely transaction (trx)
				const userResult = await trx
					.selectFrom('users')
					.select([
						'ai_plan_requests_count',
						'ai_plan_window_start',
						'cumulative_ai_plan_requests_count'
					])
					.where('id', '=', user.id)
					.executeTakeFirst(); // Kysely equivalent of oneOrNone

				if (!userResult) {
					// Should not happen if user exists, but handle defensively
					console.error(`Rate limit check failed: User not found for id ${user.id}`);
					return { allowed: false, status: 500, message: 'Internal server error.' };
				}

				let { ai_plan_requests_count: count, ai_plan_window_start: windowStart, cumulative_ai_plan_requests_count: cumulativeCount } = userResult;
				let resetWindow = false;

				// Check if the window needs resetting
				if (!windowStart || (now.getTime() - new Date(windowStart).getTime()) > windowDurationMs) {
					count = 0;
					windowStart = now;
					resetWindow = true;
				}

				// Check if limit exceeded
				if (count >= MAX_AI_PLAN_REQUESTS) {
					console.warn(`Rate limit exceeded for user ${user.id}`);
					return { allowed: false, status: 429, message: 'Rate limit exceeded. Please try again later.' };
				}

				// If allowed, increment count and update window start if necessary
				// Also increment the cumulative count
				// Refactor UPDATE using Kysely transaction (trx)
				await trx
					.updateTable('users')
					.set({
						ai_plan_requests_count: count + 1,
						ai_plan_window_start: windowStart,
						// Kysely needs a way to reference existing column value for increment
						// Using sql template for this specific case
						cumulative_ai_plan_requests_count: kyselyDb.raw('cumulative_ai_plan_requests_count + 1')
					})
					.where('id', '=', user.id)
					.execute(); // Kysely equivalent of none

				return { allowed: true };
			});

			if (!rateLimitCheckResult.allowed) {
				return json({ error: rateLimitCheckResult.message }, { status: rateLimitCheckResult.status });
			}

		} catch (dbError) {
			console.error('Database error during rate limiting check:', dbError);
			return json({ error: 'Failed to check usage limits.' }, { status: 500 });
		}
	} else {
		// Currently, anonymous users are not rate-limited with this DB approach
		console.log('Skipping rate limit check for anonymous user.');
	}

	if (!user) {
		// Keep the unauthorized check (although rate limiting doesn't apply to anon here)
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const requestBody = await request.json();

		// --- Validate Input Parameters ---
		const validationResult = ParameterSchema.safeParse(requestBody.parameters);
		if (!validationResult.success) {
			console.error('Invalid input parameters:', validationResult.error.flatten());
			return json({ error: 'Invalid input parameters.', issues: validationResult.error.flatten() }, { status: 400 });
		}
		const parameters = validationResult.data;

		console.log('Received valid parameters for AI generation:', parameters);

		if (!ANTHROPIC_API_KEY) {
			console.error('Anthropic API key is not configured.');
			return json({ error: 'AI generation service not configured.' }, { status: 500 });
		}

		const anthropic = new Anthropic({
			apiKey: ANTHROPIC_API_KEY
		});

		// --- Fetch existing drill names for mapping ---
		const existingDrills = await drillService.getAllDrillNames();
		const drillNameMap = new Map(existingDrills.map(d => [d.name.toLowerCase(), d.id]));
		console.log(`Fetched ${existingDrills.length} existing drill names for mapping.`);

		// --- Construct the prompt for Anthropic ---
		const systemPrompt = `You are an expert ultimate frisbee coach. Generate a practice plan based on the user's specifications. Output the plan ONLY in JSON format, matching this structure:
{
  "planDetails": {
    "name": "Generated Practice Plan",
    "description": "AI-generated plan based on user inputs.",
    "duration_minutes": ${parameters.durationMinutes || 90},
    "skill_level": "${parameters.skillLevel || 'intermediate'}",
    "participant_count": ${parameters.participantCount || 15},
    "goals": "${parameters.goals || 'General improvement'}",
    "focus_areas": ${JSON.stringify(parameters.focusAreas || ['throwing', 'cutting'])},
    "user_id": "${user.id}"
  },
  "sections": [
    {
      "name": "Warmup",
      "duration_minutes": 15,
      "description": "Dynamic stretching and light throwing.",
      "items": [
        { "type": "activity", "name": "Dynamic Stretching", "duration_minutes": 10, "details": "Jogging, high knees, etc." },
        { "type": "activity", "name": "Light Throwing", "duration_minutes": 5, "details": "Partner throwing." },
        { "type": "drill", "name": "Box Drill", "duration_minutes": 20, "details": "Focus on quick cuts and throws." }
      ]
    }
  ]
}
Provide ONLY the JSON object. Ensure total section duration is close to plan duration. Prioritize drills for focus_areas.`;

		const userMessage = `Generate a practice plan with the following parameters:
Duration: ${parameters.durationMinutes || 'Not specified'} minutes
Skill Level: ${parameters.skillLevel || 'Not specified'}
Participant Count: ${parameters.participantCount || 'Not specified'}
Goals: ${parameters.goals || 'Not specified'}
Focus Areas: ${parameters.focusAreas?.join(', ') || 'Not specified'}`;

		console.log('Sending request to Anthropic...');
		const msg = await anthropic.messages.create({
			model: 'claude-3-haiku-20240307',
			max_tokens: 2500,
			system: systemPrompt,
			messages: [{ role: 'user', content: userMessage }]
		});

		console.log('Received response from Anthropic.');

		let rawGeneratedJson;
		try {
			const responseText = msg.content[0].text;
			const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
			if (jsonMatch && jsonMatch[1]) {
				rawGeneratedJson = JSON.parse(jsonMatch[1]);
			} else {
				rawGeneratedJson = JSON.parse(responseText);
			}
		} catch (parseError) {
			console.error('Failed to parse JSON response from Anthropic:', parseError);
			console.error('Raw response text:', msg.content[0].text);
			return json({ error: 'AI generation failed: Invalid format received.' }, { status: 500 });
		}

		// --- Validate the structure received from AI ---
		const planValidation = GeneratedPlanSchema.safeParse(rawGeneratedJson);
		if (!planValidation.success) {
			console.error('Invalid structure received from AI:', planValidation.error.flatten());
			console.error('Raw JSON data:', JSON.stringify(rawGeneratedJson, null, 2));
			return json({ error: 'AI generation failed: Invalid data structure received.' }, { status: 500 });
		}

		const generatedPlan = planValidation.data;

		// --- Map Drill Names to IDs ---
		let drillsMapped = 0;
		generatedPlan.sections.forEach(section => {
			section.items.forEach(item => {
				if (item.type === 'drill') {
					const drillId = drillNameMap.get(item.name.toLowerCase().trim());
					if (drillId) {
						item.drill_id = drillId;
						drillsMapped++;
					} else {
						item.drill_id = null;
						console.log(`AI generated drill "${item.name}" not found in existing drills.`);
					}
				}
			});
		});
		console.log(`Mapped ${drillsMapped} drill names to existing IDs.`);

		// TODO: Sanitize free-text fields

		// Ensure the user_id from the AI response matches the logged-in user
		if (generatedPlan.planDetails.user_id !== user.id) {
			console.warn(`AI generated plan had user_id ${generatedPlan.planDetails.user_id}, but logged in user is ${user.id}. Overriding.`);
			generatedPlan.planDetails.user_id = user.id;
		}

		return json(generatedPlan, { status: 200 });

	} catch (error) {
		if (error instanceof Anthropic.APIError) {
			console.error('Anthropic API Error:', error.status, error.name, error.message);
			let statusCode = 500;
			let message = 'AI generation failed.';
			if (error.status === 401) { statusCode = 401; message = 'AI service authentication failed.'; }
			if (error.status === 429) { statusCode = 429; message = 'AI service rate limit exceeded.'; }
			if (error.status === 503) { statusCode = 503; message = 'AI service unavailable.'; }
			if (error.status === 400) {
				statusCode = 400;
				message = `AI service request invalid or content rejected: ${error.message}`;
			}
			return json({ error: message }, { status: statusCode });
		} else if (error instanceof z.ZodError) {
            console.error('Zod validation error (likely request body):', error.flatten());
            return json({ error: 'Invalid request format.', issues: error.flatten() }, { status: 400 });
        } else if (error instanceof SyntaxError) {
            console.error('JSON parsing error in request body:', error);
            return json({ error: 'Invalid request format.' }, { status: 400 });
        } else {
			console.error('Unexpected error during AI plan generation:', error);
			return json({ error: 'An unexpected error occurred.' }, { status: 500 });
		}
	}
} 