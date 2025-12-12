import { describe, it, expect, beforeEach, vi } from 'vitest';
import { teamMemberService } from '../teamMemberService';
import { ForbiddenError, ValidationError } from '$lib/server/errors';

// Mock the database operations
vi.mock('$lib/server/db', () => ({
	db: {
		query: vi.fn()
	}
}));

describe('TeamMemberService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getMember', () => {
		it('should return member when exists', async () => {
			const mockGetAll = vi.spyOn(teamMemberService, 'getAll').mockResolvedValue({
				items: [{ team_id: 'team-1', user_id: 'user-1', role: 'admin' }]
			});

			const result = await teamMemberService.getMember('team-1', 'user-1');
			expect(result).toMatchObject({
				team_id: 'team-1',
				user_id: 'user-1',
				role: 'admin'
			});

			mockGetAll.mockRestore();
		});

		it('should return null when member does not exist', async () => {
			const mockGetAll = vi.spyOn(teamMemberService, 'getAll').mockResolvedValue({
				items: []
			});

			const result = await teamMemberService.getMember('team-1', 'non-existent');
			expect(result).toBeNull();

			mockGetAll.mockRestore();
		});
	});

	describe('addMember', () => {
		it('should add new member successfully', async () => {
			const mockGetMember = vi.spyOn(teamMemberService, 'getMember').mockResolvedValue(null);
			const mockCreate = vi.spyOn(teamMemberService, 'create').mockResolvedValue({
				team_id: 'team-1',
				user_id: 'user-1',
				role: 'member'
			});

			const result = await teamMemberService.addMember('team-1', 'user-1', 'member');

			expect(result).toMatchObject({
				team_id: 'team-1',
				user_id: 'user-1',
				role: 'member'
			});

			mockGetMember.mockRestore();
			mockCreate.mockRestore();
		});

		it('should throw error when user is already a member', async () => {
			const mockGetMember = vi.spyOn(teamMemberService, 'getMember').mockResolvedValue({
				team_id: 'team-1',
				user_id: 'user-1',
				role: 'member'
			});

			await expect(teamMemberService.addMember('team-1', 'user-1', 'member')).rejects.toThrow(
				'User is already a team member'
			);

			mockGetMember.mockRestore();
		});

		it('should default to member role when not specified', async () => {
			const mockGetMember = vi.spyOn(teamMemberService, 'getMember').mockResolvedValue(null);
			const mockCreate = vi.spyOn(teamMemberService, 'create').mockResolvedValue({
				team_id: 'team-1',
				user_id: 'user-1',
				role: 'member'
			});

			await teamMemberService.addMember('team-1', 'user-1');

			expect(mockCreate).toHaveBeenCalledWith({
				team_id: 'team-1',
				user_id: 'user-1',
				role: 'member'
			});

			mockGetMember.mockRestore();
			mockCreate.mockRestore();
		});
	});

	describe('updateRole', () => {
		it('should update role when requester is admin', async () => {
			const mockGetMember = vi
				.spyOn(teamMemberService, 'getMember')
				.mockResolvedValueOnce({ role: 'admin' }); // requester is admin

			const mockTransaction = vi
				.spyOn(teamMemberService, 'withTransaction')
				.mockImplementation(async (callback) =>
					callback({
						query: vi.fn().mockResolvedValue({
							rows: [{ team_id: 'team-1', user_id: 'user-2', role: 'admin' }]
						})
					})
				);

			const result = await teamMemberService.updateRole('team-1', 'user-2', 'admin', 'user-1');

			expect(result).toMatchObject({ role: 'admin' });

			mockGetMember.mockRestore();
			mockTransaction.mockRestore();
		});

		it('should throw error when requester is not admin', async () => {
			const mockGetMember = vi
				.spyOn(teamMemberService, 'getMember')
				.mockResolvedValue({ role: 'member' }); // requester is not admin

			await expect(
				teamMemberService.updateRole('team-1', 'user-2', 'admin', 'user-1')
			).rejects.toThrow('Only team admins can update roles');

			mockGetMember.mockRestore();
		});

		it('should prevent removing last admin', async () => {
			const mockGetMember = vi
				.spyOn(teamMemberService, 'getMember')
				.mockResolvedValue({ role: 'admin' }); // requester is admin

			const mockGetAll = vi.spyOn(teamMemberService, 'getAll').mockResolvedValue({
				items: [{ team_id: 'team-1', user_id: 'user-1', role: 'admin' }] // only one admin
			});

			await expect(
				teamMemberService.updateRole('team-1', 'user-1', 'member', 'user-1')
			).rejects.toThrow('Cannot remove the last admin');

			mockGetMember.mockRestore();
			mockGetAll.mockRestore();
		});
	});

	describe('removeMember', () => {
		it('should allow self-removal for non-admins', async () => {
			const mockGetMember = vi
				.spyOn(teamMemberService, 'getMember')
				.mockResolvedValue({ role: 'member' });

			const mockTransaction = vi
				.spyOn(teamMemberService, 'withTransaction')
				.mockImplementation(async (callback) =>
					callback({
						query: vi.fn().mockResolvedValue({
							rows: [{ team_id: 'team-1', user_id: 'user-1' }]
						})
					})
				);

			const result = await teamMemberService.removeMember('team-1', 'user-1', 'user-1');

			expect(result).toMatchObject({ team_id: 'team-1', user_id: 'user-1' });

			mockGetMember.mockRestore();
			mockTransaction.mockRestore();
		});

		it('should allow admin to remove other members', async () => {
			const mockGetMember = vi
				.spyOn(teamMemberService, 'getMember')
				.mockResolvedValueOnce({ role: 'admin' }) // requester is admin
				.mockResolvedValueOnce({ role: 'member' }); // member to remove

			const mockTransaction = vi
				.spyOn(teamMemberService, 'withTransaction')
				.mockImplementation(async (callback) =>
					callback({
						query: vi.fn().mockResolvedValue({
							rows: [{ team_id: 'team-1', user_id: 'user-2' }]
						})
					})
				);

			const result = await teamMemberService.removeMember('team-1', 'user-2', 'user-1');

			expect(result).toMatchObject({ team_id: 'team-1', user_id: 'user-2' });

			mockGetMember.mockRestore();
			mockTransaction.mockRestore();
		});

		it('should prevent non-admin from removing others', async () => {
			const mockGetMember = vi
				.spyOn(teamMemberService, 'getMember')
				.mockResolvedValue({ role: 'member' }); // requester is not admin

			await expect(teamMemberService.removeMember('team-1', 'user-2', 'user-1')).rejects.toThrow(
				'Only team admins can remove members'
			);

			mockGetMember.mockRestore();
		});

		it('should prevent removing last admin', async () => {
			const mockGetMember = vi
				.spyOn(teamMemberService, 'getMember')
				.mockResolvedValue({ role: 'admin' }); // member to remove is admin

			const mockGetAll = vi.spyOn(teamMemberService, 'getAll').mockResolvedValue({
				items: [{ team_id: 'team-1', user_id: 'user-1', role: 'admin' }] // only one admin
			});

			await expect(teamMemberService.removeMember('team-1', 'user-1', 'user-1')).rejects.toThrow(
				'Cannot remove the last admin'
			);

			mockGetMember.mockRestore();
			mockGetAll.mockRestore();
		});
	});

	describe('getTeamMembers', () => {
		it('should return all team members', async () => {
			const mockGetAll = vi.spyOn(teamMemberService, 'getAll').mockResolvedValue({
				items: [
					{ team_id: 'team-1', user_id: 'user-1', role: 'admin' },
					{ team_id: 'team-1', user_id: 'user-2', role: 'member' },
					{ team_id: 'team-1', user_id: 'user-3', role: 'member' }
				]
			});

			const result = await teamMemberService.getTeamMembers('team-1');

			expect(result).toHaveLength(3);
			expect(result[0].role).toBe('admin');

			mockGetAll.mockRestore();
		});
	});

	describe('getUserMemberships', () => {
		it('should return all user memberships', async () => {
			const mockGetAll = vi.spyOn(teamMemberService, 'getAll').mockResolvedValue({
				items: [
					{ team_id: 'team-1', user_id: 'user-1', role: 'admin' },
					{ team_id: 'team-2', user_id: 'user-1', role: 'member' }
				]
			});

			const result = await teamMemberService.getUserMemberships('user-1');

			expect(result).toHaveLength(2);
			expect(result[0].team_id).toBe('team-1');
			expect(result[1].team_id).toBe('team-2');

			mockGetAll.mockRestore();
		});
	});
});
