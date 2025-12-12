import { describe, it, expect, beforeEach, vi } from 'vitest';
import { teamService } from '../teamService';

// Mock the teamMemberService to avoid circular dependency
vi.mock('../teamMemberService', () => ({
	teamMemberService: {
		addMember: vi
			.fn()
			.mockResolvedValue({ team_id: 'test-team-id', user_id: 'test-user-id', role: 'admin' }),
		getUserMemberships: vi.fn().mockResolvedValue([
			{ team_id: 'team-1', user_id: 'test-user-id', role: 'admin' },
			{ team_id: 'team-2', user_id: 'test-user-id', role: 'member' }
		])
	}
}));

// Mock the database operations
vi.mock('$lib/server/db', () => ({
	db: {
		query: vi.fn()
	}
}));

describe('TeamService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	describe('generateSlug', () => {
		it('should generate valid slug from team name', () => {
			expect(teamService.generateSlug('Test Team')).toBe('test-team');
			expect(teamService.generateSlug('Team 123!')).toBe('team-123');
			expect(teamService.generateSlug('  Multiple   Spaces  ')).toBe('multiple-spaces');
			expect(teamService.generateSlug('Special!@#$%Characters')).toBe('special-characters');
		});

		it('should limit slug length to 50 characters', () => {
			const longName =
				'This is a very long team name that should be truncated to fifty characters maximum';
			const slug = teamService.generateSlug(longName);
			expect(slug.length).toBeLessThanOrEqual(50);
		});

		it('should handle edge cases', () => {
			expect(teamService.generateSlug('')).toBe('');
			expect(teamService.generateSlug('---')).toBe('');
			expect(teamService.generateSlug('123')).toBe('123');
		});
	});

	describe('create', () => {
		it('should auto-generate slug if not provided', async () => {
			vi.spyOn(teamService, 'getBySlug').mockResolvedValue(null);
			vi.spyOn(
				Object.getPrototypeOf(Object.getPrototypeOf(teamService)),
				'create'
			).mockResolvedValue({
				id: 'new-team-id',
				name: 'New Team',
				slug: 'new-team'
			});

			const result = await teamService.create({ name: 'New Team' }, 'user-123');

			expect(result.slug).toBe('new-team');
		});

		it('should reject duplicate slugs', async () => {
			vi.spyOn(teamService, 'getBySlug').mockResolvedValue({
				id: 'existing-team',
				slug: 'test-team'
			});

			await expect(
				teamService.create(
					{
						name: 'Test Team',
						slug: 'test-team'
					},
					'user-123'
				)
			).rejects.toThrow('Team slug already exists');
		});
	});

	describe('getUserTeams', () => {
		it('should return empty array when user has no teams', async () => {
			const { teamMemberService } = await import('../teamMemberService');
			teamMemberService.getUserMemberships.mockResolvedValue([]);

			const result = await teamService.getUserTeams('user-123');
			expect(result).toEqual([]);
		});

		it('should return teams with roles attached', async () => {
			const { teamMemberService } = await import('../teamMemberService');
			teamMemberService.getUserMemberships.mockResolvedValue([
				{ team_id: 'team-1', user_id: 'user-123', role: 'admin' },
				{ team_id: 'team-2', user_id: 'user-123', role: 'member' }
			]);

			vi.spyOn(teamService, 'getAll').mockResolvedValue({
				items: [
					{ id: 'team-1', name: 'Team One' },
					{ id: 'team-2', name: 'Team Two' }
				]
			});

			const result = await teamService.getUserTeams('user-123');

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({
				id: 'team-1',
				name: 'Team One',
				role: 'admin'
			});
			expect(result[1]).toMatchObject({
				id: 'team-2',
				name: 'Team Two',
				role: 'member'
			});
		});
	});

	describe('getBySlug', () => {
		it('should return team when slug exists', async () => {
			vi.spyOn(teamService, 'getAll').mockResolvedValue({
				items: [{ id: 'team-1', slug: 'test-slug' }]
			});

			const result = await teamService.getBySlug('test-slug');
			expect(result).toMatchObject({ id: 'team-1', slug: 'test-slug' });
		});

		it('should return null when slug does not exist', async () => {
			vi.spyOn(teamService, 'getAll').mockResolvedValue({
				items: []
			});

			const result = await teamService.getBySlug('non-existent');
			expect(result).toBeNull();
		});
	});
});
