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
    const validated = updateSeasonMarkerSchema.parse(data);
    const marker = await seasonMarkerService.update(
      params.markerId,
      validated,
      locals.user.id
    );
    return json(marker);
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