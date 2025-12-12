import { json } from '@sveltejs/kit';
import { seasonMarkerService } from '$lib/server/services/seasonMarkerService.js';

export async function GET({ locals, params }) {
	if (!locals.user) return json({ error: 'Authentication required' }, { status: 401 });
	try {
		const items = await seasonMarkerService.getSeasonMarkers(params.seasonId, locals.user.id);
		const toDateStr = (v) =>
			v ? (typeof v === 'string' ? v.slice(0, 10) : new Date(v).toISOString().slice(0, 10)) : null;

		const normalized = items.map((m) => {
			const preferred = m.start_date && !m.end_date ? m.start_date : m.date || m.start_date;
			const date = toDateStr(preferred);
			return {
				...m,
				// keep both keys for UI compatibility
				name: m.name ?? m.title ?? '',
				title: m.title ?? m.name ?? '',
				start_date: toDateStr(m.start_date),
				end_date: toDateStr(m.end_date),
				date
			};
		});
		return json(normalized);
	} catch (err) {
		return json(
			{ error: err?.message || 'Failed to fetch markers' },
			{ status: err?.status || 500 }
		);
	}
}

export async function POST({ locals, params, request }) {
	if (!locals.user) return json({ error: 'Authentication required' }, { status: 401 });
	try {
		const body = await request.json();
		const payload = {
			season_id: params.seasonId,
			type: body.type || 'event',
			title: body.name || body.title || '',
			notes: body.description || body.notes || null,
			color: body.color || '#3b82f6',
			start_date: body.start_date || body.date,
			end_date: body.end_date || null,
			visible_to_members: true
		};
		const created = await seasonMarkerService.create(payload, locals.user.id);
		return json(created, { status: 201 });
	} catch (err) {
		return json(
			{ error: err?.message || 'Failed to create marker' },
			{ status: err?.status || 500 }
		);
	}
}
