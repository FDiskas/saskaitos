import { describe, it, expect } from 'vitest';
import { formatDate, formatDateLT } from './date';

describe('date formatting utilities', () => {
  it('should format date as YYYY-MM-DD', () => {
    const d = new Date(2026, 4, 22); // Month is 0-indexed (May)
    expect(formatDate(d)).toBe('2026-05-22');
  });

  it('should format date as Lithuanian long date format', () => {
    const d = new Date(2026, 4, 22);
    // Standard Lithuanian long date output: "2026 m. gegužės 22 d."
    expect(formatDateLT(d)).toContain('2026');
    expect(formatDateLT(d)).toContain('gegužės');
    expect(formatDateLT(d)).toContain('22');
  });
});
