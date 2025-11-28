/**
 * Date Utility Tests
 *
 * Tests cover:
 * - formatDate関数のテスト（様々なフォーマット文字列）
 * - formatDistanceToNow関数のテスト（過去・未来の日付）
 * - formatRelativeDate関数のテスト（今日、昨日、明日など）
 * - 日本語ロケールの検証
 */

import { formatDate, formatDistanceToNow, formatRelativeDate } from '../date';

describe('formatDate', () => {
  it('should format date with yyyy-MM-dd pattern', () => {
    const date = new Date(2024, 0, 15); // 2024年1月15日
    const result = formatDate(date, 'yyyy-MM-dd');
    expect(result).toBe('2024-01-15');
  });

  it('should format date with Japanese date pattern', () => {
    const date = new Date(2024, 0, 15);
    const result = formatDate(date, 'yyyy年MM月dd日');
    expect(result).toBe('2024年01月15日');
  });

  it('should format date with time pattern', () => {
    const date = new Date(2024, 0, 15, 14, 30, 45);
    const result = formatDate(date, 'yyyy-MM-dd HH:mm:ss');
    expect(result).toBe('2024-01-15 14:30:45');
  });

  it('should format date with Japanese weekday', () => {
    const date = new Date(2024, 0, 15); // Monday
    const result = formatDate(date, 'EEEE');
    expect(result).toBe('月曜日');
  });

  it('should format date with short month in Japanese', () => {
    const date = new Date(2024, 0, 15);
    const result = formatDate(date, 'MMM');
    expect(result).toBe('1月');
  });

  it('should handle timestamp number input', () => {
    const timestamp = new Date(2024, 0, 15).getTime();
    const result = formatDate(timestamp, 'yyyy-MM-dd');
    expect(result).toBe('2024-01-15');
  });

  it('should format time only pattern', () => {
    const date = new Date(2024, 0, 15, 9, 5, 3);
    const result = formatDate(date, 'HH:mm:ss');
    expect(result).toBe('09:05:03');
  });

  it('should format with 12-hour time pattern', () => {
    const date = new Date(2024, 0, 15, 14, 30);
    const result = formatDate(date, 'h:mm a');
    // Japanese locale uses 午後 for PM
    expect(result).toMatch(/2:30.*午後|午後.*2:30/);
  });
});

describe('formatDistanceToNow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 0, 15, 12, 0, 0)); // 2024年1月15日 12:00
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should format past date with Japanese suffix', () => {
    const pastDate = new Date(2024, 0, 14, 12, 0, 0); // 1日前
    const result = formatDistanceToNow(pastDate);
    expect(result).toContain('前');
  });

  it('should format 3 days ago in Japanese', () => {
    const pastDate = new Date(2024, 0, 12, 12, 0, 0); // 3日前
    const result = formatDistanceToNow(pastDate);
    expect(result).toBe('3日前');
  });

  it('should format 1 hour ago in Japanese', () => {
    const pastDate = new Date(2024, 0, 15, 11, 0, 0); // 1時間前
    const result = formatDistanceToNow(pastDate);
    expect(result).toContain('時間前');
  });

  it('should format future date with Japanese suffix', () => {
    const futureDate = new Date(2024, 0, 16, 12, 0, 0); // 1日後
    const result = formatDistanceToNow(futureDate);
    expect(result).toContain('後');
  });

  it('should format 1 week ago in Japanese', () => {
    const pastDate = new Date(2024, 0, 8, 12, 0, 0); // 約1週間前
    const result = formatDistanceToNow(pastDate);
    expect(result).toMatch(/約1週間前|7日前/);
  });

  it('should handle timestamp number input', () => {
    const pastTimestamp = new Date(2024, 0, 14, 12, 0, 0).getTime();
    const result = formatDistanceToNow(pastTimestamp);
    expect(result).toContain('前');
  });

  it('should use provided baseDate instead of now', () => {
    const targetDate = new Date(2024, 0, 10, 12, 0, 0);
    const baseDate = new Date(2024, 0, 15, 12, 0, 0);
    const result = formatDistanceToNow(targetDate, baseDate);
    expect(result).toBe('5日前');
  });

  it('should format about 1 month ago', () => {
    const pastDate = new Date(2023, 11, 15, 12, 0, 0); // 約1ヶ月前
    const result = formatDistanceToNow(pastDate);
    expect(result).toMatch(/約1か月前|1か月前/);
  });
});

