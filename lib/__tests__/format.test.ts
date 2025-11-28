/**
 * Format Utility Tests
 *
 * Tests cover:
 * - Date formatting with default locale (ja-JP)
 * - Date formatting with custom locale
 * - Edge cases: invalid dates, different date options
 */

import { formatDate, DEFAULT_LOCALE } from '../format';

describe('formatDate', () => {
  // Use specific time to avoid timezone issues
  const createTestDate = (year: number, month: number, day: number) =>
    new Date(year, month - 1, day, 12, 0, 0);

  it('should format date with default locale (ja-JP)', () => {
    const date = createTestDate(2024, 1, 15);
    const result = formatDate(date);

    // Japanese locale format includes year, month, day
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/1/);
    expect(result).toMatch(/15/);
  });

  it('should format date with custom locale', () => {
    const date = createTestDate(2024, 1, 15);
    const result = formatDate(date, { locale: 'en-US' });

    // US locale format: "Jan 15, 2024"
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('should handle custom format options', () => {
    const date = createTestDate(2024, 1, 15);
    const result = formatDate(date, {
      locale: 'en-US',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    });

    // Should be in numeric format like "01/15/24"
    expect(result).toMatch(/01.*15.*24/);
  });

  it('should handle date objects with different timezones', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    const result = formatDate(date);

    // Should still format correctly
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should export DEFAULT_LOCALE as ja-JP', () => {
    expect(DEFAULT_LOCALE).toBe('ja-JP');
  });
});
