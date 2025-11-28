/**
 * Date Utility Functions
 *
 * Provides wrapper functions for date-fns with project-specific default settings (Japanese locale)
 *
 * - formatDate: Date formatting (default locale: ja)
 * - formatDistanceToNow: Relative time display (e.g., '3 days ago')
 * - formatRelativeDate: Relative date display (e.g., 'today', 'yesterday')
 */

import {
  format as dateFnsFormat,
  formatDistance,
  formatRelative,
  isValid,
} from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * Validate date input and convert to Date object
 * @throws {Error} if the date is invalid
 */
function toValidDate(date: Date | number): Date {
  const d = typeof date === 'number' ? new Date(date) : date;
  if (!isValid(d)) {
    throw new Error(`Invalid date: ${date}`);
  }
  return d;
}

/**
 * Format date with default locale (ja)
 * @param date - Date object or timestamp
 * @param formatStr - Format string (e.g., 'yyyy-MM-dd HH:mm:ss')
 * @returns Formatted date string
 *
 * @example
 * ```ts
 * formatDate(new Date(), 'yyyy-MM-dd') // '2024-01-15'
 * formatDate(new Date(), 'yyyy年MM月dd日') // '2024年01月15日'
 * formatDate(new Date(), 'EEEE') // '月曜日'
 * ```
 */
export function formatDate(date: Date | number, formatStr: string): string {
  return dateFnsFormat(toValidDate(date), formatStr, { locale: ja });
}

/**
 * Format distance between two dates with default locale (ja)
 * @param date - Target date
 * @param baseDate - Base date (defaults to now)
 * @returns Relative time string (e.g., '3日前', '約1時間後')
 *
 * @example
 * ```ts
 * const yesterday = new Date(Date.now() - 86400000);
 * formatDistanceToNow(yesterday) // '1日前'
 *
 * const nextWeek = new Date(Date.now() + 604800000);
 * formatDistanceToNow(nextWeek) // '約1週間後'
 * ```
 */
export function formatDistanceToNow(
  date: Date | number,
  baseDate?: Date | number
): string {
  const validDate = toValidDate(date);
  const validBaseDate = baseDate ? toValidDate(baseDate) : new Date();
  return formatDistance(validDate, validBaseDate, {
    locale: ja,
    addSuffix: true,
  });
}

/**
 * Format date relative to base date with default locale (ja)
 * @param date - Target date
 * @param baseDate - Base date (defaults to now)
 * @returns Relative date string (e.g., '今日 9:30', '昨日 14:00')
 *
 * @example
 * ```ts
 * const today = new Date();
 * formatRelativeDate(today) // '今日 12:00'
 *
 * const yesterday = new Date(Date.now() - 86400000);
 * formatRelativeDate(yesterday) // '昨日 12:00'
 * ```
 */
export function formatRelativeDate(
  date: Date | number,
  baseDate?: Date | number
): string {
  const validDate = toValidDate(date);
  const validBaseDate = baseDate ? toValidDate(baseDate) : new Date();
  return formatRelative(validDate, validBaseDate, { locale: ja });
}
