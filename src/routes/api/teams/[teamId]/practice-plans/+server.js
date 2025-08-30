import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db.js';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';

export async function GET({ locals, params, url }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  // Check team membership
  const member = await teamMemberService.getMember(params.teamId, locals.user.id);
  if (!member) {
    return json({ error: 'Not a team member' }, { status: 403 });
  }
  
  // Parse query parameters
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');
  const exactDate = url.searchParams.get('date'); // convenience single-day filter
  const seasonId = url.searchParams.get('season_id');
  const status = url.searchParams.get('status'); // currently ignored until publish feature lands
  
  try {
    // Build query
    let queryStr = `
      SELECT 
        pp.*,
        u.name as created_by_name
      FROM practice_plans pp
      LEFT JOIN users u ON pp.created_by = u.id
      WHERE pp.team_id = $1
    `;
    
    const queryParams = [params.teamId];
    let paramIndex = 2;
    
    // Add season filter
    if (seasonId) {
      queryStr += ` AND pp.season_id = $${paramIndex}`;
      queryParams.push(seasonId);
      paramIndex++;
    }
    
    // Add date filters
    if (exactDate) {
      queryStr += ` AND pp.scheduled_date = $${paramIndex}`;
      queryParams.push(exactDate);
      paramIndex++;
    } else if (startDate && endDate) {
      queryStr += ` AND pp.scheduled_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      queryParams.push(startDate, endDate);
      paramIndex += 2;
    } else if (startDate) {
      queryStr += ` AND pp.scheduled_date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    } else if (endDate) {
      queryStr += ` AND pp.scheduled_date <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }
    
    // Note: publish/unpublish not implemented yet (no is_published column).
    // Once schema supports it, reintroduce filtering here.
    
    // Order by scheduled date
    queryStr += ` ORDER BY pp.scheduled_date ASC, pp.created_at ASC`;
    
    const result = await query(queryStr, queryParams);
    
    // Return consistent shape
    return json({ 
      items: result.rows,
      count: result.rows.length 
    });
  } catch (error) {
    console.error('Error fetching team practice plans:', error);
    return json({ error: 'Failed to fetch practice plans' }, { status: 500 });
  }
}
