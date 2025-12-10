/**
 * FeatureLevelVO - Feature Level Value Object
 *
 * Immutable value object representing feature access levels in the purchase system.
 * Features can be either 'free' (available to all users) or 'premium' (requires purchase).
 *
 * This value object encapsulates feature level validation and access control logic,
 * following Domain-Driven Design principles.
 *
 * @module features/purchase/core/feature-level-vo
 */

import { type Result } from './types';

/**
 * Feature level type definition.
 * - 'free': Available to all users (no purchase required)
 * - 'premium': Available only to premium tier users or those with required purchase
 */
export type FeatureLevel = 'free' | 'premium';

/**
 * Feature level error types.
 */
export type FeatureLevelError =
  | { code: 'INVALID_FEATURE_LEVEL'; message: string }
  | { code: 'INVALID_FEATURE_DEFINITION'; message: string };

/**
 * FeatureLevelVO - Immutable value object for feature access levels
 *
 * Responsibilities:
 * - Validate feature level values (only 'free' or 'premium')
 * - Determine access eligibility based on feature level and user subscription tier
 * - Provide comparison and serialization methods
 *
 * Invariants:
 * - level must be either 'free' or 'premium'
 * - Free features are accessible to all users
 * - Premium features require premium subscription or purchase
 */
export class FeatureLevelVO {
  readonly level: FeatureLevel;

  /**
   * Private constructor to enforce use of factory method
   * @param level The feature level value
   */
  private constructor(level: FeatureLevel) {
    this.level = level;
  }

  /**
   * Factory method to create a new FeatureLevelVO with validation
   *
   * @param level The feature level value to validate
   * @returns Result containing the created FeatureLevelVO or validation error
   *
   * @example
   * const result = FeatureLevelVO.create('premium');
   * if (result.success) {
   *   console.log(result.data.isPremium()); // true
   * }
   */
  static create(
    level: FeatureLevel
  ): Result<FeatureLevelVO, FeatureLevelError> {
    // Validate that level is one of allowed values
    if (level !== 'free' && level !== 'premium') {
      return {
        success: false,
        error: {
          code: 'INVALID_FEATURE_LEVEL',
          message: `Invalid feature level: ${level}. Must be 'free' or 'premium'.`,
        },
      };
    }

    return {
      success: true,
      data: new FeatureLevelVO(level),
    };
  }

  /**
   * Determine if this is a free feature
   * @returns true if level is 'free'
   */
  isFree(): boolean {
    return this.level === 'free';
  }

  /**
   * Determine if this is a premium feature
   * @returns true if level is 'premium'
   */
  isPremium(): boolean {
    return this.level === 'premium';
  }

  /**
   * Check if a user can access this feature based on their subscription tier
   *
   * Access rules:
   * - Free features: accessible to all users (free and premium)
   * - Premium features: accessible only to premium subscribers
   *
   * Note: This method does NOT check for one-time purchases.
   * Purchase validation is handled by FeatureGatingService.
   *
   * @param subscriptionTier User's subscription tier ('free' or 'premium')
   * @returns true if user can access this feature with their subscription tier
   */
  canAccessWithSubscription(subscriptionTier: 'free' | 'premium'): boolean {
    // Free features are always accessible
    if (this.isFree()) {
      return true;
    }

    // Premium features require premium subscription
    return subscriptionTier === 'premium';
  }

  /**
   * Compare equality with another FeatureLevelVO
   * @param other The other FeatureLevelVO to compare
   * @returns true if both have the same level
   */
  equals(other: FeatureLevelVO): boolean {
    return this.level === other.level;
  }

  /**
   * Get string representation of the feature level
   * @returns The level string ('free' or 'premium')
   */
  toString(): string {
    return this.level;
  }

  /**
   * Serialize to JSON representation
   * @returns The feature level as a string
   */
  toJSON(): FeatureLevel {
    return this.level;
  }
}

