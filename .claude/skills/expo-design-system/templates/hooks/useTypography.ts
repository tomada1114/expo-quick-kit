/**
 * Expo Design System - useTypography Hook
 * タイポグラフィスケールにアクセスするカスタムフック
 *
 * Usage:
 *   const typography = useTypography();
 *   <Text style={typography.body}>Text</Text>
 */

import { Typography, withFontWeight, withLineHeight } from '../typography';

/**
 * タイポグラフィスケール全体にアクセスするフック
 *
 * @example
 *   const typography = useTypography();
 *   <Text style={typography.largeTitle}>Title</Text>
 *   <Text style={typography.body}>Body</Text>
 */
export function useTypography() {
  return Typography;
}

/**
 * 指定されたタイポグラフィスタイルのみ取得するフック
 *
 * @example
 *   const bodyStyle = useTypographyStyle('body');
 *   <Text style={bodyStyle}>Text</Text>
 */
export function useTypographyStyle(style: keyof typeof Typography) {
  return Typography[style];
}

/**
 * ページタイトルスタイルを取得するフック
 * @example
 *   const titleStyle = usePageTitleStyle();
 *   <Text style={titleStyle}>Page Title</Text>
 */
export function usePageTitleStyle() {
  return Typography.largeTitle;
}

/**
 * セクションタイトルスタイルを取得するフック
 * @example
 *   const sectionStyle = useSectionTitleStyle();
 *   <Text style={sectionStyle}>Section</Text>
 */
export function useSectionTitleStyle() {
  return Typography.title1;
}

/**
 * 本文テキストスタイルを取得するフック
 * @example
 *   const bodyStyle = useBodyStyle();
 *   <Text style={bodyStyle}>Body text</Text>
 */
export function useBodyStyle() {
  return Typography.body;
}

/**
 * ボタンテキストスタイルを取得するフック（body + semibold）
 * @example
 *   const buttonStyle = useButtonStyle();
 *   <Text style={buttonStyle}>Button</Text>
 */
export function useButtonStyle() {
  return withFontWeight(Typography.body, '600');
}

/**
 * ラベル・キャプションスタイルを取得するフック
 * @example
 *   const labelStyle = useLabelStyle();
 *   <Text style={labelStyle}>Label</Text>
 */
export function useLabelStyle() {
  return Typography.caption1;
}

/**
 * エラーメッセージスタイルを取得するフック
 * @example
 *   const errorStyle = useErrorStyle();
 *   <Text style={[errorStyle, { color: errorColor }]}>Error message</Text>
 */
export function useErrorStyle() {
  return Typography.caption1;
}

/**
 * ヒント・プレースホルダースタイルを取得するフック
 * @example
 *   const hintStyle = useHintStyle();
 *   <Text style={[hintStyle, { color: hintColor }]}>Hint text</Text>
 */
export function useHintStyle() {
  return Typography.caption1;
}

// ============================================================
// Export
// ============================================================

export default useTypography;
