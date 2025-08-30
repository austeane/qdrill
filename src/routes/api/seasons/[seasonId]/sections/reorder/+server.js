import { json } from '@sveltejs/kit';
import { seasonSectionService } from '$lib/server/services/seasonSectionService.js';
import { seasonService } from '$lib/server/services/seasonService.js';
import { teamMemberService } from '$lib/server/services/teamMemberService.js';

export async function PUT({ locals, params, request }) {
  if (!locals.user) return json({ error: 'Authentication required' }, { status: 401 });
  try {
    const season = await seasonService.getById(params.seasonId);
    if (!season) return json({ error: 'Season not found' }, { status: 404 });

    const member = await teamMemberService.getMember(season.team_id, locals.user.id);
    if (!member || member.role !== 'admin') {
      return json({ error: 'Only team admins can reorder sections' }, { status: 403 });
    }

    const { sections } = await request.json();
    if (!Array.isArray(sections)) {
      return json({ error: 'Invalid payload' }, { status: 400 });
    }

    await seasonSectionService.withTransaction(async (client) => {
      for (const s of sections) {
        if (!s?.id || s?.order === undefined) continue;
        await client.query(
          'UPDATE season_sections SET display_order = $1, updated_at = NOW() WHERE id = $2 AND season_id = $3',
          [s.order, s.id, params.seasonId]
        );
      }
    });

    return json({ success: true });
  } catch (err) {
    return json({ error: err?.message || 'Failed to reorder sections' }, { status: err?.status || 500 });
  }
}

