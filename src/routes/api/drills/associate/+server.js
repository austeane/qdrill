import { json } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import { query } from '$lib/server/db';

export const POST = authGuard(async ({ request, locals }) => {
  const { drillId } = await request.json();
  const session = await locals.getSession();
  
  try {
    // Update the drill to associate it with the user
    const result = await query(
      'UPDATE drills SET created_by = $1 WHERE id = $2 AND created_by IS NULL RETURNING *',
      [session.user.id, drillId]
    );

    if (result.rowCount === 0) {
      return json({ error: 'Drill not found or already owned' }, { status: 404 });
    }

    return json({ success: true, drill: result.rows[0] });
  } catch (error) {
    console.error('Error associating drill:', error);
    return json({ error: 'Failed to associate drill with user' }, { status: 500 });
  }
}); 