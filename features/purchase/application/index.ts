/**
 * Purchase Application Layer - Public Exports
 *
 * Exports application-level services for the purchase feature:
 * - Purchase orchestration (PurchaseService)
 *
 * Task 6.1-6.4: Purchase service orchestration
 *
 * @module features/purchase/application
 */

export { purchaseService } from './purchase-service';
export type { PurchaseFlowError } from './purchase-service';
