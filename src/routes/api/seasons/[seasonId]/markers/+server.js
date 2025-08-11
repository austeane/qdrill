import { json } from '@sveltejs/kit';
import { seasonMarkerService } from '$lib/server/services/seasonMarkerService.js';
import { createSeasonMarkerSchema } from '$lib/validation/seasonMarkerSchema.js';

export async function GET({ locals, params }) {
  try {
    const markers = await seasonMarkerService.getTimelineData(
      params.seasonId,
      locals.user?.id
    );
    return json(markers);
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function POST({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const validated = createSeasonMarkerSchema.parse({
      ...data,
      season_id: params.seasonId
    });
    
    const marker = await seasonMarkerService.create(validated, locals.user.id);
    return json(marker, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}