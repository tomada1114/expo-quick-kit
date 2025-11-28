/**
 * Expo Design System - iOS System Colors Theme
 * Minimal color system compliant with Apple Human Interface Guidelines
 *
 * Usage:
 *   import { Colors } from '@/constants/theme';
 *   const colorScheme = useColorScheme();
 *   const colors = Colors[colorScheme ?? 'light'];
 *
 * CUSTOMIZE:
 *   1. Select PRIMARY_COLOR from Blue/Green/Orange
 *   2. Add or customize Semantic colors as needed
 */

import { Platform } from 'react-native';

// ============================================================
// Primary Color Selection (Select one main action color for your app)
// ============================================================

export const AppPrimaryColor = {
  blue: '#007AFF', // Decision Journal - Rational, trustworthy
  green: '#34C759', // Energy Tracker - Health, energy
  orange: '#FF9500', // 12 Week Year - Urgency, action
} as const;

// CUSTOMIZE: Select one from Blue/Green/Orange
export const PRIMARY_COLOR = AppPrimaryColor.blue;

// ============================================================
// Type Definitions
// ============================================================

interface ColorPalette {
  // Primary (Main action color for the app)
  primary: string;

  // Background (3-level background hierarchy)
  background: {
    base: string; // Base background for entire screen
    secondary: string; // Card, section background
    tertiary: string; // Modal, overlay background
  };

  // Text (Text colors - 4 levels)
  text: {
    primary: string; // Main text, headings
    secondary: string; // Subtitles, descriptions
    tertiary: string; // Placeholders, inactive text
    inverse: string; // Text on dark backgrounds
  };

  // Semantic (Colors with functional meaning)
  semantic: {
    success: string; // Success, completion (iOS Green)
    warning: string; // Caution, warning (iOS Orange)
    error: string; // Error, deletion (iOS Red)
    info: string; // Information, hints (iOS Blue)
  };

  // Interactive (Interactive elements)
  interactive: {
    separator: string; // Dividers, borders
    fill: string; // Icons, inactive elements
    fillSecondary: string; // Secondary fills
  };

  // Legacy (Compatibility with existing code)
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
}

// ============================================================
// Light Mode Colors (iOS System Colors compliant)
// ============================================================

const lightColors: ColorPalette = {
  // Primary Color
  primary: PRIMARY_COLOR,

  // Background
  background: {
    base: '#FFFFFF', // Pure white
    secondary: '#F2F2F7', // iOS Light Gray
    tertiary: '#FFFFFF', // White（Elevated surface）
  },

  // Text
  text: {
    primary: '#000000', // Black
    secondary: '#3C3C43', // iOS Gray (60% opacity equivalent)
    tertiary: '#8E8E93', // iOS Gray (lighter)
    inverse: '#FFFFFF', // White on dark background
  },

  // Semantic Colors
  semantic: {
    success: '#34C759', // iOS Green
    warning: '#FF9500', // iOS Orange
    error: '#FF3B30', // iOS Red
    info: '#007AFF', // iOS Blue
  },

  // Interactive
  interactive: {
    separator: '#C6C6C8', // iOS Separator
    fill: '#787880', // iOS Gray (~30% opacity)
    fillSecondary: '#BCBCC0', // iOS Gray (~20% opacity)
  },

  // Legacy (Compatibility with existing code)
  tint: PRIMARY_COLOR,
  icon: '#787880',
  tabIconDefault: '#787880',
  tabIconSelected: PRIMARY_COLOR,
};

// ============================================================
// Dark Mode Colors (+10% Brightness Rule applied)
// ============================================================

const DarkPrimaryColors: Record<string, string> = {
  '#007AFF': '#0A84FF', // Blue +10%
  '#34C759': '#30D158', // Green +10%
  '#FF9500': '#FF9F0A', // Orange +10%
};

const getDarkPrimaryColor = (): string => {
  return DarkPrimaryColors[PRIMARY_COLOR] ?? '#0A84FF';
};

const darkColors: ColorPalette = {
  // Primary Color - +10% brightness
  primary: getDarkPrimaryColor(),

  // Background
  background: {
    base: '#000000', // Pure black
    secondary: '#1C1C1E', // iOS Dark Gray
    tertiary: '#2C2C2E', // iOS Dark Gray（Elevated）
  },

  // Text
  text: {
    primary: '#FFFFFF', // White
    secondary: '#EBEBF5', // iOS Light Gray (60% opacity white equivalent)
    tertiary: '#8E8E93', // iOS Gray (same as light mode)
    inverse: '#000000', // Black on light background
  },

  // Semantic Colors - +10% brightness
  semantic: {
    success: '#30D158', // #34C759 + 10%
    warning: '#FF9F0A', // #FF9500 + 10%
    error: '#FF453A', // #FF3B30 + 10%
    info: '#0A84FF', // #007AFF + 10%
  },

  // Interactive
  interactive: {
    separator: '#38383A', // iOS Dark Separator
    fill: '#787880', // Same as light mode
    fillSecondary: '#48484A', // iOS Dark Gray (lighter)
  },

  // Legacy (Compatibility with existing code)
  tint: getDarkPrimaryColor(),
  icon: '#9BA1A6',
  tabIconDefault: '#9BA1A6',
  tabIconSelected: getDarkPrimaryColor(),
};

// ============================================================
// Export Colors Object
// ============================================================

export const Colors = {
  light: lightColors,
  dark: darkColors,
} as const;

// ============================================================
// Spacing（8pt Grid System）
// ============================================================

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

// ============================================================
// Typography (iOS Dynamic Type compliant)
// ============================================================

export const Typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '400' as const,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '400' as const,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '400' as const,
    lineHeight: 26,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption1: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  footnote: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
  },
} as const;

// ============================================================
// Border Radius
// ============================================================

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// ============================================================
// Touch Target (iOS HIG compliant)
// ============================================================

export const TouchTarget = {
  min: 44, // iOS minimum touch target size
} as const;

// ============================================================
// Shadows (iOS standard shadows)
// ============================================================

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// ============================================================
// Typography (Font family definitions)
// ============================================================

interface FontFamily {
  sans: string;
  serif: string;
  rounded: string;
  mono: string;
}

export const Fonts: FontFamily | undefined = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ============================================================
// Helper: Theme Type
// ============================================================

export type Theme = typeof Colors;
export type ColorScheme = keyof Theme;
