import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserService } from '../userService.js';
import { NotFoundError, DatabaseError, ValidationError } from '../../../../lib/server/errors.js';

vi.mock('$lib/server/db');

import * as db from '$lib/server/db';

describe('UserService', () => {
	let userService;

	beforeEach(() => {
		vi.clearAllMocks();
		db.kyselyDb.__setResults([]);
		userService = new UserService();
	});

	describe('constructor', () => {
		it('should initialize with the correct table name and columns', () => {
			expect(userService.tableName).toBe('users');
			expect(userService.primaryKey).toBe('id');
			expect(userService.allowedColumns).toContain('email');
			expect(userService.allowedColumns).toContain('name');
			expect(userService.allowedColumns).toContain('image');
		});
	});

	describe('getUserByEmail', () => {
		it('should return user data when found', async () => {
			const mockUser = { id: '123', name: 'Test User', email: 'test@example.com' };
			db.kyselyDb.__setResults([mockUser]);
			const result = await userService.getUserByEmail('test@example.com');
			expect(result).toEqual(mockUser);
		});

		it('should throw NotFoundError when user not found', async () => {
			db.kyselyDb.__setResults([undefined]);
			await expect(userService.getUserByEmail('nonexistent@example.com')).rejects.toThrow(
				NotFoundError
			);
		});

		it('should handle errors properly', async () => {
			const mockError = new Error('Database error');
			db.kyselyDb.executeTakeFirst.mockRejectedValueOnce(mockError);
			await expect(userService.getUserByEmail('test@example.com')).rejects.toThrow(DatabaseError);
		});
	});

	describe('isAdmin', () => {
		it('should return true for admin role', async () => {
			const mockUser = { id: '123', role: 'admin' };
			vi.spyOn(userService, 'getById').mockResolvedValueOnce(mockUser);

			const result = await userService.isAdmin('123');
			expect(result).toBe(true);
			expect(userService.getById).toHaveBeenCalledWith('123', ['role']);
		});

		it('should return false for user role', async () => {
			const mockUser = { id: '123', role: 'user' };
			vi.spyOn(userService, 'getById').mockResolvedValueOnce(mockUser);

			const result = await userService.isAdmin('123');
			expect(result).toBe(false);
		});

		it('should return false when user not found', async () => {
			vi.spyOn(userService, 'getById').mockRejectedValueOnce(new NotFoundError('User not found'));

			const result = await userService.isAdmin('nonexistent');
			expect(result).toBe(false);
		});

		it('should return false on database error', async () => {
			vi.spyOn(userService, 'getById').mockRejectedValueOnce(new Error('Database error'));

			const result = await userService.isAdmin('123');
			expect(result).toBe(false);
		});
	});

	describe('setUserRole', () => {
		it('should update user role successfully', async () => {
			const mockUser = { id: '123', name: 'Test User', email: 'test@example.com', role: 'admin' };
			db.kyselyDb.__setResults([mockUser]);

			const result = await userService.setUserRole('123', 'admin');
			expect(result).toEqual(mockUser);
			expect(db.kyselyDb.updateTable).toHaveBeenCalledWith('users');
		});

		it('should throw ValidationError for invalid role', async () => {
			await expect(userService.setUserRole('123', 'superuser')).rejects.toThrow(ValidationError);
			expect(db.query).not.toHaveBeenCalled();
		});

		it('should throw NotFoundError when user not found', async () => {
			db.kyselyDb.__setResults([undefined]);
			await expect(userService.setUserRole('nonexistent', 'admin')).rejects.toThrow(NotFoundError);
		});

		it('should throw DatabaseError on database error', async () => {
			db.kyselyDb.executeTakeFirst.mockRejectedValueOnce(new Error('Database error'));
			await expect(userService.setUserRole('123', 'admin')).rejects.toThrow(DatabaseError);
		});
	});

	describe('getUserProfile', () => {
		it('should return complete user profile with related data', async () => {
			// Mock getById instead of db.query for the user fetch
			vi.spyOn(userService, 'getById').mockResolvedValueOnce({
				id: '123',
				name: 'Test User',
				email: 'test@example.com',
				image: null,
				email_verified: null
			});

			// Mock withTransaction to return test data directly
			vi.spyOn(userService, 'withTransaction').mockResolvedValueOnce({
				user: {
					id: '123',
					name: 'Test User',
					email: 'test@example.com',
					emailVerified: null
				},
				drills: [{ id: 1, name: 'Drill 1', variation_count: 2 }],
				practicePlans: [{ id: 1, name: 'Plan 1' }],
				formations: [{ id: 1, name: 'Formation 1' }],
				votes: [{ id: 1, type: 'drill', item_name: 'Drill 1' }],
				comments: [
					{
						id: 1,
						drill_id: 1,
						drill_name: 'Drill 1',
						content: 'Great drill!',
						created_at: new Date()
					}
				]
			});

			const result = await userService.getUserProfile('123');

			expect(result).toHaveProperty('user');
			expect(result.user).toHaveProperty('emailVerified');
			expect(result.user).not.toHaveProperty('email_verified');
			expect(result).toHaveProperty('drills');
			expect(result).toHaveProperty('practicePlans');
			expect(result).toHaveProperty('formations');
			expect(result).toHaveProperty('votes');
			expect(result).toHaveProperty('comments');
		});

		it('should throw NotFoundError if user not found', async () => {
			vi.spyOn(userService, 'getById').mockRejectedValueOnce(new NotFoundError('User not found'));
			await expect(userService.getUserProfile('nonexistent')).rejects.toThrow(NotFoundError);
		});
	});
});
