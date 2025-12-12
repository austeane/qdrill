import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PracticePlanService } from '../practicePlanService.js';
import {
	NotFoundError,
	ForbiddenError,
	ValidationError,
	DatabaseError
} from '../../../../lib/server/errors.js';

// Ensure deterministic dev flag for permission-related tests
vi.mock('$app/environment', () => ({ dev: false }));

vi.mock('$lib/server/db');
import * as mockDb from '$lib/server/db';

describe('PracticePlanService', () => {
	let service;

	beforeEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
		mockDb.kyselyDb.__setResults([]);
		service = new PracticePlanService();
	});

	describe('constructor', () => {
		it('should initialize with correct values', () => {
			expect(service.tableName).toBe('practice_plans');
			expect(service.primaryKey).toBe('id');
			expect(service.defaultColumns).toEqual(['*']);
			expect(service.allowedColumns).toContain('name');
			expect(service.allowedColumns).toContain('visibility');
			expect(service.useStandardPermissions).toBe(true);
		});
	});

	describe('calculateSectionDuration', () => {
		it('should sum durations of non-parallel items', () => {
			const items = [{ duration: 10 }, { duration: 15 }, { duration: 5 }];

			const result = service.calculateSectionDuration(items);

			expect(result).toBe(30);
		});

		it('should handle parallel groups correctly', () => {
			const items = [
				{ duration: 10 },
				{ duration: 20, parallel_group_id: 'group1' },
				{ duration: 15, parallel_group_id: 'group1' },
				{ duration: 5 }
			];

			// Should take max of parallel group (20) + non-parallel items (10 + 5)
			const result = service.calculateSectionDuration(items);

			expect(result).toBe(35);
		});

		it('should handle multiple parallel groups', () => {
			const items = [
				{ duration: 10 },
				{ duration: 20, parallel_group_id: 'group1' },
				{ duration: 15, parallel_group_id: 'group1' },
				{ duration: 25, parallel_group_id: 'group2' },
				{ duration: 30, parallel_group_id: 'group2' },
				{ duration: 5 }
			];

			// Should take max of each parallel group (20 from group1, 30 from group2) + non-parallel items (10 + 5)
			const result = service.calculateSectionDuration(items);

			expect(result).toBe(65);
		});

		it('should handle items with null or undefined duration', () => {
			const items = [
				{ duration: 10 },
				{ duration: null },
				{ duration: undefined },
				{ parallel_group_id: 'group1' }
			];

			const result = service.calculateSectionDuration(items);

			expect(result).toBe(10);
		});
	});

	describe('formatDrillItem', () => {
		it('should format regular drill item correctly', () => {
			const dbItem = {
				id: 1,
				type: 'drill',
				item_duration: 10,
				order_in_plan: 0,
				section_id: 'section1',
				drill_id: 123,
				drill_name: 'Test Drill',
				brief_description: 'A test drill',
				ppd_diagram_data: null
			};

			const result = service.formatDrillItem(dbItem);

			expect(result.type).toBe('drill');
			expect(result.duration).toBe(10);
			expect(result.section_id).toBe('section1');
			expect(result.drill).toBeDefined();
			expect(result.drill.id).toBe(123);
			expect(result.drill.name).toBe('Test Drill');
		});

		it('should format one-off drill items correctly', () => {
			const dbItem = {
				id: 2,
				type: 'drill',
				item_duration: 5,
				order_in_plan: 1,
				section_id: 'section1',
				drill_id: null,
				name: 'Custom Activity',
				ppd_diagram_data: '{"some":"data"}'
			};

			const result = service.formatDrillItem(dbItem);

			expect(result.type).toBe('one-off');
			expect(result.duration).toBe(5);
			expect(result.name).toBe('Custom Activity');
			expect(result.drill).toBeNull();
			expect(result.diagram_data).toBe('{"some":"data"}');
		});

		it('should format break items correctly', () => {
			const dbItem = {
				id: 3,
				type: 'break',
				item_duration: 5,
				order_in_plan: 2,
				section_id: 'section1',
				name: 'Water Break'
			};

			const result = service.formatDrillItem(dbItem);

			expect(result.type).toBe('break');
			expect(result.duration).toBe(5);
			expect(result.name).toBe('Water Break');
			expect(result.drill).toBeUndefined();
		});

		it('should handle parallel timeline and group info', () => {
			const dbItem = {
				id: 4,
				type: 'drill',
				item_duration: 10,
				order_in_plan: 3,
				section_id: 'section1',
				drill_id: 456,
				drill_name: 'Parallel Drill',
				parallel_group_id: 'group1',
				parallel_timeline: 'timeline2',
				groupTimelines: ['timeline1', 'timeline2']
			};

			const result = service.formatDrillItem(dbItem);

			expect(result.parallel_group_id).toBe('group1');
			expect(result.parallel_timeline).toBe('timeline2');
			expect(result.groupTimelines).toEqual(['timeline1', 'timeline2']);
		});
	});

	describe('validatePracticePlan', () => {
		it('should validate a valid plan', () => {
			const plan = {
				name: 'Test Plan',
				sections: [
					{
						name: 'Section 1',
						items: [{ type: 'drill', drill_id: 123, name: 'Test Drill', duration: 10 }]
					}
				]
			};

			expect(() => service.validatePracticePlan(plan)).not.toThrow();
		});

		it('should throw error when name is missing', () => {
			const plan = {
				name: '',
				sections: [
					{
						name: 'Section 1',
						items: [{ type: 'drill', drill_id: 123, name: 'Test Drill', duration: 10 }]
					}
				]
			};

			expect(() => service.validatePracticePlan(plan)).toThrow(ValidationError);
			try {
				service.validatePracticePlan(plan);
			} catch (error) {
				expect(error.details.name).toContain('Plan name is required');
			}
		});

		it('should allow plans with only breaks', () => {
			const plan = {
				name: 'Test Plan',
				sections: [
					{
						name: 'Section 1',
						items: [{ type: 'break', name: 'Water Break', duration: 5 }]
					}
				]
			};

			expect(() => service.validatePracticePlan(plan)).not.toThrow();
		});

		it('should allow arbitrary phase_of_season values', () => {
			const plan = {
				name: 'Test Plan',
				phase_of_season: 'Invalid Phase',
				sections: [
					{
						name: 'Section 1',
						items: [{ type: 'drill', drill_id: 123, name: 'Test Drill', duration: 10 }]
					}
				]
			};

			expect(() => service.validatePracticePlan(plan)).not.toThrow();
		});
	});

		describe('getAll', () => {
			it('should retrieve public practice plans by default', async () => {
				const mockPlans = [
					{
						id: 1,
						name: 'Public Plan',
						visibility: 'public',
						drills: [1, 2],
						upvote_count: 0
					}
				];
				// initial search execute, sorted re-execute, then count
				mockDb.kyselyDb.__setResults([mockPlans, mockPlans, { total: '1' }]);

				const result = await service.getAll();

				expect(result.items).toHaveLength(1);
				expect(result.items[0].id).toBe(1);
				expect(result.items[0].visibility).toBe('public');
				expect(result.pagination.totalItems).toBe(1);
			});

			it('should include private plans for the requesting user', async () => {
				const userId = 123;
				const mockPlans = [
					{
						id: 1,
						name: 'Public Plan',
						visibility: 'public',
						created_by: null
					},
					{
						id: 2,
						name: 'Private Plan',
						visibility: 'private',
						created_by: userId
					}
				];
				mockDb.kyselyDb.__setResults([mockPlans, mockPlans, { total: '2' }]);

				const result = await service.getAll({ userId });

				expect(result.items).toHaveLength(2);
			});

			it('should handle database errors', async () => {
				mockDb.kyselyDb.execute.mockRejectedValueOnce(new Error('Database error'));
				await expect(service.getAll()).rejects.toThrow('Database error');
			});
		});

	describe('createPracticePlan', () => {
		beforeEach(() => {
			// Mock validatePracticePlan to prevent validation errors (currently not invoked by service)
			vi.spyOn(service, 'validatePracticePlan').mockImplementation(() => {});

			// Mock addTimestamps
			vi.spyOn(service, 'addTimestamps').mockImplementation((data) => ({
				...data,
				created_at: new Date('2025-01-01'),
				updated_at: new Date('2025-01-01')
			}));
		});

		it('should create a new practice plan', async () => {
			mockDb.kyselyDb.__setResults([{ id: 123 }, { id: 456 }]);

			const planData = {
				name: 'Test Practice Plan',
				description: 'Description of the plan',
				practice_goals: ['goal1', 'goal2'],
				phase_of_season: 'Mid season, skill building',
				estimated_number_of_participants: 15,
				visibility: 'public',
				is_editable_by_others: true,
				sections: [
					{
						name: 'Warm-up',
						order: 0,
						goals: ['warm up players'],
						notes: 'Start slow',
						items: [
							{
								type: 'drill',
								drill_id: 789,
								duration: 10
							}
						]
					}
				]
			};

			const userId = 456;
			const result = await service.createPracticePlan(planData, userId);

			// Check if the correct ID is returned
			expect(result).toEqual({ id: 123 });
		});

		it('should force public visibility for anonymous users', async () => {
			mockDb.kyselyDb.__setResults([{ id: 123 }, { id: 456 }]);

			const planData = {
				name: 'Anonymous Plan',
				visibility: 'private', // This should be overridden
				sections: [
					{
						name: 'Section',
						order: 0,
						items: [{ type: 'drill', drill_id: 1, name: 'Test Drill', duration: 10 }]
					}
				]
			};

			await service.createPracticePlan(planData, null); // null userId = anonymous

			// Check if visibility was changed to public
			const planValues = mockDb.kyselyDb.values.mock.calls[0][0];
			expect(planValues.visibility).toBe('public');
			expect(planValues.is_editable_by_others).toBe(true);
		});

		it('should handle one-off items and type mapping', async () => {
			mockDb.kyselyDb.__setResults([{ id: 123 }, { id: 456 }]);

			const planData = {
				name: 'Plan with One-offs',
				visibility: 'public', // Add valid visibility
				sections: [
					{
						name: 'Section',
						order: 0,
						items: [
							{
								type: 'one-off',
								name: 'Custom Drill',
								duration: 10
							}
						]
					}
				]
			};

			await service.createPracticePlan(planData, 123);

			const itemValues = mockDb.kyselyDb.values.mock.calls[2][0];
			expect(itemValues.drill_id).toBeNull();
			expect(itemValues.type).toBe('drill');
			expect(itemValues.name).toBe('Custom Drill');
		});

		it('should handle parallel groups and timelines', async () => {
			mockDb.kyselyDb.__setResults([{ id: 123 }, { id: 456 }]);

			const planData = {
				name: 'Parallel Plan',
				visibility: 'public', // Add valid visibility
				sections: [
					{
						name: 'Section',
						order: 0,
						items: [
							{
								type: 'drill',
								drill_id: 789,
								duration: 10,
								parallel_group_id: 'group1',
								parallel_timeline: 'timeline1',
								groupTimelines: ['timeline1', 'timeline2']
							}
						]
					}
				]
			};

			await service.createPracticePlan(planData, 123);

			const itemValues = mockDb.kyselyDb.values.mock.calls[2][0];
			expect(itemValues.parallel_group_id).toBe('group1');
			expect(itemValues.parallel_timeline).toBe('timeline1');
			expect(itemValues.group_timelines).toEqual(['timeline1', 'timeline2']);
		});
	});

	describe('getPracticePlanById', () => {
		beforeEach(() => {
			// Mock base getById (used before transaction)
			vi.spyOn(service, 'getById').mockResolvedValue({
				id: 123,
				name: 'Test Plan',
				visibility: 'public',
				created_by: 456
			});

			// Mock formatDrillItem to return the input for easier testing
			vi.spyOn(service, 'formatDrillItem').mockImplementation((item) => ({
				...item,
				formatted: true
			}));

			// Mock calculateSectionDuration
			vi.spyOn(service, 'calculateSectionDuration').mockReturnValue(30);
		});

		it('should retrieve a practice plan with its sections and items', async () => {
			mockDb.kyselyDb.__setResults([
				[
					{
						id: 'section1',
						name: 'Section 1',
						order: 0
					}
				],
				{
					rows: [
						{
							id: 'item1',
							section_id: 'section1',
							drill_id: 789,
							order_in_plan: 0,
							type: 'drill',
							item_duration: 10,
							drill_name: 'Test Drill'
						}
					]
				}
			]);

			const result = await service.getPracticePlanById(123, 456);

			// Check the result structure
			expect(result.id).toBe(123);
			expect(result.name).toBe('Test Plan');
			expect(result.sections).toHaveLength(1);
			expect(result.sections[0].id).toBe('section1');
			expect(result.sections[0].items).toHaveLength(1);
			expect(result.sections[0].duration).toBe(30);
		});

		it('should throw error if plan not found', async () => {
			service.getById.mockRejectedValue(new NotFoundError('Practice plan not found'));

			await expect(service.getPracticePlanById(999, 123)).rejects.toThrow(
				'Practice plan not found'
			);
		});

		it('should throw error if user is not authorized', async () => {
			service.getById.mockRejectedValue(new ForbiddenError('Unauthorized'));

			await expect(service.getPracticePlanById(123, 789)).rejects.toThrow('Unauthorized');
		});

		it('should create default section if no sections exist', async () => {
			mockDb.kyselyDb.__setResults([
				[],
				{
					rows: [
						{
							id: 'item1',
							section_id: null, // No section
							drill_id: 789,
							order_in_plan: 0,
							type: 'drill',
							item_duration: 10,
							drill_name: 'Test Drill'
						}
					]
				}
			]);

			const result = await service.getPracticePlanById(123, 456);

			// Check if a default section was created
			expect(result.sections).toHaveLength(1);
			expect(result.sections[0].id).toBe('default');
			expect(result.sections[0].name).toBe('Main Section');
			expect(result.sections[0].items).toHaveLength(1);
		});
	});

	describe('updatePracticePlan', () => {
		beforeEach(() => {
			// Mock getById
			vi.spyOn(service, 'getById').mockResolvedValue({
				id: 123,
				name: 'Existing Plan',
				visibility: 'public',
				created_by: 456
			});

			// Mock canUserEdit
			vi.spyOn(service, 'canUserEdit').mockResolvedValue(true);

			// Mock addTimestamps
			vi.spyOn(service, 'addTimestamps').mockImplementation((data) => ({
				...data,
				updated_at: new Date('2025-01-01')
			}));
			vi.spyOn(service, '_resequenceItems').mockResolvedValue();
		});

		it('should update a practice plan', async () => {
			vi.spyOn(service, 'update').mockResolvedValue({ id: 123, name: 'Updated Plan' });

			const planData = {
				name: 'Updated Plan',
				description: 'Updated description',
				visibility: 'public',
				sections: [
					{
						id: 'section1',
						name: 'Updated Section',
						order: 0,
						items: [
							{
								type: 'drill',
								drill_id: 789,
								duration: 15
							}
						]
					}
				]
			};

			const result = await service.updatePracticePlan(123, planData, 456);

			// Check result
			expect(result.id).toBe(123);
			expect(result.name).toBe('Updated Plan');
		});

		it('should throw error if plan not found', async () => {
			service.canUserEdit.mockRejectedValue(new NotFoundError('Practice plan not found'));

			await expect(service.updatePracticePlan(999, { name: 'Updated' }, 456)).rejects.toThrow(
				'Practice plan not found'
			);
		});

		it('should throw error if user is not authorized', async () => {
			service.canUserEdit.mockRejectedValue(
				new ForbiddenError('Unauthorized to edit this practice plan')
			);

			await expect(service.updatePracticePlan(123, { name: 'Updated' }, 789)).rejects.toThrow(
				'Unauthorized to edit this practice plan'
			);
		});

		it('should force public visibility for anonymous users', async () => {
			vi.spyOn(service, 'update').mockResolvedValue({ id: 123, name: 'Updated Plan' });

			const planData = {
				name: 'Updated by Anonymous',
				visibility: 'private' // Should be overridden
			};

			await service.updatePracticePlan(123, planData, null); // null userId

			expect(service.update).toHaveBeenCalledWith(
				123,
				expect.objectContaining({ visibility: 'public', is_editable_by_others: true }),
				expect.anything()
			);
		});

		it('should handle complex items with timelines and custom attributes', async () => {
			vi.spyOn(service, 'update').mockResolvedValue({ id: 123 });

			const planData = {
				name: 'Complex Plan',
				sections: [
					{
						id: 'section1',
						name: 'Complex Section',
						order: 0,
						items: [
							{
								type: 'drill',
								drill: { id: 789, name: 'Drill from object' },
								selected_duration: 15, // legacy field
								duration: 15,
								parallel_group_id: 'group1',
								parallel_timeline: 'timeline1',
								groupTimelines: ['timeline1', 'timeline2']
							}
						]
					}
				]
			};

			await service.updatePracticePlan(123, planData, 456);

			const itemValues = mockDb.kyselyDb.values.mock.calls[1][0];
			expect(itemValues.drill_id).toBe(789);
			expect(itemValues.duration).toBe(15);
			expect(itemValues.parallel_group_id).toBe('group1');
			expect(itemValues.parallel_timeline).toBe('timeline1');
			expect(itemValues.group_timelines).toEqual(['timeline1', 'timeline2']);
		});
	});

	describe('deletePracticePlan', () => {
		beforeEach(() => {
			// Mock getById
			vi.spyOn(service, 'getById').mockResolvedValue({
				id: 123,
				name: 'Plan to Delete',
				visibility: 'public',
				created_by: 456
			});

			// Mock canUserEdit
			vi.spyOn(service, 'canUserEdit').mockResolvedValue(true);
		});

		it('should delete a practice plan and related records', async () => {
			// plan (executeTakeFirst), delete drills (execute), delete sections (execute), base delete (executeTakeFirst)
			mockDb.kyselyDb.__setResults([
				{ created_by: 456, visibility: 'public' },
				[],
				[],
				{ id: 123 }
			]);

			const result = await service.deletePracticePlan(123, 456);

			// Should return true on success
			expect(result).toBe(true);
		});

		it('should throw error if plan not found', async () => {
			mockDb.kyselyDb.__setResults([undefined]);

			await expect(service.deletePracticePlan(999, 456)).rejects.toThrow('not found');
		});

		it('should throw error if user is not authorized', async () => {
			mockDb.kyselyDb.__setResults([{ created_by: 456, visibility: 'public' }]);

			await expect(service.deletePracticePlan(123, 789)).rejects.toThrow(
				'Only the creator can delete this practice plan.'
			);
		});

		it('should handle database errors during deletion', async () => {
			mockDb.kyselyDb.executeTakeFirst.mockRejectedValueOnce(new Error('Database error'));

			await expect(service.deletePracticePlan(123, 456)).rejects.toThrow(DatabaseError);
		});
	});

	describe('duplicatePracticePlan', () => {
		beforeEach(() => {
			// Mock getPracticePlanById (used to load original)
			vi.spyOn(service, 'getPracticePlanById').mockResolvedValue({
				id: 123,
				name: 'Original Plan',
				description: 'Original description',
				practice_goals: ['goal1'],
				phase_of_season: 'Mid season, skill building',
				estimated_number_of_participants: 15,
				visibility: 'public',
				is_editable_by_others: true,
				start_time: '2025-01-01'
			});

			// Mock addTimestamps
			vi.spyOn(service, 'addTimestamps').mockImplementation((data) => ({
				...data,
				created_at: new Date('2025-01-01'),
				updated_at: new Date('2025-01-01')
			}));
		});

		it('should duplicate a practice plan with all sections and items', async () => {
			mockDb.kyselyDb.__setResults([
				{ id: 456 },
				[
					{
						id: 'section1',
						name: 'Section 1',
						order: 0,
						goals: ['goal1'],
						notes: 'notes'
					}
				],
				{ id: 'newSection1' },
				[
					{
						id: 'item1',
						drill_id: 789,
						order_in_plan: 0,
						duration: 10,
						type: 'drill',
						parallel_group_id: 'group1',
						parallel_timeline: 'timeline1',
						group_timelines: ['timeline1'],
						name: 'Drill Name'
					}
				]
			]);

			const result = await service.duplicatePracticePlan(123, 456); // original ID, new userId
			const planValues = mockDb.kyselyDb.values.mock.calls[0][0];
			expect(planValues.name).toBe('Original Plan (Copy)');

			// Check result
			expect(result).toEqual({ id: 456 });
		});

		it('should throw error if original plan not found', async () => {
			service.getPracticePlanById.mockRejectedValue(new NotFoundError('Practice plan not found'));

			await expect(service.duplicatePracticePlan(999, 456)).rejects.toThrow(
				'Practice plan not found'
			);
		});

		it('should use userId of duplicator as creator', async () => {
			mockDb.kyselyDb.__setResults([{ id: 456 }, []]);

			const newUserId = 789;
			await service.duplicatePracticePlan(123, newUserId);

			const planValues = mockDb.kyselyDb.values.mock.calls[0][0];
			expect(planValues.created_by).toBe(newUserId);
		});

		it('should preserve visibility and editability settings', async () => {
			// Set specific settings on the original plan
			service.getPracticePlanById.mockResolvedValue({
				id: 123,
				name: 'Private Plan',
				description: null,
				practice_goals: [],
				phase_of_season: null,
				estimated_number_of_participants: null,
				visibility: 'private',
				is_editable_by_others: false
			});

			mockDb.kyselyDb.__setResults([{ id: 456 }, []]);

			await service.duplicatePracticePlan(123, 456);

			const planValues = mockDb.kyselyDb.values.mock.calls[0][0];
			expect(planValues.visibility).toBe('private');
			expect(planValues.is_editable_by_others).toBe(false);
		});
	});
});
