/**
 * Expo Design System - useSpacing Hook
 * スペーシング定数にアクセスするカスタムフック
 *
 * Usage:
 *   const spacing = useSpacing();
 *   <View style={{ padding: spacing.md }} />
 */

import { Spacing, BorderRadius, ZIndex, Shadows } from '../spacing';

/**
 * スペーシング、ボーダーラジアス、Z-Index、影を一括取得するフック
 *
 * @example
 *   const { spacing, radius, zIndex, shadows } = useSpacing();
 *   <View style={{
 *     padding: spacing.md,
 *     borderRadius: radius.md,
 *     zIndex: zIndex.floating,
 *     ...shadows.md,
 *   }} />
 */
export function useSpacing() {
  return {
    spacing: Spacing,
    radius: BorderRadius,
    zIndex: ZIndex,
    shadows: Shadows,
  };
}

/**
 * スペーシング値のみ取得するシンプルなフック
 *
 * @example
 *   const s = useSpacingValue();
 *   <View style={{ marginBottom: s.lg }} />
 */
export function useSpacingValue() {
  return Spacing;
}

/**
 * ボーダーラジアスのみ取得するフック
 *
 * @example
 *   const radius = useBorderRadius();
 *   <View style={{ borderRadius: radius.md }} />
 */
export function useBorderRadius() {
  return BorderRadius;
}

/**
 * Z-Index のみ取得するフック
 *
 * @example
 *   const zIndex = useZIndex();
 *   <Modal style={{ zIndex: zIndex.modal }} />
 */
export function useZIndex() {
  return ZIndex;
}

/**
 * 影スタイルのみ取得するフック
 *
 * @example
 *   const shadows = useShadows();
 *   <View style={shadows.md} />
 */
export function useShadows() {
  return Shadows;
}

// ============================================================
// Export
// ============================================================

export default useSpacing;
