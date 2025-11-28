/**
 * App Slice
 * Core application state slice for Zustand store
 */
import type { AppState, UserPreferences } from '../types';

/**
 * Default user preferences
 */
const defaultUserPreferences: UserPreferences = {
  theme: 'auto',
  language: 'en',
};

/**
 * Creates the app slice for Zustand store
 * @param set - Zustand set function
 * @returns App slice state and actions
 */
export const createAppSlice = (
  set: (
    partial:
      | Partial<AppState>
      | ((state: AppState) => Partial<AppState>)
      | AppState
  ) => void
): AppState => ({
  // Initial state
  isOnboarded: false,
  isPremium: false,
  isRevenueCatAvailable: false,
  userPreferences: defaultUserPreferences,

  // Actions
  setOnboarded: (value: boolean) => set({ isOnboarded: value }),
  setPremium: (value: boolean) => set({ isPremium: value }),
  setRevenueCatAvailable: (value: boolean) =>
    set({ isRevenueCatAvailable: value }),
  updateUserPreferences: (prefs: Partial<UserPreferences>) =>
    set((state) => ({
      userPreferences: { ...state.userPreferences, ...prefs },
    })),
  hydrate: (state: Partial<AppState>) => set(state),
});
