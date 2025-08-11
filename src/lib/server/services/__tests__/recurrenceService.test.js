import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recurrenceService } from '../recurrenceService.js';

// Mock the database
vi.mock('$lib/server/db.js', () => ({
  db: {
    query: vi.fn(),
    withTransaction: vi.fn()
  }
}));

// Mock other services
vi.mock('../seasonUnionService.js', () => ({
  seasonUnionService: {
    instantiatePracticePlan: vi.fn()
  }
}));

vi.mock('../seasonMarkerService.js', () => ({
  seasonMarkerService: {
    getBySeason: vi.fn()
  }
}));

describe('RecurrenceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateDatesFromPattern', () => {
    it('should generate weekly dates for specified days', () => {
      const recurrence = {
        pattern: 'weekly',
        day_of_week: [1, 3, 5], // Mon, Wed, Fri
        skip_dates: []
      };
      
      const dates = recurrenceService.generateDatesFromPattern(
        recurrence,
        '2024-01-01', // Monday
        '2024-01-07'  // Sunday
      );
      
      expect(dates).toHaveLength(3);
      expect(dates[0].getDay()).toBe(1); // Monday
      expect(dates[1].getDay()).toBe(3); // Wednesday
      expect(dates[2].getDay()).toBe(5); // Friday
    });

    it('should generate biweekly dates correctly', () => {
      const recurrence = {
        pattern: 'biweekly',
        day_of_week: [2], // Tuesday
        skip_dates: []
      };
      
      const dates = recurrenceService.generateDatesFromPattern(
        recurrence,
        '2024-01-01',
        '2024-01-31'
      );
      
      // Should get Tuesdays from weeks 0 and 2 (biweekly)
      const tuesdays = dates.filter(d => d.getDay() === 2);
      expect(tuesdays.length).toBeGreaterThan(0);
      
      // Check that dates are 14 days apart
      if (tuesdays.length > 1) {
        const diff = (tuesdays[1] - tuesdays[0]) / (1000 * 60 * 60 * 24);
        expect(diff).toBe(14);
      }
    });

    it('should generate monthly dates for specified days of month', () => {
      const recurrence = {
        pattern: 'monthly',
        day_of_month: [1, 15], // 1st and 15th
        skip_dates: []
      };
      
      const dates = recurrenceService.generateDatesFromPattern(
        recurrence,
        '2024-01-01',
        '2024-02-29'
      );
      
      const expectedDates = [
        new Date('2024-01-01'),
        new Date('2024-01-15'),
        new Date('2024-02-01'),
        new Date('2024-02-15')
      ];
      
      expect(dates).toHaveLength(4);
      dates.forEach((date, i) => {
        expect(date.getDate()).toBe(expectedDates[i].getDate());
      });
    });

    it('should skip specified dates', () => {
      const recurrence = {
        pattern: 'weekly',
        day_of_week: [1], // Monday
        skip_dates: ['2024-01-08'] // Skip second Monday
      };
      
      const dates = recurrenceService.generateDatesFromPattern(
        recurrence,
        '2024-01-01',
        '2024-01-15'
      );
      
      // Should have 3 Mondays minus 1 skipped = 2
      const mondays = dates.filter(d => d.getDay() === 1);
      expect(mondays).toHaveLength(2);
      
      // Check that Jan 8 is not included
      const jan8 = dates.find(d => 
        d.toISOString().split('T')[0] === '2024-01-08'
      );
      expect(jan8).toBeUndefined();
    });
  });

  describe('previewGeneration', () => {
    it('should preview practice generation with existing practices', async () => {
      const mockRecurrence = {
        id: 'rec-1',
        season_id: 'season-1',
        pattern: 'weekly',
        day_of_week: [1],
        skip_markers: false
      };
      
      const mockExistingPractices = {
        rows: [
          { scheduled_date: '2024-01-08' }
        ]
      };
      
      recurrenceService.getById = vi.fn().mockResolvedValue(mockRecurrence);
      recurrenceService.db = {
        query: vi.fn().mockResolvedValue(mockExistingPractices)
      };
      
      const preview = await recurrenceService.previewGeneration(
        'rec-1',
        '2024-01-01',
        '2024-01-15'
      );
      
      expect(preview.recurrence).toEqual(mockRecurrence);
      expect(preview.totalDates).toBeGreaterThan(0);
      expect(preview.willSkip).toBeGreaterThan(0);
    });
  });

  describe('batchGenerate', () => {
    it('should generate practices and create log', async () => {
      const mockRecurrence = {
        id: 'rec-1',
        season_id: 'season-1',
        pattern: 'weekly',
        day_of_week: [1],
        skip_markers: false
      };
      
      recurrenceService.getById = vi.fn().mockResolvedValue(mockRecurrence);
      recurrenceService.previewGeneration = vi.fn().mockResolvedValue({
        preview: [
          { date: '2024-01-01', willCreate: true },
          { date: '2024-01-08', willCreate: false, skipReason: 'Practice exists' }
        ]
      });
      
      const { seasonUnionService } = await import('../seasonUnionService.js');
      seasonUnionService.instantiatePracticePlan.mockResolvedValue({ id: 123 });
      
      recurrenceService.db = {
        query: vi.fn().mockResolvedValue({
          rows: [{ id: 'log-1', generated_count: 1 }]
        })
      };
      
      const result = await recurrenceService.batchGenerate(
        'rec-1',
        '2024-01-01',
        '2024-01-08',
        'user-1',
        'team-1'
      );
      
      expect(result.generated).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.generatedPlanIds).toContain(123);
      expect(result.skipReasons['2024-01-08']).toBe('Practice exists');
    });
  });
});