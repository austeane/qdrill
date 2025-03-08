import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PracticePlanService } from '../practicePlanService.js';

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

describe('PracticePlanService', () => {
  let service;
  
  beforeEach(() => {
    // Create a new service instance for each test
    service = new PracticePlanService();
    
    // Reset mock function calls
    vi.resetAllMocks();
  });
  
  describe('constructor', () => {
    it('should initialize with correct values', () => {
      expect(service.tableName).toBe('practice_plans');
      expect(service.primaryKey).toBe('id');
      expect(service.defaultColumns).toEqual(['*']);
      expect(service.allowedColumns).toContain('name');
      expect(service.allowedColumns).toContain('visibility');
      expect(service.useStandardPermissions).toBe(true);
    });
  });

  describe('calculateSectionDuration', () => {
    it('should sum durations of non-parallel items', () => {
      const items = [
        { duration: 10 },
        { duration: 15 },
        { duration: 5 }
      ];
      
      const result = service.calculateSectionDuration(items);
      
      expect(result).toBe(30);
    });
    
    it('should handle parallel groups correctly', () => {
      const items = [
        { duration: 10 },
        { duration: 20, parallel_group_id: 'group1' },
        { duration: 15, parallel_group_id: 'group1' },
        { duration: 5 }
      ];
      
      // Should take max of parallel group (20) + non-parallel items (10 + 5)
      const result = service.calculateSectionDuration(items);
      
      expect(result).toBe(35);
    });
    
    it('should handle multiple parallel groups', () => {
      const items = [
        { duration: 10 },
        { duration: 20, parallel_group_id: 'group1' },
        { duration: 15, parallel_group_id: 'group1' },
        { duration: 25, parallel_group_id: 'group2' },
        { duration: 30, parallel_group_id: 'group2' },
        { duration: 5 }
      ];
      
      // Should take max of each parallel group (20 from group1, 30 from group2) + non-parallel items (10 + 5)
      const result = service.calculateSectionDuration(items);
      
      expect(result).toBe(65);
    });
    
    it('should handle items with null or undefined duration', () => {
      const items = [
        { duration: 10 },
        { duration: null },
        { duration: undefined },
        { parallel_group_id: 'group1' }
      ];
      
      const result = service.calculateSectionDuration(items);
      
      expect(result).toBe(10);
    });
  });
  
  describe('formatDrillItem', () => {
    it('should format regular drill item correctly', () => {
      const dbItem = {
        id: 1,
        type: 'drill',
        item_duration: 10,
        order_in_plan: 0,
        section_id: 'section1',
        drill_id: 123,
        drill_name: 'Test Drill',
        brief_description: 'A test drill',
        ppd_diagram_data: null
      };
      
      const result = service.formatDrillItem(dbItem);
      
      expect(result.type).toBe('drill');
      expect(result.duration).toBe(10);
      expect(result.section_id).toBe('section1');
      expect(result.drill).toBeDefined();
      expect(result.drill.id).toBe(123);
      expect(result.drill.name).toBe('Test Drill');
    });
    
    it('should format one-off drill items correctly', () => {
      const dbItem = {
        id: 2,
        type: 'drill',
        item_duration: 5,
        order_in_plan: 1,
        section_id: 'section1',
        drill_id: null,
        name: 'Custom Activity',
        ppd_diagram_data: '{"some":"data"}'
      };
      
      const result = service.formatDrillItem(dbItem);
      
      expect(result.type).toBe('one-off');
      expect(result.duration).toBe(5);
      expect(result.name).toBe('Custom Activity');
      expect(result.drill).toBeNull();
      expect(result.diagram_data).toBe('{"some":"data"}');
    });
    
    it('should format break items correctly', () => {
      const dbItem = {
        id: 3,
        type: 'break',
        item_duration: 5,
        order_in_plan: 2,
        section_id: 'section1',
        name: 'Water Break'
      };
      
      const result = service.formatDrillItem(dbItem);
      
      expect(result.type).toBe('break');
      expect(result.duration).toBe(5);
      expect(result.name).toBe('Water Break');
      expect(result.drill).toBeUndefined();
    });
    
    it('should handle parallel timeline and group info', () => {
      const dbItem = {
        id: 4,
        type: 'drill',
        item_duration: 10,
        order_in_plan: 3,
        section_id: 'section1',
        drill_id: 456,
        drill_name: 'Parallel Drill',
        parallel_group_id: 'group1',
        parallel_timeline: 'timeline2',
        groupTimelines: ['timeline1', 'timeline2']
      };
      
      const result = service.formatDrillItem(dbItem);
      
      expect(result.parallel_group_id).toBe('group1');
      expect(result.parallel_timeline).toBe('timeline2');
      expect(result.groupTimelines).toEqual(['timeline1', 'timeline2']);
    });
  });
  
  describe('validatePracticePlan', () => {
    it('should validate a valid plan', () => {
      const plan = {
        name: 'Test Plan',
        sections: [
          {
            name: 'Section 1',
            items: [
              { type: 'drill', drill_id: 123 }
            ]
          }
        ]
      };
      
      expect(() => service.validatePracticePlan(plan)).not.toThrow();
    });
    
    it('should throw error when name is missing', () => {
      const plan = {
        name: '',
        sections: [
          {
            name: 'Section 1',
            items: [
              { type: 'drill', drill_id: 123 }
            ]
          }
        ]
      };
      
      expect(() => service.validatePracticePlan(plan)).toThrow('Name is required');
    });
    
    it('should throw error when no drills are included', () => {
      const plan = {
        name: 'Test Plan',
        sections: [
          {
            name: 'Section 1',
            items: [
              { type: 'break', duration: 5 }
            ]
          }
        ]
      };
      
      expect(() => service.validatePracticePlan(plan)).toThrow('At least one drill is required');
    });
    
    it('should throw error for invalid phase of season', () => {
      const plan = {
        name: 'Test Plan',
        phase_of_season: 'Invalid Phase',
        sections: [
          {
            name: 'Section 1',
            items: [
              { type: 'drill', drill_id: 123 }
            ]
          }
        ]
      };
      
      expect(() => service.validatePracticePlan(plan)).toThrow('Invalid phase of season');
    });
  });
});