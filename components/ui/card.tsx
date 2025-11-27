/**
 * Card Component
 * iOS System Colors準拠のカードコンテナコンポーネント
 *
 * Usage:
 *   <Card>
 *     <Text>Card content</Text>
 *   </Card>
 *   <Card variant="elevated">
 *     <Text>Elevated card with shadow</Text>
 *   </Card>
 */
import React from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useThemedColors } from '@/hooks/use-theme-color';

export type CardVariant = 'flat' | 'elevated' | 'outlined';

export interface CardProps extends ViewProps {
  /** Card variant style */
  variant?: CardVariant;
  /** Custom padding (default: 16) */
  padding?: number;
  /** Custom border radius (default: 12) */
  borderRadius?: number;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  /** Children content */
  children: React.ReactNode;
}

export function Card({
  variant = 'flat',
  padding = Spacing.md,
  borderRadius = BorderRadius.lg,
  style,
  children,
  testID,
  accessibilityLabel,
  ...props
}: CardProps) {
  const { colors } = useThemedColors();

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'flat':
        return colors.background.secondary;
      case 'elevated':
        return colors.background.tertiary;
      case 'outlined':
        return colors.background.base;
      default:
        return colors.background.secondary;
    }
  };

  const getShadowStyle = (): ViewStyle => {
    if (variant === 'elevated') {
      return Shadows.md;
    }
    return {};
  };

  const getBorderStyle = (): ViewStyle => {
    if (variant === 'outlined') {
      return {
        borderWidth: 1,
        borderColor: colors.interactive.separator,
      };
    }
    return {};
  };

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          padding,
          borderRadius,
        },
        getShadowStyle(),
        getBorderStyle(),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
