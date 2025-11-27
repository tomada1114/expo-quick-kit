/**
 * Expo Design System - Button Component
 * Apple HIG準拠のボタンコンポーネント
 *
 * Usage:
 *   <Button title="Save" variant="primary" onPress={onSave} />
 *   <Button title="Cancel" variant="secondary" onPress={onCancel} />
 *   <Button title="Delete" variant="destructive" onPress={onDelete} size="lg" />
 */

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from 'react-native';
import { Colors } from '../theme';
import { Typography } from '../typography';
import { Spacing, BorderRadius } from '../spacing';

// ============================================================
// Types
// ============================================================

interface ButtonProps {
  /** ボタンのテキスト */
  title: string;

  /** ボタンのバリエーション */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';

  /** ボタンのサイズ */
  size?: 'sm' | 'md' | 'lg';

  /** 押下時のコールバック */
  onPress: () => void;

  /** ボタンの無効化 */
  disabled?: boolean;

  /** カスタムスタイル */
  style?: ViewStyle;

  /** テキストスタイル */
  textStyle?: TextStyle;

  /** ローディング中か */
  loading?: boolean;

  /** ローディング中に表示するテキスト */
  loadingText?: string;
}

// ============================================================
// Button Component
// ============================================================

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  style,
  textStyle,
  loading = false,
  loadingText = 'Loading...',
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // サイズ設定
  const sizeStyles = {
    sm: {
      padding: Spacing.sm,
      minHeight: 36,
    },
    md: {
      padding: Spacing.md,
      minHeight: 44,
    },
    lg: {
      padding: Spacing.lg,
      minHeight: 48,
    },
  };

  const currentSizeStyle = sizeStyles[size];

  // バリエーション設定
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: colors.background.secondary,
          borderColor: colors.interactive.separator,
          borderWidth: 1,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'destructive':
        return {
          backgroundColor: colors.semantic.error,
          borderColor: colors.semantic.error,
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        };
    }
  };

  // テキストカラー設定
  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'destructive':
        return colors.text.inverse;
      case 'secondary':
        return colors.text.primary;
      case 'ghost':
        return colors.primary;
      default:
        return colors.text.inverse;
    }
  };

  // 無効化時のスタイル
  const disabledStyle = disabled || loading ? { opacity: 0.5 } : {};

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        currentSizeStyle,
        getVariantStyle(),
        {
          borderRadius: BorderRadius.md,
        },
        pressed && { opacity: 0.7 },
        disabledStyle,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Text
        style={[
          styles.text,
          Typography.body,
          {
            color: getTextColor(),
            fontWeight: '600',
          },
          textStyle,
        ]}
      >
        {loading ? loadingText : title}
      </Text>
    </Pressable>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    textAlign: 'center',
  },
});

// ============================================================
// Export
// ============================================================

export default Button;
