/**
 * useThemeColor and useThemedColors Hook Tests
 *
 * Tests for theme color hooks that provide iOS System Colors
 */

import { renderHook } from '@testing-library/react-native';

import { Colors } from '@/constants/theme';

// Mock useColorScheme
let mockColorScheme: 'light' | 'dark' | null = 'light';
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => mockColorScheme,
}));

// Import after mocks
import { useThemeColor, useThemedColors } from '../use-theme-color';

describe('useThemeColor', () => {
  beforeEach(() => {
    mockColorScheme = 'light';
  });

  describe('Happy path', () => {
    // Given: Light mode is active
    // When: useThemeColor is called with a valid color name
    // Then: Returns the correct light mode color
    it('should return light mode color when colorScheme is light', () => {
      mockColorScheme = 'light';
      const { result } = renderHook(() => useThemeColor({}, 'tint'));
      expect(result.current).toBe(Colors.light.tint);
    });

    // Given: Dark mode is active
    // When: useThemeColor is called with a valid color name
    // Then: Returns the correct dark mode color
    it('should return dark mode color when colorScheme is dark', () => {
      mockColorScheme = 'dark';
      const { result } = renderHook(() => useThemeColor({}, 'tint'));
      expect(result.current).toBe(Colors.dark.tint);
    });

    // Given: Custom color is provided in props for light mode
    // When: Light mode is active
    // Then: Returns the custom color from props
    it('should return color from props when light mode prop is provided', () => {
      mockColorScheme = 'light';
      const customColor = '#FF0000';
      const { result } = renderHook(() =>
        useThemeColor({ light: customColor }, 'tint')
      );
      expect(result.current).toBe(customColor);
    });

    // Given: Custom color is provided in props for dark mode
    // When: Dark mode is active
    // Then: Returns the custom color from props
    it('should return color from props when dark mode prop is provided', () => {
      mockColorScheme = 'dark';
      const customColor = '#00FF00';
      const { result } = renderHook(() =>
        useThemeColor({ dark: customColor }, 'tint')
      );
      expect(result.current).toBe(customColor);
    });

    // Given: Both light and dark props are provided
    // When: Switching between modes
    // Then: Returns the corresponding prop color
    it('should use correct prop based on current theme', () => {
      const lightColor = '#FFFFFF';
      const darkColor = '#000000';

      mockColorScheme = 'light';
      const { result: lightResult } = renderHook(() =>
        useThemeColor({ light: lightColor, dark: darkColor }, 'tint')
      );
      expect(lightResult.current).toBe(lightColor);

      mockColorScheme = 'dark';
      const { result: darkResult } = renderHook(() =>
        useThemeColor({ light: lightColor, dark: darkColor }, 'tint')
      );
      expect(darkResult.current).toBe(darkColor);
    });
  });

  describe('Edge cases', () => {
    // Given: colorScheme is null (not yet determined)
    // When: useThemeColor is called
    // Then: Falls back to light mode
    it('should fallback to light mode when colorScheme is null', () => {
      mockColorScheme = null;
      const { result } = renderHook(() => useThemeColor({}, 'tint'));
      expect(result.current).toBe(Colors.light.tint);
    });

    // Given: A nested color property is requested
    // When: useThemeColor is called with a nested color name
    // Then: Returns undefined (nested colors are not supported)
    it('should return undefined for nested color properties', () => {
      mockColorScheme = 'light';
      const { result } = renderHook(() =>
        useThemeColor({}, 'background' as 'tint')
      );
      expect(result.current).toBeUndefined();
    });

    // Given: An empty props object is provided
    // When: useThemeColor is called
    // Then: Returns the theme color value
    it('should handle empty props object', () => {
      mockColorScheme = 'light';
      const { result } = renderHook(() => useThemeColor({}, 'icon'));
      expect(result.current).toBe(Colors.light.icon);
    });

    // Given: Only the opposite theme prop is provided
    // When: useThemeColor is called
    // Then: Returns the fallback theme color
    it('should use theme color when only opposite theme prop is provided', () => {
      mockColorScheme = 'light';
      const { result } = renderHook(() =>
        useThemeColor({ dark: '#000000' }, 'tint')
      );
      expect(result.current).toBe(Colors.light.tint);
    });
  });

  describe('All top-level color properties', () => {
    const topLevelColors = [
      'tint',
      'icon',
      'tabIconDefault',
      'tabIconSelected',
    ] as const;

    topLevelColors.forEach((colorName) => {
      it(`should return correct value for ${colorName} in light mode`, () => {
        mockColorScheme = 'light';
        const { result } = renderHook(() => useThemeColor({}, colorName));
        expect(result.current).toBe(Colors.light[colorName]);
      });

      it(`should return correct value for ${colorName} in dark mode`, () => {
        mockColorScheme = 'dark';
        const { result } = renderHook(() => useThemeColor({}, colorName));
        expect(result.current).toBe(Colors.dark[colorName]);
      });
    });
  });
});

