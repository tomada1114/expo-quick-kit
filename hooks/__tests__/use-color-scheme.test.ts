/**
 * useColorScheme Hook Tests
 *
 * Tests for the color scheme hook that re-exports from react-native
 * This file tests the native implementation (use-color-scheme.ts)
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import { renderHook } from '@testing-library/react-native';

// Mock react-native's useColorScheme with a configurable mock
const mockUseColorScheme = jest.fn();
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  useColorScheme: () => mockUseColorScheme(),
}));

// Import after mocks - native version
import { useColorScheme } from '../use-color-scheme';

describe('useColorScheme (native)', () => {
  beforeEach(() => {
    mockUseColorScheme.mockReturnValue('light');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy path', () => {
    // Given: System is in light mode
    // When: useColorScheme is called
    // Then: Returns 'light'
    it('should return light when system is in light mode', () => {
      mockUseColorScheme.mockReturnValue('light');
      const { result } = renderHook(() => useColorScheme());
      expect(result.current).toBe('light');
    });

    // Given: System is in dark mode
    // When: useColorScheme is called
    // Then: Returns 'dark'
    it('should return dark when system is in dark mode', () => {
      mockUseColorScheme.mockReturnValue('dark');
      const { result } = renderHook(() => useColorScheme());
      expect(result.current).toBe('dark');
    });
  });

  describe('Edge cases', () => {
    // Given: System color scheme is not yet determined
    // When: useColorScheme is called
    // Then: Returns null
    it('should return null when system color scheme is not determined', () => {
      mockUseColorScheme.mockReturnValue(null);
      const { result } = renderHook(() => useColorScheme());
      expect(result.current).toBeNull();
    });
  });

  describe('Re-export behavior', () => {
    // Given: useColorScheme is imported from our hook
    // When: It is called
    // Then: It should call react-native's useColorScheme
    it('should call react-native useColorScheme under the hood', () => {
      renderHook(() => useColorScheme());
      expect(mockUseColorScheme).toHaveBeenCalled();
    });
  });
});
