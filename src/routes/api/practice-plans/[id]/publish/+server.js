import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db.js';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';

export async function POST({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Fetch plan
    const planRes = await query('SELECT * FROM practice_plans WHERE id = $1', [params.id]);
    if (planRes.rows.length === 0) {
      return json({ error: 'Practice plan not found' }, { status: 404 });
    }
    const plan = planRes.rows[0];

    // Permission: admin of team or creator of plan
    if (plan.team_id) {
      const member = await teamMemberService.getMember(plan.team_id, locals.user.id);
      if (!member || (member.role !== 'admin' && plan.created_by !== locals.user.id)) {
        return json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (plan.created_by !== locals.user.id) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateRes = await query(
      `UPDATE practice_plans
       SET is_published = true,
           published_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [params.id]
    );
    return json(updateRes.rows[0]);
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function DELETE({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Fetch plan
    const planRes = await query('SELECT * FROM practice_plans WHERE id = $1', [params.id]);
    if (planRes.rows.length === 0) {
      return json({ error: 'Practice plan not found' }, { status: 404 });
    }
    const plan = planRes.rows[0];

    // Permission: admin of team or creator of plan
    if (plan.team_id) {
      const member = await teamMemberService.getMember(plan.team_id, locals.user.id);
      if (!member || (member.role !== 'admin' && plan.created_by !== locals.user.id)) {
        return json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (plan.created_by !== locals.user.id) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateRes = await query(
      `UPDATE practice_plans
       SET is_published = false,
           published_at = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [params.id]
    );
    return json(updateRes.rows[0]);
  } catch (error) {
    return json({ error: error.message }, { status: error.statusCode || 500 });
  }
}


