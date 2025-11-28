/**
 * Theme Color Hooks
 * Hooks to get theme colors compliant with iOS System Colors
 *
 * Usage:
 *   // Method 1: Get entire Colors object (recommended)
 *   const { colors, colorScheme } = useThemedColors();
 *   <View style={{ backgroundColor: colors.background.base }} />
 *
 *   // Method 2: Get top-level color (legacy compatibility)
 *   const tintColor = useThemeColor({}, 'tint');
 *
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, type ColorScheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ColorPalette = (typeof Colors)['light'];

/**
 * Get top-level color properties (legacy compatibility)
 * For nested colors (background.base, etc.), use useThemedColors instead
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ColorPalette
): string | undefined {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    const colorValue = Colors[theme][colorName];
    // Return undefined for nested objects (for type safety)
    if (typeof colorValue === 'string') {
      return colorValue;
    }
    return undefined;
  }
}

interface ThemedColorsResult {
  colors: ColorPalette;
  colorScheme: ColorScheme;
}

/**
 * Get entire theme color palette (recommended)
 * Provides access to nested colors (background.base, text.primary, etc.)
 *
 * @returns colors - Color palette based on current theme
 * @returns colorScheme - 'light' | 'dark' (never returns null)
 */
export function useThemedColors(): ThemedColorsResult {
  const colorScheme: ColorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return {
    colors,
    colorScheme,
  };
}
