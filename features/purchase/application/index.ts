/**
 * Purchase Application Layer - Public Exports
 *
 * Exports application-level services for the purchase feature:
 * - Feature gating service (FeatureGatingService)
 * - Purchase orchestration (PurchaseService)
 * - Trial management (TrialManager)
 * - Purchase restoration (RestoreService)
 *
 * Task 7.1: Feature gating service with synchronous access checking
 * Task 6.1-6.4: Purchase service orchestration
 * Task 7.4: Trial period support
 * Task 8.1: Purchase restoration flow
 *
 * @module features/purchase/application
 */

export { featureGatingService, type FeatureGatingService } from './feature-gating-service';
export { purchaseService } from './purchase-service';
export type { PurchaseFlowError } from './purchase-service';
export { TrialManager } from './trial-manager';
export { restoreService } from './restore-service';
export type { RestoreResult, RestoreError } from './restore-service';
