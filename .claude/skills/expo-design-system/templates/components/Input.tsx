/**
 * Expo Design System - Input Component
 * テキスト入力フィールドコンポーネント
 *
 * Usage:
 *   <Input
 *     placeholder="Enter text"
 *     value={value}
 *     onChangeText={setValue}
 *   />
 */

import React from 'react';
import {
  TextInput,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  useColorScheme,
  View,
} from 'react-native';
import { Colors } from '../theme';
import { Typography } from '../typography';
import { Spacing, BorderRadius } from '../spacing';

// ============================================================
// Types
// ============================================================

interface InputProps extends TextInputProps {
  /** 入力フィールドのバリエーション */
  variant?: 'default' | 'filled';

  /** エラー状態 */
  error?: boolean;

  /** カスタム外側スタイル */
  containerStyle?: ViewStyle;
}

// ============================================================
// Input Component
// ============================================================

export function Input({
  variant = 'default',
  error = false,
  containerStyle,
  placeholder,
  placeholderTextColor: placeholderColorProp,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const borderColor = error ? colors.semantic.error : colors.interactive.separator;
  const placeholderTextColor = placeholderColorProp ?? colors.text.tertiary;
  const textColor = colors.text.primary;

  const getVariantStyle = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: colors.background.secondary,
          borderWidth: 0,
        };
      case 'default':
      default:
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor,
        };
    }
  };

  return (
    <View style={containerStyle}>
      <TextInput
        style={[
          styles.input,
          {
            ...getVariantStyle(),
            color: textColor,
            borderRadius: BorderRadius.md,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            minHeight: 44,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        selectionColor={colors.primary}
        {...props}
      />
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  input: {
    ...Typography.body,
    fontWeight: '400',
  },
});

// ============================================================
// Export
// ============================================================

export default Input;
