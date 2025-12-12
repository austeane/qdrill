import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SkillService } from '../skillService.js';
import { NotFoundError } from '../../../../lib/server/errors.js';

// Mock db module
// vi.mock('$lib/server/db', () => ({
//  query: vi.fn(),
//  getClient: vi.fn(() => ({
//   query: vi.fn(),
//   release: vi.fn()
//  }))
// }));
vi.mock('$lib/server/db');

import * as db from '$lib/server/db';

describe('SkillService', () => {
	let skillService;

	beforeEach(() => {
		vi.clearAllMocks();
		db.kyselyDb.__setResults([]);
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
			expect(skillService.primaryKey).toBe('skill');
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
			db.kyselyDb.__setResults([{ skills_focused_on: ['passing', 'catching'] }]);

			const result = await skillService.getSkillsForDrill(1);

			expect(result).toEqual(['passing', 'catching']);
		});

		it('should return empty array if drill not found', async () => {
			db.kyselyDb.__setResults([undefined]);
			await expect(skillService.getSkillsForDrill(999)).rejects.toThrow(NotFoundError);
		});

		it('should handle null skills_focused_on', async () => {
			db.kyselyDb.__setResults([{ skills_focused_on: null }]);

			const result = await skillService.getSkillsForDrill(1);

			expect(result).toEqual([]);
		});
	});

	describe('getMostUsedSkills', () => {
		it('should return most frequently used skills', async () => {
			db.kyselyDb.__setResults([
				[
					{ skill: 'passing', drills_used_in: 10, usage_count: 25 },
					{ skill: 'catching', drills_used_in: 8, usage_count: 20 }
				]
			]);

			const result = await skillService.getMostUsedSkills(2);
			expect(db.kyselyDb.limit).toHaveBeenCalledWith(2);

			expect(result).toHaveLength(2);
			expect(result[0].skill).toBe('passing');
		});

		it('should use default limit if not provided', async () => {
			db.kyselyDb.__setResults([[]]);

			await skillService.getMostUsedSkills();

			expect(db.kyselyDb.limit).toHaveBeenCalledWith(10);
		});
	});

	describe('updateSkillCounts', () => {
		it('should add new skills and remove old ones', async () => {
			// Mock addSkillsToDatabase
			vi.spyOn(skillService, 'addSkillsToDatabase').mockResolvedValueOnce();

			await skillService.updateSkillCounts(
				['passing', 'catching'], // Skills to add
				['defense'], // Skills to remove
				1 // Drill ID
			);

			// Check transaction was started (Kysely transaction helper)
			expect(db.kyselyDb.transaction).toHaveBeenCalled();

			// Check addSkillsToDatabase was called
			expect(skillService.addSkillsToDatabase).toHaveBeenCalledWith(
				['passing', 'catching'],
				1,
				expect.anything()
			);
			expect(db.kyselyDb.updateTable).toHaveBeenCalledWith('skills');
		});

		it('should handle empty arrays gracefully', async () => {
			const addSpy = vi.spyOn(skillService, 'addSkillsToDatabase');
			await skillService.updateSkillCounts([], [], 1);
			expect(addSpy).not.toHaveBeenCalled();
			expect(db.kyselyDb.updateTable).not.toHaveBeenCalled();
		});
	});

	describe('getSkillRecommendations', () => {
		it('should return recommendations based on related skills', async () => {
			db.kyselyDb.__setResults([
				[{ id: 1 }, { id: 2 }],
				{
					rows: [
						{ skill: 'throwing', drill_count: 2 },
						{ skill: 'strategy', drill_count: 1 }
					]
				}
			]);

			const result = await skillService.getSkillRecommendations(['passing']);

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
			db.kyselyDb.__setResults([[]]);

			const result = await skillService.getSkillRecommendations(['very_rare_skill']);

			expect(result).toEqual([]);
		});
	});
});
