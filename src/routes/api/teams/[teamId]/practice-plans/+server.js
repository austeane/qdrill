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
  const seasonId = url.searchParams.get('season_id');
  const status = url.searchParams.get('status'); // 'all', 'draft', 'published'
  
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
    
    // Add date range filter
    if (startDate && endDate) {
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
    
    // Add status filter based on user role
    if (member.role === 'admin') {
      // Admins can see all practices
      if (status && status !== 'all') {
        queryStr += ` AND pp.is_published = ${status === 'published' ? 'true' : 'false'}`;
      }
    } else {
      // Members can only see published practices
      queryStr += ` AND pp.is_published = true`;
    }
    
    // Order by scheduled date
    queryStr += ` ORDER BY pp.scheduled_date ASC, pp.created_at ASC`;
    
    const result = await query(queryStr, queryParams);
    
    return json({
      plans: result.rows,
      count: result.rows.length,
      filters: {
        startDate,
        endDate,
        seasonId,
        status: member.role === 'admin' ? (status || 'all') : 'published'
      }
    });
  } catch (error) {
    console.error('Error fetching team practice plans:', error);
    return json({ error: 'Failed to fetch practice plans' }, { status: 500 });
  }
}