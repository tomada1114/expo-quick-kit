/**
 * Formatting Utilities
 *
 * Centralized formatting functions for consistent data presentation
 */

/**
 * Default locale for date formatting
 * Can be overridden by passing a locale parameter
 */
export const DEFAULT_LOCALE = 'ja-JP';

/**
 * Date format options
 */
export interface DateFormatOptions {
  /** Locale for formatting (default: ja-JP) */
  locale?: string;
  /** Year display style */
  year?: 'numeric' | '2-digit';
  /** Month display style */
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  /** Day display style */
  day?: 'numeric' | '2-digit';
}

/**
 * Default date format options
 */
const DEFAULT_DATE_FORMAT: DateFormatOptions = {
  locale: DEFAULT_LOCALE,
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

/**
 * Format a date for display
 *
 * @param date - Date to format
 * @param options - Formatting options (optional)
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date('2024-01-15'))
 * // => "2024年1月15日" (ja-JP)
 *
 * formatDate(new Date('2024-01-15'), { locale: 'en-US' })
 * // => "Jan 15, 2024"
 */
export function formatDate(
  date: Date,
  options: DateFormatOptions = {}
): string {
  const { locale, ...formatOptions } = { ...DEFAULT_DATE_FORMAT, ...options };
  const d = new Date(date);
  return d.toLocaleDateString(locale, formatOptions);
}
