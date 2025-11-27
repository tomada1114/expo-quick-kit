/**
 * LoadingOverlay Component
 * フルスクリーンローディング表示コンポーネント
 *
 * Usage:
 *   <LoadingOverlay visible />
 *   <LoadingOverlay visible message="Saving..." />
 */
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useThemedColors } from '@/hooks/use-theme-color';

export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Optional loading message */
  message?: string;
  /** Custom style for the overlay */
  style?: StyleProp<ViewStyle>;
  /** Test ID for testing */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export function LoadingOverlay({
  visible,
  message,
  style,
  testID,
  accessibilityLabel = 'Loading',
}: LoadingOverlayProps) {
  const { colors } = useThemedColors();

  if (!visible) {
    return null;
  }

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="progressbar"
        style={[styles.overlay, style]}
      >
        <View
          style={[
            styles.content,
            { backgroundColor: colors.background.tertiary },
          ]}
        >
          <ActivityIndicator
            testID={testID ? `${testID}-indicator` : 'loading-indicator'}
            size="large"
            color={colors.semantic.info}
          />
          {message && (
            <Text
              testID={testID ? `${testID}-message` : 'loading-message'}
              style={[
                styles.message,
                {
                  color: colors.text.primary,
                },
              ]}
            >
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  message: {
    marginTop: Spacing.md,
    ...Typography.body,
    textAlign: 'center',
  },
});
