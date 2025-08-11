import { json } from '@sveltejs/kit';
import { seasonSectionService } from '$lib/server/services/seasonSectionService.js';
import { createSeasonSectionSchema } from '$lib/validation/seasonSectionSchema.js';

export async function GET({ locals, params }) {
  try {
    const sections = await seasonSectionService.getSeasonSections(
      params.seasonId,
      locals.user?.id
    );
    return json(sections);
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
    const validated = createSeasonSectionSchema.parse({
      ...data,
      season_id: params.seasonId
    });
    
    const section = await seasonSectionService.create(validated, locals.user.id);
    return json(section, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}