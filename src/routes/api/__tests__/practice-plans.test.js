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
				userId: 'user123'
			});

			// Verify the response
			expect(data).toEqual(mockPlans);
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
				userId: undefined
			});

			// Verify the response
			expect(data).toEqual(mockPlans);
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
			expect(data.details).toBeDefined();
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
						items: [{ type: 'drill', drill_id: 1, duration: 10 }]
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
			expect(practicePlanService.createPracticePlan).toHaveBeenCalledWith(mockPlanData, 'user123');

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
			expect(data.error).toBe('At least one drill is required');
		});

		it('should handle anonymous users correctly', async () => {
			// Mock practice plan data and service response
			const mockPlanData = {
				name: 'Public Practice Plan',
				sections: [
					{
						name: 'Warm up',
						items: [{ type: 'drill', drill_id: 1, duration: 10 }]
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
			expect(practicePlanService.createPracticePlan).toHaveBeenCalledWith(mockPlanData, undefined);

			// Verify the response
			expect(response.status).toBe(201);
			expect(data).toEqual({
				id: 1,
				message: 'Practice plan created successfully'
			});
		});
	});
});
