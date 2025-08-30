import { json } from '@sveltejs/kit';
import { seasonSectionService } from '$lib/server/services/seasonSectionService.js';

export async function PUT({ locals, params, request }) {
  if (!locals.user) return json({ error: 'Authentication required' }, { status: 401 });
  try {
    const body = await request.json();
    const updated = await seasonSectionService.update(params.sectionId, body, locals.user.id);
    return json(updated);
  } catch (err) {
    return json({ error: err?.message || 'Failed to update section' }, { status: err?.status || 500 });
  }
}

export async function DELETE({ locals, params }) {
  if (!locals.user) return json({ error: 'Authentication required' }, { status: 401 });
  try {
    await seasonSectionService.delete(params.sectionId, locals.user.id);
    return json({ success: true });
  } catch (err) {
    return json({ error: err?.message || 'Failed to delete section' }, { status: err?.status || 500 });
  }
}

