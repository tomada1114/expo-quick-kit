/**
 * Expo Design System - Card Component
 * カード表示用コンポーネント
 *
 * Usage:
 *   <Card elevated>
 *     <Text>Card Content</Text>
 *   </Card>
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, useColorScheme } from 'react-native';
import { Colors } from '../theme';
import { Spacing, BorderRadius, Shadows } from '../spacing';

// ============================================================
// Types
// ============================================================

interface CardProps {
  /** カード内のコンテンツ */
  children: ReactNode;

  /** カードのバリエーション */
  variant?: 'flat' | 'elevated';

  /** パディング */
  padding?: number;

  /** 角丸のサイズ */
  borderRadius?: number;

  /** カスタムスタイル */
  style?: ViewStyle;

  /** 背景色のオーバーライド */
  backgroundColor?: string;
}

// ============================================================
// Card Component
// ============================================================

export function Card({
  children,
  variant = 'flat',
  padding = Spacing.md,
  borderRadius: borderRadiusSize = BorderRadius.md,
  style,
  backgroundColor,
}: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const cardBackgroundColor = backgroundColor ?? colors.background.secondary;

  const shadowStyle = variant === 'elevated' ? Shadows.sm : Shadows.none;

  return (
    <View
      style={[
        styles.container,
        {
          padding,
          borderRadius: borderRadiusSize,
          backgroundColor: cardBackgroundColor,
        },
        shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    // Base styles handled by props
  },
});

// ============================================================
// Export
// ============================================================

export default Card;
