/**
 * Theme Color Hooks
 * iOS System Colors準拠のテーマカラーを取得するフック
 *
 * Usage:
 *   // 方法1: Colors全体を取得（推奨）
 *   const { colors, colorScheme } = useThemedColors();
 *   <View style={{ backgroundColor: colors.background.base }} />
 *
 *   // 方法2: トップレベルの色を取得（legacy互換）
 *   const tintColor = useThemeColor({}, 'tint');
 *
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ColorPalette = (typeof Colors)['light'];

/**
 * トップレベルのカラープロパティを取得するフック（legacy互換）
 * ネストされたカラー（background.base等）にはuseThemedColorsを使用
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ColorPalette
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    const colorValue = Colors[theme][colorName];
    // ネストされたオブジェクトの場合はundefinedを返す（型安全性のため）
    if (typeof colorValue === 'string') {
      return colorValue;
    }
    return undefined;
  }
}

/**
 * テーマカラーパレット全体を取得するフック（推奨）
 * ネストされたカラー（background.base, text.primary等）にアクセス可能
 */
export function useThemedColors() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return {
    colors,
    colorScheme,
  };
}
