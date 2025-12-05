/**
 * Purchase UI Store
 *
 * Zustand-based state management for purchase UI components.
 * Manages:
 * - Selected product in paywall
 * - Loading state during purchase
 * - Purchase flow state
 *
 * @module features/purchase/infrastructure/purchase-ui-store
 */

import { create } from 'zustand';

/**
 * Purchase UI Store State
 */
interface PurchaseUIState {
  // Product selection
  selectedProductId: string | undefined;
  setSelectedProductId: (productId: string | undefined) => void;

  // Loading state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Purchase flow
  reset: () => void;
}

/**
 * Zustand store for purchase UI state management
 *
 * Used by PaywallComponent and other purchase UI components to manage:
 * - Which product is currently selected
 * - Whether a purchase is in progress
 * - Loading indicators
 */
export const usePurchaseUIStore = create<PurchaseUIState>((set) => ({
  // Product selection
  selectedProductId: undefined,
  setSelectedProductId: (productId) =>
    set({ selectedProductId: productId }),

  // Loading state
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  // Reset
  reset: () =>
    set({
      selectedProductId: undefined,
      isLoading: false,
    }),
}));

/**
 * Legacy alias for backwards compatibility
 * Prefer usePurchaseUIStore in new code
 */
export const usePurchaseStore = usePurchaseUIStore;
