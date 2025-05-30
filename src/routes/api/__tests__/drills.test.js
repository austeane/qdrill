import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST, PUT, DELETE } from '../drills/+server.js';
import { NotFoundError, ForbiddenError, ValidationError } from '$lib/server/errors.js';

// Mock the dependencies
vi.mock('$lib/server/services/drillService', () => {
	return {
		drillService: {
			getFilteredDrills: vi.fn(),
			createDrill: vi.fn(),
			updateDrill: vi.fn(),
			deleteDrill: vi.fn()
		}
	};
});

vi.mock('$lib/server/authGuard', () => {
	return {
		authGuard: (handler) => handler
	};
});

// Import the mocked services
import { drillService } from '$lib/server/services/drillService';

describe('Drills API Endpoints', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('GET endpoint', () => {
		it('should return filtered drills with pagination', async () => {
			// Mock service response
			const mockDrills = [
				{ id: 1, name: 'Drill 1' },
				{ id: 2, name: 'Drill 2' }
			];
			const mockPagination = { page: 1, limit: 10, totalItems: 2, totalPages: 1 };

			drillService.getFilteredDrills.mockResolvedValue({
				items: mockDrills,
				pagination: mockPagination
			});

			// Create mock request event
			const event = {
				url: new URL('http://localhost/api/drills?page=1&limit=10'),
				locals: { session: { user: { id: 'user123' } } }
			};

			// Call the GET endpoint
			const response = await GET(event);
			const data = await response.json();

			// Verify the service was called with correct params
			expect(drillService.getFilteredDrills).toHaveBeenCalledWith(
				{}, // empty filters
				expect.objectContaining({
					page: 1,
					limit: 10,
					all: false
				})
			);

			// Verify the response
			expect(data).toEqual({
				drills: mockDrills,
				pagination: mockPagination
			});
		});

		it('should handle errors correctly', async () => {
			// Mock service to throw error
			drillService.getFilteredDrills.mockRejectedValue(new Error('Database error'));

			// Create mock request event
			const event = {
				url: new URL('http://localhost/api/drills'),
				locals: { session: { user: { id: 'user123' } } }
			};

			// Call the GET endpoint
			const response = await GET(event);
			const data = await response.json();

			// Verify error response
			expect(response.status).toBe(500);
			expect(data.error).toBeDefined();
			expect(data.error.code).toBe('INTERNAL_SERVER_ERROR');
			expect(data.error.message).toBe('Database error');
		});
	});

	describe('POST endpoint', () => {
		it('should create a new drill', async () => {
			// Mock drill data and service response
			const mockDrillData = { name: 'New Drill', skill_level: ['beginner'] };
			const mockCreatedDrill = { id: 1, ...mockDrillData };

			drillService.createDrill.mockResolvedValue(mockCreatedDrill);

			// Create mock request event
			const event = {
				request: {
					json: vi.fn().mockResolvedValue(mockDrillData)
				},
				locals: {
					session: { user: { id: 'user123' } }
				}
			};

			// Call the POST endpoint
			const response = await POST(event);
			const data = await response.json();

			// Verify the service was called correctly
			expect(drillService.createDrill).toHaveBeenCalledWith(mockDrillData, 'user123');

			// Verify the response
			expect(data).toEqual(mockCreatedDrill);
		});

		it('should handle anonymous users correctly', async () => {
			// Mock drill data and service response
			const mockDrillData = { name: 'New Drill', skill_level: ['beginner'] };
			const mockCreatedDrill = { id: 1, ...mockDrillData };

			drillService.createDrill.mockResolvedValue(mockCreatedDrill);

			// Create mock request event with no session
			const event = {
				request: {
					json: vi.fn().mockResolvedValue(mockDrillData)
				},
				locals: {
					session: null
				}
			};

			// Call the POST endpoint
			const response = await POST(event);
			const data = await response.json();

			// Verify the service was called with null userId
			expect(drillService.createDrill).toHaveBeenCalledWith(mockDrillData, null);

			// Verify the response
			expect(data).toEqual(mockCreatedDrill);
		});

		it('should handle errors', async () => {
			// Mock service to throw error
			drillService.createDrill.mockRejectedValue(new ValidationError('Validation error'));

			// Create mock request event
			const event = {
				request: {
					json: vi.fn().mockResolvedValue({ name: 'Invalid Drill' })
				},
				locals: {
					session: { user: { id: 'user123' } }
				}
			};

			// Call the POST endpoint
			const response = await POST(event);
			const data = await response.json();

			// Verify error response
			expect(response.status).toBe(400);
			expect(data.error.code).toBe('VALIDATION_ERROR');
			expect(data.error.message).toBe('Validation error');
		});
	});

	describe('PUT endpoint', () => {
		it('should update an existing drill', async () => {
			// Mock drill data and service response
			const mockDrillData = { id: 1, name: 'Updated Drill' };
			const mockUpdatedDrill = { ...mockDrillData, updated_at: new Date().toISOString() };

			drillService.updateDrill.mockResolvedValue(mockUpdatedDrill);

			// Create mock request event
			const event = {
				request: {
					json: vi.fn().mockResolvedValue(mockDrillData)
				},
				locals: {
					session: { user: { id: 'user123' } }
				}
			};

			// Call the PUT endpoint
			const response = await PUT(event);
			const data = await response.json();

			// Verify the service was called correctly
			expect(drillService.updateDrill).toHaveBeenCalledWith(
				1, // drill id
				mockDrillData,
				'user123'
			);

			// Verify the response
			expect(data).toEqual(mockUpdatedDrill);
		});

		it('should handle unauthorized errors', async () => {
			// Mock service to throw unauthorized error
			drillService.updateDrill.mockRejectedValue(
				new ForbiddenError('Unauthorized to edit this drill')
			);

			// Create mock request event
			const event = {
				request: {
					json: vi.fn().mockResolvedValue({ id: 1, name: 'Updated Drill' })
				},
				locals: {
					session: { user: { id: 'user123' } }
				}
			};

			// Call the PUT endpoint
			const response = await PUT(event);
			const data = await response.json();

			// Verify error response
			expect(response.status).toBe(403);
			expect(data.error.code).toBe('FORBIDDEN');
			expect(data.error.message).toBe('Unauthorized to edit this drill');
		});

		it('should handle not found errors', async () => {
			// Mock service to throw not found error
			drillService.updateDrill.mockRejectedValue(new NotFoundError('Drill not found'));

			// Create mock request event
			const event = {
				request: {
					json: vi.fn().mockResolvedValue({ id: 999, name: 'Updated Drill' })
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
			expect(data.error.message).toBe('Drill not found');
		});
	});

	describe('DELETE endpoint', () => {
		it('should delete an existing drill', async () => {
			// Mock service response for successful deletion
			drillService.deleteDrill.mockResolvedValue(true);

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
			expect(drillService.deleteDrill).toHaveBeenCalledWith(parseInt('1'), 'user123', {
				deleteRelated: false
			});

			// Verify the response
			expect(response.status).toBe(204);
		});

		it('should handle not found case', async () => {
			// Mock service response for non-existent drill
			drillService.deleteDrill.mockRejectedValue(new NotFoundError('Drill not found'));

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
			expect(data.error.message).toBe('Drill not found');
		});

		it('should handle unauthorized errors', async () => {
			// Mock service to throw unauthorized error
			drillService.deleteDrill.mockRejectedValue(
				new ForbiddenError('Unauthorized to delete this drill')
			);

			// Create mock request event
			const event = {
				params: { id: '1' },
				locals: {
					session: { user: { id: 'user123' } }
				}
			};

			// Call the DELETE endpoint
			const response = await DELETE(event);
			const data = await response.json();

			// Verify error response
			expect(response.status).toBe(403);
			expect(data.error.code).toBe('FORBIDDEN');
			expect(data.error.message).toBe('Unauthorized to delete this drill');
		});
	});
});
