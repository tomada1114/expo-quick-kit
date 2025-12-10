/**
 * FeatureLevelVO Unit Tests
 *
 * Tests for the FeatureLevel value object and FeatureDefinition.
 * Following TDD methodology with RED-GREEN-REFACTOR cycle.
 */

import { FeatureLevelVO, FeatureDefinition } from '../feature-level-vo';

describe('FeatureLevelVO', () => {
  // RED: Write failing tests first

  describe('FeatureLevelVO.create()', () => {
    // Happy path: Creating valid feature levels
    it('should create a free feature level successfully', () => {
      const result = FeatureLevelVO.create('free');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.level).toBe('free');
      }
    });

    it('should create a premium feature level successfully', () => {
      const result = FeatureLevelVO.create('premium');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.level).toBe('premium');
      }
    });

    // Sad path: Invalid feature levels
    it('should return error for invalid feature level', () => {
      const result = FeatureLevelVO.create('invalid' as any);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_FEATURE_LEVEL');
      }
    });

    it('should return error for null/undefined feature level', () => {
      const result = FeatureLevelVO.create(null as any);
      expect(result.success).toBe(false);
    });
  });

  describe('FeatureLevelVO.isFree()', () => {
    it('should return true for free level', () => {
      const result = FeatureLevelVO.create('free');
      if (result.success) {
        expect(result.data.isFree()).toBe(true);
      }
    });

    it('should return false for premium level', () => {
      const result = FeatureLevelVO.create('premium');
      if (result.success) {
        expect(result.data.isFree()).toBe(false);
      }
    });
  });

  describe('FeatureLevelVO.isPremium()', () => {
    it('should return false for free level', () => {
      const result = FeatureLevelVO.create('free');
      if (result.success) {
        expect(result.data.isPremium()).toBe(false);
      }
    });

    it('should return true for premium level', () => {
      const result = FeatureLevelVO.create('premium');
      if (result.success) {
        expect(result.data.isPremium()).toBe(true);
      }
    });
  });

  describe('FeatureLevelVO.canAccessWithSubscription()', () => {
    it('should allow free feature access for any user', () => {
      const result = FeatureLevelVO.create('free');
      if (result.success) {
        expect(result.data.canAccessWithSubscription('free')).toBe(true);
        expect(result.data.canAccessWithSubscription('premium')).toBe(true);
      }
    });

    it('should allow premium feature access only for premium subscribers', () => {
      const result = FeatureLevelVO.create('premium');
      if (result.success) {
        expect(result.data.canAccessWithSubscription('free')).toBe(false);
        expect(result.data.canAccessWithSubscription('premium')).toBe(true);
      }
    });
  });

  describe('FeatureLevelVO.equals()', () => {
    it('should be equal if both have same level', () => {
      const free1 = FeatureLevelVO.create('free');
      const free2 = FeatureLevelVO.create('free');
      if (free1.success && free2.success) {
        expect(free1.data.equals(free2.data)).toBe(true);
      }
    });

    it('should not be equal if levels differ', () => {
      const free = FeatureLevelVO.create('free');
      const premium = FeatureLevelVO.create('premium');
      if (free.success && premium.success) {
        expect(free.data.equals(premium.data)).toBe(false);
      }
    });
  });

  describe('FeatureLevelVO.toString()', () => {
    it('should return string representation of level', () => {
      const result = FeatureLevelVO.create('free');
      if (result.success) {
        expect(result.data.toString()).toBe('free');
      }
    });
  });
});

