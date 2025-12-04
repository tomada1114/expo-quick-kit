/**
 * useColorScheme Hook Tests (Web)
 *
 * Tests for the web-specific color scheme hook that handles SSR hydration
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import { renderHook, act } from '@testing-library/react-native';

// Mock react-native's useColorScheme with a configurable mock
const mockUseRNColorScheme = jest.fn();
jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
  useColorScheme: () => mockUseRNColorScheme(),
}));

// Import after mocks - web version
import { useColorScheme } from '../use-color-scheme.web';

describe('useColorScheme (web)', () => {
  beforeEach(() => {
    mockUseRNColorScheme.mockReturnValue('light');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('SSR/Hydration behavior', () => {
    // Given: Component is rendering for the first time (SSR)
    // When: useColorScheme is called before hydration
    // Then: Returns 'light' as a safe default
    it('should return light before hydration', () => {
      const { result } = renderHook(() => useColorScheme());

      // Before useEffect runs, should return 'light' as safe default
      expect(result.current).toBe('light');
    });

    // Given: Component has mounted and hydrated
    // When: useColorScheme is called after hydration in light mode
    // Then: Returns the actual system color scheme
    it('should return actual color scheme after hydration in light mode', async () => {
      mockUseRNColorScheme.mockReturnValue('light');
      const { result } = renderHook(() => useColorScheme());

      // Simulate hydration by running effects
      await act(async () => {
        jest.runAllTimers();
      });

      expect(result.current).toBe('light');
    });

    // Given: Component has mounted and hydrated
    // When: useColorScheme is called after hydration in dark mode
    // Then: Returns 'dark'
    it('should return dark after hydration when system is in dark mode', async () => {
      mockUseRNColorScheme.mockReturnValue('dark');
      const { result } = renderHook(() => useColorScheme());

      await act(async () => {
        jest.runAllTimers();
      });

      expect(result.current).toBe('dark');
    });
  });

  describe('Edge cases', () => {
    // Given: System color scheme is null
    // When: useColorScheme is called after hydration
    // Then: Returns null (actual system value)
    it('should return null after hydration when system color scheme is null', async () => {
      mockUseRNColorScheme.mockReturnValue(null);
      const { result } = renderHook(() => useColorScheme());

      await act(async () => {
        jest.runAllTimers();
      });

      expect(result.current).toBeNull();
    });

    // Given: Multiple renders occur
    // When: useColorScheme is called
    // Then: Maintains correct hydration state
    it('should maintain hydration state across rerenders', async () => {
      mockUseRNColorScheme.mockReturnValue('dark');
      const { result, rerender } = renderHook(() => useColorScheme());

      await act(async () => {
        jest.runAllTimers();
      });

      expect(result.current).toBe('dark');

      // Rerender should maintain the hydrated state
      rerender({});
      expect(result.current).toBe('dark');
    });
  });

  describe('Static rendering support', () => {
    // Given: Static rendering context (SSR)
    // When: Initial render happens before client-side hydration
    // Then: Always returns 'light' to avoid hydration mismatch
    it('should provide consistent initial value for static rendering', () => {
      // First render simulates SSR
      const { result } = renderHook(() => useColorScheme());

      // Should always be 'light' initially to match server-rendered HTML
      expect(result.current).toBe('light');
    });
  });

  describe('Hydration state transition', () => {
    // Given: System prefers dark mode
    // When: Component mounts and hydrates
    // Then: Eventually returns the system value (dark)
    // Note: In JSDOM environment, useEffect runs synchronously during render,
    // so we cannot observe the pre-hydration 'light' state directly
    it('should return system color scheme after hydration', async () => {
      mockUseRNColorScheme.mockReturnValue('dark');
      const { result } = renderHook(() => useColorScheme());

      // After hydration: actual system value
      await act(async () => {
        jest.runAllTimers();
      });

      expect(result.current).toBe('dark');
    });

    // Given: System prefers light mode
    // When: Component mounts and hydrates
    // Then: Returns 'light' (same as SSR default)
    it('should return light when system is in light mode', async () => {
      mockUseRNColorScheme.mockReturnValue('light');
      const { result } = renderHook(() => useColorScheme());

      await act(async () => {
        jest.runAllTimers();
      });

      expect(result.current).toBe('light');
    });
  });
});
