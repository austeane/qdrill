import { redirect, error } from '@sveltejs/kit';
import { teamService } from '$lib/server/services/teamService';
import { teamMemberService } from '$lib/server/services/teamMemberService';
import { getTeamRole } from '$lib/server/auth/teamPermissions';
import { vercelPool } from '$lib/server/db';

export async function load({ locals, params }) {
  if (!locals.user) {
    throw redirect(302, '/');
  }
  
  const team = await teamService.getById(params.teamId);
  if (!team) {
    throw error(404, 'Team not found');
  }
  
  const role = await getTeamRole(team.id, locals.user.id);
  if (!role) {
    throw error(403, 'You are not a member of this team');
  }
  
  if (role !== 'admin') {
    throw error(403, 'Only team admins can access settings');
  }
  
  const members = await teamMemberService.getTeamMembers(team.id);
  
  // Fetch user details for all members
  const userIds = members.map(m => m.user_id);
  const usersResult = await vercelPool.query(
    'SELECT id, name, email, image FROM users WHERE id = ANY($1)',
    [userIds]
  );
  
  // Create a map for quick lookup
  const usersMap = new Map(usersResult.rows.map(u => [u.id, u]));
  
  // Enhance members with user info
  const membersWithInfo = members.map(member => ({
    ...member,
    user: usersMap.get(member.user_id) || { 
      id: member.user_id, 
      name: 'Unknown User', 
      email: null, 
      image: null 
    }
  }));
  
  return {
    team,
    members: membersWithInfo,
    userRole: role
  };
}
