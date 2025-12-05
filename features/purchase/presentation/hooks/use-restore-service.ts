/**
 * useRestoreService hook
 *
 * Hook wrapper for RestoreService singleton
 *
 * Task 14.2: Restore Purchases button implementation
 *
 * @returns restoreService instance for restoring purchases
 *
 * @example
 * ```typescript
 * const restoreService = useRestoreService();
 * const result = await restoreService.restorePurchases();
 * ```
 */

import { restoreService } from '../../application/restore-service';

export function useRestoreService() {
  return restoreService;
}
