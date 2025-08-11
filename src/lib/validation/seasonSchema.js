import { z } from 'zod';

const baseSeasonSchema = z.object({
  team_id: z.string().uuid(),
  name: z.string().min(3).max(100),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_active: z.boolean().default(false),
  template_practice_plan_id: z.number().nullable().optional()
});

export const createSeasonSchema = baseSeasonSchema.refine(data => {
  return new Date(data.start_date) < new Date(data.end_date);
}, {
  message: "Start date must be before end date",
  path: ["end_date"]
});

export const updateSeasonSchema = baseSeasonSchema.partial().omit({ team_id: true }).refine(data => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) < new Date(data.end_date);
  }
  return true;
}, {
  message: "Start date must be before end date",
  path: ["end_date"]
});