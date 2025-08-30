import { BaseEntityService } from './baseEntityService.js';
import { ValidationError } from '$lib/server/errors.js';

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
    const { teamMemberService } = await import('./teamMemberService.js');
    
    // Generate slug from name if not provided
    if (!data.slug) {
      data.slug = await this.generateUniqueSlug(data.name);
    } else {
      // Ensure provided slug is unique
      const existing = await this.getBySlug(data.slug);
      if (existing) {
        throw new ValidationError('Team slug already exists');
      }
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

  // getById strictly for UUIDs (internal use only)
  async getById(id, columns = this.defaultColumns, userId = null, client = null) {
    return super.getById(id, columns, userId, client);
  }

  async getUserTeams(userId) {
    // Import here to avoid circular dependency
    const { teamMemberService } = await import('./teamMemberService.js');
    
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

  async generateUniqueSlug(name) {
    const baseSlug = this.generateSlug(name);
    let slug = baseSlug;
    let suffix = 1;
    
    // Keep trying until we find a unique slug
    while (await this.getBySlug(slug)) {
      suffix++;
      slug = `${baseSlug}-${suffix}`;
    }
    
    return slug;
  }
}

export const teamService = new TeamService();
