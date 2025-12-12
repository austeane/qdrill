import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FormationService } from '../formationService.js';

// Mock db module
// vi.mock('$lib/server/db', () => ({
//  query: vi.fn(),
//  getClient: vi.fn(() => ({
//   query: vi.fn(),
//   release: vi.fn()
//  }))
// }));
vi.mock('$lib/server/db');

// Get the mocked module
// import * as mockDb from '$lib/server/db'; // Removed unused import

describe('FormationService', () => {
	let service;

	beforeEach(() => {
		// Create a new service instance for each test
		service = new FormationService();

		// Reset mock function calls
		vi.resetAllMocks();
	});

	describe('constructor', () => {
		it('should initialize with correct values', () => {
			expect(service.tableName).toBe('formations');
			expect(service.primaryKey).toBe('id');
			expect(service.defaultColumns).toContain('id');
			expect(service.columnTypes).toHaveProperty('diagrams', 'json');
			expect(service.columnTypes).toHaveProperty('tags', 'array');
		});
	});

	describe('normalizeFormationData', () => {
		it('should handle diagram normalization', () => {
			const data = {
				name: 'Test Formation',
				diagrams: { some: 'diagram' }
			};

			const result = service.normalizeFormationData(data);

			// Should convert single diagram object to array
			expect(Array.isArray(result.diagrams)).toBe(true);
			expect(result.diagrams).toHaveLength(1);
			expect(result.diagrams[0]).toEqual({ some: 'diagram' });
		});

		it('should handle already array diagrams', () => {
			const data = {
				name: 'Test Formation',
				diagrams: [{ diagram1: 'data' }, { diagram2: 'data' }]
			};

			const result = service.normalizeFormationData(data);

			expect(Array.isArray(result.diagrams)).toBe(true);
			expect(result.diagrams).toHaveLength(2);
		});

		it('should handle missing diagrams', () => {
			const data = {
				name: 'Test Formation'
			};

			const result = service.normalizeFormationData(data);

			expect(Array.isArray(result.diagrams)).toBe(true);
			expect(result.diagrams).toHaveLength(0);
		});

		it('should normalize tags field', () => {
			const data = {
				name: 'Test Formation',
				tags: 'single-tag'
			};

			const result = service.normalizeFormationData(data);

			expect(Array.isArray(result.tags)).toBe(true);
			expect(result.tags).toEqual(['single-tag']);
		});

		it('should remove id if null or undefined', () => {
			const data = {
				id: null,
				name: 'Test Formation'
			};

			const result = service.normalizeFormationData(data);

			expect(result).not.toHaveProperty('id');
		});
	});

	describe('createFormation', () => {
		it('should create a formation with normalized data', async () => {
			// Mock the create method to return a formation
			vi.spyOn(service, 'create').mockResolvedValue({
				id: 1,
				name: 'Test Formation',
				diagrams: [{ some: 'diagram' }]
			});

			const formationData = {
				name: 'Test Formation',
				diagrams: { some: 'diagram' }
			};

			const result = await service.createFormation(formationData, 123);

			expect(service.create).toHaveBeenCalled();

			// Check that the normalized data was passed to create
			const createArg = service.create.mock.calls[0][0];
			expect(createArg.created_by).toBe(123);
			expect(createArg.created_at).toBeInstanceOf(Date);
			expect(createArg.updated_at).toBeInstanceOf(Date);
			expect(Array.isArray(createArg.diagrams)).toBe(true);

			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('name', 'Test Formation');
		});

		it('should remove id from input data', async () => {
			vi.spyOn(service, 'create').mockResolvedValue({
				id: 1,
				name: 'Test Formation'
			});

			const formationData = {
				id: 999, // This should be removed
				name: 'Test Formation'
			};

			await service.createFormation(formationData, 123);

			// Check that the id was removed from the create call
			const createArg = service.create.mock.calls[0][0];
			expect(createArg).not.toHaveProperty('id');
		});
	});

	describe('updateFormation', () => {
		it('should update a formation with normalized data', async () => {
			// Bypass permission check for this unit test
			vi.spyOn(service, 'canUserEdit').mockResolvedValue(true);

			// Mock the update method
			vi.spyOn(service, 'update').mockResolvedValue({
				id: 1,
				name: 'Updated Formation',
				diagrams: [{ updated: 'diagram' }]
			});

			const formationData = {
				name: 'Updated Formation',
				diagrams: { updated: 'diagram' }
			};

			const result = await service.updateFormation(1, formationData);

			expect(service.update).toHaveBeenCalledWith(1, expect.any(Object));

			// Check that the normalized data was passed to update
			const updateArg = service.update.mock.calls[0][1];
			expect(updateArg.updated_at).toBeInstanceOf(Date);
			expect(Array.isArray(updateArg.diagrams)).toBe(true);

			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('name', 'Updated Formation');
		});
	});
});
