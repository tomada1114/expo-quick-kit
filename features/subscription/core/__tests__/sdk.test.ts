/**
 * SDK Configuration Tests
 *
 * Tests for RevenueCat SDK initialization and API key validation.
 * Following TDD methodology - these tests were written before implementation.
 */

import { Platform } from 'react-native';

// Mock react-native-purchases before importing the module under test
jest.mock('react-native-purchases', () => {
  return {
    __esModule: true,
    default: {
      configure: jest.fn().mockResolvedValue(undefined),
      setLogLevel: jest.fn(),
      isConfigured: jest.fn().mockReturnValue(false),
    },
    LOG_LEVEL: {
      DEBUG: 'DEBUG',
      INFO: 'INFO',
      WARN: 'WARN',
      ERROR: 'ERROR',
    },
  };
});

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

// Now import the module under test and the mocked module
import {
  configurePurchases,
  isConfigured,
  getApiKey,
  resetConfiguration,
} from '../sdk';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

describe('SDK Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    resetConfiguration();
    // Reset environment variables - create clean env without RevenueCat keys
    // to ensure test isolation from real environment variables
    const cleanEnv = { ...originalEnv };
    delete cleanEnv.EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE;
    delete cleanEnv.EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE;
    process.env = cleanEnv;
    // Reset Platform.OS
    (Platform as { OS: string }).OS = 'ios';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getApiKey', () => {
    it('should return Apple API key on iOS platform', () => {
      process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE = 'test_apple_key';
      (Platform as { OS: string }).OS = 'ios';

      const key = getApiKey();

      expect(key).toBe('test_apple_key');
    });

    it('should return Google API key on Android platform', () => {
      process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE = 'test_google_key';
      (Platform as { OS: string }).OS = 'android';

      const key = getApiKey();

      expect(key).toBe('test_google_key');
    });

    it('should return null when API key is not set', () => {
      delete process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE;
      delete process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE;
      (Platform as { OS: string }).OS = 'ios';

      const key = getApiKey();

      expect(key).toBeNull();
    });

    it('should return null on unsupported platforms', () => {
      (Platform as { OS: string }).OS = 'web';

      const key = getApiKey();

      expect(key).toBeNull();
    });
  });

  describe('configurePurchases', () => {
    it('should configure RevenueCat SDK with iOS API key', async () => {
      process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE = 'test_apple_key';
      (Platform as { OS: string }).OS = 'ios';

      await configurePurchases();

      expect(Purchases.configure).toHaveBeenCalledWith({
        apiKey: 'test_apple_key',
      });
    });

    it('should configure RevenueCat SDK with Android API key', async () => {
      process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE = 'test_google_key';
      (Platform as { OS: string }).OS = 'android';

      await configurePurchases();

      expect(Purchases.configure).toHaveBeenCalledWith({
        apiKey: 'test_google_key',
      });
    });

    it('should enable DEBUG log level in development mode', async () => {
      process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE = 'test_apple_key';
      (Platform as { OS: string }).OS = 'ios';
      const originalDev = __DEV__;
      // @ts-expect-error - Modifying __DEV__ for testing
      global.__DEV__ = true;

      await configurePurchases();

      expect(Purchases.setLogLevel).toHaveBeenCalledWith(LOG_LEVEL.DEBUG);

      // Restore
      // @ts-expect-error - Modifying __DEV__ for testing
      global.__DEV__ = originalDev;
    });

    it('should throw error when API key is missing on iOS', async () => {
      delete process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE;
      delete process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE;
      (Platform as { OS: string }).OS = 'ios';

      await expect(configurePurchases()).rejects.toThrow(
        'RevenueCat API key is missing for iOS. Please set EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE in your environment variables.'
      );
    });

    it('should throw error when Android API key is missing', async () => {
      delete process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE;
      (Platform as { OS: string }).OS = 'android';

      await expect(configurePurchases()).rejects.toThrow(
        'RevenueCat API key is missing for Android. Please set EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE in your environment variables.'
      );
    });

    it('should not configure on unsupported platforms (web)', async () => {
      (Platform as { OS: string }).OS = 'web';

      await configurePurchases();

      expect(Purchases.configure).not.toHaveBeenCalled();
    });

    it('should only configure once (idempotent)', async () => {
      process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE = 'test_apple_key';
      (Platform as { OS: string }).OS = 'ios';

      await configurePurchases();
      await configurePurchases();

      expect(Purchases.configure).toHaveBeenCalledTimes(1);
    });
  });

  describe('isConfigured', () => {
    it('should return false before configuration', () => {
      expect(isConfigured()).toBe(false);
    });

    it('should return true after successful configuration', async () => {
      process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE = 'test_apple_key';
      (Platform as { OS: string }).OS = 'ios';

      await configurePurchases();

      expect(isConfigured()).toBe(true);
    });

    it('should return false after configuration failure', async () => {
      delete process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE;
      (Platform as { OS: string }).OS = 'ios';

      try {
        await configurePurchases();
      } catch {
        // Expected to fail
      }

      expect(isConfigured()).toBe(false);
    });
  });
});
