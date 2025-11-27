import { useEffect, useState } from 'react';
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
import { initializeDatabase } from '@/database/client';
import { useStore } from '@/store';
import { queryClient } from '@/lib/query-client';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

/**
 * Initialization timeout in milliseconds
 */
const INIT_TIMEOUT_MS = 5000;

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
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);

  const initializeApp = async () => {
    setInitError(null);

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Initialization timeout')),
          INIT_TIMEOUT_MS
        )
      );

      // Database initialization with timeout
      const dbInitPromise = Promise.race([
        initializeDatabase(),
        timeoutPromise,
      ]);

      // Store rehydration
      const storeHydrationPromise = useStore.persist.rehydrate();

      // Parallel initialization
      await Promise.all([dbInitPromise, storeHydrationPromise]);

      setAppReady(true);
    } catch (error) {
      console.error('App initialization failed:', error);
      setInitError(error as Error);
      setAppReady(true);
    } finally {
      await SplashScreen.hideAsync();
    }
  };

  useEffect(() => {
    initializeApp();
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
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: 'modal', title: 'Modal' }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
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
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
