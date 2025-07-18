import { z } from 'zod';

const visibilityOptions = ['public', 'unlisted', 'private'] as const;
const formationTypeOptions = ['offense', 'defense'] as const;

export const formationSchema = z.object({
    id: z.number().int().positive().optional(),
    name: z.string().trim().min(1, 'Name is required'),
    brief_description: z.string().trim().min(1, 'Brief description is required'),
    detailed_description: z.string().trim().optional(),
    diagrams: z.array(z.any()).optional(),
    tags: z.array(z.string().trim()).optional(),
    is_editable_by_others: z.boolean().optional(),
    visibility: z.enum(visibilityOptions).default('public'),
    formation_type: z.enum(formationTypeOptions).default('offense'),
    created_by: z.number().int().positive().nullable().optional(),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional()
});

export const createFormationSchema = formationSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    created_by: true
});

export const updateFormationSchema = formationSchema.extend({
    id: z.number().int().positive('Valid Formation ID is required for update')
}).omit({
    created_at: true,
    created_by: true,
    updated_at: true
});

export type Formation = z.infer<typeof formationSchema>;
export type CreateFormationInput = z.infer<typeof createFormationSchema>;
export type UpdateFormationInput = z.infer<typeof updateFormationSchema>;
