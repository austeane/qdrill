import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, PUT, DELETE } from '../drills/[id]/+server.js';
import { NotFoundError } from '$lib/server/errors.js';

// Mock the dependencies
vi.mock('$lib/server/services/drillService', () => {
	return {
		drillService: {
			getById: vi.fn(),
			getDrillWithVariations: vi.fn(),
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

vi.mock('$lib/server/db', () => {
	return {
		query: vi.fn(),
		getClient: vi.fn(() => ({
			query: vi.fn(),
			release: vi.fn()
		}))
	};
});

// Mock $app/environment to control dev mode
vi.mock('$app/environment', () => {
	return { dev: false };
});

// Import the mocked services
import { drillService } from '$lib/server/services/drillService';
import * as _db from '$lib/server/db';

describe('Drill ID API Endpoints', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('GET endpoint', () => {
		it('should return a drill by ID', async () => {
			// Mock service response
			const mockDrill = { id: 1, name: 'Test Drill', visibility: 'public' };
			drillService.getById.mockResolvedValue(mockDrill);

			// Create mock request event
			const event = {
				params: { id: '1' },
				url: new URL('http://localhost/api/drills/1'),
				locals: {}
			};

			// Call the GET endpoint
			const response = await GET(event);
			const data = await response.json();

			// Verify the service was called correctly
			expect(drillService.getById).toHaveBeenCalledWith(1, undefined, undefined);

			// Verify the response
			expect(data).toEqual(mockDrill);
		});

		it('should return a drill with variations', async () => {
			// Mock service response
			const mockDrill = {
				id: 1,
				name: 'Test Drill',
				visibility: 'public',
				variations: [
					{ id: 2, name: 'Variation 1', created_by: 'user123' },
					{ id: 3, name: 'Variation 2', created_by: 'user456' }
				]
			};

			drillService.getDrillWithVariations.mockResolvedValue(mockDrill);

			// Create mock request event
			const event = {
				params: { id: '1' },
				url: new URL('http://localhost/api/drills/1?includeVariants=true'),
				locals: {}
			};

			// Call the GET endpoint
			const response = await GET(event);
			const data = await response.json();

			// Verify the service was called correctly
			expect(drillService.getDrillWithVariations).toHaveBeenCalledWith(1, undefined);
			expect(data.variations).toHaveLength(2);
		});

		it('should handle drill not found', async () => {
			drillService.getById.mockRejectedValue(new NotFoundError('Drill not found'));

			// Create mock request event
			const event = {
				params: { id: '999' },
				url: new URL('http://localhost/api/drills/999'),
				locals: {}
			};

			// Call the GET endpoint
			const response = await GET(event);
			const data = await response.json();

			// Verify error response
			expect(response.status).toBe(404);
			expect(data.error.code).toBe('NOT_FOUND');
		});

		it('should handle invalid ID parameter', async () => {
			// Create mock request event with invalid ID
			const event = {
				params: { id: 'invalid' },
				url: new URL('http://localhost/api/drills/invalid'),
				locals: {}
			};

			// Call the GET endpoint
			const response = await GET(event);
			const data = await response.json();

			// Verify error response
			expect(response.status).toBe(400);
			expect(data.error.code).toBe('VALIDATION_ERROR');
		});
	});

	describe('PUT endpoint', () => {
		it('should update an existing drill', async () => {
			// Mock service response
			const mockDrillData = {
				id: 1,
				name: 'Updated Drill',
				brief_description: 'Brief',
				drill_type: ['Conditioning']
			};
			const mockUpdatedDrill = { ...mockDrillData, updated_at: new Date().toISOString() };

			drillService.updateDrill.mockResolvedValue(mockUpdatedDrill);

			// Create mock request event
			const event = {
				params: { id: '1' },
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
			expect(drillService.updateDrill).toHaveBeenCalledWith(1, mockDrillData, 'user123');

			// Verify the response
			expect(data).toEqual(mockUpdatedDrill);
		});

		it('should validate required fields', async () => {
			// Create mock request event with missing fields
			const event = {
				params: { id: '1' },
				request: {
					json: vi.fn().mockResolvedValue({ name: 'Missing Type' }) // Missing drill_type
				},
				locals: {
					session: { user: { id: 'user123' } }
				}
			};

			// Call the PUT endpoint
			const response = await PUT(event);
			const data = await response.json();

			// Verify error response
			expect(response.status).toBe(400);
			expect(data.error.code).toBe('VALIDATION_ERROR');
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
			const data = await response.json();

			// Verify the service was called correctly
			expect(drillService.deleteDrill).toHaveBeenCalledWith(1, 'user123');

			// Verify the response
			expect(data.message).toBeDefined();
		});

		it('should handle drill not found', async () => {
			// Mock service to return false for not found
			drillService.deleteDrill.mockResolvedValue(false);

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
		});
	});
});
