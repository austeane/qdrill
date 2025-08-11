import { json } from '@sveltejs/kit';
import { seasonSectionService } from '$lib/server/services/seasonSectionService.js';
import { updateSeasonSectionSchema } from '$lib/validation/seasonSectionSchema.js';

export async function GET({ locals, params }) {
  try {
    const section = await seasonSectionService.getSectionWithDefaults(
      params.sectionId,
      locals.user?.id
    );
    return json(section);
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
    const validated = updateSeasonSectionSchema.parse(data);
    const section = await seasonSectionService.update(
      params.sectionId,
      validated,
      locals.user.id
    );
    return json(section);
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
    await seasonSectionService.delete(params.sectionId, locals.user.id);
    return json({ success: true });
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}