import { json } from '@sveltejs/kit';
import { seasonUnionService } from '$lib/server/services/seasonUnionService.js';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';
import { seasonService } from '$lib/server/services/seasonService.js';
import { z } from 'zod';

const instantiatePlanSchema = z.object({
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().optional(),
  seed_default_sections: z.boolean().optional(),
  practice_type: z.enum(['regular', 'scrimmage', 'tournament', 'training']).optional()
});

export async function POST({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    
    // Get season to find team
    const season = await seasonService.getById(params.seasonId);
    if (!season) {
      return json({ error: 'Season not found' }, { status: 404 });
    }
    
    // Verify user is team admin
    const member = await teamMemberService.getMember(season.team_id, locals.user.id);
    if (!member || member.role !== 'admin') {
      return json({ error: 'Only team admins can create practice plans' }, { status: 403 });
    }
    
    const validated = instantiatePlanSchema.parse(data);
    
    const practicePlan = await seasonUnionService.instantiatePracticePlan(
      params.seasonId,
      validated.scheduled_date,
      locals.user.id,
      season.team_id,
      {
        startTime: validated.start_time,
        seedDefaultSections: validated.seed_default_sections,
        practiceType: validated.practice_type
      }
    );
    
    console.log('Created practice plan:', practicePlan?.id ? `ID: ${practicePlan.id}` : 'NO ID', JSON.stringify(practicePlan).substring(0, 200));
    
    return json(practicePlan, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}