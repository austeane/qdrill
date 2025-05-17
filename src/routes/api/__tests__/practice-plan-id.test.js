import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, PUT, DELETE } from '../practice-plans/[id]/+server.js';
import { NotFoundError, ForbiddenError } from '$lib/server/errors.js';

// Mock the dependencies
vi.mock('$lib/server/services/practicePlanService.js', () => {
	return {
		practicePlanService: {
			getPracticePlanById: vi.fn(),
			updatePracticePlan: vi.fn(),
			deletePracticePlan: vi.fn()
		}
	};
});

vi.mock('$lib/server/authGuard', () => {
	return {
		authGuard: (handler) => handler
	};
});

// Mock $app/environment to control dev mode
vi.mock('$app/environment', () => {
	return { dev: false };
});

// Import the mocked services
import { practicePlanService } from '$lib/server/services/practicePlanService.js';

describe('Practice Plan ID API Endpoints', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('GET endpoint', () => {
		it('should return a practice plan by ID', async () => {
			// Mock service response
			const mockPracticePlan = {
				id: 1,
				name: 'Test Practice Plan',
				sections: [
					{
						id: 1,
						name: 'Warm up',
						items: [{ type: 'drill', drill_id: 1, name: 'Test Drill' }]
					}
				]
			};

			practicePlanService.getPracticePlanById.mockResolvedValue(mockPracticePlan);

			// Create mock request event
			const event = {
				params: { id: '1' },
				locals: {
					session: { user: { id: 'user123' } }
				}
			};

			// Call the GET endpoint
			const response = await GET(event);
			const data = await response.json();

			// Verify the service was called correctly
			expect(practicePlanService.getPracticePlanById).toHaveBeenCalledWith('1', 'user123');

			// Verify the response
			expect(data).toEqual(mockPracticePlan);
		});

		it('should handle practice plan not found', async () => {
			// Mock service to throw not found error
			practicePlanService.getPracticePlanById.mockRejectedValue(
				new NotFoundError('Practice plan not found')
			);

			// Create mock request event
			const event = {
				params: { id: '999' },
				locals: {
					session: { user: { id: 'user123' } }
				}
			};

			// Call the GET endpoint
			const response = await GET(event);
			const data = await response.json();

			// Verify error response
			expect(response.status).toBe(404);
			expect(data.error.code).toBe('NOT_FOUND');
			expect(data.error.message).toBe('Practice plan not found');
		});

		it('should handle unauthorized access', async () => {
			// Mock service to throw unauthorized error
			practicePlanService.getPracticePlanById.mockRejectedValue(new ForbiddenError('Unauthorized'));

			// Create mock request event
			const event = {
				params: { id: '1' },
				locals: {
					session: { user: { id: 'user123' } }
				}
			};

			// Call the GET endpoint
			const response = await GET(event);
			const data = await response.json();

			// Verify error response
			expect(response.status).toBe(403);
			expect(data.error.code).toBe('FORBIDDEN');
			expect(data.error.message).toBe('Unauthorized');
		});
	});

	describe('PUT endpoint', () => {
		it('should update a practice plan', async () => {
			// Mock practice plan data and service response
			const mockPlanData = {
				name: 'Updated Practice Plan',
				sections: [
					{
						id: 1,
						name: 'Updated Section',
						items: [{ type: 'drill', drill_id: 1, duration: 15 }]
					}
				]
			};

			const mockUpdatedPlan = {
				id: 1,
				...mockPlanData,
				updated_at: new Date().toISOString()
			};

			practicePlanService.updatePracticePlan.mockResolvedValue(mockUpdatedPlan);

			// Create mock request event
			const event = {
				params: { id: '1' },
				request: {
					json: vi.fn().mockResolvedValue(mockPlanData)
				},
				locals: {
					session: { user: { id: 'user123' } }
				}
			};

			// Call the PUT endpoint
			const response = await PUT(event);
			const data = await response.json();

			// Verify the service was called correctly
			expect(practicePlanService.updatePracticePlan).toHaveBeenCalledWith(
				'1',
				mockPlanData,
				'user123'
			);

			// Verify the response
			expect(data).toEqual(mockUpdatedPlan);
		});

		it('should handle unauthorized edit', async () => {
			// Mock service to throw unauthorized error
			practicePlanService.updatePracticePlan.mockRejectedValue(
				new ForbiddenError('Unauthorized to edit this practice plan')
			);

			// Create mock request event
			const event = {
				params: { id: '1' },
				request: {
					json: vi.fn().mockResolvedValue({ name: 'Unauthorized Edit' })
				},
				locals: {
					session: { user: { id: 'user456' } }
				}
			};

			// Call the PUT endpoint
			const response = await PUT(event);
			const data = await response.json();

			// Verify error response
			expect(response.status).toBe(403);
			expect(data.error.code).toBe('FORBIDDEN');
			expect(data.error.message).toBe('Unauthorized to edit this practice plan');
		});

		it('should handle practice plan not found for update', async () => {
			// Mock service to throw not found error
			practicePlanService.updatePracticePlan.mockRejectedValue(
				new NotFoundError('Practice plan not found')
			);

			// Create mock request event
			const event = {
				params: { id: '999' },
				request: {
					json: vi.fn().mockResolvedValue({ name: 'Not Found Plan' })
				},
				locals: {
					session: { user: { id: 'user123' } }
				}
			};

			// Call the PUT endpoint
			const response = await PUT(event);
			const data = await response.json();

			// Verify error response
			expect(response.status).toBe(404);
			expect(data.error.code).toBe('NOT_FOUND');
			expect(data.error.message).toBe('Practice plan not found');
		});
	});

	describe('DELETE endpoint', () => {
		it('should delete a practice plan', async () => {
			// Mock service for successful deletion
			practicePlanService.deletePracticePlan.mockResolvedValue(true);

			// Create mock request event
			const event = {
				params: { id: '1' },
				locals: {
					session: { user: { id: 'user123' } }
				}
			};

			// Call the DELETE endpoint
			const response = await DELETE(event);

			// Verify the service was called correctly
			expect(practicePlanService.deletePracticePlan).toHaveBeenCalledWith(parseInt('1'), 'user123');

			// Verify the response
			expect(response.status).toBe(204);
		});

		it('should handle unauthorized deletion', async () => {
			// Mock service to throw unauthorized error
			practicePlanService.deletePracticePlan.mockRejectedValue(
				new ForbiddenError('Unauthorized to delete this practice plan')
			);

			// Create mock request event
			const event = {
				params: { id: '1' },
				locals: {
					session: { user: { id: 'user456' } }
				}
			};

			// Call the DELETE endpoint
			const response = await DELETE(event);
			const data = await response.json();

			// Verify error response
			expect(response.status).toBe(403);
			expect(data.error.code).toBe('FORBIDDEN');
			expect(data.error.message).toBe('Unauthorized to delete this practice plan');
		});

		it('should handle practice plan not found for deletion', async () => {
			// Mock service to throw not found error
			practicePlanService.deletePracticePlan.mockRejectedValue(
				new NotFoundError('Practice plan not found')
			);

			// Create mock request event
			const event = {
				params: { id: '999' },
				locals: {
					session: { user: { id: 'user123' } }
				}
			};

			// Call the DELETE endpoint
			const response = await DELETE(event);
			const data = await response.json();

			// Verify error response
			expect(response.status).toBe(404);
			expect(data.error.code).toBe('NOT_FOUND');
			expect(data.error.message).toBe('Practice plan not found');
		});
	});
});
