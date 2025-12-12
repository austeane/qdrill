import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db.js';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';
import { teamService } from '$lib/server/services/teamService.js';

export async function GET({ locals, params, url }) {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	// Resolve team from slug and check membership
	const team = await teamService.getBySlug(params.slug);
	if (!team) {
		return json({ error: 'Team not found' }, { status: 404 });
	}
	const member = await teamMemberService.getMember(team.id, locals.user.id);
	if (!member) {
		return json({ error: 'Not a team member' }, { status: 403 });
	}

	// Parse query parameters
	const startDate = url.searchParams.get('start_date');
	const endDate = url.searchParams.get('end_date');
	const exactDate = url.searchParams.get('date'); // convenience single-day filter
	const seasonId = url.searchParams.get('season_id');
	const status = url.searchParams.get('status'); // 'published' | 'all'
	const canViewAll = member.role === 'admin' || member.role === 'coach';

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

		const queryParams = [team.id];
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

		// Publish filter: members see only published; admin/coach can see all
		if (status === 'published' || (!canViewAll && status !== 'all')) {
			queryStr += ` AND pp.is_published = true`;
		}

		// Order by scheduled date
		queryStr += ` ORDER BY pp.scheduled_date ASC, pp.created_at ASC`;

		const result = await query(queryStr, queryParams);

		// Normalize date-only + time-only for consistent client behavior
		const items = (result.rows || []).map((row) => {
			const normalizeDate = (v) =>
				v
					? typeof v === 'string'
						? v.slice(0, 10)
						: new Date(v).toISOString().slice(0, 10)
					: null;
			const normalizeTime = (v) => (v ? String(v).slice(0, 8) : null);

			return {
				...row,
				scheduled_date: normalizeDate(row.scheduled_date),
				start_time: normalizeTime(row.start_time)
			};
		});

		return json({ items, count: items.length });
	} catch (error) {
		console.error('Error fetching team practice plans:', error);
		return json({ error: 'Failed to fetch practice plans' }, { status: 500 });
	}
}
