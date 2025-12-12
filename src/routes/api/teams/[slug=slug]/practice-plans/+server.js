import { json } from '@sveltejs/kit';
import { kyselyDb } from '$lib/server/db.js';
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
		// Build Kysely query
		let qb = kyselyDb
			.selectFrom('practice_plans as pp')
			.leftJoin('users as u', 'pp.created_by', 'u.id')
			.selectAll('pp')
			.select('u.name as created_by_name')
			.where('pp.team_id', '=', team.id);

		// Add season filter
		if (seasonId) {
			qb = qb.where('pp.season_id', '=', seasonId);
		}

		// Add date filters
		if (exactDate) {
			qb = qb.where('pp.scheduled_date', '=', exactDate);
		} else if (startDate && endDate) {
			qb = qb.where('pp.scheduled_date', '>=', startDate).where('pp.scheduled_date', '<=', endDate);
		} else if (startDate) {
			qb = qb.where('pp.scheduled_date', '>=', startDate);
		} else if (endDate) {
			qb = qb.where('pp.scheduled_date', '<=', endDate);
		}

		// Publish filter: members see only published; admin/coach can see all
		if (status === 'published' || (!canViewAll && status !== 'all')) {
			qb = qb.where('pp.is_published', '=', true);
		}

		const result = await qb
			.orderBy('pp.scheduled_date', 'asc')
			.orderBy('pp.created_at', 'asc')
			.execute();

		// Normalize date-only + time-only for consistent client behavior
		const items = (result || []).map((row) => {
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
