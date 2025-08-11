import { BaseEntityService } from './baseEntityService';
import { ForbiddenError, ValidationError } from '$lib/server/errors';

class TeamMemberService extends BaseEntityService {
  constructor() {
    super(
      'team_members',
      null, // No single primary key
      ['team_id', 'user_id', 'role', 'created_at', 'updated_at'],
      ['team_id', 'user_id', 'role', 'created_at', 'updated_at']
    );
  }

  async getMember(teamId, userId) {
    const result = await this.getAll({
      filters: { team_id: teamId, user_id: userId },
      limit: 1
    });
    return result.items[0] || null;
  }

  async getTeamMembers(teamId) {
    const result = await this.getAll({
      filters: { team_id: teamId },
      all: true
    });
    return result.items;
  }

  async getUserMemberships(userId) {
    const result = await this.getAll({
      filters: { user_id: userId },
      all: true
    });
    return result.items;
  }

  async addMember(teamId, userId, role = 'member') {
    // Check if already a member
    const existing = await this.getMember(teamId, userId);
    if (existing) {
      throw new ValidationError('User is already a team member');
    }
    
    return await this.create({
      team_id: teamId,
      user_id: userId,
      role
    });
  }

  async updateRole(teamId, userId, newRole, requestingUserId) {
    // Check requester is admin
    const requester = await this.getMember(teamId, requestingUserId);
    if (!requester || requester.role !== 'admin') {
      throw new ForbiddenError('Only team admins can update roles');
    }
    
    // Can't change last admin to member
    if (userId === requestingUserId && newRole === 'member') {
      const admins = await this.getAll({
        filters: { team_id: teamId, role: 'admin' },
        all: true
      });
      if (admins.items.length === 1) {
        throw new ValidationError('Cannot remove the last admin');
      }
    }
    
    // Update role
    return await this.withTransaction(async (client) => {
      const query = `
        UPDATE team_members 
        SET role = $1, updated_at = NOW()
        WHERE team_id = $2 AND user_id = $3
        RETURNING *
      `;
      const result = await client.query(query, [newRole, teamId, userId]);
      return result.rows[0];
    });
  }

  async removeMember(teamId, userId, requestingUserId) {
    // Check requester is admin (unless removing self)
    if (userId !== requestingUserId) {
      const requester = await this.getMember(teamId, requestingUserId);
      if (!requester || requester.role !== 'admin') {
        throw new ForbiddenError('Only team admins can remove members');
      }
    }
    
    // Can't remove last admin
    const member = await this.getMember(teamId, userId);
    if (member?.role === 'admin') {
      const admins = await this.getAll({
        filters: { team_id: teamId, role: 'admin' },
        all: true
      });
      if (admins.items.length === 1) {
        throw new ValidationError('Cannot remove the last admin');
      }
    }
    
    return await this.withTransaction(async (client) => {
      const query = `
        DELETE FROM team_members
        WHERE team_id = $1 AND user_id = $2
        RETURNING team_id, user_id
      `;
      const result = await client.query(query, [teamId, userId]);
      return result.rows[0];
    });
  }
}

export const teamMemberService = new TeamMemberService();