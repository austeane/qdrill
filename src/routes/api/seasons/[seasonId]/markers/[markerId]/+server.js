import { json } from '@sveltejs/kit';
import { seasonMarkerService } from '$lib/server/services/seasonMarkerService.js';

export async function PUT({ locals, params, request }) {
  if (!locals.user) return json({ error: 'Authentication required' }, { status: 401 });
  try {
    const body = await request.json();
    const payload = {
      type: body.type,
      title: body.name || body.title,
      notes: body.description || body.notes,
      color: body.color,
      start_date: body.start_date || body.date,
      end_date: body.end_date
    };
    const updated = await seasonMarkerService.update(params.markerId, payload, locals.user.id);
    return json(updated);
  } catch (err) {
    return json({ error: err?.message || 'Failed to update marker' }, { status: err?.status || 500 });
  }
}

export async function DELETE({ locals, params }) {
  if (!locals.user) return json({ error: 'Authentication required' }, { status: 401 });
  try {
    await seasonMarkerService.delete(params.markerId, locals.user.id);
    return json({ success: true });
  } catch (err) {
    return json({ error: err?.message || 'Failed to delete marker' }, { status: err?.status || 500 });
  }
}

