import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DrillService } from '../drillService.js';

// Mock db module
vi.mock('$lib/server/db', () => {
  return {
    query: vi.fn(),
    getClient: vi.fn(() => ({
      query: vi.fn(),
      release: vi.fn()
    }))
  };
});

// Get the mocked module
import * as mockDb from '$lib/server/db';

describe('DrillService', () => {
  let service;
  
  beforeEach(() => {
    // Create a new service instance for each test
    service = new DrillService();
    
    // Reset mock function calls
    vi.resetAllMocks();
  });
  
  describe('constructor', () => {
    it('should initialize with correct values', () => {
      expect(service.tableName).toBe('drills');
      expect(service.primaryKey).toBe('id');
      expect(service.defaultColumns).toEqual(['*']);
      expect(service.allowedColumns).toContain('name');
      expect(service.allowedColumns).toContain('skill_level');
      expect(service.columnTypes).toHaveProperty('skills_focused_on', 'array');
      expect(service.useStandardPermissions).toBe(true);
      expect(service.arrayFields).toContain('skill_level');
      expect(service.arrayFields).toContain('diagrams');
    });
  });
  
  describe('normalizeDrillData', () => {
    it('should normalize array fields', () => {
      const data = {
        name: 'Test Drill',
        skill_level: 'beginner',
        skills_focused_on: 'passing'
      };
      
      const result = service.normalizeDrillData(data);
      
      expect(result.skill_level).toEqual(['beginner']);
      expect(result.skills_focused_on).toEqual(['passing']);
    });
    
    it('should normalize string case in arrays', () => {
      const data = {
        name: 'Test Drill',
        skill_level: ['Beginner', 'INTERMEDIATE'],
        skills_focused_on: ['Passing', 'CATCHING']
      };
      
      const result = service.normalizeDrillData(data);
      
      expect(result.skill_level).toEqual(['beginner', 'intermediate']);
      expect(result.skills_focused_on).toEqual(['passing', 'catching']);
    });
    
    it('should convert diagrams to JSON strings if they are objects', () => {
      const data = {
        name: 'Test Drill',
        diagrams: [{ some: 'data' }]
      };
      
      const result = service.normalizeDrillData(data);
      
      expect(result.diagrams[0]).toBe('{"some":"data"}');
    });
    
    it('should handle number_of_people_max field', () => {
      const data = {
        name: 'Test Drill',
        number_of_people_max: '10'
      };
      
      const result = service.normalizeDrillData(data);
      
      expect(result.number_of_people_max).toBe(10);
    });
    
    it('should convert empty number_of_people_max to null', () => {
      const data = {
        name: 'Test Drill',
        number_of_people_max: ''
      };
      
      const result = service.normalizeDrillData(data);
      
      expect(result.number_of_people_max).toBeNull();
    });
    
    it('should remove id if it is null or undefined', () => {
      const data = {
        id: null,
        name: 'Test Drill'
      };
      
      const result = service.normalizeDrillData(data);
      
      expect(result).not.toHaveProperty('id');
    });
  });
  
  describe('createDrill', () => {
    it('should create a drill with normalized data', async () => {
      // Mock transaction function
      vi.spyOn(service, 'withTransaction').mockImplementation(async (callback) => {
        return callback();
      });
      
      // Mock the create method to return a drill
      vi.spyOn(service, 'create').mockResolvedValue({
        id: 1,
        name: 'Test Drill',
        skill_level: ['beginner'],
        skills_focused_on: ['passing']
      });
      
      // Mock updateSkills
      vi.spyOn(service, 'updateSkills').mockResolvedValue();
      
      const drillData = {
        name: 'Test Drill',
        skill_level: 'beginner',
        skills_focused_on: 'passing'
      };
      
      const result = await service.createDrill(drillData, 123);
      
      expect(service.create).toHaveBeenCalled();
      expect(service.updateSkills).toHaveBeenCalled();
      expect(service.updateSkills.mock.calls[0][0]).toEqual(['passing']);
      expect(service.updateSkills.mock.calls[0][1]).toBe(1);
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'Test Drill');
    });
  });
  
  describe('updateDrill', () => {
    it('should check authorization before updating', async () => {
      // Mock canUserEdit
      vi.spyOn(service, 'canUserEdit').mockResolvedValue(false);
      
      const drillData = {
        name: 'Updated Drill'
      };
      
      await expect(service.updateDrill(1, drillData, 123)).rejects.toThrow('Unauthorized');
      expect(service.canUserEdit).toHaveBeenCalledWith(1, 123);
    });
    
    it('should update a drill with normalized data when authorized', async () => {
      // Mock authorization
      vi.spyOn(service, 'canUserEdit').mockResolvedValue(true);
      
      // Mock transaction function
      vi.spyOn(service, 'withTransaction').mockImplementation(async (callback) => {
        return callback();
      });
      
      // Mock getById
      vi.spyOn(service, 'getById').mockResolvedValue({
        id: 1,
        name: 'Test Drill',
        skills_focused_on: ['passing']
      });
      
      // Mock update
      vi.spyOn(service, 'update').mockResolvedValue({
        id: 1,
        name: 'Updated Drill',
        skills_focused_on: ['passing', 'catching']
      });
      
      // Mock updateSkillCounts
      vi.spyOn(service, 'updateSkillCounts').mockResolvedValue();
      
      const drillData = {
        name: 'Updated Drill',
        skills_focused_on: ['passing', 'catching']
      };
      
      const result = await service.updateDrill(1, drillData, 123);
      
      expect(service.update).toHaveBeenCalled();
      expect(service.updateSkillCounts).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'Updated Drill');
    });
  });
  
  describe('getDrillWithVariations', () => {
    it('should return drill with its variations', async () => {
      // Mock getById
      vi.spyOn(service, 'getById').mockResolvedValue({
        id: 1,
        name: 'Test Drill'
      });
      
      // Mock db query
      mockDb.query.mockResolvedValue({
        rows: [
          { id: 2, name: 'Variation 1' },
          { id: 3, name: 'Variation 2' }
        ]
      });
      
      const result = await service.getDrillWithVariations(1);
      
      expect(mockDb.query).toHaveBeenCalled();
      expect(mockDb.query.mock.calls[0][1]).toEqual([1]); // Check query params
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('variations');
      expect(result.variations).toHaveLength(2);
    });
    
    it('should return null if drill does not exist', async () => {
      // Mock getById
      vi.spyOn(service, 'getById').mockResolvedValue(null);
      
      const result = await service.getDrillWithVariations(999);
      
      expect(result).toBeNull();
      expect(mockDb.query).not.toHaveBeenCalled();
    });
  });
});