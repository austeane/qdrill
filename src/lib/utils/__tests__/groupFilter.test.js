import { describe, it, expect } from 'vitest';
import { getAvailableGroupFilters, filterSectionsByGroup } from '../groupFilter.js';

describe('group filter utilities', () => {
  const sections = [
    {
      id: 1,
      items: [
        { id: 1, parallel_timeline: 'CHASERS' },
        { id: 2, parallel_timeline: 'BEATERS' },
        { id: 3 }
      ]
    },
    {
      id: 2,
      items: [
        { id: 4, parallel_timeline: 'SEEKERS' }
      ]
    }
  ];

  it('extracts available group names', () => {
    const result = getAvailableGroupFilters(sections);
    expect(result).toContain('CHASERS');
    expect(result).toContain('BEATERS');
    expect(result).toContain('SEEKERS');
    expect(result).toContain('All Groups');
  });

  it('filters sections by group', () => {
    const filtered = filterSectionsByGroup(sections, 'BEATERS');
    expect(filtered.length).toBe(1);
    expect(filtered[0].items.length).toBe(1);
    expect(filtered[0].items[0].parallel_timeline).toBe('BEATERS');
  });
});
