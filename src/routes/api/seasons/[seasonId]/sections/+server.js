import { json } from '@sveltejs/kit';
import { seasonSectionService } from '$lib/server/services/seasonSectionService.js';

export async function GET({ locals, params }) {
	if (!locals.user) return json({ error: 'Authentication required' }, { status: 401 });
	try {
		const items = await seasonSectionService.getSeasonSections(params.seasonId, locals.user.id);
		// Provide a lightweight alias so clients can use `order` if desired
		const normalized = items.map((s, idx) => ({ ...s, order: s.display_order ?? idx }));
		return json(normalized);
	} catch (err) {
		return json(
			{ error: err?.message || 'Failed to fetch sections' },
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
			name: body.name,
			color: body.color ?? '#2563eb',
			start_date: body.start_date,
			end_date: body.end_date,
			overview_visible_to_members: true
		};
		const created = await seasonSectionService.create(payload, locals.user.id);
		return json(created, { status: 201 });
	} catch (err) {
		return json(
			{ error: err?.message || 'Failed to create section' },
			{ status: err?.status || 500 }
		);
	}
}
