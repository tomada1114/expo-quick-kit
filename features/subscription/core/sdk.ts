/**
 * RevenueCat SDK Configuration
 *
 * Handles RevenueCat SDK initialization with platform-specific API keys.
 * This module is responsible for:
 * - Reading API keys from environment variables
 * - Configuring the SDK with proper settings
 * - Enabling debug logging in development mode
 *
 * @module features/subscription/core/sdk
 */

import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

/**
 * Environment variable names for API keys
 */
const ENV_KEY_APPLE = 'EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE';
const ENV_KEY_GOOGLE = 'EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE';

/**
 * Supported platforms for RevenueCat
 */
type SupportedPlatform = 'ios' | 'android';

/**
 * Internal state to track if SDK has been configured
 */
let _isConfigured = false;

/**
 * Get the API key for the current platform from environment variables.
 *
 * @returns API key string or null if not set or platform unsupported
 *
 * @example
 * ```ts
 * const key = getApiKey();
 * if (key) {
 *   // Configure SDK
 * }
 * ```
 */
export function getApiKey(): string | null {
  const platform = Platform.OS;

  switch (platform) {
    case 'ios':
      return process.env[ENV_KEY_APPLE] ?? null;
    case 'android':
      return process.env[ENV_KEY_GOOGLE] ?? null;
    default:
      // Web and other platforms are not supported
      return null;
  }
}

/**
 * Get the platform name for error messages.
 *
 * @param platform - The platform OS string
 * @returns Human-readable platform name
 */
function getPlatformName(platform: string): string {
  switch (platform) {
    case 'ios':
      return 'iOS';
    case 'android':
      return 'Android';
    default:
      return platform;
  }
}

/**
 * Get the environment variable name for a platform.
 *
 * @param platform - The platform OS string
 * @returns Environment variable name
 */
function getEnvVarName(platform: string): string {
  switch (platform) {
    case 'ios':
      return ENV_KEY_APPLE;
    case 'android':
      return ENV_KEY_GOOGLE;
    default:
      return 'EXPO_PUBLIC_REVENUE_CAT_API_KEY';
  }
}

/**
 * Check if the current platform is supported by RevenueCat.
 *
 * @returns True if platform is iOS or Android
 */
function isSupportedPlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Configure the RevenueCat SDK.
 *
 * This function:
 * - Validates that the API key is present
 * - Configures the SDK with the platform-specific API key
 * - Enables DEBUG logging in development mode
 * - Is idempotent (safe to call multiple times)
 *
 * @throws Error if API key is missing for the current platform
 *
 * @example
 * ```ts
 * try {
 *   await configurePurchases();
 *   console.log('RevenueCat configured successfully');
 * } catch (error) {
 *   console.error('Failed to configure RevenueCat:', error);
 * }
 * ```
 */
export async function configurePurchases(): Promise<void> {
  // Skip configuration on unsupported platforms (web)
  if (!isSupportedPlatform()) {
    return;
  }

  // Idempotent: don't configure twice
  if (_isConfigured) {
    return;
  }

  const apiKey = getApiKey();
  const platform = Platform.OS;

  // Validate API key
  if (!apiKey) {
    const platformName = getPlatformName(platform);
    const envVarName = getEnvVarName(platform);
    throw new Error(
      `RevenueCat API key is missing for ${platformName}. Please set ${envVarName} in your environment variables.`
    );
  }

  // Enable error-only logging in development
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
  }

  // Configure the SDK
  await Purchases.configure({ apiKey });

  _isConfigured = true;
}

/**
 * Check if the RevenueCat SDK has been configured.
 *
 * @returns True if configurePurchases() has been called successfully
 *
 * @example
 * ```ts
 * if (!isConfigured()) {
 *   await configurePurchases();
 * }
 * ```
 */
export function isConfigured(): boolean {
  return _isConfigured;
}

/**
 * Reset the configuration state.
 * This is primarily used for testing purposes.
 *
 * @internal
 */
export function resetConfiguration(): void {
  _isConfigured = false;
}
