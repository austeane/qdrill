import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '../practice-plans/+server.js';

// Mock the dependencies
vi.mock('$lib/server/services/practicePlanService.js', () => {
	return {
		practicePlanService: {
			getAll: vi.fn(),
			createPracticePlan: vi.fn()
		}
	};
});

// Import the mocked services
import { practicePlanService } from '$lib/server/services/practicePlanService.js';

describe('Practice Plans API Endpoints', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('GET endpoint', () => {
		it('should return all practice plans for a user', async () => {
			// Mock service response
			const mockPlans = [
				{ id: 1, name: 'Practice Plan 1' },
				{ id: 2, name: 'Practice Plan 2' }
			];

			practicePlanService.getAll.mockResolvedValue({
				items: mockPlans
			});

			// Create mock request event
			const event = {
				url: new URL('http://localhost/api/practice-plans'),
				locals: {
					user: { id: 'user123' }
				}
			};

			// Call the GET endpoint
			const response = await GET(event);
			const data = await response.json();

			// Verify the service was called with correct params
			expect(practicePlanService.getAll).toHaveBeenCalledWith({
				userId: 'user123',
				page: 1,
				limit: 10,
				sortBy: 'upvotes',
				sortOrder: 'desc',
				filters: {
					searchQuery: undefined,
					phase_of_season: undefined,
					practice_goals: undefined,
					min_participants: null,
					max_participants: null
				}
			});

			// Verify the response
			expect(data.items).toEqual(mockPlans);
		});

		it('should handle anonymous users correctly', async () => {
			// Mock service response
			const mockPlans = [
				{ id: 1, name: 'Public Practice Plan 1', visibility: 'public' },
				{ id: 2, name: 'Public Practice Plan 2', visibility: 'public' }
			];

			practicePlanService.getAll.mockResolvedValue({
				items: mockPlans
			});

			// Create mock request event with no user
			const event = {
				url: new URL('http://localhost/api/practice-plans'),
				locals: {} // No user
			};

			// Call the GET endpoint
			const response = await GET(event);
			const data = await response.json();

			// Verify the service was called with undefined userId
			expect(practicePlanService.getAll).toHaveBeenCalledWith({
				userId: undefined,
				page: 1,
				limit: 10,
				sortBy: 'upvotes',
				sortOrder: 'desc',
				filters: {
					searchQuery: undefined,
					phase_of_season: undefined,
					practice_goals: undefined,
					min_participants: null,
					max_participants: null
				}
			});

			// Verify the response
			expect(data.items).toEqual(mockPlans);
		});

		it('should handle errors correctly', async () => {
			// Mock service to throw error
			practicePlanService.getAll.mockRejectedValue(new Error('Database error'));

			// Create mock request event
			const event = {
				url: new URL('http://localhost/api/practice-plans'),
				locals: {
					user: { id: 'user123' }
				}
			};

			// Call the GET endpoint
			const response = await GET(event);
			const data = await response.json();

			// Verify error response
			expect(response.status).toBe(500);
			expect(data.error).toBeDefined();
			if (data.error.message) {
				expect(data.error.message).toBe('Database error');
			} else {
				expect(data.error).toBe('Database error');
			}
		});
	});

	describe('POST endpoint', () => {
		it('should create a new practice plan', async () => {
			// Mock practice plan data and service response
			const mockPlanData = {
				name: 'New Practice Plan',
				sections: [
					{
						name: 'Warm up',
						items: [{ type: 'drill', drill_id: 1, name: 'Test Drill', duration: 10 }]
					}
				]
			};

			practicePlanService.createPracticePlan.mockResolvedValue({ id: 1 });

			// Create mock request event
			const event = {
				request: {
					json: vi.fn().mockResolvedValue(mockPlanData)
				},
				locals: {
					user: { id: 'user123' }
				}
			};

			// Call the POST endpoint
			const response = await POST(event);
			const data = await response.json();

			// Verify the service was called correctly
			expect(practicePlanService.createPracticePlan).toHaveBeenCalledWith(
				expect.objectContaining({ name: mockPlanData.name, sections: expect.any(Array) }),
				'user123'
			);
			const calledPlan = practicePlanService.createPracticePlan.mock.calls[0][0];
			expect(calledPlan.sections[0].order).toBe(0);

			// Verify the response
			expect(response.status).toBe(201);
			expect(data).toEqual({
				id: 1,
				message: 'Practice plan created successfully'
			});
		});

		it('should handle validation errors', async () => {
			// Mock service to throw validation error
			practicePlanService.createPracticePlan.mockRejectedValue(
				new Error('At least one drill is required')
			);

			// Create mock request event with invalid plan data
			const event = {
				request: {
					json: vi.fn().mockResolvedValue({
						name: 'Invalid Plan',
						sections: []
					})
				},
				locals: {
					user: { id: 'user123' }
				}
			};

			// Call the POST endpoint
			const response = await POST(event);
			const data = await response.json();

			// Verify error response
			expect(response.status).toBe(400);
			expect(data.error.code).toBe('VALIDATION_ERROR');
			expect(data.error.details.sections).toContain(
				'A practice plan must have at least one section'
			);
		});

		it('should handle anonymous users correctly', async () => {
			// Mock practice plan data and service response
			const mockPlanData = {
				name: 'Public Practice Plan',
				sections: [
					{
						name: 'Warm up',
						items: [{ type: 'drill', drill_id: 1, name: 'Test Drill', duration: 10 }]
					}
				],
				visibility: 'public'
			};

			practicePlanService.createPracticePlan.mockResolvedValue({ id: 1 });

			// Create mock request event with no user
			const event = {
				request: {
					json: vi.fn().mockResolvedValue(mockPlanData)
				},
				locals: {} // No user
			};

			// Call the POST endpoint
			const response = await POST(event);
			const data = await response.json();

			// Verify the service was called with undefined userId
			expect(practicePlanService.createPracticePlan).toHaveBeenCalledWith(
				expect.objectContaining({ name: mockPlanData.name, sections: expect.any(Array) }),
				undefined
			);
			const calledPlan = practicePlanService.createPracticePlan.mock.calls[0][0];
			expect(calledPlan.sections[0].order).toBe(0);

			// Verify the response
			expect(response.status).toBe(201);
			expect(data.id).toBe(1);
			expect(data.message).toBe('Practice plan created successfully');
			expect(data.claimToken).toBeDefined();
		});
	});
});
