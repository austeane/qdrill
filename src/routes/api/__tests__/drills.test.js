import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '../drills/+server.js';
import { ValidationError } from '$lib/server/errors.js';

// Mock the dependencies
vi.mock('$lib/server/services/drillService', () => {
	return {
		drillService: {
			getFilteredDrills: vi.fn(),
			createDrill: vi.fn()
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
				expect.objectContaining({ searchQuery: null }),
				expect.objectContaining({
					page: 1,
					limit: 10,
					sortBy: null,
					sortOrder: 'desc',
					userId: 'user123'
				})
			);

			expect(data).toEqual({
				items: mockDrills,
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
			const mockDrillData = {
				name: 'New Drill',
				brief_description: 'Brief',
				skill_level: ['Beginner'],
				suggested_length: { min: 5, max: 10 },
				skills_focused_on: ['Passing'],
				positions_focused_on: ['Chaser'],
				drill_type: ['Warmup']
			};
			const mockCreatedDrill = { id: 1, ...mockDrillData };

			drillService.createDrill.mockResolvedValue(mockCreatedDrill);

			// Create mock request event
			const event = {
				request: {
					json: vi.fn().mockResolvedValue(mockDrillData)
				},
				locals: {
					session: { user: { id: '123' } }
				}
			};

			// Call the POST endpoint
			const response = await POST(event);
			const data = await response.json();

			// Verify the service was called correctly
			expect(drillService.createDrill).toHaveBeenCalledWith(expect.any(Object), '123');

			// Verify the response
			expect(data).toEqual(mockCreatedDrill);
		});

		it('should handle anonymous users correctly', async () => {
			// Mock drill data and service response
			const mockDrillData = {
				name: 'New Drill',
				brief_description: 'Brief',
				skill_level: ['Beginner'],
				suggested_length: { min: 5, max: 10 },
				skills_focused_on: ['Passing'],
				positions_focused_on: ['Chaser'],
				drill_type: ['Warmup']
			};
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
			expect(drillService.createDrill).toHaveBeenCalledWith(expect.any(Object), null);

			// Verify the response
			expect(data).toEqual(expect.objectContaining(mockCreatedDrill));
			expect(data.claimToken).toBeDefined();
		});

		it('should handle errors', async () => {
			// Create mock request event
			const event = {
				request: {
					json: vi.fn().mockResolvedValue({ name: 'Invalid Drill' })
				},
				locals: {
					session: { user: { id: '123' } }
				}
			};

			// Call the POST endpoint
			const response = await POST(event);
			const data = await response.json();

			// Verify error response
			expect(response.status).toBe(400);
			expect(data.error.code).toBe('VALIDATION_ERROR');
			expect(data.error.message).toBe('Validation failed');
		});
	});
});
