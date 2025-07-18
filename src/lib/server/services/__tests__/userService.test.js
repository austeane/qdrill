import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserService } from '../userService.js';
import { NotFoundError, DatabaseError } from '../../../../lib/server/errors.js';

vi.mock('$lib/server/db');

import db from '$lib/server/db'; // Import the default export directly

describe('UserService', () => {
	let userService;

	beforeEach(() => {
		vi.resetAllMocks();
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
			db.query.mockResolvedValueOnce({
				rows: [mockUser]
			});
			const result = await userService.getUserByEmail('test@example.com');
			expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM users'), [
				'test@example.com'
			]);
			expect(result).toEqual(mockUser);
		});

                it('should throw NotFoundError when user not found', async () => {
                        db.query.mockResolvedValueOnce({ rows: [] });
                        await expect(userService.getUserByEmail('nonexistent@example.com')).rejects.toThrow(NotFoundError);
                });

                it('should handle errors properly', async () => {
                        const mockError = new Error('Database error');
                        db.query.mockRejectedValueOnce(mockError);
                        await expect(userService.getUserByEmail('test@example.com')).rejects.toThrow(DatabaseError);
                });
	});

	describe('getUserProfile', () => {
		it('should return complete user profile with related data', async () => {
                        const mockClientQuery = vi.fn();
                        db.query.mockResolvedValueOnce({ rows: [{ id: '123', name: 'Test User', email: 'test@example.com', image: null, email_verified: null }] });
                        db.getClient.mockResolvedValueOnce({
                                query: mockClientQuery,
                                release: vi.fn()
                        });
			mockClientQuery.mockResolvedValueOnce({
				rows: [{ id: 1, name: 'Drill 1', variation_count: 2 }]
			});
			mockClientQuery.mockResolvedValueOnce({
				rows: [{ id: 1, name: 'Plan 1' }]
			});
			mockClientQuery.mockResolvedValueOnce({
				rows: [{ id: 1, name: 'Formation 1' }]
			});
			mockClientQuery.mockResolvedValueOnce({
				rows: [{ id: 1, type: 'drill', item_name: 'Drill 1' }]
			});
			mockClientQuery.mockResolvedValueOnce({
				rows: [{ id: 1, drill_id: 1, drill_name: 'Drill 1' }]
			});

                        const result = await userService.getUserProfile('123');

                        expect(mockClientQuery).toHaveBeenNthCalledWith(
                                1,
                                expect.stringContaining('SELECT id, name, brief_description'),
                                ['123', 10, 0]
                        );
			expect(result).toHaveProperty('user');
			expect(result).toHaveProperty('drills');
			expect(result).toHaveProperty('practicePlans');
			expect(result).toHaveProperty('formations');
			expect(result).toHaveProperty('votes');
			expect(result).toHaveProperty('comments');
		});

                it('should throw NotFoundError if user not found', async () => {
                        db.query.mockResolvedValueOnce({ rows: [] });
                        await expect(userService.getUserProfile('nonexistent')).rejects.toThrow(NotFoundError);
                });
	});


});
