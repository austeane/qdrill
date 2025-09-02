import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(50).optional(),
  default_start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).default('09:00:00'),
  timezone: z.string().default('America/New_York')
});

export const updateTeamSchema = createTeamSchema.partial();

export const teamMemberSchema = z.object({
  user_id: z.string(),
  role: z.enum(['admin', 'coach', 'member']).default('member')
});
