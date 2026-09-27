import { describe, expect, it } from 'vitest';
import { daysFromToday, localDay } from './localDay';

describe('the day as the person at the screen counts it', () => {
  it('reads the local calendar, not UTC’s', () => {
    // Built from local parts, so this is 07:30 wherever the test runs: in
    // Ulaanbaatar, still yesterday in UTC.
    expect(localDay(new Date(2026, 8, 28, 7, 30))).toBe('2026-09-28');
  });

  it('counts days forward and back on the same calendar', () => {
    const from = new Date(2026, 8, 28, 7, 30);

    expect(daysFromToday(3, from)).toBe('2026-10-01');
    expect(daysFromToday(-28, from)).toBe('2026-08-31');
  });
});
