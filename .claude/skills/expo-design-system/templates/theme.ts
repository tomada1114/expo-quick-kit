/**
 * Expo Design System - iOS System Colors Theme
 * Apple Human Interface Guidelines準拠のミニマル配色システム
 *
 * Usage:
 *   import { Colors } from '@/constants/theme';
 *   const colorScheme = useColorScheme();
 *   const colors = Colors[colorScheme ?? 'light'];
 *
 * CUSTOMIZE:
 *   1. PRIMARY_COLOR を Blue/Green/Orange から選択
 *   2. Semantic colors が必要に応じて追加・カスタマイズ
 */

import { Platform } from 'react-native';

// ============================================================
// Primary Color Selection（アプリのメインアクション色を1色選択）
// ============================================================

const AppPrimaryColor = {
  blue: '#007AFF', // Decision Journal - 理性的、信頼感
  green: '#34C759', // Energy Tracker - 健康、エネルギー
  orange: '#FF9500', // 12 Week Year - 緊急性、実行
} as const;

// CUSTOMIZE: Blue/Green/Orange のいずれかを選択
export const PRIMARY_COLOR = AppPrimaryColor.blue;

// ============================================================
// Type Definitions
// ============================================================

interface ColorPalette {
  // Primary（アプリのメインアクション色）
  primary: string;

  // Background（3段階の背景階層）
  background: {
    base: string; // 画面全体の基本背景
    secondary: string; // カード、セクション背景
    tertiary: string; // モーダル、オーバーレイ背景
  };

  // Text（テキスト色 - 4段階）
  text: {
    primary: string; // メインテキスト、見出し
    secondary: string; // サブタイトル、説明文
    tertiary: string; // プレースホルダー、非活性テキスト
    inverse: string; // Dark背景上のテキスト
  };

  // Semantic（機能的な意味を持つ色）
  semantic: {
    success: string; // 成功、完了（iOS Green）
    warning: string; // 注意、警告（iOS Orange）
    error: string; // エラー、削除（iOS Red）
    info: string; // 情報、ヒント（iOS Blue）
  };

  // Interactive（操作要素）
  interactive: {
    separator: string; // 区切り線、ボーダー
    fill: string; // アイコン、非活性要素
    fillSecondary: string; // 副次的な塗りつぶし
  };

  // Legacy（既存コードとの互換性）
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
}

// ============================================================
// Light Mode Colors（iOS System Colors準拠）
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
    secondary: '#3C3C43', // iOS Gray（60% opacity相当）
    tertiary: '#8E8E93', // iOS Gray（lighter）
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
    fill: '#787880', // iOS Gray（~30% opacity）
    fillSecondary: '#BCBCC0', // iOS Gray（~20% opacity）
  },

  // Legacy（既存コードとの互換性）
  tint: PRIMARY_COLOR,
  icon: '#787880',
  tabIconDefault: '#787880',
  tabIconSelected: PRIMARY_COLOR,
};

// ============================================================
// Dark Mode Colors（+10% Brightness Rule適用）
// ============================================================

const darkColors: ColorPalette = {
  // Primary Color - +10% brightness
  primary: (() => {
    switch (PRIMARY_COLOR) {
      case AppPrimaryColor.blue:
        return '#0A84FF'; // #007AFF + 10%
      case AppPrimaryColor.green:
        return '#30D158'; // #34C759 + 10%
      case AppPrimaryColor.orange:
        return '#FF9F0A'; // #FF9500 + 10%
      default:
        return '#0A84FF';
    }
  })(),

  // Background
  background: {
    base: '#000000', // Pure black
    secondary: '#1C1C1E', // iOS Dark Gray
    tertiary: '#2C2C2E', // iOS Dark Gray（Elevated）
  },

  // Text
  text: {
    primary: '#FFFFFF', // White
    secondary: '#EBEBF5', // iOS Light Gray（60% opacity white相当）
    tertiary: '#8E8E93', // iOS Gray（same as light mode）
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
    fillSecondary: '#48484A', // iOS Dark Gray（lighter）
  },

  // Legacy（既存コードとの互換性）
  tint: (() => {
    switch (PRIMARY_COLOR) {
      case AppPrimaryColor.blue:
        return '#0A84FF';
      case AppPrimaryColor.green:
        return '#30D158';
      case AppPrimaryColor.orange:
        return '#FF9F0A';
      default:
        return '#0A84FF';
    }
  })(),
  icon: '#9BA1A6',
  tabIconDefault: '#9BA1A6',
  tabIconSelected: (() => {
    switch (PRIMARY_COLOR) {
      case AppPrimaryColor.blue:
        return '#0A84FF';
      case AppPrimaryColor.green:
        return '#30D158';
      case AppPrimaryColor.orange:
        return '#FF9F0A';
      default:
        return '#0A84FF';
    }
  })(),
};

// ============================================================
// Export Colors Object
// ============================================================

export const Colors = {
  light: lightColors,
  dark: darkColors,
} as const;

// ============================================================
// Typography（フォントファミリー定義）
// ============================================================

export const Fonts = Platform.select({
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
}) as const;

// ============================================================
// Helper: Theme Type
// ============================================================

export type Theme = typeof Colors;
export type ColorScheme = keyof Theme;
