/**
 * Paywall Store (Zustand)
 *
 * Manages the PaywallComponent UI state:
 * - Selected product ID for purchase
 *
 * @module features/purchase/store/paywall-store
 */

import { create } from 'zustand';

export interface PaywallStoreState {
  selectedProductId: string | null;
  setSelectedProductId: (productId: string) => void;
  resetSelection: () => void;
}

/**
 * Zustand store for paywall component state.
 * Provides selection state management for purchase options.
 */
export const usePaywallStore = create<PaywallStoreState>((set) => ({
  selectedProductId: null,

  setSelectedProductId: (productId: string) => {
    set({ selectedProductId: productId });
  },

  resetSelection: () => {
    set({ selectedProductId: null });
  },
}));
