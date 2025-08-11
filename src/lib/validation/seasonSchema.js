import { z } from 'zod';

export const createSeasonSchema = z.object({
  team_id: z.string().uuid(),
  name: z.string().min(3).max(100),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_active: z.boolean().default(false),
  template_practice_plan_id: z.number().nullable().optional()
}).refine(data => {
  return new Date(data.start_date) < new Date(data.end_date);
}, {
  message: "Start date must be before end date",
  path: ["end_date"]
});

export const updateSeasonSchema = createSeasonSchema.partial().omit({ team_id: true });