/**
 * Button Component
 * iOS System Colors準拠のボタンコンポーネント
 *
 * Usage:
 *   <Button title="Save" onPress={handleSave} />
 *   <Button title="Cancel" variant="secondary" onPress={handleCancel} />
 *   <Button title="Delete" variant="destructive" onPress={handleDelete} />
 */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';

import {
  BorderRadius,
  Spacing,
  TouchTarget,
  Typography,
} from '@/constants/theme';
import { useThemedColors } from '@/hooks/use-theme-color';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  /** Button text content */
  title?: string;
  /** Button variant style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Show children alongside loading indicator (default: false) */
  showChildrenWhileLoading?: boolean;
  /** Custom children (overrides title) */
  children?: React.ReactNode;
  /** Custom button style */
  style?: StyleProp<ViewStyle>;
  /** Custom text style */
  textStyle?: StyleProp<TextStyle>;
}

const SIZE_CONFIG = {
  sm: {
    height: 36,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    fontSize: Typography.subheadline.fontSize,
  },
  md: {
    height: TouchTarget.min, // 44pt - iOS minimum touch target
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.body.fontSize,
  },
  lg: {
    height: 48,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.body.fontSize,
  },
} as const;

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  showChildrenWhileLoading = false,
  children,
  style,
  textStyle,
  onPress,
  testID,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  const { colors } = useThemedColors();

  const getBackgroundColor = (): string => {
    if (disabled) {
      return colors.interactive.fillSecondary;
    }

    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.background.secondary;
      case 'ghost':
        return 'transparent';
      case 'destructive':
        return colors.semantic.error;
      default:
        return colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (disabled) {
      return colors.text.tertiary;
    }

    switch (variant) {
      case 'primary':
        return colors.text.inverse;
      case 'secondary':
        return colors.text.primary;
      case 'ghost':
        return colors.primary;
      case 'destructive':
        return colors.text.inverse;
      default:
        return colors.text.inverse;
    }
  };

  const sizeConfig = SIZE_CONFIG[size];
  const backgroundColor = getBackgroundColor();
  const textColor = getTextColor();

  const isDisabled = disabled || loading;

  const handlePress = (
    e: Parameters<NonNullable<PressableProps['onPress']>>[0]
  ) => {
    if (!isDisabled && onPress) {
      onPress(e);
    }
  };

  return (
    <Pressable
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          minHeight: sizeConfig.height,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: sizeConfig.paddingVertical,
          opacity: pressed && !isDisabled ? 0.8 : 1,
        },
        variant === 'ghost' && {
          borderWidth: 0,
        },
        variant === 'secondary' && {
          borderWidth: 1,
          borderColor: colors.interactive.separator,
        },
        style,
      ]}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          testID={testID ? `${testID}-loading` : 'button-loading'}
          size="small"
          color={textColor}
          style={showChildrenWhileLoading ? styles.loadingIndicator : undefined}
        />
      )}
      {(!loading || showChildrenWhileLoading) &&
        (children ? (
          typeof children === 'string' ? (
            <Text
              style={[
                styles.text,
                {
                  color: textColor,
                  fontSize: sizeConfig.fontSize,
                },
                textStyle,
              ]}
            >
              {children}
            </Text>
          ) : (
            children
          )
        ) : (
          <Text
            style={[
              styles.text,
              {
                color: textColor,
                fontSize: sizeConfig.fontSize,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingIndicator: {
    marginRight: Spacing.sm,
  },
});
