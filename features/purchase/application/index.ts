/**
 * Purchase Application Layer - Public Exports
 *
 * Exports application-level services for the purchase feature:
 * - Feature gating service (FeatureGatingService)
 * - Purchase orchestration (PurchaseService)
 * - Trial management (TrialManager)
 * - Purchase restoration (RestoreService)
 * - Sync reconciliation (SyncReconciler)
 * - Recovery handling (RecoveryHandler)
 * - Authorization service (AuthorizationService) - Task 15.2
 *
 * Task 7.1: Feature gating service with synchronous access checking
 * Task 6.1-6.4: Purchase service orchestration
 * Task 7.4: Trial period support
 * Task 8.1: Purchase restoration flow
 * Task 9.3: Sync reconciliation
 * Task 9.5: Database corruption detection and recovery
 * Task 15.2: Authorization service for cross-user access control
 *
 * @module features/purchase/application
 */

export { featureGatingService, type FeatureGatingService } from './feature-gating-service';
export { purchaseService } from './purchase-service';
export type { PurchaseFlowError } from './purchase-service';
export { TrialManager } from './trial-manager';
export { restoreService } from './restore-service';
export type { RestoreResult, RestoreError } from './restore-service';
export { syncReconciler } from './sync-reconciler';
export type { ReconciliationResult, ReconciliationError } from './sync-reconciler';
export { recoveryHandler } from './recovery-handler';
export type {
  DBCorruptionResult,
  CorruptionErrorInfo,
  RecoveryResult,
  ReconstructionResult,
  RecoveryValidation,
  RecoveryStatus,
} from './recovery-handler';
export { createAuthorizationService, authorizationService } from './authorization-service';
export type { AuthorizationService, AuthorizationError, CurrentUser, CurrentUserProvider } from './authorization-service';
