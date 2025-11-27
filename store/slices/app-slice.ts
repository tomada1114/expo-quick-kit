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
 * @param get - Zustand get function
 * @returns App slice state and actions
 */
export const createAppSlice = (
  set: (
    partial:
      | Partial<AppState>
      | ((state: AppState) => Partial<AppState>)
      | AppState
  ) => void,
  _get: () => AppState
): AppState => ({
  // Initial state
  isOnboarded: false,
  isPremium: false,
  userPreferences: defaultUserPreferences,

  // Actions
  setOnboarded: (value: boolean) => set({ isOnboarded: value }),
  setPremium: (value: boolean) => set({ isPremium: value }),
  updateUserPreferences: (prefs: Partial<UserPreferences>) =>
    set((state) => ({
      userPreferences: { ...state.userPreferences, ...prefs },
    })),
  hydrate: (state: Partial<AppState>) => set(state),
});
