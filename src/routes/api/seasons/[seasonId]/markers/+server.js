import { json } from '@sveltejs/kit';
import { seasonMarkerService } from '$lib/server/services/seasonMarkerService.js';
import { seasonService } from '$lib/server/services/seasonService.js';
import { createSeasonMarkerSchema } from '$lib/validation/seasonMarkerSchema.js';

export async function GET({ locals, params }) {
  try {
    const raw = await seasonMarkerService.getSeasonMarkers(
      params.seasonId,
      locals.user?.id
    );
    // Map to UI shape expected by timeline and markers UI
    const markers = raw.map((m) => ({
      id: m.id,
      type: m.type,
      name: m.title,
      date: m.start_date,
      end_date: m.end_date,
      color: m.color,
      visible_to_members: m.visible_to_members
    }));
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
    // Accept both new UI shape (name/date) and service shape (title/start_date)
    const normalized = {
      ...data,
      title: data.title ?? data.name,
      start_date: data.start_date ?? data.date,
      end_date: data.end_date ?? null,
      season_id: params.seasonId
    };
    const validated = createSeasonMarkerSchema.parse(normalized);
    
    const marker = await seasonMarkerService.create(validated, locals.user.id);
    return json(marker, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}