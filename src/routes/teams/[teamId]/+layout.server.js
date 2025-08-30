import { error, redirect } from '@sveltejs/kit';
import { teamService } from '$lib/server/services/teamService.js';
import { getTeamRole } from '$lib/server/auth/teamPermissions.js';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ params, locals, url }) {
  // Resolve team from slug or UUID once at layout level
  const team = await teamService.getById(params.teamId).catch(() => null);
  if (!team) {
    throw error(404, 'Team not found');
  }

  // Canonical redirect: if teamId is a UUID, redirect to slug URL
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(params.teamId) && team.slug) {
    // Build the new path with the slug
    const newPath = url.pathname.replace(`/teams/${params.teamId}`, `/teams/${team.slug}`);
    throw redirect(301, newPath + url.search);
  }

  let userRole = null;
  if (locals.user) {
    userRole = await getTeamRole(team.id, locals.user.id);
  }

  return { team, userRole };
}