describe('FeatureDefinition', () => {
  describe('FeatureDefinition.create()', () => {
    // Happy path: Creating valid feature definitions
    it('should create a free feature definition successfully', () => {
      const result = FeatureDefinition.create({
        id: 'analytics',
        level: 'free',
        name: 'Analytics',
        description: 'View analytics data',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('analytics');
        expect(result.data.level.isPremium()).toBe(false);
      }
    });

    it('should create a premium feature definition with required product', () => {
      const result = FeatureDefinition.create({
        id: 'advanced_analytics',
        level: 'premium',
        name: 'Advanced Analytics',
        description: 'View advanced analytics data',
        requiredProductId: 'premium_unlock',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('advanced_analytics');
        expect(result.data.level.isPremium()).toBe(true);
        expect(result.data.requiredProductId).toBe('premium_unlock');
      }
    });

    // Sad path: Invalid feature definitions
    it('should return error for missing id', () => {
      const result = FeatureDefinition.create({
        id: '',
        level: 'free',
        name: 'Test',
        description: 'Test feature',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_FEATURE_DEFINITION');
      }
    });

    it('should return error for missing name', () => {
      const result = FeatureDefinition.create({
        id: 'test',
        level: 'free',
        name: '',
        description: 'Test feature',
      });
      expect(result.success).toBe(false);
    });

    it('should return error for missing description', () => {
      const result = FeatureDefinition.create({
        id: 'test',
        level: 'free',
        name: 'Test',
        description: '',
      });
      expect(result.success).toBe(false);
    });

    it('should return error for premium feature without required product', () => {
      const result = FeatureDefinition.create({
        id: 'premium_feature',
        level: 'premium',
        name: 'Premium Feature',
        description: 'A premium feature',
        requiredProductId: undefined,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_FEATURE_DEFINITION');
      }
    });
  });

  describe('FeatureDefinition.isFree()', () => {
    it('should return true for free tier features', () => {
      const result = FeatureDefinition.create({
        id: 'analytics',
        level: 'free',
        name: 'Analytics',
        description: 'View analytics',
      });
      if (result.success) {
        expect(result.data.isFree()).toBe(true);
      }
    });

    it('should return false for premium tier features', () => {
      const result = FeatureDefinition.create({
        id: 'advanced',
        level: 'premium',
        name: 'Advanced',
        description: 'Advanced features',
        requiredProductId: 'pro',
      });
      if (result.success) {
        expect(result.data.isFree()).toBe(false);
      }
    });
  });

  describe('FeatureDefinition.canAccessWithSubscription()', () => {
    it('should allow free feature for free subscription', () => {
      const result = FeatureDefinition.create({
        id: 'analytics',
        level: 'free',
        name: 'Analytics',
        description: 'View analytics',
      });
      if (result.success) {
        expect(result.data.canAccessWithSubscription('free')).toBe(true);
      }
    });

    it('should allow free feature for premium subscription', () => {
      const result = FeatureDefinition.create({
        id: 'analytics',
        level: 'free',
        name: 'Analytics',
        description: 'View analytics',
      });
      if (result.success) {
        expect(result.data.canAccessWithSubscription('premium')).toBe(true);
      }
    });

    it('should deny premium feature for free subscription', () => {
      const result = FeatureDefinition.create({
        id: 'advanced',
        level: 'premium',
        name: 'Advanced',
        description: 'Advanced features',
        requiredProductId: 'pro',
      });
      if (result.success) {
        expect(result.data.canAccessWithSubscription('free')).toBe(false);
      }
    });

    it('should allow premium feature for premium subscription', () => {
      const result = FeatureDefinition.create({
        id: 'advanced',
        level: 'premium',
        name: 'Advanced',
        description: 'Advanced features',
        requiredProductId: 'pro',
      });
      if (result.success) {
        expect(result.data.canAccessWithSubscription('premium')).toBe(true);
      }
    });
  });

  describe('FeatureDefinition.equals()', () => {
    it('should be equal for same feature ids', () => {
      const def1 = FeatureDefinition.create({
        id: 'analytics',
        level: 'free',
        name: 'Analytics',
        description: 'View analytics',
      });
      const def2 = FeatureDefinition.create({
        id: 'analytics',
        level: 'free',
        name: 'Analytics Updated',
        description: 'View analytics data',
      });
      if (def1.success && def2.success) {
        expect(def1.data.equals(def2.data)).toBe(true);
      }
    });

    it('should not be equal for different feature ids', () => {
      const def1 = FeatureDefinition.create({
        id: 'analytics',
        level: 'free',
        name: 'Analytics',
        description: 'View analytics',
      });
      const def2 = FeatureDefinition.create({
        id: 'reports',
        level: 'free',
        name: 'Reports',
        description: 'View reports',
      });
      if (def1.success && def2.success) {
        expect(def1.data.equals(def2.data)).toBe(false);
      }
    });
  });

  describe('FeatureDefinition.toJSON()', () => {
    it('should serialize to JSON correctly', () => {
      const result = FeatureDefinition.create({
        id: 'analytics',
        level: 'free',
        name: 'Analytics',
        description: 'View analytics',
      });
      if (result.success) {
        const json = result.data.toJSON();
        expect(json.id).toBe('analytics');
        expect(json.level).toBe('free');
        expect(json.name).toBe('Analytics');
        expect(json.description).toBe('View analytics');
        expect(json.requiredProductId).toBeUndefined();
      }
    });

    it('should serialize premium feature with product id', () => {
      const result = FeatureDefinition.create({
        id: 'advanced',
        level: 'premium',
        name: 'Advanced',
        description: 'Advanced features',
        requiredProductId: 'pro',
      });
      if (result.success) {
        const json = result.data.toJSON();
        expect(json.requiredProductId).toBe('pro');
      }
    });
  });
});
