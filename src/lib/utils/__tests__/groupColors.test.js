import { describe, it, expect } from 'vitest';
import { getGroupColor } from '../groupColors.js';

describe('getGroupColor', () => {
  it('returns consistent color for the same group', () => {
    const first = getGroupColor('CHASERS');
    const second = getGroupColor('CHASERS');
    expect(first).toBe(second);
  });

  it('assigns different colors for different groups', () => {
    const color1 = getGroupColor('A');
    const color2 = getGroupColor('B');
    expect(color1).not.toBe(color2);
  });
});
