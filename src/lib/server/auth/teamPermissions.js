import { error } from '@sveltejs/kit';

// Forward declaration - will be imported properly once teamMemberService is created
let teamMemberService;

export async function requireTeamAdmin(teamId, userId) {
  if (!userId) throw error(401, 'Authentication required');
  
  // Lazy load to avoid circular dependency
  if (!teamMemberService) {
    const module = await import('$lib/server/services/teamMemberService.js');
    teamMemberService = module.teamMemberService;
  }
  
  const member = await teamMemberService.getMember(teamId, userId);
  if (!member || member.role !== 'admin') {
    throw error(403, 'Team admin access required');
  }
  return member;
}

export async function requireTeamMember(teamId, userId) {
  if (!userId) throw error(401, 'Authentication required');
  
  // Lazy load to avoid circular dependency
  if (!teamMemberService) {
    const module = await import('$lib/server/services/teamMemberService.js');
    teamMemberService = module.teamMemberService;
  }
  
  const member = await teamMemberService.getMember(teamId, userId);
  if (!member) throw error(403, 'Team member access required');
  return member;
}

export async function getTeamRole(teamId, userId) {
  if (!userId) return null;
  
  // Lazy load to avoid circular dependency
  if (!teamMemberService) {
    const module = await import('$lib/server/services/teamMemberService.js');
    teamMemberService = module.teamMemberService;
  }
  
  const member = await teamMemberService.getMember(teamId, userId);
  return member?.role || null;
}
