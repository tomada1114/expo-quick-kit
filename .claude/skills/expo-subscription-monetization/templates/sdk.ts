/**
 * RevenueCat Template - SDK Configuration
 *
 * Handles RevenueCat SDK initialization with platform-specific API keys.
 */

import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

type RevenueCatEnv = {
  EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE?: string;
  EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE?: string;
};

const revenueCatEnv = process.env as RevenueCatEnv;

let isConfigured = false;
let configurationPromise: Promise<void> | null = null;

/**
 * Resolves the appropriate API key based on the current platform.
 */
function resolveApiKey(): string | undefined {
  if (Platform.OS === 'ios') {
    return revenueCatEnv.EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE;
  }

  if (Platform.OS === 'android') {
    return revenueCatEnv.EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE;
  }

  // Default to iOS key when platform is unknown (e.g. during Jest tests)
  return revenueCatEnv.EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE;
}

/**
 * Ensures RevenueCat SDK is configured before making API calls.
 * Safe to call multiple times - will only configure once.
 *
 * @throws Error if API key is missing
 */
export async function ensureRevenueCatConfigured(): Promise<void> {
  if (isConfigured) {
    return;
  }

  if (configurationPromise) {
    await configurationPromise;
    return;
  }

  const apiKey = resolveApiKey();

  if (!apiKey) {
    throw new Error(
      'RevenueCat API key is missing. Please set EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE / EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE.'
    );
  }

  configurationPromise = (async () => {
    Purchases.configure({ apiKey });
    isConfigured = true;
  })();

  try {
    await configurationPromise;
  } finally {
    configurationPromise = null;
  }
}

/**
 * Testing utility to reset configuration state.
 * Only use in tests!
 */
export function resetRevenueCatConfiguration(): void {
  isConfigured = false;
  configurationPromise = null;
}
