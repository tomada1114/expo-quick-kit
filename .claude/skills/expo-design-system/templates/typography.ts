/**
 * Expo Design System - Typography
 * Apple San Francisco Font準拠のタイポグラフィスケール
 *
 * Usage:
 *   import { Typography } from '@/constants/typography';
 *   <Text style={Typography.largeTitle}>Title</Text>
 *   <Text style={Typography.body}>Body text</Text>
 */

import { Platform } from 'react-native';
import { Fonts } from './theme';

// ============================================================
// Type Definitions
// ============================================================

interface TextStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
  fontFamily?: string;
}

interface TypographyScale {
  largeTitle: TextStyle;  // 34pt - H1
  title1: TextStyle;      // 28pt - H2
  title2: TextStyle;      // 22pt - H3
  title3: TextStyle;      // 20pt - H4
  headline: TextStyle;    // 17pt bold
  body: TextStyle;        // 17pt regular
  callout: TextStyle;     // 16pt
  subheadline: TextStyle; // 15pt
  caption1: TextStyle;    // 13pt
  caption2: TextStyle;    // 12pt
  footnote: TextStyle;    // 11pt
}

// ============================================================
// Font Weights（OSレベルでの指定）
// ============================================================

const fontWeight = {
  thin: '100' as const,
  extralight: '200' as const,
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
} as const;

// ============================================================
// Typography Scale（Apple San Francisco準拠）
// ============================================================

export const Typography: TypographyScale = {
  // Large Title - 34pt (ページタイトル、大見出し)
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '400',
  },

  // Title 1 - 28pt (セクションタイトル)
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '400',
  },

  // Title 2 - 22pt (サブセクションタイトル)
  title2: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '400',
  },

  // Title 3 - 20pt (グループタイトル)
  title3: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '400',
  },

  // Headline - 17pt bold (強調テキスト)
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  },

  // Body - 17pt (本文テキスト)
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
  },

  // Callout - 16pt (補足、注釈)
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
  },

  // Subheadline - 15pt (副見出し)
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },

  // Caption 1 - 13pt (説明テキスト)
  caption1: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '400',
  },

  // Caption 2 - 12pt (細かい補足)
  caption2: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '400',
  },

  // Footnote - 11pt (最小テキスト、アクセシビリティ考慮)
  footnote: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400',
  },
};

// ============================================================
// Font Family Helpers
// ============================================================

/**
 * プラットフォーム別フォントファミリーを取得
 * @param fontType - 'sans' | 'serif' | 'mono' | 'rounded'
 * @returns フォントファミリー文字列
 */
export function getFontFamily(fontType: keyof typeof Fonts.sans = 'sans'): string {
  const platform = Platform.select({
    ios: Fonts.sans,
    android: Fonts.sans,
    web: Fonts.sans,
    default: Fonts.sans,
  });

  return platform?.[fontType] ?? 'system-ui';
}

// ============================================================
// Typography Helpers
// ============================================================

/**
 * タイポグラフィスタイルに fontFamily を追加
 * @param style - Typography scale from Typography object
 * @param fontType - 'sans' | 'serif' | 'mono' | 'rounded'
 * @returns TextStyle with fontFamily
 */
export function withFontFamily(
  style: TextStyle,
  fontType: keyof typeof Fonts.sans = 'sans'
): TextStyle & { fontFamily?: string } {
  return {
    ...style,
    fontFamily: getFontFamily(fontType),
  };
}

/**
 * フォントウェイトを上書きしたスタイルを生成
 * @param style - Base Typography style
 * @param weight - FontWeight
 * @returns TextStyle with custom weight
 */
export function withFontWeight(
  style: TextStyle,
  weight: '400' | '500' | '600' | '700'
): TextStyle {
  return {
    ...style,
    fontWeight: weight,
  };
}

/**
 * 行の高さを上書きしたスタイルを生成
 * @param style - Base Typography style
 * @param lineHeight - Custom line height
 * @returns TextStyle with custom lineHeight
 */
export function withLineHeight(
  style: TextStyle,
  lineHeight: number
): TextStyle {
  return {
    ...style,
    lineHeight,
  };
}

// ============================================================
// Semantic Typography Styles（セマンティック定義）
// ============================================================

/**
 * ページタイトル用（largeTitle相当）
 */
export const PageTitle = Typography.largeTitle;

/**
 * セクションタイトル用（title1相当）
 */
export const SectionTitle = Typography.title1;

/**
 * 本文テキスト用（body相当）
 */
export const BodyText = Typography.body;

/**
 * ボタンテキスト用（body + semibold）
 */
export const ButtonText = withFontWeight(Typography.body, '600');

/**
 * ラベル・キャプション用（caption1相当）
 */
export const Label = Typography.caption1;

/**
 * エラーメッセージ用（caption1相当、red色推奨）
 */
export const ErrorText = Typography.caption1;

/**
 * ヒント・プレースホルダー用（caption1相当、tertiary color推奨）
 */
export const HintText = Typography.caption1;

// ============================================================
// Dynamic Type Support（オプション：将来の実装用）
// ============================================================

/**
 * Dynamic Type対応バージョン（React Native 0.81+で検討）
 * useWindowDimensions + fontSize 計算で実装可能
 *
 * 現在は固定サイズで実装。
 * 今後、maxFontSizeMultiplier プロップで制御可能。
 */
export const DynamicTypeScales = {
  large: {
    fontSize: (baseSize: number) => baseSize * 1.2,
  },
  xLarge: {
    fontSize: (baseSize: number) => baseSize * 1.5,
  },
  xxLarge: {
    fontSize: (baseSize: number) => baseSize * 2.0,
  },
} as const;

// ============================================================
// Export Types
// ============================================================

export type Typography = typeof Typography;
export type TextStyleKey = keyof Typography;
