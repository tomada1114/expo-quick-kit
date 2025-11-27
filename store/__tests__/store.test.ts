/**
 * Store Tests
 * TDD: Tests for the main Zustand store with persistence
 */
import { act } from '@testing-library/react-native';

// Mock AsyncStorage before importing the store
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

import { useStore } from '../index';

describe('Zustand Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useStore.setState({
        isOnboarded: false,
        isPremium: false,
        userPreferences: { theme: 'auto', language: 'en' },
      });
    });
  });

  describe('Store Creation', () => {
    it('should create store with initial state', () => {
      expect(useStore).toBeDefined();
      expect(typeof useStore.getState).toBe('function');
    });

    it('should return initial state values', () => {
      const state = useStore.getState();
      expect(state.isOnboarded).toBe(false);
      expect(state.isPremium).toBe(false);
      expect(state.userPreferences).toEqual({
        theme: 'auto',
        language: 'en',
      });
    });
  });

  describe('State Mutations', () => {
    it('should update isOnboarded state', () => {
      act(() => {
        useStore.getState().setOnboarded(true);
      });
      expect(useStore.getState().isOnboarded).toBe(true);
    });

    it('should update isPremium state', () => {
      act(() => {
        useStore.getState().setPremium(true);
      });
      expect(useStore.getState().isPremium).toBe(true);
    });

    it('should update user preferences partially', () => {
      act(() => {
        useStore.getState().updateUserPreferences({ theme: 'dark' });
      });
      const prefs = useStore.getState().userPreferences;
      expect(prefs.theme).toBe('dark');
      expect(prefs.language).toBe('en'); // preserved
    });

    it('should hydrate state from external source', () => {
      act(() => {
        useStore.getState().hydrate({
          isOnboarded: true,
          isPremium: true,
          userPreferences: { theme: 'light', language: 'ja' },
        });
      });
      const state = useStore.getState();
      expect(state.isOnboarded).toBe(true);
      expect(state.isPremium).toBe(true);
      expect(state.userPreferences.theme).toBe('light');
      expect(state.userPreferences.language).toBe('ja');
    });
  });

  describe('Type Safety', () => {
    it('should provide typed state access', () => {
      const state = useStore.getState();

      // Type assertions (compile-time checks)
      const onboarded: boolean = state.isOnboarded;
      const premium: boolean = state.isPremium;
      const theme: 'light' | 'dark' | 'auto' = state.userPreferences.theme;
      const language: 'en' | 'ja' = state.userPreferences.language;

      expect(typeof onboarded).toBe('boolean');
      expect(typeof premium).toBe('boolean');
      expect(typeof theme).toBe('string');
      expect(typeof language).toBe('string');
    });

    it('should provide typed action access', () => {
      const state = useStore.getState();

      expect(typeof state.setOnboarded).toBe('function');
      expect(typeof state.setPremium).toBe('function');
      expect(typeof state.updateUserPreferences).toBe('function');
      expect(typeof state.hydrate).toBe('function');
    });
  });
});
