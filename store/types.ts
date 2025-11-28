/**
 * Store Type Definitions
 * Type definitions for Zustand store
 */

/**
 * Supported languages for the application
 */
export type SupportedLanguage = 'en' | 'ja';

/**
 * User preferences for the application
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: SupportedLanguage;
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

  // RevenueCat SDK availability (not persisted - determined at runtime)
  isRevenueCatAvailable: boolean;
  setRevenueCatAvailable: (value: boolean) => void;

  // User preferences
  userPreferences: UserPreferences;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => void;

  // State hydration (for persistence)
  hydrate: (state: Partial<AppState>) => void;
}
