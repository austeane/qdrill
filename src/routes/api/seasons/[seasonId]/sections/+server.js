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
    const { seed_default_sections, ...sectionData } = data;
    
    const validated = createSeasonSectionSchema.parse({
      ...sectionData,
      season_id: params.seasonId
    });
    
    const section = await seasonSectionService.create(validated, locals.user.id);
    
    // If requested, seed the default practice sections
    if (seed_default_sections) {
      const defaultSections = [
        { section_name: 'Introduction to the sport', order: 0, goals: ['Understand basic rules', 'Learn safety fundamentals'] },
        { section_name: 'Fundamental skills', order: 1, goals: ['Master basic movements', 'Build core strength'] },
        { section_name: 'Formations', order: 2, goals: ['Learn team positions', 'Understand spatial awareness'] },
        { section_name: 'Basic plays', order: 3, goals: ['Execute simple strategies', 'Develop timing'] },
        { section_name: 'Advanced tactics', order: 4, goals: ['Complex plays', 'Situational awareness'] }
      ];
      
      await seasonSectionService.setDefaultSections(section.id, defaultSections, locals.user.id);
    }
    
    return json({ success: true, section }, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}