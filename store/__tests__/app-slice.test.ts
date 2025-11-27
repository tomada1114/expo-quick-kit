/**
 * App Slice Tests
 * TDD: Tests for the app slice state management
 */
import { createAppSlice } from '../slices/app-slice';
import type { AppState, UserPreferences } from '../types';

// Helper to create a minimal store-like set function
type SetFunction = (
  partial:
    | Partial<AppState>
    | ((state: AppState) => Partial<AppState>)
    | AppState
) => void;

describe('App Slice', () => {
  let state: Partial<AppState>;
  let set: SetFunction;

  beforeEach(() => {
    state = {};
    set = (partial) => {
      if (typeof partial === 'function') {
        const updates = partial(state as AppState);
        state = { ...state, ...updates };
      } else {
        state = { ...state, ...partial };
      }
    };

    // Initialize state with app slice
    const initialState = createAppSlice(set);
    state = initialState;
  });

  describe('Initial State', () => {
    it('should have isOnboarded as false by default', () => {
      expect(state.isOnboarded).toBe(false);
    });

    it('should have isPremium as false by default', () => {
      expect(state.isPremium).toBe(false);
    });

    it('should have default user preferences', () => {
      expect(state.userPreferences).toEqual({
        theme: 'auto',
        language: 'en',
      });
    });
  });

  describe('setOnboarded', () => {
    it('should set isOnboarded to true', () => {
      state.setOnboarded?.(true);
      expect(state.isOnboarded).toBe(true);
    });

    it('should set isOnboarded to false', () => {
      state.setOnboarded?.(true);
      state.setOnboarded?.(false);
      expect(state.isOnboarded).toBe(false);
    });
  });

  describe('setPremium', () => {
    it('should set isPremium to true', () => {
      state.setPremium?.(true);
      expect(state.isPremium).toBe(true);
    });

    it('should set isPremium to false', () => {
      state.setPremium?.(true);
      state.setPremium?.(false);
      expect(state.isPremium).toBe(false);
    });
  });

  describe('updateUserPreferences', () => {
    it('should update theme preference', () => {
      state.updateUserPreferences?.({ theme: 'dark' });
      expect(state.userPreferences?.theme).toBe('dark');
    });

    it('should update language preference', () => {
      state.updateUserPreferences?.({ language: 'ja' });
      expect(state.userPreferences?.language).toBe('ja');
    });

    it('should preserve other preferences when updating one', () => {
      state.updateUserPreferences?.({ theme: 'light' });
      expect(state.userPreferences?.language).toBe('en');
    });

    it('should update multiple preferences at once', () => {
      state.updateUserPreferences?.({ theme: 'dark', language: 'ja' });
      expect(state.userPreferences).toEqual({
        theme: 'dark',
        language: 'ja',
      });
    });
  });

  describe('hydrate', () => {
    it('should hydrate partial state', () => {
      state.hydrate?.({
        isOnboarded: true,
        isPremium: true,
      });
      expect(state.isOnboarded).toBe(true);
      expect(state.isPremium).toBe(true);
    });

    it('should hydrate user preferences', () => {
      const prefs: UserPreferences = { theme: 'dark', language: 'ja' };
      state.hydrate?.({ userPreferences: prefs });
      expect(state.userPreferences).toEqual(prefs);
    });

    it('should preserve unhydrated state', () => {
      state.setOnboarded?.(true);
      state.hydrate?.({ isPremium: true });
      expect(state.isOnboarded).toBe(true);
      expect(state.isPremium).toBe(true);
    });
  });
});