describe('useThemedColors', () => {
  beforeEach(() => {
    mockColorScheme = 'light';
  });

  describe('Happy path', () => {
    // Given: Light mode is active
    // When: useThemedColors is called
    // Then: Returns light mode colors and colorScheme
    it('should return light mode colors and colorScheme when light mode is active', () => {
      mockColorScheme = 'light';
      const { result } = renderHook(() => useThemedColors());

      expect(result.current.colorScheme).toBe('light');
      expect(result.current.colors).toBe(Colors.light);
    });

    // Given: Dark mode is active
    // When: useThemedColors is called
    // Then: Returns dark mode colors and colorScheme
    it('should return dark mode colors and colorScheme when dark mode is active', () => {
      mockColorScheme = 'dark';
      const { result } = renderHook(() => useThemedColors());

      expect(result.current.colorScheme).toBe('dark');
      expect(result.current.colors).toBe(Colors.dark);
    });
  });

  describe('Nested colors access', () => {
    // Given: Light mode is active
    // When: Accessing nested background colors
    // Then: Returns correct values
    it('should provide access to nested background colors', () => {
      mockColorScheme = 'light';
      const { result } = renderHook(() => useThemedColors());

      expect(result.current.colors.background.base).toBe(
        Colors.light.background.base
      );
      expect(result.current.colors.background.secondary).toBe(
        Colors.light.background.secondary
      );
      expect(result.current.colors.background.tertiary).toBe(
        Colors.light.background.tertiary
      );
    });

    // Given: Light mode is active
    // When: Accessing nested text colors
    // Then: Returns correct values
    it('should provide access to nested text colors', () => {
      mockColorScheme = 'light';
      const { result } = renderHook(() => useThemedColors());

      expect(result.current.colors.text.primary).toBe(
        Colors.light.text.primary
      );
      expect(result.current.colors.text.secondary).toBe(
        Colors.light.text.secondary
      );
      expect(result.current.colors.text.tertiary).toBe(
        Colors.light.text.tertiary
      );
      expect(result.current.colors.text.inverse).toBe(
        Colors.light.text.inverse
      );
    });

    // Given: Light mode is active
    // When: Accessing semantic colors
    // Then: Returns correct values
    it('should provide access to semantic colors', () => {
      mockColorScheme = 'light';
      const { result } = renderHook(() => useThemedColors());

      expect(result.current.colors.semantic.success).toBe(
        Colors.light.semantic.success
      );
      expect(result.current.colors.semantic.warning).toBe(
        Colors.light.semantic.warning
      );
      expect(result.current.colors.semantic.error).toBe(
        Colors.light.semantic.error
      );
      expect(result.current.colors.semantic.info).toBe(
        Colors.light.semantic.info
      );
    });

    // Given: Light mode is active
    // When: Accessing interactive colors
    // Then: Returns correct values
    it('should provide access to interactive colors', () => {
      mockColorScheme = 'light';
      const { result } = renderHook(() => useThemedColors());

      expect(result.current.colors.interactive.separator).toBe(
        Colors.light.interactive.separator
      );
      expect(result.current.colors.interactive.fill).toBe(
        Colors.light.interactive.fill
      );
      expect(result.current.colors.interactive.fillSecondary).toBe(
        Colors.light.interactive.fillSecondary
      );
    });
  });

  describe('Edge cases', () => {
    // Given: colorScheme is null (not yet determined)
    // When: useThemedColors is called
    // Then: Falls back to light mode
    it('should fallback to light mode when colorScheme is null', () => {
      mockColorScheme = null;
      const { result } = renderHook(() => useThemedColors());

      expect(result.current.colorScheme).toBe('light');
      expect(result.current.colors).toBe(Colors.light);
    });
  });

  describe('Dark mode nested colors', () => {
    // Given: Dark mode is active
    // When: Accessing all nested color categories
    // Then: Returns correct dark mode values
    it('should return dark mode nested colors correctly', () => {
      mockColorScheme = 'dark';
      const { result } = renderHook(() => useThemedColors());

      // Background
      expect(result.current.colors.background.base).toBe(
        Colors.dark.background.base
      );

      // Text
      expect(result.current.colors.text.primary).toBe(Colors.dark.text.primary);

      // Semantic
      expect(result.current.colors.semantic.error).toBe(
        Colors.dark.semantic.error
      );

      // Interactive
      expect(result.current.colors.interactive.separator).toBe(
        Colors.dark.interactive.separator
      );
    });
  });
});
