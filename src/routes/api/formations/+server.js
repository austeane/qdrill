import { json } from '@sveltejs/kit';
import { formationService } from '$lib/server/services/formationService.js';
import { authGuard } from '$lib/server/authGuard';

/**
 * GET handler for formations
 * Supports filtering, pagination, and getting all formations
 */
export async function GET({ url }) {
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = parseInt(url.searchParams.get('limit')) || 10;
  const all = url.searchParams.get('all') === 'true';
  const sortBy = url.searchParams.get('sort');
  const sortOrder = url.searchParams.get('order') || 'desc';
  const tag = url.searchParams.get('tag');
  const formation_type = url.searchParams.get('formation_type');
  
  // Build filter conditions
  const filters = {};
  if (tag) {
    filters.tag = tag;
  }
  if (formation_type) {
    filters.formation_type = formation_type;
  }
  
  try {
    const result = await formationService.getAll({
      page,
      limit,
      all,
      sortBy,
      sortOrder,
      filters
    });
    
    return json(result);
  } catch (error) {
    console.error('Error fetching formations:', error);
    return json(
      { error: 'An error occurred while fetching formations', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new formation
 */
export const POST = async (event) => {
  const formationData = await event.request.json();
  const session = await event.locals.getSession();
  const userId = session?.user?.id || null;
  
  console.log('Creating formation with data:', JSON.stringify(formationData, null, 2));
  console.log('User ID:', userId);
  
  try {
    // Make sure we don't pass an empty/null ID
    const { id, ...dataWithoutId } = formationData;
    
    const formation = await formationService.createFormation(dataWithoutId, userId);
    return json(formation);
  } catch (error) {
    console.error('Error creating formation:', error);
    return json(
      { error: 'An error occurred while creating the formation', details: error.message },
      { status: 500 }
    );
  }
};

/**
 * PUT handler for updating an existing formation
 * Requires authentication and proper permissions
 */
export const PUT = authGuard(async ({ request, locals }) => {
  const formationData = await request.json();
  const session = await locals.getSession();
  const userId = session.user.id;
  const { id } = formationData;
  
  try {
    // Check if the formation exists and if the user has permission to update it
    const formation = await formationService.getById(id);
    
    if (!formation) {
      return json({ error: 'Formation not found' }, { status: 404 });
    }
    
    // Check authorization: allow edit if user created the formation or if it's editable by others
    if (formation.created_by !== userId && !formation.is_editable_by_others && formation.created_by !== null) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // If formation has no creator, assign it to the current user
    if (formation.created_by === null) {
      formationData.created_by = userId;
    }
    
    const updatedFormation = await formationService.updateFormation(id, formationData);
    return json(updatedFormation);
  } catch (error) {
    console.error('Error updating formation:', error);
    return json(
      { error: 'An error occurred while updating the formation', details: error.message },
      { status: 500 }
    );
  }
});