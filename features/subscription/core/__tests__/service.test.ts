/**
 * Subscription Service Unit Tests
 *
 * Tests for the application service layer that contains business logic
 * for subscription management, feature gating, and usage limits.
 *
 * @module features/subscription/core/__tests__/service.test
 */

import {
  getUsageLimits,
  canAccessFeature,
  FREE_TIER_LIMITS,
  PREMIUM_TIER_LIMITS,
} from '../service';
import type { FeatureLevel } from '../types';

describe('Subscription Service', () => {
  describe('getUsageLimits', () => {
    it('should return free tier limits for free tier', () => {
      const limits = getUsageLimits('free');

      expect(limits).toEqual(FREE_TIER_LIMITS);
      expect(limits.maxItems).toBe(10);
      expect(limits.maxExports).toBe(1);
      expect(limits.hasAds).toBe(true);
    });

    it('should return premium tier limits for premium tier', () => {
      const limits = getUsageLimits('premium');

      expect(limits).toEqual(PREMIUM_TIER_LIMITS);
      expect(limits.maxItems).toBe(Infinity);
      expect(limits.maxExports).toBe(Infinity);
      expect(limits.hasAds).toBe(false);
    });

    it('should return immutable free tier limits', () => {
      const limits1 = getUsageLimits('free');
      const limits2 = getUsageLimits('free');

      // Should return the same reference (immutable constant)
      expect(limits1).toBe(limits2);
    });

    it('should return immutable premium tier limits', () => {
      const limits1 = getUsageLimits('premium');
      const limits2 = getUsageLimits('premium');

      // Should return the same reference (immutable constant)
      expect(limits1).toBe(limits2);
    });
  });

  describe('canAccessFeature', () => {
    describe('with free tier', () => {
      const tier = 'free' as const;

      it('should allow access to basic features', () => {
        const result = canAccessFeature('basic', tier);
        expect(result).toBe(true);
      });

      it('should deny access to premium features', () => {
        const result = canAccessFeature('premium', tier);
        expect(result).toBe(false);
      });
    });

    describe('with premium tier', () => {
      const tier = 'premium' as const;

      it('should allow access to basic features', () => {
        const result = canAccessFeature('basic', tier);
        expect(result).toBe(true);
      });

      it('should allow access to premium features', () => {
        const result = canAccessFeature('premium', tier);
        expect(result).toBe(true);
      });
    });

    it('should handle all feature levels exhaustively', () => {
      const featureLevels: FeatureLevel[] = ['basic', 'premium'];
      const tiers = ['free', 'premium'] as const;

      // Ensure no runtime errors for all combinations
      for (const level of featureLevels) {
        for (const tier of tiers) {
          expect(typeof canAccessFeature(level, tier)).toBe('boolean');
        }
      }
    });
  });
});
