/**
 * Zustand Store
 * Global state management with persistence
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createAppSlice } from './slices/app-slice';
import type { AppState } from './types';

/**
 * Main application store with AsyncStorage persistence
 */
export const useStore = create<AppState>()(
  persist((set) => createAppSlice(set), {
    name: 'app-store',
    version: 1,
    storage: createJSONStorage(() => AsyncStorage),
    // Only persist these keys
    partialize: (state) => ({
      isOnboarded: state.isOnboarded,
      isPremium: state.isPremium,
      userPreferences: state.userPreferences,
    }),
  })
);

// Re-export types
export type { AppState, UserPreferences, SupportedLanguage } from './types';
