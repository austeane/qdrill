import { z } from 'zod';

const baseSeasonSectionSchema = z.object({
	season_id: z.string().uuid(),
	name: z.string().min(1).max(255),
	start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	notes: z.string().optional(),
	overview_visible_to_members: z.boolean().default(true),
	display_order: z.number().int().min(0).optional(),
	color: z.string().default('blue')
});

export const createSeasonSectionSchema = baseSeasonSectionSchema.refine(
	(data) => {
		return new Date(data.start_date) <= new Date(data.end_date);
	},
	{
		message: 'Start date must be before or equal to end date',
		path: ['end_date']
	}
);

export const updateSeasonSectionSchema = baseSeasonSectionSchema
	.partial()
	.omit({ season_id: true })
	.refine(
		(data) => {
			if (data.start_date && data.end_date) {
				return new Date(data.start_date) <= new Date(data.end_date);
			}
			return true;
		},
		{
			message: 'Start date must be before or equal to end date',
			path: ['end_date']
		}
	);

export const defaultSectionSchema = z.object({
	section_name: z.string().min(1).max(255),
	order: z.number().int().min(0).optional(),
	goals: z.array(z.string()).default([]),
	notes: z.string().optional()
});

export const linkedDrillSchema = z
	.object({
		type: z.enum(['drill', 'formation', 'break']),
		drill_id: z.number().int().positive().nullable().optional(),
		formation_id: z.number().int().positive().nullable().optional(),
		name: z.string().optional(),
		default_duration_minutes: z.number().int().min(1).default(30),
		order_in_section: z.number().int().min(0).optional(),
		default_section_id: z.string().uuid().nullable().optional()
	})
	.refine(
		(data) => {
			if (data.type === 'drill') return !!data.drill_id;
			if (data.type === 'formation') return !!data.formation_id;
			return true; // breaks don't need references
		},
		{
			message: 'Drill type requires drill_id, Formation type requires formation_id'
		}
	);

export const batchDefaultSectionsSchema = z.array(defaultSectionSchema);
export const batchLinkedDrillsSchema = z.array(linkedDrillSchema);
