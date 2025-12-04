/**
 * Purchase Infrastructure Module - Public Exports
 *
 * Exports infrastructure components for the purchase feature:
 * - Receipt verification
 * - Secure storage of verification metadata
 * - Verification state management and restoration
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