/**
 * FeatureDefinition - Domain object describing a feature in the application
 *
 * Represents a feature that can be gated based on access level and purchases.
 * Each feature has metadata (id, name, description) and an access level (free/premium).
 *
 * Responsibilities:
 * - Store and validate feature metadata
 * - Determine access eligibility
 * - Maintain reference to required purchase product (if premium)
 *
 * Invariants:
 * - id must be non-empty string (unique identifier)
 * - name must be non-empty string
 * - description must be non-empty string
 * - level must be valid FeatureLevel
 * - premium features must have requiredProductId defined
 */
export class FeatureDefinition {
  readonly id: string;
  readonly level: FeatureLevelVO;
  readonly name: string;
  readonly description: string;
  readonly requiredProductId?: string;

  /**
   * Private constructor to enforce use of factory method
   */
  private constructor(
    id: string,
    level: FeatureLevelVO,
    name: string,
    description: string,
    requiredProductId?: string
  ) {
    this.id = id;
    this.level = level;
    this.name = name;
    this.description = description;
    this.requiredProductId = requiredProductId;
  }

  /**
   * Factory method to create a new FeatureDefinition with validation
   *
   * @param params Feature definition parameters
   * @param params.id Unique feature identifier (e.g., 'advanced_analytics')
   * @param params.level Feature access level ('free' or 'premium')
   * @param params.name Human-readable feature name
   * @param params.description Feature description
   * @param params.requiredProductId Product ID required for this feature (required for premium)
   * @returns Result containing the created FeatureDefinition or validation error
   *
   * @example
   * const result = FeatureDefinition.create({
   *   id: 'advanced_analytics',
   *   level: 'premium',
   *   name: 'Advanced Analytics',
   *   description: 'Access to advanced analytics features',
   *   requiredProductId: 'premium_unlock'
   * });
   */
  static create(params: {
    id: string;
    level: FeatureLevel;
    name: string;
    description: string;
    requiredProductId?: string;
  }): Result<FeatureDefinition, FeatureLevelError> {
    // Validate id
    if (!params.id || params.id.trim().length === 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_FEATURE_DEFINITION',
          message: 'Feature id must be a non-empty string',
        },
      };
    }

    // Validate name
    if (!params.name || params.name.trim().length === 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_FEATURE_DEFINITION',
          message: 'Feature name must be a non-empty string',
        },
      };
    }

    // Validate description
    if (!params.description || params.description.trim().length === 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_FEATURE_DEFINITION',
          message: 'Feature description must be a non-empty string',
        },
      };
    }

    // Create feature level
    const levelResult = FeatureLevelVO.create(params.level);
    if (!levelResult.success) {
      return levelResult;
    }

    // Validate that premium features have required product
    if (levelResult.data.isPremium() && !params.requiredProductId) {
      return {
        success: false,
        error: {
          code: 'INVALID_FEATURE_DEFINITION',
          message: 'Premium features must have a requiredProductId',
        },
      };
    }

    return {
      success: true,
      data: new FeatureDefinition(
        params.id,
        levelResult.data,
        params.name,
        params.description,
        params.requiredProductId
      ),
    };
  }

  /**
   * Determine if this is a free feature
   * @returns true if feature level is 'free'
   */
  isFree(): boolean {
    return this.level.isFree();
  }

  /**
   * Determine if this is a premium feature
   * @returns true if feature level is 'premium'
   */
  isPremium(): boolean {
    return this.level.isPremium();
  }

  /**
   * Check if a user can access this feature based on their subscription tier
   * @param subscriptionTier User's subscription tier ('free' or 'premium')
   * @returns true if user can access with their subscription tier
   */
  canAccessWithSubscription(subscriptionTier: 'free' | 'premium'): boolean {
    return this.level.canAccessWithSubscription(subscriptionTier);
  }

  /**
   * Compare equality with another FeatureDefinition
   * Features are equal if they have the same id
   * @param other The other FeatureDefinition to compare
   * @returns true if both have the same id
   */
  equals(other: FeatureDefinition): boolean {
    return this.id === other.id;
  }

  /**
   * Serialize to JSON representation
   * @returns Object representation of the feature definition
   */
  toJSON() {
    return {
      id: this.id,
      level: this.level.toJSON(),
      name: this.name,
      description: this.description,
      requiredProductId: this.requiredProductId,
    };
  }
}
