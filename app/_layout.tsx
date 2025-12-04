import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemedColors } from '@/hooks/use-theme-color';
import { initializeDatabase } from '@/database/client';
import { useStore } from '@/store';
import { queryClient } from '@/lib/query-client';
import { setupForegroundHandler } from '@/services/notifications';
import { configurePurchases } from '@/features/subscription/core/sdk';
import { SubscriptionProvider } from '@/features/subscription/providers';
import {
  subscriptionRepository,
  createSubscriptionService,
  syncSubscriptionToStore,
} from '@/features/subscription/core';

export { ErrorBoundary } from '@/components/ui/error-fallback';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

/**
 * Initialization timeout in milliseconds
 */
const INIT_TIMEOUT_MS = 5000;

/**
 * Subscription service instance for the entire app.
 * Created once at module level to maintain consistent state.
 */
const subscriptionService = createSubscriptionService({
  repository: subscriptionRepository,
  onStateChange: syncSubscriptionToStore,
});

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * Error screen shown when app initialization fails
 */
function ErrorScreen({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  const { colors } = useThemedColors();

  return (
    <View
      style={[
        styles.errorContainer,
        { backgroundColor: colors.background.base },
      ]}
    >
      <Text style={[styles.errorTitle, { color: colors.text.primary }]}>
        Something went wrong
      </Text>
      <Text style={[styles.errorMessage, { color: colors.text.secondary }]}>
        {error.message}
      </Text>
      <Pressable
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={onRetry}
      >
        <Text style={[styles.retryButtonText, { color: colors.text.inverse }]}>
          Try Again
        </Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);

  const initializeApp = useCallback(async () => {
    setInitError(null);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      // Create timeout promise with cleanup capability
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('Initialization timeout')),
          INIT_TIMEOUT_MS
        );
      });

      // Database initialization with timeout
      const dbInitPromise = Promise.race([
        initializeDatabase(),
        timeoutPromise,
      ]);

      // Store rehydration
      const storeHydrationPromise = useStore.persist.rehydrate();

      // RevenueCat SDK initialization with timeout (non-blocking: errors are logged but don't block app startup)
      // Falls back to free tier mode if initialization fails or times out
      const revenueCatInitPromise = Promise.race([
        configurePurchases(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('RevenueCat initialization timeout')),
            INIT_TIMEOUT_MS
          )
        ),
      ])
        .then(() => {
          useStore.getState().setRevenueCatAvailable(true);
        })
        .catch((error: unknown) => {
          // Log error but don't block app startup - user will be in free tier mode
          const message =
            error instanceof Error ? error.message : String(error);
          console.warn('RevenueCat SDK initialization failed:', message);
          useStore.getState().setRevenueCatAvailable(false);
        });

      // Parallel initialization of all critical services
      await Promise.all([
        dbInitPromise,
        storeHydrationPromise,
        revenueCatInitPromise,
      ]);

      setAppReady(true);
    } catch (error) {
      console.error('App initialization failed:', error);
      setInitError(error as Error);
      setAppReady(true);
    } finally {
      // Clean up timeout to prevent memory leak
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      await SplashScreen.hideAsync();
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Setup foreground notification handler (safe for hot-reload)
  useEffect(() => {
    setupForegroundHandler();
  }, []);

  // Show nothing while initializing (splash screen is visible)
  if (!appReady) {
    return null;
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ErrorScreen error={initError} onRetry={initializeApp} />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SubscriptionProvider service={subscriptionService}>
        <ThemeProvider
          value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: 'modal', title: 'Modal' }}
            />
            <Stack.Screen
              name="paywall"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SubscriptionProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
