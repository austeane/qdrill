import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseEntityService } from '../baseEntityService.js';

// Mock the db module
vi.mock('$lib/server/db', () => {
  return {
    query: vi.fn(),
    getClient: vi.fn(() => ({
      query: vi.fn(),
      release: vi.fn()
    }))
  };
});

describe('BaseEntityService', () => {
  let service;
  
  beforeEach(() => {
    // Create a new service instance for each test
    service = new BaseEntityService(
      'test_table', 
      'id', 
      ['*'], 
      ['name', 'description', 'created_by'], 
      { tags: 'array' }
    );
    
    // Reset mock function calls
    vi.resetAllMocks();
  });
  
  describe('constructor', () => {
    it('should initialize with provided values', () => {
      expect(service.tableName).toBe('test_table');
      expect(service.primaryKey).toBe('id');
      expect(service.defaultColumns).toEqual(['*']);
      expect(service.allowedColumns).toEqual(['name', 'description', 'created_by', 'id']);
      expect(service.columnTypes).toEqual({ tags: 'array' });
      expect(service.useStandardPermissions).toBe(false);
    });
    
    it('should use default values when not provided', () => {
      const defaultService = new BaseEntityService('test_table');
      expect(defaultService.primaryKey).toBe('id');
      expect(defaultService.defaultColumns).toEqual(['*']);
      expect(defaultService.allowedColumns).toEqual(['id']);
      expect(defaultService.columnTypes).toEqual({});
    });
  });
  
  describe('enableStandardPermissions', () => {
    it('should enable standard permissions', () => {
      service.enableStandardPermissions();
      expect(service.useStandardPermissions).toBe(true);
    });
  });
  
  describe('isColumnAllowed', () => {
    it('should allow primary key', () => {
      expect(service.isColumnAllowed('id')).toBe(true);
    });
    
    it('should allow columns in allowed list', () => {
      expect(service.isColumnAllowed('name')).toBe(true);
      expect(service.isColumnAllowed('description')).toBe(true);
    });
    
    it('should not allow columns not in allowed list', () => {
      expect(service.isColumnAllowed('unknown')).toBe(false);
    });
    
    it('should only allow primary key when no allowed columns specified', () => {
      const restrictedService = new BaseEntityService('test_table');
      expect(restrictedService.isColumnAllowed('id')).toBe(true);
      expect(restrictedService.isColumnAllowed('name')).toBe(false);
    });
  });
  
  describe('validateSortOrder', () => {
    it('should return ASC for asc', () => {
      expect(service.validateSortOrder('asc')).toBe('ASC');
    });
    
    it('should return DESC for desc', () => {
      expect(service.validateSortOrder('desc')).toBe('DESC');
    });
    
    it('should return DESC for invalid values', () => {
      expect(service.validateSortOrder('invalid')).toBe('DESC');
    });
  });
  
  describe('normalizeArrayFields', () => {
    it('should convert string to array', () => {
      const result = service.normalizeArrayFields({ tags: 'tag1' }, ['tags']);
      expect(result.tags).toEqual(['tag1']);
    });
    
    it('should handle already array values', () => {
      const result = service.normalizeArrayFields({ tags: ['tag1', 'tag2'] }, ['tags']);
      expect(result.tags).toEqual(['tag1', 'tag2']);
    });
    
    it('should convert non-array to array', () => {
      const result = service.normalizeArrayFields({ tags: 123 }, ['tags']);
      expect(result.tags).toEqual([123]);
    });
    
    it('should handle missing fields', () => {
      const result = service.normalizeArrayFields({}, ['tags']);
      expect(result.tags).toBeUndefined();
    });
    
    it('should handle null or undefined values', () => {
      const result = service.normalizeArrayFields({ tags: null }, ['tags']);
      expect(result.tags).toEqual([]);
    });
  });
  
  describe('addTimestamps', () => {
    it('should add created_at and updated_at for new entities', () => {
      const data = { name: 'Test' };
      const result = service.addTimestamps(data, true);
      
      expect(result.name).toBe('Test');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });
    
    it('should only add updated_at for existing entities', () => {
      const data = { name: 'Test' };
      const result = service.addTimestamps(data, false);
      
      expect(result.name).toBe('Test');
      expect(result.created_at).toBeUndefined();
      expect(result.updated_at).toBeInstanceOf(Date);
    });
  });
});