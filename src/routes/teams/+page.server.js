import { redirect } from '@sveltejs/kit';
import { teamService } from '$lib/server/services/teamService';

export async function load({ locals }) {
  // If not logged in, show a public list of teams (read‑only)
  if (!locals.user) {
    const result = await teamService.getAll({
      page: 1,
      limit: 24,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    return { teams: result.items, isAuthenticated: false };
  }

  const teams = await teamService.getUserTeams(locals.user.id);

  return {
    teams,
    isAuthenticated: true
  };
}
