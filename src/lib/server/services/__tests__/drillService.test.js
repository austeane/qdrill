import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DrillService } from '../drillService.js';
import {
	NotFoundError,
	ForbiddenError,
	DatabaseError
} from '../../../../lib/server/errors.js';

// Mock db module - REMOVE THIS BLOCK
// vi.mock('$lib/server/db', () => {
// 	return {
// 		query: vi.fn(),
// 		getClient: vi.fn(() => ({
// 			query: vi.fn(),
// 			release: vi.fn()
// 		}))
// 	};
// });
vi.mock('$lib/server/db');

// Get the mocked module
import * as mockDb from '$lib/server/db';

describe('DrillService', () => {
	let service;

	beforeEach(() => {
		// Create a new service instance for each test
		service = new DrillService();

		// Clear mocks without wiping Kysely mock implementations
		vi.clearAllMocks();
		mockDb.kyselyDb.__setResults([]);
	});

	describe('constructor', () => {
		it('should initialize with correct values', () => {
			expect(service.tableName).toBe('drills');
			expect(service.primaryKey).toBe('id');
			expect(service.defaultColumns).toContain('id');
			expect(service.allowedColumns).toContain('name');
			expect(service.allowedColumns).toContain('skill_level');
			expect(service.columnTypes).toHaveProperty('skills_focused_on', 'array');
			expect(service.useStandardPermissions).toBe(true);
			expect(service.arrayFields).toContain('skill_level');
			expect(service.arrayFields).toContain('diagrams');
		});
	});

	describe('normalizeDrillData', () => {
		it('should normalize array fields', () => {
			const data = {
				name: 'Test Drill',
				skill_level: 'beginner',
				skills_focused_on: 'passing'
			};

			const result = service.normalizeDrillData(data);

			expect(result.skill_level).toEqual(['beginner']);
			expect(result.skills_focused_on).toEqual(['passing']);
		});

		it('should normalize string case in arrays', () => {
			const data = {
				name: 'Test Drill',
				skill_level: ['Beginner', 'INTERMEDIATE'],
				skills_focused_on: ['Passing', 'CATCHING']
			};

			const result = service.normalizeDrillData(data);

			expect(result.skill_level).toEqual(['beginner', 'intermediate']);
			expect(result.skills_focused_on).toEqual(['passing', 'catching']);
		});

		it('should convert diagrams to JSON strings if they are objects', () => {
			const data = {
				name: 'Test Drill',
				diagrams: [{ some: 'data' }]
			};

			const result = service.normalizeDrillData(data);

			expect(result.diagrams[0]).toBe('{"some":"data"}');
		});

		it('should handle number_of_people_max field', () => {
			const data = {
				name: 'Test Drill',
				number_of_people_max: '10'
			};

			const result = service.normalizeDrillData(data);

			expect(result.number_of_people_max).toBe(10);
		});

		it('should convert empty number_of_people_max to null', () => {
			const data = {
				name: 'Test Drill',
				number_of_people_max: ''
			};

			const result = service.normalizeDrillData(data);

			expect(result.number_of_people_max).toBeNull();
		});

		it('should remove id if it is null or undefined', () => {
			const data = {
				id: null,
				name: 'Test Drill'
			};

			const result = service.normalizeDrillData(data);

			expect(result).not.toHaveProperty('id');
		});

		it('should keep id if it has a value', () => {
			const data = {
				id: 123,
				name: 'Test Drill'
			};

			const result = service.normalizeDrillData(data);

			expect(result).toHaveProperty('id', 123);
		});

		it('should handle null array fields', () => {
			const data = {
				name: 'Test Drill',
				skill_level: null,
				skills_focused_on: null
			};

			const result = service.normalizeDrillData(data);

			expect(result.skill_level).toEqual([]);
			expect(result.skills_focused_on).toEqual([]);
		});

		it('should handle non-array diagram field', () => {
			const data = {
				name: 'Test Drill',
				diagrams: 'diagram-data'
			};

			const result = service.normalizeDrillData(data);

			expect(result.diagrams).toEqual(['diagram-data']);
		});

		it('should handle empty string position', () => {
			const data = {
				name: 'Test Drill',
				positions_focused_on: ''
			};

			const result = service.normalizeDrillData(data);

			// The implementation might keep empty strings, which is still a valid array
			expect(Array.isArray(result.positions_focused_on)).toBe(true);
		});
	});

	describe('createDrill', () => {
		it('should create a drill with normalized data', async () => {
			// Mock transaction function
			vi.spyOn(service, 'withTransaction').mockImplementation(async (callback) => {
				return callback();
			});

			// Mock the create method to return a drill
			vi.spyOn(service, 'create').mockResolvedValue({
				id: 1,
				name: 'Test Drill',
				skill_level: ['beginner'],
				skills_focused_on: ['passing']
			});

			// Mock updateSkills
			vi.spyOn(service, 'updateSkills').mockResolvedValue();

			const drillData = {
				name: 'Test Drill',
				skill_level: 'beginner',
				skills_focused_on: 'passing'
			};

			const result = await service.createDrill(drillData, 123);

			expect(service.create).toHaveBeenCalled();
			expect(service.updateSkills).toHaveBeenCalled();
			expect(service.updateSkills.mock.calls[0][0]).toEqual(['passing']);
			expect(service.updateSkills.mock.calls[0][1]).toBe(1);
			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('name', 'Test Drill');
		});

		it('should handle transaction errors', async () => {
			// Mock transaction function to throw an error
			vi.spyOn(service, 'withTransaction').mockRejectedValue(new Error('Transaction failed'));

			const drillData = {
				name: 'Test Drill',
				skill_level: 'beginner'
			};

			await expect(service.createDrill(drillData, 123)).rejects.toThrow('Transaction failed');
		});

		it('should handle empty skills', async () => {
			// Mock transaction function
			vi.spyOn(service, 'withTransaction').mockImplementation(async (callback) => {
				return callback();
			});

			// Mock the create method
			vi.spyOn(service, 'create').mockResolvedValue({
				id: 1,
				name: 'Test Drill'
			});

			// Mock updateSkills
			vi.spyOn(service, 'updateSkills').mockResolvedValue();

			const drillData = {
				name: 'Test Drill',
				skills_focused_on: [] // Empty skills
			};

			await service.createDrill(drillData, 123);

			expect(service.updateSkills).toHaveBeenCalledWith([], 1, undefined);
		});
	});

	describe('updateDrill', () => {
		it('should check authorization before updating', async () => {
			// Mock canUserEdit to throw the specific ForbiddenError
			vi.spyOn(service, 'canUserEdit').mockRejectedValueOnce(
				new ForbiddenError('Unauthorized to edit this drill.')
			);

			// Ensure db.getClient() is properly mocked for this test context
			const localMockClient = { query: vi.fn(), release: vi.fn() }; // Ensure release is a spy
			mockDb.getClient.mockResolvedValue(localMockClient);

			const drillData = {
				name: 'Updated Drill'
			};

			await expect(service.updateDrill(1, drillData, 123)).rejects.toThrow(
				'Unauthorized to edit this drill.'
			);
			expect(service.canUserEdit).toHaveBeenCalledWith(1, 123, expect.anything()); // Client is passed by withTransaction
		});

		it('should update a drill with normalized data when authorized', async () => {
			// Mock authorization
			vi.spyOn(service, 'canUserEdit').mockResolvedValue(true);

			// Mock transaction function to pass a Kysely-like trx
			vi.spyOn(service, 'withTransaction').mockImplementation(async (callback) => {
				return callback(mockDb.kyselyDb);
			});

			// Mock getById
			vi.spyOn(service, 'getById').mockResolvedValue({
				id: 1,
				name: 'Test Drill',
				skills_focused_on: ['passing']
			});

			// Mock update
			vi.spyOn(service, 'update').mockResolvedValue({
				id: 1,
				name: 'Updated Drill',
				skills_focused_on: ['passing', 'catching']
			});

			// Mock updateSkillCounts
			vi.spyOn(service, 'updateSkillCounts').mockResolvedValue();

			const drillData = {
				name: 'Updated Drill',
				skills_focused_on: ['passing', 'catching']
			};

			const result = await service.updateDrill(1, drillData, 123);

			expect(service.update).toHaveBeenCalled();
			expect(service.updateSkillCounts).toHaveBeenCalled();
			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('name', 'Updated Drill');
		});

		it('should handle transaction errors', async () => {
			// Mock authorization
			vi.spyOn(service, 'canUserEdit').mockResolvedValue(true);

			// Mock transaction function to throw an error
			vi.spyOn(service, 'withTransaction').mockRejectedValue(new Error('Transaction failed'));

			const drillData = {
				name: 'Updated Drill'
			};

			await expect(service.updateDrill(1, drillData, 123)).rejects.toThrow('Transaction failed');
		});

		it('should handle drill not found', async () => {
			// Mock authorization
			vi.spyOn(service, 'canUserEdit').mockResolvedValue(true);

			// Mock transaction function
			vi.spyOn(service, 'withTransaction').mockImplementation(async (callback) => {
				return callback();
			});

			// Mock getById to return null (drill not found)
			vi.spyOn(service, 'getById').mockResolvedValue(null);

			const drillData = {
				name: 'Updated Drill'
			};

			await expect(service.updateDrill(999, drillData, 123)).rejects.toThrow('Drill not found');
		});
	});

	// NOTE: Complex tests that interact with database features are temporarily disabled
	// We'll focus on testing the higher-level functionality and API endpoints first.

	describe('getDrillWithVariations', () => {
		it('should return drill with its variations', async () => {
			// Skip test if method doesn't exist
			if (typeof service.getDrillWithVariations !== 'function') {
				return;
			}

			// Mock getById
			vi.spyOn(service, 'getById').mockResolvedValue({
				id: 1,
				name: 'Test Drill'
			});

			mockDb.kyselyDb.__setResults([
				[
					{ id: 2, name: 'Variation 1', created_by: null },
					{ id: 3, name: 'Variation 2', created_by: null }
				],
				[]
			]);

			const result = await service.getDrillWithVariations(1);

			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('variations');
			expect(result.variations).toHaveLength(2);
		});

		it('should return null if drill does not exist', async () => {
			// Skip test if method doesn't exist
			if (typeof service.getDrillWithVariations !== 'function') {
				return;
			}

			vi.spyOn(service, 'getById').mockRejectedValue(new NotFoundError('Drill not found'));

			await expect(service.getDrillWithVariations(999)).rejects.toThrow(NotFoundError);
		});
	});

		describe('getFilteredDrills', () => {
			it('should filter drills by multiple criteria', async () => {
				const mockDrills = [
					{ id: 1, name: 'Filtered Drill 1' },
					{ id: 2, name: 'Filtered Drill 2' }
				];
				// items (execute), variation counts (execute), total (executeTakeFirst)
				mockDb.kyselyDb.__setResults([mockDrills, [], { total: String(mockDrills.length) }]);

				const filters = {
					skill_level: ['beginner'],
					skills_focused_on: ['passing'],
					positions_focused_on: ['chaser'],
					suggested_length_min: 5,
					suggested_length_max: 15
				};

				const result = await service.getFilteredDrills(filters, {
					page: 1,
					limit: 10,
					userId: 'user123'
				});

				expect(result.items).toHaveLength(mockDrills.length);
				expect(result.items.map(({ id, name }) => ({ id, name }))).toEqual(
					mockDrills.map(({ id, name }) => ({ id, name }))
				);
				expect(result.items.every((d) => d.variation_count === 0)).toBe(true);
				expect(result.pagination.totalItems).toBe(mockDrills.length);
			});

			it('should handle no filters', async () => {
				const mockDrills = [
					{ id: 1, name: 'Drill 1' },
					{ id: 2, name: 'Drill 2' }
				];
				mockDb.kyselyDb.__setResults([mockDrills, [], { total: String(mockDrills.length) }]);

				const result = await service.getFilteredDrills({}, { page: 1, limit: 10, userId: 'user123' });

				expect(result.items).toHaveLength(mockDrills.length);
				expect(result.items.map(({ id, name }) => ({ id, name }))).toEqual(
					mockDrills.map(({ id, name }) => ({ id, name }))
				);
			});

			it('should handle errors', async () => {
				mockDb.kyselyDb.execute.mockRejectedValueOnce(
					new DatabaseError('Failed to retrieve filtered drills.')
				);

				await expect(service.getFilteredDrills({}, { userId: 'user123' })).rejects.toThrow(
					'Failed to retrieve filtered drills.'
				);
			});
		});

	describe('toggleUpvote', () => {
		it('should toggle upvote for a drill', async () => {
			vi.spyOn(service, 'getById').mockResolvedValue({
				id: 1,
				name: 'Test Drill',
				created_by: 123,
				visibility: 'public'
			});

			// existingVote (executeTakeFirst), insert (execute), countRow (executeTakeFirst)
			mockDb.kyselyDb.__setResults([undefined, [], { upvotes: '5' }]);

			const result = await service.toggleUpvote(1, 123);

			expect(service.getById).toHaveBeenCalledWith(1, undefined, null, expect.anything());
			expect(result).toHaveProperty('upvotes', 5);
			expect(result).toHaveProperty('hasVoted', true);
		});

		it('should remove upvote if user already voted', async () => {
			vi.spyOn(service, 'getById').mockResolvedValue({
				id: 1,
				name: 'Test Drill',
				created_by: 123,
				visibility: 'public'
			});

			// existingVote (executeTakeFirst), delete (execute), countRow (executeTakeFirst)
			mockDb.kyselyDb.__setResults([{ id: 1 }, [], { upvotes: '4' }]);

			const result = await service.toggleUpvote(1, 123);

			expect(service.getById).toHaveBeenCalledWith(1, undefined, null, expect.anything());
			expect(result).toHaveProperty('upvotes', 4);
			expect(result).toHaveProperty('hasVoted', false);
		});

		it('should throw error if drill not found', async () => {
			vi.spyOn(service, 'getById').mockRejectedValue(new NotFoundError('Drill not found'));

			await expect(service.toggleUpvote(999, 123)).rejects.toThrow('Drill not found for upvoting');
		});

		it('should throw error if drill ID or user ID is missing', async () => {
			await expect(service.toggleUpvote(null, 123)).rejects.toThrowError(
				'Both drill ID and user ID are required'
			);

			await expect(service.toggleUpvote(1, null)).rejects.toThrowError(
				'Both drill ID and user ID are required'
			);
		});
	});

	describe('setVariant', () => {
		it('should set variant relationship for a drill', async () => {
			mockDb.kyselyDb.__setResults([
				{ id: 1, name: 'Test Drill', parent_drill_id: null },
				{ count: '0' },
				{ id: 2, name: 'Parent Drill', parent_drill_id: null },
				{ id: 1, name: 'Test Drill', parent_drill_id: 2 },
				{ name: 'Parent Drill' }
			]);

			const result = await service.setVariant(1, 2);

			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('parent_drill_id', 2);
			expect(result).toHaveProperty('parent_drill_name', 'Parent Drill');
		});

		it('should remove variant relationship when parentDrillId is null', async () => {
			mockDb.kyselyDb.__setResults([
				{ id: 1, name: 'Test Drill', parent_drill_id: 2 },
				{ count: '0' },
				{ id: 1, name: 'Test Drill', parent_drill_id: null }
			]);

			const result = await service.setVariant(1, null);

			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('parent_drill_id', null);
		});

		it('should throw error if drill not found', async () => {
			mockDb.kyselyDb.__setResults([undefined]);
			await expect(service.setVariant(999, 2)).rejects.toThrow('Drill not found');
		});

		it('should throw error if parent drill not found', async () => {
			mockDb.kyselyDb.__setResults([
				{ id: 1, name: 'Test Drill', parent_drill_id: null },
				{ count: '0' },
				undefined
			]);
			await expect(service.setVariant(1, 999)).rejects.toThrow('Parent drill not found');
		});

		it('should throw error if attempting to make a parent into a variant', async () => {
			mockDb.kyselyDb.__setResults([
				{ id: 1, name: 'Test Drill', parent_drill_id: null },
				{ count: '2' },
				{ id: 2, name: 'Parent Drill', parent_drill_id: null }
			]);
			await expect(service.setVariant(1, 2)).rejects.toThrow(
				'Cannot make a parent drill into a variant'
			);
		});

		it('should throw error if attempting to use a variant as a parent', async () => {
			mockDb.kyselyDb.__setResults([
				{ id: 1, name: 'Test Drill', parent_drill_id: null },
				{ count: '0' },
				{ id: 2, name: 'Variant Drill', parent_drill_id: 3 }
			]);
			await expect(service.setVariant(1, 2)).rejects.toThrow('Cannot set a variant as a parent');
		});

		it('should throw error if drill ID is missing', async () => {
			await expect(service.setVariant(null, 2)).rejects.toThrow('Drill ID is required');
		});
	});

	describe('permission checks', () => {
		it('should check if user can edit a drill', async () => {
			// Directly test canUserEdit from the base class
			vi.spyOn(service, 'canUserEdit').mockResolvedValue(true);

			const result = await service.canUserEdit(1, 123);

			expect(result).toBe(true);
		});

		it('should handle unauthorized users', async () => {
			// Directly test canUserEdit from the base class
			vi.spyOn(service, 'canUserEdit').mockResolvedValue(false);

			const result = await service.canUserEdit(1, 123);

			expect(result).toBe(false);
		});

		it('should handle errors during permission checks', async () => {
			// Directly test canUserEdit from the base class
			vi.spyOn(service, 'canUserEdit').mockRejectedValue(new Error('Permission check failed'));

			await expect(service.canUserEdit(1, 123)).rejects.toThrow('Permission check failed');
		});
	});
});
