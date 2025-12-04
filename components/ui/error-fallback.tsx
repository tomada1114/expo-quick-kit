/**
 * Error Fallback Component
 * Global error boundary fallback for expo-router
 *
 * Usage:
 *   // In app/_layout.tsx
 *   export { ErrorBoundary } from '@/components/ui/error-fallback';
 */
import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeModules,
  Platform,
} from 'react-native';
import * as Updates from 'expo-updates';

import { useThemedColors } from '@/hooks/use-theme-color';
import {
  BorderRadius,
  Spacing,
  TouchTarget,
  Typography,
} from '@/constants/theme';
import { Button } from './button';

export interface ErrorBoundaryProps {
  error: Error;
  retry: () => void;
}

/** 10% opacity in hex (0x1A ≈ 10% of 255) */
const OVERLAY_OPACITY_10 = '1A';

/**
 * Restarts the application.
 * Uses expo-updates in production, DevSettings in development.
 */
async function restartApp(): Promise<void> {
  if (__DEV__) {
    const DevSettings = NativeModules.DevSettings;
    if (DevSettings?.reload) {
      DevSettings.reload();
    }
  } else {
    await Updates.reloadAsync();
  }
}

/**
 * ErrorBoundary component for expo-router
 * Export this from app/_layout.tsx to handle rendering errors globally
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { colors } = useThemedColors();

  const handleRestart = useCallback(async () => {
    try {
      await restartApp();
    } catch (restartError) {
      console.error('Failed to restart app:', restartError);
    }
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.base }]}
      testID="error-boundary-container"
    >
      <View style={styles.content}>
        {/* Error Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.semantic.error + OVERLAY_OPACITY_10 },
          ]}
        >
          <Text style={[styles.icon, { color: colors.semantic.error }]}>!</Text>
        </View>

        {/* User-friendly Message */}
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Something went wrong
        </Text>
        <Text style={[styles.message, { color: colors.text.secondary }]}>
          We&apos;re sorry, but something unexpected happened.{'\n'}
          Please try again or restart the app.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Retry"
            onPress={retry}
            variant="primary"
            size="lg"
            style={styles.button}
            testID="error-boundary-retry-button"
          />
          <Button
            title="Restart App"
            onPress={handleRestart}
            variant="secondary"
            size="lg"
            style={styles.button}
            testID="error-boundary-restart-button"
          />
        </View>

        {/* Debug Information (Development Only) */}
        {__DEV__ && (
          <View
            style={[
              styles.debugContainer,
              { backgroundColor: colors.background.secondary },
            ]}
            testID="error-boundary-debug-info"
          >
            <Text style={[styles.debugTitle, { color: colors.text.tertiary }]}>
              --- Debug Information ---
            </Text>
            <Text style={[styles.debugLabel, { color: colors.semantic.error }]}>
              Error: {error.name}
            </Text>
            <Text style={[styles.debugMessage, { color: colors.text.primary }]}>
              {error.message}
            </Text>
            {error.stack && (
              <ScrollView
                style={styles.stackScrollView}
                showsVerticalScrollIndicator={true}
              >
                <Text
                  style={[styles.debugStack, { color: colors.text.secondary }]}
                  selectable
                >
                  {error.stack}
                </Text>
              </ScrollView>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  icon: {
    fontSize: 48,
    fontWeight: '700',
  },
  title: {
    ...Typography.title1,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  button: {
    width: '100%',
    minHeight: TouchTarget.min,
  },
  debugContainer: {
    width: '100%',
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  debugTitle: {
    ...Typography.caption1,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  debugLabel: {
    ...Typography.subheadline,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  debugMessage: {
    ...Typography.body,
    marginBottom: Spacing.sm,
  },
  stackScrollView: {
    maxHeight: 200,
  },
  debugStack: {
    ...Typography.footnote,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
});
