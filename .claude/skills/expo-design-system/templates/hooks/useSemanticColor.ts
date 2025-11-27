/**
 * Expo Design System - useSemanticColor Hook
 * Semantic color（成功/警告/エラー/情報）にアクセスするカスタムフック
 *
 * Usage:
 *   const successColor = useSemanticColor('success');
 *   const errorColor = useSemanticColor('error');
 */

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '../theme';

type SemanticColorType = 'success' | 'warning' | 'error' | 'info';

/**
 * Semantic color を取得するフック
 * @param colorType - semantic color の種類
 * @param opacity - 不透明度（0-1）
 * @returns 色コード（RGB or RGBA）
 *
 * @example
 *   const successColor = useSemanticColor('success');
 *   const fadedError = useSemanticColor('error', 0.5);
 */
export function useSemanticColor(
  colorType: SemanticColorType,
  opacity?: number
): string {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const color = colors.semantic[colorType];

  // Opacity を適用する場合はRGBAに変換
  if (opacity !== undefined && opacity !== 1) {
    // HEXをRGBに変換してOpacityを適用
    const rgb = hexToRgb(color);
    if (rgb) {
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    }
  }

  return color;
}

/**
 * HEX色をRGBに変換
 * @param hex - HEX形式の色（#RRGGBB）
 * @returns RGB値またはnull
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// ============================================================
// Export
// ============================================================

export default useSemanticColor;
