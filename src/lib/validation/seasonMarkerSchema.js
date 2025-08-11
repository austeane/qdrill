import { z } from 'zod';

export const createSeasonMarkerSchema = z.object({
  season_id: z.string().uuid(),
  type: z.enum(['tournament', 'break', 'scrimmage', 'custom']),
  title: z.string().min(1).max(255),
  notes: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  color: z.string().default('red'),
  visible_to_members: z.boolean().default(true)
}).refine(data => {
  if (!data.end_date) return true;
  return new Date(data.start_date) <= new Date(data.end_date);
}, {
  message: "Start date must be before or equal to end date",
  path: ["end_date"]
});

export const updateSeasonMarkerSchema = createSeasonMarkerSchema.partial().omit({ season_id: true });