/**
 * Purchase Feature Store (Zustand)
 *
 * Manages PaywallComponent selection state and purchase UI state.
 * Uses Zustand for lightweight state management.
 */

import { create } from 'zustand';

export interface PurchaseStoreState {
  // Selection state
  selectedProductId: string | undefined;
  setSelectedProductId: (productId: string | undefined) => void;

  // Loading state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Error state
  error: string | undefined;
  setError: (error: string | undefined) => void;

  // Reset
  reset: () => void;
}

export const usePurchaseStore = create<PurchaseStoreState>((set) => ({
  selectedProductId: undefined,
  setSelectedProductId: (productId) => set({ selectedProductId: productId }),

  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  error: undefined,
  setError: (error) => set({ error }),

  reset: () =>
    set({
      selectedProductId: undefined,
      isLoading: false,
      error: undefined,
    }),
}));
