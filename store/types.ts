/**
 * Store Type Definitions
 * Type definitions for Zustand store
 */

/**
 * User preferences for the application
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

/**
 * Application state interface
 * Defines the global state managed by Zustand
 */
export interface AppState {
  // Onboarding state
  isOnboarded: boolean;
  setOnboarded: (value: boolean) => void;

  // Premium subscription state
  isPremium: boolean;
  setPremium: (value: boolean) => void;

  // User preferences
  userPreferences: UserPreferences;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => void;

  // State hydration (for persistence)
  hydrate: (state: Partial<AppState>) => void;
}
