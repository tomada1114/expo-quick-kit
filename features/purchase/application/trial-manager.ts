/**
 * Trial Manager for Premium Feature Trials
 *
 * Manages trial periods for premium features, providing:
 * - Remaining trial days calculation
 * - Trial expiration detection
 * - Trial end date calculation
 *
 * A trial period allows users to temporarily access premium features
 * without purchase. After the trial expires, purchase becomes mandatory.
 *
 * @module features/purchase/application/trial-manager
 */

/**
 * TrialManager handles trial period logic for premium features.
 *
 * Responsibilities:
 * - Calculate remaining trial days from a start date and duration
 * - Determine if a trial has expired
 * - Calculate the exact end date of a trial
 * - Validate trial parameters (no future dates, valid durations)
 *
 * Trial Logic:
 * - A trial starts at a given date and lasts for N days
 * - Remaining days = trial_duration - (today - start_date)
 * - Trial is expired when remaining days <= 0
 * - Trial end date = start_date + trial_duration days
 */
export class TrialManager {
  /**
   * Calculate remaining trial days for a feature.
   *
   * @param featureId - The feature identifier (for validation)
   * @param startDate - When the trial started (must be in the past)
   * @param trialDurationDays - Total trial duration in days (must be >= 0)
   * @returns Number of days remaining. Negative if trial is expired.
   * @throws Error if inputs are invalid
   *
   * @example
   * const startDate = new Date(2025, 0, 1); // Jan 1, 2025
   * const remaining = trialManager.getRemainingTrialDays('premium', startDate, 7);
   * // If today is Jan 3, returns 5 days
   */
  getRemainingTrialDays(
    featureId: string,
    startDate: Date,
    trialDurationDays: number
  ): number {
    // Validate inputs
    if (!featureId || featureId.trim() === '') {
      throw new Error('Feature ID must not be empty');
    }

    if (!startDate || !(startDate instanceof Date)) {
      throw new Error('Start date must be a valid Date object');
    }

    if (trialDurationDays < 0) {
      throw new Error('Trial duration must be non-negative');
    }

    if (startDate.getTime() > new Date().getTime()) {
      throw new Error('Trial start date cannot be in the future');
    }

    // Calculate days elapsed since trial started
    const now = new Date();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    // Normalize dates to midnight to get full day counts
    const startMidnight = new Date(startDate);
    startMidnight.setHours(0, 0, 0, 0);

    const nowMidnight = new Date(now);
    nowMidnight.setHours(0, 0, 0, 0);

    const daysElapsed = Math.floor(
      (nowMidnight.getTime() - startMidnight.getTime()) / millisecondsPerDay
    );

    // Remaining days = duration - elapsed
    return trialDurationDays - daysElapsed;
  }

  /**
   * Determine if a trial has expired.
   *
   * @param startDate - When the trial started
   * @param trialDurationDays - Total trial duration in days
   * @returns True if trial has expired (remaining days <= 0), false otherwise
   * @throws Error if inputs are invalid

   * @example
   * const startDate = new Date(2025, 0, 1);
   * const isExpired = trialManager.isTrialExpired(startDate, 7);
   * // If today is Jan 9 or later, returns true
   */
  isTrialExpired(startDate: Date, trialDurationDays: number): boolean {
    const remaining = this.getRemainingTrialDays(
      '_tmp',
      startDate,
      trialDurationDays
    );
    return remaining <= 0;
  }

  /**
   * Calculate the exact end date of a trial.
   *
   * @param startDate - When the trial started
   * @param trialDurationDays - Total trial duration in days
   * @returns Date object representing when the trial ends
   * @throws Error if inputs are invalid
   *
   * @example
   * const startDate = new Date(2025, 0, 1);
   * const endDate = trialManager.calculateTrialEndDate(startDate, 7);
   * // Returns Jan 8, 2025 with same time as startDate
   */
  calculateTrialEndDate(startDate: Date, trialDurationDays: number): Date {
    // Validate inputs
    if (!startDate || !(startDate instanceof Date)) {
      throw new Error('Start date must be a valid Date object');
    }

    if (trialDurationDays < 0) {
      throw new Error('Trial duration must be non-negative');
    }

    // Create end date by adding days to start date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + trialDurationDays);

    return endDate;
  }
}
