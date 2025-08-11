import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db.js';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';

export async function GET({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  // Check team membership
  const member = await teamMemberService.getMember(params.teamId, locals.user.id);
  if (!member) {
    return json({ error: 'Not a team member' }, { status: 403 });
  }
  
  try {
    // Get active season for the team
    const queryStr = `
      SELECT s.*, pp.name as template_name
      FROM seasons s
      LEFT JOIN practice_plans pp ON s.template_practice_plan_id = pp.id
      WHERE s.team_id = $1 AND s.is_active = true
      LIMIT 1
    `;
    
    const result = await query(queryStr, [params.teamId]);
    
    if (result.rows.length === 0) {
      return json({ error: 'No active season found' }, { status: 404 });
    }
    
    return json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching active season:', error);
    return json({ error: 'Failed to fetch active season' }, { status: 500 });
  }
}