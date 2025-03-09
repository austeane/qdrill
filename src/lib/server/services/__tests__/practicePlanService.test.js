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

// Create a mock transaction client for testing
const mockClient = {
  query: vi.fn(),
  release: vi.fn()
};

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

  describe('getAll', () => {
    beforeEach(() => {
      // Mock withTransaction to simulate successful transaction
      vi.spyOn(service, 'withTransaction').mockImplementation(async (callback) => {
        return callback(mockClient);
      });
      
      // Reset the mock client query function
      mockClient.query.mockReset();
    });

    it('should retrieve all practice plans with public visibility', async () => {
      // Mock client query to return practice plans
      mockClient.query.mockResolvedValue({
        rows: [
          { 
            id: 1, 
            name: 'Public Plan', 
            visibility: 'public', 
            drills: [1, 2], 
            drill_durations: [10, 15]
          }
        ]
      });
      
      const result = await service.getAll();
      
      // Check if the query was called with the right parameters
      expect(mockClient.query).toHaveBeenCalled();
      
      // Verify that SQL query includes public visibility condition
      const queryCall = mockClient.query.mock.calls[0];
      expect(queryCall[0]).toContain('visibility = \'public\'');
      
      // Check that the result has the correct structure
      expect(result).toHaveProperty('items');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(1);
      expect(result.pagination).toBeNull();
    });
    
    it('should filter by userId for private plans', async () => {
      // Mock client query to return practice plans for a specific user
      mockClient.query.mockResolvedValue({
        rows: [
          { 
            id: 1, 
            name: 'Public Plan', 
            visibility: 'public',
            created_by: null 
          },
          { 
            id: 2, 
            name: 'Private Plan', 
            visibility: 'private',
            created_by: 123 
          }
        ]
      });
      
      const userId = 123;
      const result = await service.getAll({ userId });
      
      // Check if the query parameter includes the userId
      const queryCall = mockClient.query.mock.calls[0];
      expect(queryCall[0]).toContain('OR (visibility = \'private\' AND created_by = $1)');
      expect(queryCall[1]).toEqual([userId]);
      
      // Check if both plans are returned
      expect(result.items).toHaveLength(2);
    });
    
    it('should handle database errors', async () => {
      // Mock client query to throw an error
      mockClient.query.mockRejectedValue(new Error('Database error'));
      
      // Mock the transaction to pass through the error
      vi.spyOn(service, 'withTransaction').mockImplementation(async (callback) => {
        try {
          return await callback(mockClient);
        } catch (error) {
          throw error;
        }
      });
      
      await expect(service.getAll()).rejects.toThrow('Database error');
    });
  });

  describe('createPracticePlan', () => {
    beforeEach(() => {
      // Mock withTransaction to simulate successful transaction
      vi.spyOn(service, 'withTransaction').mockImplementation(async (callback) => {
        return callback(mockClient);
      });
      
      // Mock validatePracticePlan to prevent validation errors
      vi.spyOn(service, 'validatePracticePlan').mockImplementation(() => {});
      
      // Mock addTimestamps
      vi.spyOn(service, 'addTimestamps').mockImplementation((data) => ({ 
        ...data, 
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01')
      }));
      
      // Reset the mock client query function
      mockClient.query.mockReset();
    });
    
    it('should create a new practice plan', async () => {
      // Mock client queries to simulate successful insertions
      mockClient.query
        // First query for plan insertion
        .mockResolvedValueOnce({ rows: [{ id: 123 }] })
        // Mock for section insertion
        .mockResolvedValueOnce({ rows: [{ id: 456 }] })
        // No need to mock drill insertion result since it's not used
        .mockResolvedValue({});
      
      const planData = {
        name: 'Test Practice Plan',
        description: 'Description of the plan',
        practice_goals: ['goal1', 'goal2'],
        phase_of_season: 'Mid season, skill building',
        estimated_number_of_participants: 15,
        visibility: 'public',
        is_editable_by_others: true,
        sections: [
          {
            name: 'Warm-up',
            order: 0,
            goals: ['warm up players'],
            notes: 'Start slow',
            items: [
              {
                type: 'drill',
                drill_id: 789,
                duration: 10
              }
            ]
          }
        ]
      };
      
      const userId = 456;
      const result = await service.createPracticePlan(planData, userId);
      
      // Verify the practice plan was inserted
      expect(mockClient.query).toHaveBeenCalledTimes(3); // Plan, section, and drill insertions
      
      // Check the first call (plan insertion)
      const planInsertCall = mockClient.query.mock.calls[0];
      expect(planInsertCall[0]).toContain('INSERT INTO practice_plans');
      expect(planInsertCall[1]).toContain(planData.name);
      expect(planInsertCall[1]).toContain(userId);
      
      // Check the second call (section insertion)
      const sectionInsertCall = mockClient.query.mock.calls[1];
      expect(sectionInsertCall[0]).toContain('INSERT INTO practice_plan_sections');
      expect(sectionInsertCall[1]).toEqual([
        123, // plan ID
        'Warm-up',
        0,
        ['warm up players'],
        'Start slow'
      ]);
      
      // Check the third call (drill insertion)
      const drillInsertCall = mockClient.query.mock.calls[2];
      expect(drillInsertCall[0]).toContain('INSERT INTO practice_plan_drills');
      
      // Check if the correct ID is returned
      expect(result).toEqual({ id: 123 });
    });
    
    it('should force public visibility for anonymous users', async () => {
      // Mock client query for plan insertion
      mockClient.query.mockResolvedValue({ rows: [{ id: 123 }] });
      
      const planData = {
        name: 'Anonymous Plan',
        visibility: 'private', // This should be overridden
        sections: [
          {
            name: 'Section',
            items: [
              { type: 'drill', drill_id: 1 }
            ]
          }
        ]
      };
      
      await service.createPracticePlan(planData, null); // null userId = anonymous
      
      // Check if visibility was changed to public
      const planInsertCall = mockClient.query.mock.calls[0];
      expect(planInsertCall[1][6]).toBe('public'); // visibility parameter
      expect(planInsertCall[1][7]).toBe(true); // is_editable_by_others parameter
    });
    
    it('should validate the practice plan', async () => {
      // Just verify the validation is called during practice plan creation
      
      // Reset mocks
      vi.resetAllMocks();
      
      // Add spy on validatePracticePlan
      const spy = vi.spyOn(service, 'validatePracticePlan');
      
      // Create mock query implementation
      mockClient.query.mockResolvedValue({ rows: [{ id: 123 }] });
      
      // Create valid plan
      const validPlan = {
        name: 'Valid Plan',
        visibility: 'public',
        sections: [
          {
            name: 'Section',
            items: [
              { type: 'drill', drill_id: 123 }
            ]
          }
        ]
      };
      
      await service.createPracticePlan(validPlan, 123);
      
      // Verify validation was called
      expect(spy).toHaveBeenCalledWith(validPlan);
    });
    
    it('should handle one-off items and type mapping', async () => {
      // Mock client queries
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 123 }] })
        .mockResolvedValueOnce({ rows: [{ id: 456 }] })
        .mockResolvedValue({});
      
      const planData = {
        name: 'Plan with One-offs',
        visibility: 'public', // Add valid visibility
        sections: [
          {
            name: 'Section',
            order: 0,
            items: [
              {
                type: 'one-off',
                name: 'Custom Drill',
                duration: 10
              }
            ]
          }
        ]
      };
      
      await service.createPracticePlan(planData, 123);
      
      // Check the drill insertion call
      const drillInsertCall = mockClient.query.mock.calls[2];
      expect(drillInsertCall[1][2]).toBeNull(); // drill_id should be null for one-off
      expect(drillInsertCall[1][5]).toBe('drill'); // type should be mapped to 'drill'
      expect(drillInsertCall[1][10]).toBe('Custom Drill'); // name should be preserved
    });
    
    it('should handle parallel groups and timelines', async () => {
      // Mock client queries
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 123 }] })
        .mockResolvedValueOnce({ rows: [{ id: 456 }] })
        .mockResolvedValue({});
      
      const planData = {
        name: 'Parallel Plan',
        visibility: 'public', // Add valid visibility
        sections: [
          {
            name: 'Section',
            order: 0,
            items: [
              {
                type: 'drill',
                drill_id: 789,
                duration: 10,
                parallel_group_id: 'group1',
                parallel_timeline: 'timeline1',
                groupTimelines: ['timeline1', 'timeline2']
              }
            ]
          }
        ]
      };
      
      await service.createPracticePlan(planData, 123);
      
      // Check the drill insertion call
      const drillInsertCall = mockClient.query.mock.calls[2];
      expect(drillInsertCall[1][7]).toBe('group1'); // parallel_group_id
      expect(drillInsertCall[1][8]).toBe('timeline1'); // parallel_timeline
      expect(drillInsertCall[1][9]).toBe('{timeline1,timeline2}'); // groupTimelines
    });
  });

  describe('getPracticePlanById', () => {
    beforeEach(() => {
      // Mock withTransaction
      vi.spyOn(service, 'withTransaction').mockImplementation(async (callback) => {
        return callback(mockClient);
      });
      
      // Mock canUserView
      vi.spyOn(service, 'canUserView').mockReturnValue(true);
      
      // Mock formatDrillItem to return the input for easier testing
      vi.spyOn(service, 'formatDrillItem').mockImplementation(item => ({...item, formatted: true}));
      
      // Mock calculateSectionDuration
      vi.spyOn(service, 'calculateSectionDuration').mockReturnValue(30);
      
      // Reset mockClient.query
      mockClient.query.mockReset();
    });
    
    it('should retrieve a practice plan with its sections and items', async () => {
      // Mock client queries
      mockClient.query
        // First query for practice plan
        .mockResolvedValueOnce({
          rows: [{
            id: 123,
            name: 'Test Plan',
            visibility: 'public',
            created_by: 456
          }]
        })
        // Second query for sections
        .mockResolvedValueOnce({
          rows: [{
            id: 'section1',
            name: 'Section 1',
            order: 0
          }]
        })
        // Third query for items
        .mockResolvedValueOnce({
          rows: [{
            id: 'item1',
            section_id: 'section1',
            drill_id: 789,
            order_in_plan: 0,
            type: 'drill',
            item_duration: 10,
            drill_name: 'Test Drill'
          }]
        });
      
      const result = await service.getPracticePlanById(123, 456);
      
      // Check if all 3 queries were called
      expect(mockClient.query).toHaveBeenCalledTimes(3);
      
      // Check the first query (plan)
      const planQuery = mockClient.query.mock.calls[0];
      expect(planQuery[0]).toContain('SELECT * FROM practice_plans WHERE id = $1');
      expect(planQuery[1]).toEqual([123]);
      
      // Check the second query (sections)
      const sectionsQuery = mockClient.query.mock.calls[1];
      expect(sectionsQuery[0]).toContain('SELECT * FROM practice_plan_sections');
      expect(sectionsQuery[1]).toEqual([123]);
      
      // Check the third query (items)
      const itemsQuery = mockClient.query.mock.calls[2];
      expect(itemsQuery[0]).toContain('SELECT');
      expect(itemsQuery[0]).toContain('FROM practice_plan_drills ppd');
      expect(itemsQuery[1]).toEqual([123]);
      
      // Check the result structure
      expect(result.id).toBe(123);
      expect(result.name).toBe('Test Plan');
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].id).toBe('section1');
      expect(result.sections[0].items).toHaveLength(1);
      expect(result.sections[0].duration).toBe(30);
    });
    
    it('should throw error if plan not found', async () => {
      // Mock client query to return empty result
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      await expect(service.getPracticePlanById(999, 123))
        .rejects.toThrow('Practice plan not found');
        
      // Only the first query should have been called
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });
    
    it('should throw error if user is not authorized', async () => {
      // Mock client query to return a plan
      mockClient.query.mockResolvedValueOnce({
        rows: [{
          id: 123,
          name: 'Private Plan',
          visibility: 'private',
          created_by: 456
        }]
      });
      
      // Mock canUserView to return false
      service.canUserView.mockReturnValue(false);
      
      await expect(service.getPracticePlanById(123, 789)) // Different userId
        .rejects.toThrow('Unauthorized');
    });
    
    it('should create default section if no sections exist', async () => {
      // Mock client queries
      mockClient.query
        // First query for practice plan
        .mockResolvedValueOnce({
          rows: [{
            id: 123,
            name: 'Test Plan',
            visibility: 'public',
            created_by: 456
          }]
        })
        // Second query for sections (empty result)
        .mockResolvedValueOnce({
          rows: []
        })
        // Third query for items
        .mockResolvedValueOnce({
          rows: [{
            id: 'item1',
            section_id: null, // No section
            drill_id: 789,
            order_in_plan: 0,
            type: 'drill',
            item_duration: 10,
            drill_name: 'Test Drill'
          }]
        });
      
      const result = await service.getPracticePlanById(123, 456);
      
      // Check if a default section was created
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].id).toBe('default');
      expect(result.sections[0].name).toBe('Main Section');
      expect(result.sections[0].items).toHaveLength(1);
    });
  });

  describe('updatePracticePlan', () => {
    beforeEach(() => {
      // Mock withTransaction
      vi.spyOn(service, 'withTransaction').mockImplementation(async (callback) => {
        return callback(mockClient);
      });
      
      // Mock getById
      vi.spyOn(service, 'getById').mockResolvedValue({
        id: 123,
        name: 'Existing Plan',
        visibility: 'public',
        created_by: 456
      });
      
      // Mock canUserEdit
      vi.spyOn(service, 'canUserEdit').mockResolvedValue(true);
      
      // Mock addTimestamps
      vi.spyOn(service, 'addTimestamps').mockImplementation((data) => ({ 
        ...data, 
        updated_at: new Date('2025-01-01')
      }));
      
      // Reset mockClient.query
      mockClient.query.mockReset();
    });
    
    it('should update a practice plan', async () => {
      // Mock client queries
      mockClient.query
        // First query for updating plan
        .mockResolvedValueOnce({
          rows: [{
            id: 123,
            name: 'Updated Plan'
          }]
        })
        // For section and drill deletion/insertion
        .mockResolvedValue({});
      
      const planData = {
        name: 'Updated Plan',
        description: 'Updated description',
        visibility: 'public',
        sections: [
          {
            id: 'section1',
            name: 'Updated Section',
            order: 0,
            items: [
              {
                type: 'drill',
                drill_id: 789,
                duration: 15
              }
            ]
          }
        ]
      };
      
      const result = await service.updatePracticePlan(123, planData, 456);
      
      // Check the update query
      const updateQuery = mockClient.query.mock.calls[0];
      expect(updateQuery[0]).toContain('UPDATE practice_plans SET');
      expect(updateQuery[1]).toContain('Updated Plan');
      
      // Check that sections were deleted and recreated
      const deleteSecQuery = mockClient.query.mock.calls[1];
      expect(deleteSecQuery[0]).toContain('DELETE FROM practice_plan_sections');
      
      const deleteDrillsQuery = mockClient.query.mock.calls[2];
      expect(deleteDrillsQuery[0]).toContain('DELETE FROM practice_plan_drills');
      
      // Check section insertion
      const sectionInsertQuery = mockClient.query.mock.calls[3];
      expect(sectionInsertQuery[0]).toContain('INSERT INTO practice_plan_sections');
      
      // Check drill insertion
      const drillInsertQuery = mockClient.query.mock.calls[4];
      expect(drillInsertQuery[0]).toContain('INSERT INTO practice_plan_drills');
      
      // Check result
      expect(result.id).toBe(123);
      expect(result.name).toBe('Updated Plan');
    });
    
    it('should throw error if plan not found', async () => {
      // Mock getById to return null
      service.getById.mockResolvedValue(null);
      
      await expect(service.updatePracticePlan(999, { name: 'Updated' }, 456))
        .rejects.toThrow('Practice plan not found');
      
      // No queries should have been executed
      expect(mockClient.query).not.toHaveBeenCalled();
    });
    
    it('should throw error if user is not authorized', async () => {
      // Mock canUserEdit to return false
      service.canUserEdit.mockResolvedValue(false);
      
      await expect(service.updatePracticePlan(123, { name: 'Updated' }, 789))
        .rejects.toThrow('Unauthorized to edit this practice plan');
      
      // No queries should have been executed
      expect(mockClient.query).not.toHaveBeenCalled();
    });
    
    it('should force public visibility for anonymous users', async () => {
      // Mock client queries
      mockClient.query.mockResolvedValue({
        rows: [{ id: 123, name: 'Updated Plan' }]
      });
      
      const planData = {
        name: 'Updated by Anonymous',
        visibility: 'private' // Should be overridden
      };
      
      await service.updatePracticePlan(123, planData, null); // null userId
      
      // Check the update query parameters
      const updateQuery = mockClient.query.mock.calls[0];
      expect(updateQuery[1][6]).toBe('public'); // visibility param
      expect(updateQuery[1][5]).toBe(true); // is_editable_by_others param
    });
    
    it('should handle complex items with timelines and custom attributes', async () => {
      // Mock client queries
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 123 }] })
        .mockResolvedValue({});
      
      const planData = {
        name: 'Complex Plan',
        sections: [
          {
            id: 'section1',
            name: 'Complex Section',
            order: 0,
            items: [
              {
                type: 'drill',
                drill: { id: 789, name: 'Drill from object' },
                selected_duration: 15, // Using selected_duration instead of duration
                parallel_group_id: 'group1',
                parallel_timeline: 'timeline1',
                groupTimelines: ['timeline1', 'timeline2']
              }
            ]
          }
        ]
      };
      
      await service.updatePracticePlan(123, planData, 456);
      
      // Check the item insertion
      const itemInsertQuery = mockClient.query.mock.calls[4];
      
      // Should use drill.id when drill_id is not provided
      expect(itemInsertQuery[1][2]).toBe(789);
      
      // Should use selected_duration when duration is not provided
      expect(itemInsertQuery[1][4]).toBe(15);
      
      // Check parallel group properties
      // Match the parameter indexes from the query in updatePracticePlan
      expect(itemInsertQuery[1][6]).toBe('group1'); // parallel_group_id
      expect(itemInsertQuery[1][7]).toBe('timeline1'); // parallel_timeline
      expect(itemInsertQuery[1][8]).toBe('{timeline1,timeline2}'); // group_timelines
    });
  });

  describe('deletePracticePlan', () => {
    beforeEach(() => {
      // Mock withTransaction
      vi.spyOn(service, 'withTransaction').mockImplementation(async (callback) => {
        return callback(mockClient);
      });
      
      // Mock getById
      vi.spyOn(service, 'getById').mockResolvedValue({
        id: 123,
        name: 'Plan to Delete',
        visibility: 'public',
        created_by: 456
      });
      
      // Mock canUserEdit
      vi.spyOn(service, 'canUserEdit').mockResolvedValue(true);
      
      // Reset mockClient.query
      mockClient.query.mockReset();
    });
    
    it('should delete a practice plan and related records', async () => {
      // Mock client queries
      mockClient.query.mockResolvedValue({});
      
      const result = await service.deletePracticePlan(123, 456);
      
      // Check queries were executed in correct order
      expect(mockClient.query).toHaveBeenCalledTimes(3);
      
      // First should delete drills
      const deleteItemsQuery = mockClient.query.mock.calls[0];
      expect(deleteItemsQuery[0]).toContain('DELETE FROM practice_plan_drills');
      expect(deleteItemsQuery[1]).toEqual([123]);
      
      // Second should delete sections
      const deleteSectionsQuery = mockClient.query.mock.calls[1];
      expect(deleteSectionsQuery[0]).toContain('DELETE FROM practice_plan_sections');
      expect(deleteSectionsQuery[1]).toEqual([123]);
      
      // Third should delete the plan
      const deletePlanQuery = mockClient.query.mock.calls[2];
      expect(deletePlanQuery[0]).toContain('DELETE FROM practice_plans');
      expect(deletePlanQuery[1]).toEqual([123]);
      
      // Should return true on success
      expect(result).toBe(true);
    });
    
    it('should throw error if plan not found', async () => {
      // Mock getById to return null
      service.getById.mockResolvedValue(null);
      
      await expect(service.deletePracticePlan(999, 456))
        .rejects.toThrow('Practice plan not found');
        
      // No queries should have been executed
      expect(mockClient.query).not.toHaveBeenCalled();
    });
    
    it('should throw error if user is not authorized', async () => {
      // Mock canUserEdit to return false
      service.canUserEdit.mockResolvedValue(false);
      
      await expect(service.deletePracticePlan(123, 789))
        .rejects.toThrow('Unauthorized to delete this practice plan');
        
      // No queries should have been executed
      expect(mockClient.query).not.toHaveBeenCalled();
    });
    
    it('should handle database errors during deletion', async () => {
      // Mock client query to throw error
      mockClient.query.mockRejectedValue(new Error('Database error'));
      
      // Mock transaction to pass through the error
      vi.spyOn(service, 'withTransaction').mockImplementation(async (callback) => {
        try {
          return await callback(mockClient);
        } catch (error) {
          throw error;
        }
      });
      
      await expect(service.deletePracticePlan(123, 456))
        .rejects.toThrow('Database error');
    });
  });

  describe('duplicatePracticePlan', () => {
    beforeEach(() => {
      // Mock withTransaction
      vi.spyOn(service, 'withTransaction').mockImplementation(async (callback) => {
        return callback(mockClient);
      });
      
      // Mock getById
      vi.spyOn(service, 'getById').mockResolvedValue({
        id: 123,
        name: 'Original Plan',
        description: 'Original description',
        practice_goals: ['goal1'],
        phase_of_season: 'Mid season, skill building',
        estimated_number_of_participants: 15,
        visibility: 'public',
        is_editable_by_others: true,
        start_time: '2025-01-01'
      });
      
      // Mock addTimestamps
      vi.spyOn(service, 'addTimestamps').mockImplementation((data) => ({ 
        ...data, 
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01')
      }));
      
      // Reset mockClient.query
      mockClient.query.mockReset();
    });
    
    it('should duplicate a practice plan with all sections and items', async () => {
      // Mock client queries
      mockClient.query
        // First query for new plan
        .mockResolvedValueOnce({
          rows: [{ id: 456 }]
        })
        // Second query for sections
        .mockResolvedValueOnce({
          rows: [
            { id: 'section1', name: 'Section 1', order: 0, goals: ['goal1'], notes: 'notes' }
          ]
        })
        // Third query for new section
        .mockResolvedValueOnce({
          rows: [{ id: 'newSection1' }]
        })
        // Fourth query for drills
        .mockResolvedValueOnce({
          rows: [
            { 
              id: 'item1', 
              drill_id: 789, 
              order_in_plan: 0, 
              duration: 10, 
              type: 'drill',
              parallel_group_id: 'group1',
              parallel_timeline: 'timeline1',
              group_timelines: ['timeline1'],
              name: 'Drill Name'
            }
          ]
        })
        // Final query for drill insertion
        .mockResolvedValue({});
      
      const result = await service.duplicatePracticePlan(123, 456); // original ID, new userId
      
      // Check queries
      expect(mockClient.query).toHaveBeenCalledTimes(5);
      
      // Check new plan creation
      const planInsertQuery = mockClient.query.mock.calls[0];
      expect(planInsertQuery[0]).toContain('INSERT INTO practice_plans');
      expect(planInsertQuery[1][0]).toBe('Original Plan (Copy)'); // Name should have (Copy) appended
      
      // Check sections query
      const sectionsQuery = mockClient.query.mock.calls[1];
      expect(sectionsQuery[0]).toContain('SELECT * FROM practice_plan_sections');
      
      // Check section insertion
      const sectionInsertQuery = mockClient.query.mock.calls[2];
      expect(sectionInsertQuery[0]).toContain('INSERT INTO practice_plan_sections');
      
      // Check drills query
      const drillsQuery = mockClient.query.mock.calls[3];
      expect(drillsQuery[0]).toContain('SELECT * FROM practice_plan_drills');
      
      // Check drill insertion
      const drillInsertQuery = mockClient.query.mock.calls[4];
      expect(drillInsertQuery[0]).toContain('INSERT INTO practice_plan_drills');
      expect(drillInsertQuery[1][0]).toBe(456); // new plan ID
      expect(drillInsertQuery[1][1]).toBe('newSection1'); // new section ID
      expect(drillInsertQuery[1][2]).toBe(789); // original drill ID
      
      // Check result
      expect(result).toEqual({ id: 456 });
    });
    
    it('should throw error if original plan not found', async () => {
      // Mock getById to return null
      service.getById.mockResolvedValue(null);
      
      await expect(service.duplicatePracticePlan(999, 456))
        .rejects.toThrow('Practice plan not found');
        
      // No queries should have been executed
      expect(mockClient.query).not.toHaveBeenCalled();
    });
    
    it('should use userId of duplicator as creator', async () => {
      // Mock client queries with minimal implementation
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 456 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({});
      
      const newUserId = 789;
      await service.duplicatePracticePlan(123, newUserId);
      
      // Check if the new plan has the duplicator as creator
      const planInsertQuery = mockClient.query.mock.calls[0];
      expect(planInsertQuery[1][5]).toBe(newUserId); // created_by parameter
    });
    
    it('should preserve visibility and editability settings', async () => {
      // Set specific settings on the original plan
      service.getById.mockResolvedValue({
        id: 123,
        name: 'Private Plan',
        visibility: 'private',
        is_editable_by_others: false
      });
      
      // Mock minimal query implementation
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 456 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({});
      
      await service.duplicatePracticePlan(123, 456);
      
      // Check if visibility and editability are preserved
      const planInsertQuery = mockClient.query.mock.calls[0];
      expect(planInsertQuery[1][6]).toBe('private'); // visibility parameter
      expect(planInsertQuery[1][7]).toBe(false); // is_editable_by_others parameter
    });
  });
});