import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requireTeamAdmin, requireTeamMember, getTeamRole } from '../teamPermissions';

// Mock SvelteKit error function
vi.mock('@sveltejs/kit', () => ({
	error: vi.fn((status, message) => {
		const err = new Error(message);
		err.status = status;
		throw err;
	})
}));

// Mock teamMemberService
vi.mock('$lib/server/services/teamMemberService', () => ({
	teamMemberService: {
		getMember: vi.fn()
	}
}));

describe('Team Permissions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('requireTeamAdmin', () => {
		it('should return member when user is admin', async () => {
			const { teamMemberService } = await import('$lib/server/services/teamMemberService');
			const mockMember = { team_id: 'team-1', user_id: 'user-1', role: 'admin' };
			teamMemberService.getMember.mockResolvedValue(mockMember);

			const result = await requireTeamAdmin('team-1', 'user-1');

			expect(result).toEqual(mockMember);
			expect(teamMemberService.getMember).toHaveBeenCalledWith('team-1', 'user-1');
		});

		it('should throw 401 when userId is not provided', async () => {
			await expect(requireTeamAdmin('team-1', null)).rejects.toThrow('Authentication required');

			try {
				await requireTeamAdmin('team-1', undefined);
			} catch (err) {
				expect(err.status).toBe(401);
				expect(err.message).toBe('Authentication required');
			}
		});

		it('should throw 403 when user is not a member', async () => {
			const { teamMemberService } = await import('$lib/server/services/teamMemberService');
			teamMemberService.getMember.mockResolvedValue(null);

			await expect(requireTeamAdmin('team-1', 'user-1')).rejects.toThrow(
				'Team admin access required'
			);

			try {
				await requireTeamAdmin('team-1', 'user-1');
			} catch (err) {
				expect(err.status).toBe(403);
			}
		});

		it('should throw 403 when user is member but not admin', async () => {
			const { teamMemberService } = await import('$lib/server/services/teamMemberService');
			teamMemberService.getMember.mockResolvedValue({
				team_id: 'team-1',
				user_id: 'user-1',
				role: 'member'
			});

			await expect(requireTeamAdmin('team-1', 'user-1')).rejects.toThrow(
				'Team admin access required'
			);
		});
	});

	describe('requireTeamMember', () => {
		it('should return member when user is a member', async () => {
			const { teamMemberService } = await import('$lib/server/services/teamMemberService');
			const mockMember = { team_id: 'team-1', user_id: 'user-1', role: 'member' };
			teamMemberService.getMember.mockResolvedValue(mockMember);

			const result = await requireTeamMember('team-1', 'user-1');

			expect(result).toEqual(mockMember);
		});

		it('should return member when user is admin', async () => {
			const { teamMemberService } = await import('$lib/server/services/teamMemberService');
			const mockMember = { team_id: 'team-1', user_id: 'user-1', role: 'admin' };
			teamMemberService.getMember.mockResolvedValue(mockMember);

			const result = await requireTeamMember('team-1', 'user-1');

			expect(result).toEqual(mockMember);
		});

		it('should throw 401 when userId is not provided', async () => {
			await expect(requireTeamMember('team-1', null)).rejects.toThrow('Authentication required');
		});

		it('should throw 403 when user is not a member', async () => {
			const { teamMemberService } = await import('$lib/server/services/teamMemberService');
			teamMemberService.getMember.mockResolvedValue(null);

			await expect(requireTeamMember('team-1', 'user-1')).rejects.toThrow(
				'Team member access required'
			);
		});
	});

	describe('getTeamRole', () => {
		it('should return role when user is a member', async () => {
			const { teamMemberService } = await import('$lib/server/services/teamMemberService');
			teamMemberService.getMember.mockResolvedValue({
				team_id: 'team-1',
				user_id: 'user-1',
				role: 'admin'
			});

			const result = await getTeamRole('team-1', 'user-1');

			expect(result).toBe('admin');
		});

		it('should return null when userId is not provided', async () => {
			const result = await getTeamRole('team-1', null);

			expect(result).toBeNull();
		});

		it('should return null when user is not a member', async () => {
			const { teamMemberService } = await import('$lib/server/services/teamMemberService');
			teamMemberService.getMember.mockResolvedValue(null);

			const result = await getTeamRole('team-1', 'user-1');

			expect(result).toBeNull();
		});

		it('should handle different roles correctly', async () => {
			const { teamMemberService } = await import('$lib/server/services/teamMemberService');

			// Test member role
			teamMemberService.getMember.mockResolvedValue({
				team_id: 'team-1',
				user_id: 'user-1',
				role: 'member'
			});
			expect(await getTeamRole('team-1', 'user-1')).toBe('member');

			// Test admin role
			teamMemberService.getMember.mockResolvedValue({
				team_id: 'team-1',
				user_id: 'user-2',
				role: 'admin'
			});
			expect(await getTeamRole('team-1', 'user-2')).toBe('admin');
		});
	});
});
