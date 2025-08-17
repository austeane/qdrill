import { json } from '@sveltejs/kit';
import { seasonMarkerService } from '$lib/server/services/seasonMarkerService.js';
import { updateSeasonMarkerSchema } from '$lib/validation/seasonMarkerSchema.js';

export async function GET({ locals, params }) {
  try {
    const marker = await seasonMarkerService.getById(params.markerId);
    return json(marker);
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function PATCH({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    // Accept both UI shape (name/date) and service shape (title/start_date)
    const normalized = {
      ...data,
      title: data.title ?? data.name,
      start_date: data.start_date ?? data.date
    };
    const validated = updateSeasonMarkerSchema.parse(normalized);
    const marker = await seasonMarkerService.update(
      params.markerId,
      validated,
      locals.user.id
    );
    
    // Return in UI shape expected by timeline
    const result = {
      id: marker.id,
      type: marker.type,
      name: marker.title,
      title: marker.title,
      date: marker.start_date,
      start_date: marker.start_date,
      end_date: marker.end_date,
      color: marker.color,
      visible_to_members: marker.visible_to_members
    };
    
    return json({ success: true, marker: result });
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function DELETE({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    await seasonMarkerService.delete(params.markerId, locals.user.id);
    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}