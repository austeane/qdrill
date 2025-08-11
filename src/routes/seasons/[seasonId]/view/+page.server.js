import { error } from '@sveltejs/kit';
import { query } from '$lib/server/db.js';

/**
 * Public view of a season calendar
 * Accessible with share token
 */
export async function load({ params, url }) {
  const { seasonId } = params;
  const token = url.searchParams.get('token');
  
  if (!token) {
    throw error(401, 'Access token required');
  }
  
  try {
    // Validate token and get season
    const seasonResult = await query(
      `SELECT s.*, t.name as team_name, t.timezone, t.default_start_time
       FROM seasons s
       JOIN teams t ON s.team_id = t.id
       WHERE s.id = $1 AND s.public_view_token = $2::uuid`,
      [seasonId, token]
    );
    
    if (seasonResult.rows.length === 0) {
      throw error(404, 'Season not found or invalid token');
    }
    
    const season = seasonResult.rows[0];
    
    // Get published practices only
    const practicesResult = await query(
      `SELECT * FROM practice_plans 
       WHERE season_id = $1 AND status = 'published' 
       ORDER BY scheduled_date, start_time`,
      [seasonId]
    );
    
    // Get markers
    const markersResult = await query(
      `SELECT * FROM season_markers 
       WHERE season_id = $1 
       ORDER BY start_date`,
      [seasonId]
    );
    
    // Get sections
    const sectionsResult = await query(
      `SELECT * FROM season_sections 
       WHERE season_id = $1 
       ORDER BY start_date, end_date`,
      [seasonId]
    );
    
    return {
      season,
      practices: practicesResult.rows,
      markers: markersResult.rows,
      sections: sectionsResult.rows,
      isPublicView: true,
      icsUrl: `/api/seasons/${seasonId}/calendar.ics?token=${season.ics_token}`
    };
  } catch (err) {
    console.error('Error loading public season view:', err);
    if (err.status) {
      throw err;
    }
    throw error(500, 'Failed to load season');
  }
}