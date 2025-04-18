import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserService } from '../userService';
import * as db from '$lib/server/db';

// Mock the db module
vi.mock('$lib/server/db', () => ({
  query: vi.fn(),
  getClient: vi.fn()
}));

describe('UserService', () => {
  let userService;
  
  // Setup before each test
  beforeEach(() => {
    vi.clearAllMocks();
    userService = new UserService();
  });

  describe('constructor', () => {
    it('should initialize with the correct table name and columns', () => {
      expect(userService.tableName).toBe('users');
      expect(userService.primaryKey).toBe('id');
      expect(userService.allowedColumns).toContain('email');
      expect(userService.allowedColumns).toContain('name');
      expect(userService.allowedColumns).toContain('image');
    });
  });

  describe('getUserByEmail', () => {
    it('should return user data when found', async () => {
      const mockUser = { id: '123', name: 'Test User', email: 'test@example.com' };
      
      db.query.mockResolvedValueOnce({
        rows: [mockUser]
      });

      const result = await userService.getUserByEmail('test@example.com');
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users'),
        ['test@example.com']
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await userService.getUserByEmail('nonexistent@example.com');
      
      expect(result).toBeNull();
    });

    it('should handle errors properly', async () => {
      const mockError = new Error('Database error');
      db.query.mockRejectedValueOnce(mockError);

      await expect(userService.getUserByEmail('test@example.com'))
        .rejects.toThrow(mockError);
    });
  });

  describe('getUserProfile', () => {
    it('should return complete user profile with related data', async () => {
      // Mock client object with query method
      const mockClient = {
        query: vi.fn()
      };
      
      // Set up mock for getClient
      db.getClient.mockResolvedValueOnce({
        ...mockClient,
        release: vi.fn()
      });

      // Set up mock responses for each query
      // User query
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: '123', name: 'Test User', email: 'test@example.com' }]
      });
      
      // Drills query
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Drill 1', variation_count: 2 }]
      });
      
      // Practice plans query
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Plan 1' }]
      });
      
      // Formations query
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Formation 1' }]
      });
      
      // Votes query
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, type: 'drill', item_name: 'Drill 1' }]
      });
      
      // Comments query
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, drill_id: 1, drill_name: 'Drill 1' }]
      });

      const result = await userService.getUserProfile('123');
      
      // Verify transaction was started
      expect(mockClient.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT id, name, email'),
        ['123']
      );
      
      // Verify result structure
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('drills');
      expect(result).toHaveProperty('practicePlans');
      expect(result).toHaveProperty('formations');
      expect(result).toHaveProperty('votes');
      expect(result).toHaveProperty('comments');
    });

    it('should return null if user not found', async () => {
      // Mock client object with query method
      const mockClient = {
        query: vi.fn().mockResolvedValueOnce({ rows: [] })
      };
      
      // Set up mock for getClient
      db.getClient.mockResolvedValueOnce({
        ...mockClient,
        release: vi.fn()
      });

      const result = await userService.getUserProfile('nonexistent');
      
      expect(result).toBeNull();
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin users', async () => {
      const result = await userService.isAdmin('admin');
      
      expect(result).toBe(true);
    });

    it('should return false for non-admin users', async () => {
      const result = await userService.isAdmin('user');
      
      expect(result).toBe(false);
    });

    it('should return false for null or undefined roles', async () => {
      let result = await userService.isAdmin(null);
      expect(result).toBe(false);

      result = await userService.isAdmin(undefined);
       
      expect(result).toBe(false);
    });
  });

  describe('canUserPerformAction', () => {
    it('should allow admins to perform any action', async () => {
      vi.spyOn(userService, 'isAdmin').mockResolvedValueOnce(true);

      const result = await userService.canUserPerformAction(
        '123', 'admin', 'edit', 'drill', '456'
      );
      
      expect(result).toBe(true);
      expect(userService.isAdmin).toHaveBeenCalledWith('admin');
    });

    it('should allow viewing public entities', async () => {
      vi.spyOn(userService, 'isAdmin').mockResolvedValueOnce(false);
      
      db.query.mockResolvedValueOnce({
        rows: [
          { id: '456', created_by: '789', visibility: 'public', is_editable_by_others: false }
        ]
      });

      const result = await userService.canUserPerformAction(
        '123', 'user', 'view', 'drill', '456'
      );
      
      expect(result).toBe(true);
      expect(userService.isAdmin).toHaveBeenCalledWith('user');
    });

    it('should allow viewing unlisted entities', async () => {
      vi.spyOn(userService, 'isAdmin').mockResolvedValueOnce(false);
      
      db.query.mockResolvedValueOnce({
        rows: [
          { id: '456', created_by: '789', visibility: 'unlisted', is_editable_by_others: false }
        ]
      });

      const result = await userService.canUserPerformAction(
        '123', 'user', 'view', 'drill', '456'
      );
      
      expect(result).toBe(true);
      expect(userService.isAdmin).toHaveBeenCalledWith('user');
    });

    it('should only allow viewing private entities by creator', async () => {
      vi.spyOn(userService, 'isAdmin').mockResolvedValueOnce(false);
      
      db.query.mockResolvedValueOnce({
        rows: [
          { id: '456', created_by: '789', visibility: 'private', is_editable_by_others: false }
        ]
      });

      let result = await userService.canUserPerformAction(
        '123', 'user', 'view', 'drill', '456'
      );
      
      expect(result).toBe(false);
      expect(userService.isAdmin).toHaveBeenCalledWith('user');
      
      vi.clearAllMocks();
      vi.spyOn(userService, 'isAdmin').mockResolvedValue(false); 
      
      db.query.mockResolvedValueOnce({
        rows: [
          { id: '456', created_by: '123', visibility: 'private', is_editable_by_others: false }
        ]
      });

      result = await userService.canUserPerformAction(
        '123', 'user', 'view', 'drill', '456'
      );
      
      expect(result).toBe(true);
      expect(userService.isAdmin).toHaveBeenCalledWith('user');
    });

    it('should allow editing by creator', async () => {
      vi.spyOn(userService, 'isAdmin').mockResolvedValueOnce(false);
      
      db.query.mockResolvedValueOnce({
        rows: [
          { id: '456', created_by: '123', is_editable_by_others: false }
        ]
      });

      const result = await userService.canUserPerformAction(
        '123', 'user', 'edit', 'drill', '456'
      );
      
      expect(result).toBe(true);
      expect(userService.isAdmin).toHaveBeenCalledWith('user');
    });

    it('should allow editing if is_editable_by_others is true', async () => {
      vi.spyOn(userService, 'isAdmin').mockResolvedValueOnce(false);
      
      db.query.mockResolvedValueOnce({
        rows: [
          { id: '456', created_by: '789', is_editable_by_others: true }
        ]
      });

      const result = await userService.canUserPerformAction(
        '123', 'user', 'edit', 'drill', '456'
      );
      
      expect(result).toBe(true);
      expect(userService.isAdmin).toHaveBeenCalledWith('user');
    });

    it('should only allow deletion by creator', async () => {
      vi.spyOn(userService, 'isAdmin').mockResolvedValueOnce(false);
      
      db.query.mockResolvedValueOnce({
        rows: [
          { id: '456', created_by: '789', is_editable_by_others: true }
        ]
      });

      let result = await userService.canUserPerformAction(
        '123', 'user', 'delete', 'drill', '456'
      );
      
      expect(result).toBe(false);
      expect(userService.isAdmin).toHaveBeenCalledWith('user');
      
      vi.clearAllMocks();
      vi.spyOn(userService, 'isAdmin').mockResolvedValue(false);
      
      db.query.mockResolvedValueOnce({
        rows: [
          { id: '456', created_by: '123', is_editable_by_others: true }
        ]
      });

      result = await userService.canUserPerformAction(
        '123', 'user', 'delete', 'drill', '456'
      );
      
      expect(result).toBe(true);
      expect(userService.isAdmin).toHaveBeenCalledWith('user');
    });
  });
});