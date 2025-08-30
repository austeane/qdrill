import { json } from '@sveltejs/kit';
import { seasonMarkerService } from '$lib/server/services/seasonMarkerService.js';

export async function GET({ locals, params }) {
  if (!locals.user) return json({ error: 'Authentication required' }, { status: 401 });
  try {
    const items = await seasonMarkerService.getSeasonMarkers(params.seasonId, locals.user.id);
    // Normalize for UI that may expect `date` when not a range
    const normalized = items.map((m) => ({
      ...m,
      date: m.start_date && !m.end_date ? m.start_date : m.date || m.start_date
    }));
    return json(normalized);
  } catch (err) {
    return json({ error: err?.message || 'Failed to fetch markers' }, { status: err?.status || 500 });
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
    return json({ error: err?.message || 'Failed to create marker' }, { status: err?.status || 500 });
  }
}

