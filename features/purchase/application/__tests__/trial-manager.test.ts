/**
 * @jest-environment node
 */

import { TrialManager } from '../trial-manager';

describe('TrialManager', () => {
  let trialManager: TrialManager;

  beforeEach(() => {
    trialManager = new TrialManager();
    jest.clearAllMocks();
  });

  describe('getRemainingTrialDays', () => {
    describe('Happy Path - Valid trial feature with remaining days', () => {
      it('should return positive days remaining for active trial', () => {
        // Given: A trial feature that started 2 days ago (7-day trial)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 2);

        // When: Checking remaining days
        const remaining = trialManager.getRemainingTrialDays(
          'feature_trial',
          startDate,
          7
        );

        // Then: Should return 5 days (7 - 2)
        expect(remaining).toBe(5);
      });

      it('should return correct remaining days for trial feature', () => {
        // Given: A trial feature that started 1 day ago (14-day trial)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);

        // When: Checking remaining days
        const remaining = trialManager.getRemainingTrialDays(
          'premium_trial',
          startDate,
          14
        );

        // Then: Should return 13 days
        expect(remaining).toBe(13);
      });

      it('should return 0 days for trial ending exactly today', () => {
        // Given: A trial that started exactly trialDurationDays ago
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        // When: Checking remaining days
        const remaining = trialManager.getRemainingTrialDays(
          'feature_trial',
          startDate,
          7
        );

        // Then: Should return 0 days
        expect(remaining).toBe(0);
      });

      it('should handle partial days correctly', () => {
        // Given: A trial that started 3 days ago in the afternoon (hours are ignored)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 3);
        startDate.setHours(12); // Time within day doesn't affect full day count

        // When: Checking remaining days (10-day trial)
        const remaining = trialManager.getRemainingTrialDays(
          'feature',
          startDate,
          10
        );

        // Then: Should return 7 days (10 - 3 days elapsed, hours ignored)
        expect(remaining).toBe(7);
      });
    });

    describe('Sad Path - Expired or invalid trials', () => {
      it('should return negative value for expired trial', () => {
        // Given: A trial that started 10 days ago (only 7-day trial)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 10);

        // When: Checking remaining days
        const remaining = trialManager.getRemainingTrialDays(
          'expired_trial',
          startDate,
          7
        );

        // Then: Should return -3 (negative = expired)
        expect(remaining).toBeLessThan(0);
      });

      it('should return negative value for long-expired trial', () => {
        // Given: A trial that started 30 days ago (only 5-day trial)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        // When: Checking remaining days
        const remaining = trialManager.getRemainingTrialDays(
          'old_trial',
          startDate,
          5
        );

        // Then: Should return -25
        expect(remaining).toBeLessThan(0);
      });

      it('should handle feature with no trial period', () => {
        // Given: A non-trial feature (0-day trial)
        const startDate = new Date();

        // When: Checking remaining days with 0 duration
        const remaining = trialManager.getRemainingTrialDays(
          'no_trial',
          startDate,
          0
        );

        // Then: Should return 0 or negative
        expect(remaining).toBeLessThanOrEqual(0);
      });
    });

    describe('Edge Cases - Boundary values', () => {
      it('should handle 1-day trial', () => {
        // Given: A 1-day trial started now (today)
        const startDate = new Date();

        // When: Checking remaining days
        const remaining = trialManager.getRemainingTrialDays(
          'one_day_trial',
          startDate,
          1
        );

        // Then: Should return 1 (today counts as full day)
        expect(remaining).toBe(1);
      });

      it('should handle very long trial period', () => {
        // Given: A 365-day trial started 1 day ago
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);

        // When: Checking remaining days
        const remaining = trialManager.getRemainingTrialDays(
          'long_trial',
          startDate,
          365
        );

        // Then: Should return 364 days
        expect(remaining).toBe(364);
      });

      it('should handle start date in the past with large duration', () => {
        // Given: A trial that started exactly 6 months ago (180-day trial)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 180);

        // When: Checking remaining days
        const remaining = trialManager.getRemainingTrialDays(
          'six_month_trial',
          startDate,
          365
        );

        // Then: Should return 185 days remaining
        expect(remaining).toBe(185);
      });

      it('should return correct days when start and duration result in future end', () => {
        // Given: A 30-day trial started 5 days ago
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 5);

        // When: Checking remaining days
        const remaining = trialManager.getRemainingTrialDays(
          'mid_trial',
          startDate,
          30
        );

        // Then: Should return 25 days
        expect(remaining).toBe(25);
      });

      it('should handle same day trials correctly', () => {
        // Given: A trial that started earlier today
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - 1); // 1 hour ago

        // When: Checking remaining days (5-day trial)
        const remaining = trialManager.getRemainingTrialDays(
          'today_trial',
          startDate,
          5
        );

        // Then: Should return 5 (started today = 0 days elapsed, so 5 - 0 = 5)
        expect(remaining).toBe(5);
      });
    });

    describe('Unhappy Path - Invalid inputs', () => {
      it('should throw error for negative trial duration', () => {
        // Given: Invalid negative trial duration
        const startDate = new Date();

        // When/Then: Should throw error
        expect(() => {
          trialManager.getRemainingTrialDays('invalid_trial', startDate, -5);
        }).toThrow('Trial duration must be non-negative');
      });

      it('should throw error for future start date', () => {
        // Given: A start date in the future
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);

        // When/Then: Should throw error
        expect(() => {
          trialManager.getRemainingTrialDays('future_trial', futureDate, 7);
        }).toThrow('Trial start date cannot be in the future');
      });

      it('should throw error for invalid feature id', () => {
        // Given: Invalid feature ID
        const startDate = new Date();

        // When/Then: Should throw error
        expect(() => {
          trialManager.getRemainingTrialDays('', startDate, 7);
        }).toThrow('Feature ID must not be empty');
      });

      it('should throw error for null/undefined start date', () => {
        // Given: Invalid start date
        const startDate = null as any;

        // When/Then: Should throw error
        expect(() => {
          trialManager.getRemainingTrialDays('feature', startDate, 7);
        }).toThrow();
      });
    });
  });

  describe('isTrialExpired', () => {
    describe('Happy Path - Correct expiration detection', () => {
      it('should return false for active trial', () => {
        // Given: A trial that started 2 days ago (7-day trial)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 2);

        // When: Checking if expired
        const isExpired = trialManager.isTrialExpired(startDate, 7);

        // Then: Should not be expired
        expect(isExpired).toBe(false);
      });

      it('should return true for expired trial', () => {
        // Given: A trial that started 10 days ago (only 7-day trial)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 10);

        // When: Checking if expired
        const isExpired = trialManager.isTrialExpired(startDate, 7);

        // Then: Should be expired
        expect(isExpired).toBe(true);
      });

      it('should return true when trial ends exactly today', () => {
        // Given: A trial that started exactly 7 days ago (7-day trial)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        // When: Checking if expired
        const isExpired = trialManager.isTrialExpired(startDate, 7);

        // Then: Should be expired (0 days remaining = expired)
        expect(isExpired).toBe(true);
      });

      it('should return false for trial with 1 day remaining', () => {
        // Given: A trial that started 6 days ago (7-day trial)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);

        // When: Checking if expired
        const isExpired = trialManager.isTrialExpired(startDate, 7);

        // Then: Should not be expired
        expect(isExpired).toBe(false);
      });
    });

    describe('Edge Cases - Boundary conditions', () => {
      it('should handle 1-day trial starting now', () => {
        // Given: A 1-day trial started now (today)
        const startDate = new Date();

        // When: Checking if expired
        const isExpired = trialManager.isTrialExpired(startDate, 1);

        // Then: Should not be expired (1 day remaining, which is > 0)
        expect(isExpired).toBe(false);
      });

      it('should return false for just-started trial', () => {
        // Given: A trial that just started
        const startDate = new Date();

        // When: Checking if expired (7-day trial)
        const isExpired = trialManager.isTrialExpired(startDate, 7);

        // Then: Should not be expired
        expect(isExpired).toBe(false);
      });
    });

    describe('Unhappy Path - Invalid inputs', () => {
      it('should throw error for future start date', () => {
        // Given: A future start date
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);

        // When/Then: Should throw error
        expect(() => {
          trialManager.isTrialExpired(futureDate, 7);
        }).toThrow('Trial start date cannot be in the future');
      });

      it('should throw error for negative duration', () => {
        // Given: Negative trial duration
        const startDate = new Date();

        // When/Then: Should throw error
        expect(() => {
          trialManager.isTrialExpired(startDate, -5);
        }).toThrow('Trial duration must be non-negative');
      });
    });
  });

  describe('calculateTrialEndDate', () => {
    describe('Happy Path - Correct end date calculation', () => {
      it('should calculate end date for 7-day trial', () => {
        // Given: A trial starting today (7-day trial)
        const startDate = new Date(2025, 0, 1); // Jan 1, 2025

        // When: Calculating end date
        const endDate = trialManager.calculateTrialEndDate(startDate, 7);

        // Then: Should be 7 days later (Jan 8, 2025)
        expect(endDate.getDate()).toBe(8);
        expect(endDate.getMonth()).toBe(0);
        expect(endDate.getFullYear()).toBe(2025);
      });

      it('should handle 30-day trial', () => {
        // Given: A trial starting on Jan 1 (30-day trial)
        const startDate = new Date(2025, 0, 1);

        // When: Calculating end date
        const endDate = trialManager.calculateTrialEndDate(startDate, 30);

        // Then: Should be Jan 31, 2025
        expect(endDate.getDate()).toBe(31);
        expect(endDate.getMonth()).toBe(0);
      });

      it('should handle month boundary crossing', () => {
        // Given: A trial starting on Jan 28 (7-day trial)
        const startDate = new Date(2025, 0, 28);

        // When: Calculating end date
        const endDate = trialManager.calculateTrialEndDate(startDate, 7);

        // Then: Should be Feb 4, 2025
        expect(endDate.getDate()).toBe(4);
        expect(endDate.getMonth()).toBe(1); // February
      });

      it('should handle year boundary crossing', () => {
        // Given: A trial starting on Dec 25 (10-day trial)
        const startDate = new Date(2024, 11, 25);

        // When: Calculating end date
        const endDate = trialManager.calculateTrialEndDate(startDate, 10);

        // Then: Should be Jan 4, 2025
        expect(endDate.getDate()).toBe(4);
        expect(endDate.getMonth()).toBe(0);
        expect(endDate.getFullYear()).toBe(2025);
      });

      it('should return same date for 0-day trial', () => {
        // Given: A 0-day trial
        const startDate = new Date(2025, 0, 1);

        // When: Calculating end date
        const endDate = trialManager.calculateTrialEndDate(startDate, 0);

        // Then: Should be same as start date
        expect(endDate.getDate()).toBe(1);
        expect(endDate.getMonth()).toBe(0);
        expect(endDate.getFullYear()).toBe(2025);
      });

      it('should preserve time component of start date', () => {
        // Given: A trial with specific time
        const startDate = new Date(2025, 0, 1, 14, 30, 45);

        // When: Calculating end date
        const endDate = trialManager.calculateTrialEndDate(startDate, 7);

        // Then: Should preserve the time
        expect(endDate.getHours()).toBe(14);
        expect(endDate.getMinutes()).toBe(30);
        expect(endDate.getSeconds()).toBe(45);
      });
    });

    describe('Edge Cases - Boundary values', () => {
      it('should handle 1-day trial', () => {
        // Given: A 1-day trial starting Jan 1
        const startDate = new Date(2025, 0, 1);

        // When: Calculating end date
        const endDate = trialManager.calculateTrialEndDate(startDate, 1);

        // Then: Should be Jan 2
        expect(endDate.getDate()).toBe(2);
      });

      it('should handle 365-day trial', () => {
        // Given: A 365-day trial starting Jan 1, 2025
        const startDate = new Date(2025, 0, 1);

        // When: Calculating end date
        const endDate = trialManager.calculateTrialEndDate(startDate, 365);

        // Then: Should be Jan 1, 2026 (365 days after Jan 1, 2025)
        expect(endDate.getFullYear()).toBe(2026);
        expect(endDate.getMonth()).toBe(0); // January
        expect(endDate.getDate()).toBe(1);
      });

      it('should handle leap year transition', () => {
        // Given: A trial starting on Feb 28, 2024 (leap year)
        const startDate = new Date(2024, 1, 28);

        // When: Calculating end date (5-day trial)
        const endDate = trialManager.calculateTrialEndDate(startDate, 5);

        // Then: Should be Mar 4, 2024 (Feb 29 exists in leap year)
        expect(endDate.getDate()).toBe(4);
        expect(endDate.getMonth()).toBe(2);
      });
    });

    describe('Unhappy Path - Invalid inputs', () => {
      it('should throw error for negative duration', () => {
        // Given: Negative trial duration
        const startDate = new Date();

        // When/Then: Should throw error
        expect(() => {
          trialManager.calculateTrialEndDate(startDate, -5);
        }).toThrow('Trial duration must be non-negative');
      });

      it('should throw error for invalid start date', () => {
        // Given: Invalid start date
        const startDate = null as any;

        // When/Then: Should throw error
        expect(() => {
          trialManager.calculateTrialEndDate(startDate, 7);
        }).toThrow();
      });
    });
  });

  describe('Integration - Trial feature workflow', () => {
    it('should correctly track trial lifecycle from start to expiry', () => {
      // Given: A 7-day trial
      const trialDuration = 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 5); // Started 5 days ago

      // When: Getting trial status
      const remaining = trialManager.getRemainingTrialDays(
        'feature',
        startDate,
        trialDuration
      );
      const isExpired = trialManager.isTrialExpired(startDate, trialDuration);
      const endDate = trialManager.calculateTrialEndDate(
        startDate,
        trialDuration
      );

      // Then: Trial should be active with 2 days remaining
      expect(remaining).toBe(2);
      expect(isExpired).toBe(false);
      expect(endDate.getTime()).toBeGreaterThan(new Date().getTime());
    });

    it('should handle expired trial correctly', () => {
      // Given: A 7-day trial that expired 3 days ago
      const trialDuration = 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 10); // Started 10 days ago

      // When: Getting trial status
      const remaining = trialManager.getRemainingTrialDays(
        'feature',
        startDate,
        trialDuration
      );
      const isExpired = trialManager.isTrialExpired(startDate, trialDuration);

      // Then: Trial should be expired
      expect(remaining).toBeLessThan(0);
      expect(isExpired).toBe(true);
    });

    it('should correctly identify when trial transitions from active to expired', () => {
      // Given: A trial ending tomorrow (started 6 days ago with 7-day duration)
      const trialDuration = 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);

      // When: Getting current status
      const remaining = trialManager.getRemainingTrialDays(
        'feature',
        startDate,
        trialDuration
      );

      // Then: Should have exactly 1 day remaining
      expect(remaining).toBe(1);
    });
  });
});
