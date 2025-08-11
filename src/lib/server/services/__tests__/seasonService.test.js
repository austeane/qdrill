import { describe, it, expect, beforeEach, vi } from 'vitest';
import { seasonService } from '../seasonService';
import { ValidationError } from '$lib/server/errors';

// Mock teamMemberService
vi.mock('../teamMemberService', () => ({
  teamMemberService: {
    getMember: vi.fn()
  }
}));

// Mock the database operations
vi.mock('$lib/server/db', () => ({
  query: vi.fn(),
  getClient: vi.fn(() => Promise.resolve({
    query: vi.fn(),
    release: vi.fn()
  }))
}));

describe('SeasonService', () => {
  let testTeamId = 'team-123';
  let testUserId = 'user-123';
  let adminUserId = 'admin-123';
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('should create a season when user is admin', async () => {
      const { teamMemberService } = await import('../teamMemberService');
      teamMemberService.getMember.mockResolvedValue({ role: 'admin' });
      
      const mockCreate = vi.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(seasonService)), 'create')
        .mockResolvedValue({
          id: 'season-1',
          team_id: testTeamId,
          name: 'Spring 2024',
          start_date: '2024-03-01',
          end_date: '2024-05-31',
          is_active: true
        });
      
      const seasonData = {
        team_id: testTeamId,
        name: 'Spring 2024',
        start_date: '2024-03-01',
        end_date: '2024-05-31',
        is_active: true
      };
      
      const result = await seasonService.create(seasonData, adminUserId);
      
      expect(result.name).toBe('Spring 2024');
      expect(teamMemberService.getMember).toHaveBeenCalledWith(testTeamId, adminUserId);
      
      mockCreate.mockRestore();
    });

    it('should reject creation when user is not admin', async () => {
      const { teamMemberService } = await import('../teamMemberService');
      teamMemberService.getMember.mockResolvedValue({ role: 'member' });
      
      const seasonData = {
        team_id: testTeamId,
        name: 'Spring 2024',
        start_date: '2024-03-01',
        end_date: '2024-05-31'
      };
      
      await expect(seasonService.create(seasonData, testUserId))
        .rejects.toThrow('Only team admins can create seasons');
    });

    it('should validate date ranges', async () => {
      const { teamMemberService } = await import('../teamMemberService');
      teamMemberService.getMember.mockResolvedValue({ role: 'admin' });
      
      const seasonData = {
        team_id: testTeamId,
        name: 'Invalid Season',
        start_date: '2024-05-31',
        end_date: '2024-03-01' // End before start
      };
      
      await expect(seasonService.create(seasonData, adminUserId))
        .rejects.toThrow('Start date must be before end date');
    });

    it('should deactivate other seasons when creating active season', async () => {
      const { teamMemberService } = await import('../teamMemberService');
      teamMemberService.getMember.mockResolvedValue({ role: 'admin' });
      
      const mockDeactivate = vi.spyOn(seasonService, 'deactivateTeamSeasons')
        .mockResolvedValue();
      
      const mockCreate = vi.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(seasonService)), 'create')
        .mockResolvedValue({
          id: 'season-2',
          is_active: true
        });
      
      await seasonService.create({
        team_id: testTeamId,
        name: 'Summer 2024',
        start_date: '2024-06-01',
        end_date: '2024-08-31',
        is_active: true
      }, adminUserId);
      
      expect(mockDeactivate).toHaveBeenCalledWith(testTeamId);
      
      mockDeactivate.mockRestore();
      mockCreate.mockRestore();
    });
  });

  describe('update', () => {
    it('should update season when user is admin', async () => {
      const { teamMemberService } = await import('../teamMemberService');
      teamMemberService.getMember.mockResolvedValue({ role: 'admin' });
      
      const mockGetById = vi.spyOn(seasonService, 'getById')
        .mockResolvedValue({
          id: 'season-1',
          team_id: testTeamId,
          is_active: false,
          start_date: '2024-03-01',
          end_date: '2024-05-31'
        });
      
      const mockUpdate = vi.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(seasonService)), 'update')
        .mockResolvedValue({
          id: 'season-1',
          name: 'Spring 2024 Updated'
        });
      
      const result = await seasonService.update('season-1', {
        name: 'Spring 2024 Updated'
      }, adminUserId);
      
      expect(result.name).toBe('Spring 2024 Updated');
      
      mockGetById.mockRestore();
      mockUpdate.mockRestore();
    });

    it('should deactivate other seasons when setting active', async () => {
      const { teamMemberService } = await import('../teamMemberService');
      teamMemberService.getMember.mockResolvedValue({ role: 'admin' });
      
      const mockGetById = vi.spyOn(seasonService, 'getById')
        .mockResolvedValue({
          id: 'season-1',
          team_id: testTeamId,
          is_active: false
        });
      
      const mockDeactivate = vi.spyOn(seasonService, 'deactivateTeamSeasons')
        .mockResolvedValue();
      
      const mockUpdate = vi.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(seasonService)), 'update')
        .mockResolvedValue({
          id: 'season-1',
          is_active: true
        });
      
      await seasonService.update('season-1', { is_active: true }, adminUserId);
      
      expect(mockDeactivate).toHaveBeenCalledWith(testTeamId, 'season-1');
      
      mockGetById.mockRestore();
      mockDeactivate.mockRestore();
      mockUpdate.mockRestore();
    });
  });

  describe('getActiveSeason', () => {
    it('should return active season for team', async () => {
      const mockGetAll = vi.spyOn(seasonService, 'getAll')
        .mockResolvedValue({
          items: [{
            id: 'season-1',
            team_id: testTeamId,
            is_active: true
          }]
        });
      
      const result = await seasonService.getActiveSeason(testTeamId);
      
      expect(result).toMatchObject({
        id: 'season-1',
        is_active: true
      });
      
      mockGetAll.mockRestore();
    });

    it('should return null when no active season', async () => {
      const mockGetAll = vi.spyOn(seasonService, 'getAll')
        .mockResolvedValue({
          items: []
        });
      
      const result = await seasonService.getActiveSeason(testTeamId);
      
      expect(result).toBeNull();
      
      mockGetAll.mockRestore();
    });
  });

  describe('getTeamSeasons', () => {
    it('should return all team seasons for members', async () => {
      const { teamMemberService } = await import('../teamMemberService');
      teamMemberService.getMember.mockResolvedValue({ role: 'member' });
      
      const mockGetAll = vi.spyOn(seasonService, 'getAll')
        .mockResolvedValue({
          items: [
            { id: 'season-1', name: 'Spring 2024' },
            { id: 'season-2', name: 'Summer 2024' }
          ]
        });
      
      const result = await seasonService.getTeamSeasons(testTeamId, testUserId);
      
      expect(result).toHaveLength(2);
      expect(teamMemberService.getMember).toHaveBeenCalledWith(testTeamId, testUserId);
      
      mockGetAll.mockRestore();
    });

    it('should reject non-members', async () => {
      const { teamMemberService } = await import('../teamMemberService');
      teamMemberService.getMember.mockResolvedValue(null);
      
      await expect(seasonService.getTeamSeasons(testTeamId, 'non-member'))
        .rejects.toThrow('Only team members can view seasons');
    });
  });

  describe('token rotation', () => {
    it('should rotate public token for admins', async () => {
      const { teamMemberService } = await import('../teamMemberService');
      teamMemberService.getMember.mockResolvedValue({ role: 'admin' });
      
      const mockGetById = vi.spyOn(seasonService, 'getById')
        .mockResolvedValue({
          id: 'season-1',
          team_id: testTeamId,
          public_view_token: 'old-token'
        });
      
      const mockTransaction = vi.spyOn(seasonService, 'withTransaction')
        .mockImplementation(async (callback) => {
          return callback({
            query: vi.fn().mockResolvedValue({
              rows: [{ 
                id: 'season-1',
                public_view_token: 'new-token'
              }]
            })
          });
        });
      
      const result = await seasonService.rotatePublicToken('season-1', adminUserId);
      
      expect(result.public_view_token).toBe('new-token');
      
      mockGetById.mockRestore();
      mockTransaction.mockRestore();
    });

    it('should rotate ICS token for admins', async () => {
      const { teamMemberService } = await import('../teamMemberService');
      teamMemberService.getMember.mockResolvedValue({ role: 'admin' });
      
      const mockGetById = vi.spyOn(seasonService, 'getById')
        .mockResolvedValue({
          id: 'season-1',
          team_id: testTeamId,
          ics_token: 'old-ics-token'
        });
      
      const mockTransaction = vi.spyOn(seasonService, 'withTransaction')
        .mockImplementation(async (callback) => {
          return callback({
            query: vi.fn().mockResolvedValue({
              rows: [{ 
                id: 'season-1',
                ics_token: 'new-ics-token'
              }]
            })
          });
        });
      
      const result = await seasonService.rotateIcsToken('season-1', adminUserId);
      
      expect(result.ics_token).toBe('new-ics-token');
      
      mockGetById.mockRestore();
      mockTransaction.mockRestore();
    });

    it('should reject token rotation for non-admins', async () => {
      const { teamMemberService } = await import('../teamMemberService');
      teamMemberService.getMember.mockResolvedValue({ role: 'member' });
      
      const mockGetById = vi.spyOn(seasonService, 'getById')
        .mockResolvedValue({
          id: 'season-1',
          team_id: testTeamId
        });
      
      await expect(seasonService.rotatePublicToken('season-1', testUserId))
        .rejects.toThrow('Only team admins can rotate tokens');
      
      mockGetById.mockRestore();
    });
  });

  describe('deactivateTeamSeasons', () => {
    it('should deactivate all active seasons for team', async () => {
      const mockTransaction = vi.spyOn(seasonService, 'withTransaction')
        .mockImplementation(async (callback) => {
          const mockClient = {
            query: vi.fn()
          };
          await callback(mockClient);
          return mockClient;
        });
      
      await seasonService.deactivateTeamSeasons(testTeamId);
      
      expect(mockTransaction).toHaveBeenCalled();
      
      mockTransaction.mockRestore();
    });

    it('should exclude specific season when deactivating', async () => {
      const mockTransaction = vi.spyOn(seasonService, 'withTransaction')
        .mockImplementation(async (callback) => {
          const mockClient = {
            query: vi.fn()
          };
          await callback(mockClient);
          
          // Verify the query includes the exception
          expect(mockClient.query).toHaveBeenCalledWith(
            expect.stringContaining('AND id != $2'),
            [testTeamId, 'season-1']
          );
          
          return mockClient;
        });
      
      await seasonService.deactivateTeamSeasons(testTeamId, 'season-1');
      
      mockTransaction.mockRestore();
    });
  });

  describe('token lookups', () => {
    it('should find season by public token', async () => {
      const mockGetAll = vi.spyOn(seasonService, 'getAll')
        .mockResolvedValue({
          items: [{
            id: 'season-1',
            public_view_token: 'test-token'
          }]
        });
      
      const result = await seasonService.getByPublicToken('test-token');
      
      expect(result).toMatchObject({
        id: 'season-1',
        public_view_token: 'test-token'
      });
      
      mockGetAll.mockRestore();
    });

    it('should find season by ICS token', async () => {
      const mockGetAll = vi.spyOn(seasonService, 'getAll')
        .mockResolvedValue({
          items: [{
            id: 'season-1',
            ics_token: 'ics-test-token'
          }]
        });
      
      const result = await seasonService.getByIcsToken('ics-test-token');
      
      expect(result).toMatchObject({
        id: 'season-1',
        ics_token: 'ics-test-token'
      });
      
      mockGetAll.mockRestore();
    });
  });
});