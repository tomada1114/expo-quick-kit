/**
 * Purchase Infrastructure Module - Public Exports
 *
 * Exports infrastructure components for the purchase feature:
 * - Receipt verification
 * - Secure storage of verification metadata
 * - Verification state management and restoration
 * - Error handling: logging, retry, and user-facing messages (Task 6.5)
 *
 * @module features/purchase/infrastructure
 */

export { ReceiptVerifier, receiptVerifier } from './receipt-verifier';
export type { VerificationResult, VerificationError } from './receipt-verifier';

export {
  VerificationMetadataStore,
  verificationMetadataStore,
} from './verification-metadata-store';
export type {
  VerificationMetadata,
  VerificationMetadataError,
} from './verification-metadata-store';

export {
  VerificationStateInitializer,
  verificationStateInitializer,
} from './verification-state-initializer';
export type { VerificationStateInitializationError } from './verification-state-initializer';

// Task 6.5: Error handling and recovery
export { errorLogger } from './error-logger';
export type { ErrorLogEntry } from './error-logger';

export { retryHandler, DEFAULT_RETRY_CONFIG } from './retry-handler';
export type { RetryConfig, RetryResult } from './retry-handler';

export { errorHandler } from './error-handler';
export type { UserFacingError } from './error-handler';

export { mapPurchaseError, mapStoreKit2Error, mapGooglePlayBillingError, mapRevenueCatError } from './error-mapper';
export { isNetworkError, isStoreKit2Error, isRevenueCatError, isBillingResponseObject } from './error-mapper';
