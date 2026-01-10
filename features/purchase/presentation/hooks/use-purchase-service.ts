/**
 * usePurchaseService hook
 *
 * Hook wrapper for PurchaseService singleton
 */

import { purchaseService } from '../../application/index';

export function usePurchaseService() {
  return purchaseService;
}
