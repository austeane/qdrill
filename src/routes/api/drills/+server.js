import { json } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import { drillService } from '$lib/server/services/drillService';

export const GET = async ({ url }) => {
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = parseInt(url.searchParams.get('limit')) || 10;
  const all = url.searchParams.get('all') === 'true';
  const sortBy = url.searchParams.get('sort');
  const sortOrder = url.searchParams.get('order') || 'desc';
  
  try {
    // Use the getFilteredDrills method from DrillService for proper filtering
    const results = await drillService.getFilteredDrills({}, {
      page,
      limit,
      all,
      sortBy,
      sortOrder
    });
    
    return json({
      drills: results.items,
      pagination: results.pagination
    });
  } catch (error) {
    console.error('[Database Error] Fetching drills:', error);
    return json({ error: 'An error occurred while fetching drills', details: error.toString() }, { status: 500 });
  }
}

export const POST = async (event) => {
  try {
    const drillData = await event.request.json();
    const session = await event.locals.getSession();
    const userId = session?.user?.id || null;
    
    // Use the DrillService to create the drill
    const drill = await drillService.createDrill(drillData, userId);
    
    return json(drill);
  } catch (error) {
    console.error('Error occurred while creating drill:', error);
    return json({ error: 'An error occurred while creating the drill', details: error.toString() }, { status: 500 });
  }
};

export const PUT = authGuard(async ({ request, locals }) => {
  try {
    const drillData = await request.json();
    const session = await locals.getSession();
    const userId = session.user.id;
    
    // Use the DrillService to update the drill
    const updatedDrill = await drillService.updateDrill(drillData.id, drillData, userId);
    
    return json(updatedDrill);
  } catch (error) {
    // Handle specific error types
    if (error.message === 'Unauthorized to edit this drill') {
      return json({ error: 'Unauthorized' }, { status: 403 });
    } else if (error.message.includes('not found')) {
      return json({ error: 'Drill not found' }, { status: 404 });
    }
    
    console.error('Error updating drill:', error);
    return json({ error: 'An error occurred while updating the drill', details: error.toString() }, { status: 500 });
  }
});

export const DELETE = authGuard(async ({ params, request, locals }) => {
  // In SvelteKit, for API routes with dynamic parameters, the parameter comes from params.id 
  const id = params.id;
  const session = await locals.getSession();
  const userId = session.user.id;

  try {
    // Use the DrillService to delete the drill
    const result = await drillService.deleteDrill(id, userId);
    
    if (!result) {
      return json({ error: 'Drill not found' }, { status: 404 });
    }
    
    return json({ message: 'Drill deleted successfully' });
  } catch (error) {
    // Handle unauthorized error
    if (error.message === 'Unauthorized to delete this drill') {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    console.error(`[Delete Error] Drill ${id}:`, error);
    return json({ error: 'An error occurred while deleting the drill', details: error.toString() }, { status: 500 });
  }
});