describe('formatRelativeDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 0, 15, 12, 0, 0)); // 2024年1月15日 12:00 (月曜日)
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should format today date in Japanese', () => {
    const today = new Date(2024, 0, 15, 9, 30, 0);
    const result = formatRelativeDate(today);
    expect(result).toContain('今日');
  });

  it('should format yesterday date in Japanese', () => {
    const yesterday = new Date(2024, 0, 14, 9, 30, 0);
    const result = formatRelativeDate(yesterday);
    expect(result).toContain('昨日');
  });

  it('should format date within the week with weekday', () => {
    // 先週の金曜日 (2024年1月12日)
    const lastFriday = new Date(2024, 0, 12, 9, 30, 0);
    const result = formatRelativeDate(lastFriday);
    // Should show weekday (金曜日) or relative format
    expect(result).toMatch(/金曜日|先週.*金曜日|前の金曜日/);
  });

  it('should format tomorrow date in Japanese', () => {
    const tomorrow = new Date(2024, 0, 16, 9, 30, 0);
    const result = formatRelativeDate(tomorrow);
    expect(result).toContain('明日');
  });

  it('should format next week date with weekday', () => {
    // 次の金曜日 (2024年1月19日)
    const nextFriday = new Date(2024, 0, 19, 9, 30, 0);
    const result = formatRelativeDate(nextFriday);
    expect(result).toMatch(/金曜日|次の金曜日/);
  });

  it('should handle timestamp number input', () => {
    const todayTimestamp = new Date(2024, 0, 15, 9, 30, 0).getTime();
    const result = formatRelativeDate(todayTimestamp);
    expect(result).toContain('今日');
  });

  it('should use provided baseDate instead of now', () => {
    const targetDate = new Date(2024, 0, 20, 9, 30, 0);
    const baseDate = new Date(2024, 0, 21, 12, 0, 0);
    const result = formatRelativeDate(targetDate, baseDate);
    expect(result).toContain('昨日');
  });

  it('should format date far in the past with full date', () => {
    const oldDate = new Date(2023, 5, 15, 9, 30, 0); // 2023年6月15日
    const result = formatRelativeDate(oldDate);
    // Should show full date format
    expect(result).toMatch(/2023|6月|6\/15/);
  });
});

describe('Japanese locale integration', () => {
  it('should use Japanese locale by default', () => {
    const date = new Date(2024, 0, 15);
    const weekday = formatDate(date, 'EEEE');
    // Should be Japanese weekday, not English
    expect(weekday).not.toBe('Monday');
    expect(weekday).toBe('月曜日');
  });

  it('should use Japanese month names', () => {
    const date = new Date(2024, 0, 15);
    const month = formatDate(date, 'MMMM');
    expect(month).toBe('1月');
  });

  it('should format relative dates in Japanese', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 0, 15, 12, 0, 0));

    const pastDate = new Date(2024, 0, 10, 12, 0, 0);
    const result = formatDistanceToNow(pastDate);

    // Should contain Japanese characters
    expect(result).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/);

    jest.useRealTimers();
  });
});

describe('Invalid date validation', () => {
  it('should throw error for invalid Date object in formatDate', () => {
    const invalidDate = new Date('invalid');
    expect(() => formatDate(invalidDate, 'yyyy-MM-dd')).toThrow('Invalid date');
  });

  it('should throw error for NaN timestamp in formatDate', () => {
    expect(() => formatDate(NaN, 'yyyy-MM-dd')).toThrow('Invalid date');
  });

  it('should throw error for invalid Date in formatDistanceToNow', () => {
    const invalidDate = new Date('invalid');
    expect(() => formatDistanceToNow(invalidDate)).toThrow('Invalid date');
  });

  it('should throw error for invalid baseDate in formatDistanceToNow', () => {
    const validDate = new Date(2024, 0, 15);
    const invalidBaseDate = new Date('invalid');
    expect(() => formatDistanceToNow(validDate, invalidBaseDate)).toThrow(
      'Invalid date'
    );
  });

  it('should throw error for invalid Date in formatRelativeDate', () => {
    const invalidDate = new Date('invalid');
    expect(() => formatRelativeDate(invalidDate)).toThrow('Invalid date');
  });

  it('should throw error for invalid baseDate in formatRelativeDate', () => {
    const validDate = new Date(2024, 0, 15);
    const invalidBaseDate = new Date('invalid');
    expect(() => formatRelativeDate(validDate, invalidBaseDate)).toThrow(
      'Invalid date'
    );
  });
});
