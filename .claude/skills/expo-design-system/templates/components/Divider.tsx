/**
 * Expo Design System - Divider Component
 * 要素を分ける区切り線コンポーネント
 *
 * Usage:
 *   <Divider />
 *   <Divider direction="horizontal" />
 *   <Divider color={customColor} />
 */

import React from 'react';
import { View, ViewStyle, useColorScheme } from 'react-native';
import { Colors } from '../theme';

// ============================================================
// Types
// ============================================================

interface DividerProps {
  /** 区切り線の方向 */
  direction?: 'vertical' | 'horizontal';

  /** 区切り線の色 */
  color?: string;

  /** 区切り線の太さ */
  thickness?: number;

  /** マージン */
  margin?: number;

  /** カスタムスタイル */
  style?: ViewStyle;
}

// ============================================================
// Divider Component
// ============================================================

export function Divider({
  direction = 'horizontal',
  color: colorProp,
  thickness = 1,
  margin = 0,
  style,
}: DividerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const color = colorProp ?? colors.interactive.separator;

  const dividerStyle: ViewStyle = direction === 'horizontal'
    ? {
        height: thickness,
        width: '100%',
        backgroundColor: color,
        marginVertical: margin,
      }
    : {
        width: thickness,
        height: '100%',
        backgroundColor: color,
        marginHorizontal: margin,
      };

  return <View style={[dividerStyle, style]} />;
}

// ============================================================
// Export
// ============================================================

export default Divider;
