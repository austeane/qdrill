import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SkillService } from '../skillService.js';
import { NotFoundError, DatabaseError } from '../../../../lib/server/errors.js';

// Mock db module
// vi.mock('$lib/server/db', () => ({
//  query: vi.fn(),
//  getClient: vi.fn(() => ({
//   query: vi.fn(),
//   release: vi.fn()
//  }))
// }));
vi.mock('$lib/server/db');

import * as db from '$lib/server/db'; // Changed to import * as db

describe('SkillService', () => {
	let skillService;

	beforeEach(() => {
		vi.resetAllMocks();
		skillService = new SkillService();
	});

	// afterEach is not strictly necessary with vi.resetAllMocks() in beforeEach
	// but can be kept if specific restore logic is needed later.
	// afterEach(() => {
	// 	vi.restoreAllMocks();
	// });

	describe('constructor', () => {
		it('should initialize with the correct table name and columns', () => {
			expect(skillService.tableName).toBe('skills');
			expect(skillService.primaryKey).toBe('id');
			expect(skillService.allowedColumns).toContain('skill');
			expect(skillService.allowedColumns).toContain('drills_used_in');
			expect(skillService.allowedColumns).toContain('usage_count');
		});
	});

	describe('getAllSkills', () => {
		it('should return skills with correct sorting', async () => {
			// Mock the getAll method
			vi.spyOn(skillService, 'getAll').mockResolvedValueOnce({
				items: [
					{ skill: 'passing', drills_used_in: 10, usage_count: 25 },
					{ skill: 'catching', drills_used_in: 8, usage_count: 20 }
				],
				pagination: { page: 1, limit: 10, totalItems: 2, totalPages: 1 }
			});

			const result = await skillService.getAllSkills();

			expect(skillService.getAll).toHaveBeenCalledWith({
				sortBy: 'usage_count',
				sortOrder: 'desc'
			});

			expect(result.items).toHaveLength(2);
			expect(result.items[0].skill).toBe('passing');
		});

		it('should use custom sort parameters if provided', async () => {
			// Mock the getAll method
			vi.spyOn(skillService, 'getAll').mockResolvedValueOnce({
				items: [],
				pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 }
			});

			await skillService.getAllSkills({
				sortBy: 'skill',
				sortOrder: 'asc'
			});

			expect(skillService.getAll).toHaveBeenCalledWith({
				sortBy: 'skill',
				sortOrder: 'asc'
			});
		});
	});

	describe('getSkillsForDrill', () => {
		it('should return skills for a specific drill', async () => {
			db.query.mockResolvedValueOnce({
				rows: [{ skills_focused_on: ['passing', 'catching'] }]
			});

			const result = await skillService.getSkillsForDrill(1);

			expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT skills_focused_on'), [
				1
			]);

			expect(result).toEqual(['passing', 'catching']);
		});

		it('should return empty array if drill not found', async () => {
			db.query.mockResolvedValueOnce({ rows: [] });

			const result = await skillService.getSkillsForDrill(999);

			expect(result).toEqual([]);
		});

		it('should handle null skills_focused_on', async () => {
			db.query.mockResolvedValueOnce({
				rows: [{ skills_focused_on: null }]
			});

			const result = await skillService.getSkillsForDrill(1);

			expect(result).toEqual([]);
		});
	});

	describe('getMostUsedSkills', () => {
		it('should return most frequently used skills', async () => {
			db.query.mockResolvedValueOnce({
				rows: [
					{ skill: 'passing', drills_used_in: 10, usage_count: 25 },
					{ skill: 'catching', drills_used_in: 8, usage_count: 20 }
				]
			});

			const result = await skillService.getMostUsedSkills(2);

			expect(db.query).toHaveBeenCalledWith(
				expect.stringContaining('ORDER BY drills_used_in DESC'),
				[2]
			);

			expect(result).toHaveLength(2);
			expect(result[0].skill).toBe('passing');
		});

		it('should use default limit if not provided', async () => {
			db.query.mockResolvedValueOnce({ rows: [] });

			await skillService.getMostUsedSkills();

			expect(db.query).toHaveBeenCalledWith(
				expect.stringContaining('LIMIT $1'),
				[10] // Default limit
			);
		});
	});

	describe('updateSkillCounts', () => {
		it('should add new skills and remove old ones', async () => {
			// Mock client for transaction
			const mockClient = {
				query: vi.fn().mockResolvedValue({ rows: [] }), // Give client its own query mock
				release: vi.fn()
			};
			db.getClient.mockResolvedValueOnce(mockClient);

			// Mock addSkillsToDatabase
			vi.spyOn(skillService, 'addSkillsToDatabase').mockResolvedValueOnce();

			await skillService.updateSkillCounts(
				['passing', 'catching'], // Skills to add
				['defense'], // Skills to remove
				1 // Drill ID
			);

			// Check transaction was started
			expect(mockClient.query).toHaveBeenCalledWith('BEGIN');

			// Check addSkillsToDatabase was called
			expect(skillService.addSkillsToDatabase).toHaveBeenCalledWith(
				['passing', 'catching'],
				1,
				mockClient
			);

			// Check update query for removed skill
			expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE skills'), [
				'defense'
			]);

			// Check transaction was committed
			expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
		});

		it('should handle empty arrays gracefully', async () => {
			const mockClient = {
				query: vi.fn().mockResolvedValue({ rows: [] }), // Give client its own query mock
				release: vi.fn()
			};
			db.getClient.mockResolvedValueOnce(mockClient);

			await skillService.updateSkillCounts([], [], 1);

			expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
			expect(mockClient.query).not.toHaveBeenCalledWith(
				expect.stringContaining('UPDATE skills'),
				expect.anything()
			);
			expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
		});
	});

	describe('getSkillRecommendations', () => {
		it('should return recommendations based on related skills', async () => {
			// First query to find drills with current skills
			db.query.mockResolvedValueOnce({
				rows: [{ id: 1 }, { id: 2 }]
			});

			// Second query to find other skills in these drills
			db.query.mockResolvedValueOnce({
				rows: [
					{ skill: 'throwing', drill_count: 2 },
					{ skill: 'strategy', drill_count: 1 }
				]
			});

			const result = await skillService.getSkillRecommendations(['passing']);

			// Check first query
			expect(db.query).toHaveBeenNthCalledWith(
				1,
				expect.stringContaining('WHERE skills_focused_on && $1'),
				[['passing']]
			);

			// Check second query
			expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('WHERE id = ANY($1)'), [
				[1, 2],
				['passing'],
				5
			]);

			expect(result).toEqual(['throwing', 'strategy']);
		});

		it('should return most used skills if no current skills provided', async () => {
			vi.spyOn(skillService, 'getMostUsedSkills').mockResolvedValueOnce([
				{ skill: 'passing', drills_used_in: 10 },
				{ skill: 'catching', drills_used_in: 8 }
			]);

			const result = await skillService.getSkillRecommendations([]);

			expect(skillService.getMostUsedSkills).toHaveBeenCalledWith(5);
			expect(result).toEqual(['passing', 'catching']);
		});

		it('should return empty array if no related drills found', async () => {
			db.query.mockResolvedValueOnce({ rows: [] });

			const result = await skillService.getSkillRecommendations(['very_rare_skill']);

			expect(result).toEqual([]);
		});
	});
});
