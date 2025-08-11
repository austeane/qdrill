import { BaseEntityService } from './baseEntityService';
import { ValidationError } from '$lib/server/errors';

class TeamService extends BaseEntityService {
  constructor() {
    super(
      'teams',
      'id',
      ['id', 'name', 'slug', 'description', 'default_start_time', 'timezone', 'created_at', 'updated_at'],
      ['id', 'name', 'slug', 'description', 'default_start_time', 'timezone', 'created_by', 'created_at', 'updated_at']
    );
  }

  async create(data, userId) {
    // Import here to avoid circular dependency
    const { teamMemberService } = await import('./teamMemberService');
    
    // Generate slug from name if not provided
    if (!data.slug) {
      data.slug = this.generateSlug(data.name);
    }
    
    // Validate slug uniqueness
    const existing = await this.getBySlug(data.slug);
    if (existing) {
      throw new ValidationError('Team slug already exists');
    }
    
    // Create team with creator as admin
    const team = await super.create({ ...data, created_by: userId });
    
    // Add creator as admin member
    await teamMemberService.addMember(team.id, userId, 'admin');
    
    return team;
  }

  async getBySlug(slug) {
    const result = await this.getAll({
      filters: { slug },
      limit: 1
    });
    return result.items[0] || null;
  }

  async getUserTeams(userId) {
    // Import here to avoid circular dependency
    const { teamMemberService } = await import('./teamMemberService');
    
    // Get all teams where user is a member
    const memberships = await teamMemberService.getUserMemberships(userId);
    const teamIds = memberships.map(m => m.team_id);
    
    if (teamIds.length === 0) return [];
    
    const result = await this.getAll({
      filters: { id__in: teamIds },
      all: true
    });
    
    // Attach role to each team
    return result.items.map(team => ({
      ...team,
      role: memberships.find(m => m.team_id === team.id)?.role
    }));
  }

  generateSlug(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }
}

export const teamService = new TeamService();