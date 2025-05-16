import { json } from '@sveltejs/kit';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { bulkUploadDrillInputSchema } from '$lib/validation/drillSchema';
import { PREDEFINED_SKILLS } from '$lib/constants/skills';
import { authGuard } from '$lib/server/authGuard';
import { handleApiError } from '../../utils/handleApiError.js';
import { ValidationError } from '$lib/server/errors.js';

// Constants mapping numbers to representations
const skillLevelMap = {
	1: 'New to Sport',
	2: 'Beginner',
	3: 'Intermediate',
	4: 'Advanced',
	5: 'Expert'
};

const complexityMap = {
	1: 'Low',
	2: 'Medium',
	3: 'High'
};

// Add drillTypeOptions
const drillTypeOptions = [
	'Competitive',
	'Skill-focus',
	'Tactic-focus',
	'Warmup',
	'Conditioning',
	'Cooldown',
	'Contact',
	'Match-like situation'
];

// Wrap the POST handler with authGuard
export const POST = authGuard(async ({ request, locals }) => {
	console.log('Attempting bulk upload parsing and validation...');
	const session = locals.session;
	const userId = session?.user?.id;

	try {
		const formData = await request.formData();
		const file = formData.get('file');
		const visibility = formData.get('visibility') || 'public';

		if (!file || !(file instanceof File) || file.size === 0) {
			throw new ValidationError('No valid file uploaded');
		}
		if (!['public', 'unlisted', 'private'].includes(visibility)) {
			throw new ValidationError('Invalid visibility value provided.');
		}

		const csvContent = await file.text();

		let records;
		try {
			records = parse(csvContent, { columns: true, skip_empty_lines: true });
		} catch (parseError) {
			console.error('CSV parsing error:', parseError);
			throw new ValidationError('Failed to parse CSV file. Please ensure it is valid CSV format.', {
				details: parseError.message
			});
		}

		if (!records || records.length === 0) {
			throw new ValidationError('CSV file is empty or contains no data rows.');
		}

		const parsedDrills = [];
		let validDrills = 0;
		let drillsWithErrors = 0;

		records.forEach((record, index) => {
			const drill = parseDrill(record);
			drill.created_by = userId;
			drill.visibility = visibility;
			drill.is_editable_by_others = false;
			drill.row = index + 2;

			const validationResult = bulkUploadDrillInputSchema.safeParse(drill);

			if (validationResult.success) {
				drill.errors = [];
				validDrills++;
				parsedDrills.push(validationResult.data);
			} else {
				drill.errors = validationResult.error.errors.map(
					(err) => `${err.path.join('.')}: ${err.message}`
				);
				drillsWithErrors++;
				parsedDrills.push(drill);
			}
		});

		return json({
			summary: {
				total: records.length,
				valid: validDrills,
				errors: drillsWithErrors
			},
			drills: parsedDrills
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			const formattedErrors = err.errors.reduce((acc, curr) => {
				acc[curr.path.join('.')] = curr.message;
				return acc;
			}, {});
			return handleApiError(new ValidationError('Validation failed', formattedErrors));
		}
		return handleApiError(err);
	}
});

function parseDrill(record) {
	const drill = {
		name: record['Name'],
		brief_description: record['Brief Description'],
		detailed_description: record['Detailed Description'],
		skill_level: parseArray(
			record['Skill Level (1:New to Sport; 2:Beginner; 3:Intermediate; 4:Advanced; 5:Expert)']
		).map((level) => skillLevelMap[level] || level),
		complexity: record['Complexity (1:Low; 2:Medium; 3:High)']
			? complexityMap[record['Complexity (1:Low; 2:Medium; 3:High)']]
			: null,
		suggested_length: {
			min: parseInteger(record['Suggested Length Min']),
			max: parseInteger(record['Suggested Length Max'])
		},
		number_of_people: {
			min: parseInteger(record['Number of People Min']),
			max: parseInteger(record['Number of People Max'])
		},
		skills_focused_on: parseArray(record['Skills Focused On']).filter(
			(skill) => PREDEFINED_SKILLS.includes(skill) || skill.trim() !== ''
		),
		positions_focused_on: parseArray(
			record['Positions Focused On (Chaser; Beater; Keeper; Seeker)']
		),
		video_link: record['Video Link'] || null,
		drill_type: parseArray(record['Drill Type']).filter((type) => drillTypeOptions.includes(type)),
		diagrams: []
	};

	return drill;
}

function parseArray(value = '') {
	return value
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item !== '');
}

function parseInteger(value) {
	if (value === null || value === undefined || value.trim() === '') return null;
	const parsed = parseInt(value, 10);
	return isNaN(parsed) ? null : parsed;
}
