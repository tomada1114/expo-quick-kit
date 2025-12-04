/**
 * Purchase Core Module - Public Exports
 *
 * Exports domain types and entities for the purchase (one-time purchase) feature.
 * All consumer code should import from this index rather than directly from types.ts.
 *
 * @module features/purchase/core
 */

export type {
  Purchase,
  PurchaseError,
  PurchaseErrorCode,
  FeatureLevel,
  FeatureDefinition,
  Result,
  Product,
  Transaction,
} from './types';
