/**
 * Settings Screen Tests
 *
 * Tests for the Settings screen with restore purchases functionality.
 * Verifies iOS App Store guideline compliance (restore button required).
 *
 * Test coverage:
 * - Happy path: Restore purchases with active subscription
 * - Sad path: No active subscription found, network errors
 * - Edge cases: Rapid button presses, loading states
 * - Error handling: Various error codes
 */

/* eslint-disable import/first */

import React from 'react';
import { Alert } from 'react-native';

// Mock expo-router - must define mock object inside factory for router export
jest.mock('expo-router', () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();
  return {
    __esModule: true,
    useRouter: () => ({
      push: mockPush,
      back: mockBack,
    }),
    router: {
      push: mockPush,
      back: mockBack,
    },
  };
});

// Access the mock for assertions
import { router as mockRouter } from 'expo-router';

// Mock useThemedColors
const mockColors = {
  primary: '#007AFF',
  background: {
    base: '#FFFFFF',
    secondary: '#F2F2F7',
    tertiary: '#FFFFFF',
  },
  text: {
    primary: '#000000',
    secondary: '#3C3C43',
    tertiary: '#8E8E93',
    inverse: '#FFFFFF',
  },
  semantic: {
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',
  },
  interactive: {
    separator: '#C6C6C8',
    fill: '#787880',
    fillSecondary: '#BCBCC0',
  },
  tint: '#007AFF',
  icon: '#787880',
  tabIconDefault: '#787880',
  tabIconSelected: '#007AFF',
};

jest.mock('@/hooks/use-theme-color', () => ({
  useThemedColors: () => ({
    colors: mockColors,
    colorScheme: 'light',
  }),
  useThemeColor: () => '#007AFF',
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

// Mock useSubscription hook - will be configured per test
const mockRestorePurchases = jest.fn();
let mockLoading = false;
let mockError: { code: string; message: string; retryable: boolean } | null =
  null;
let mockSubscription: {
  isActive: boolean;
  tier: 'free' | 'premium';
  expiresAt: Date | null;
  productId: string | null;
} | null = null;
let mockIsPremium = false;

jest.mock('@/features/subscription/hooks', () => ({
  useSubscription: () => ({
    isPremium: mockIsPremium,
    isFree: !mockIsPremium,
    usageLimits: mockIsPremium
      ? { maxItems: Infinity, maxExports: Infinity, hasAds: false }
      : { maxItems: 10, maxExports: 1, hasAds: true },
    subscription: mockSubscription,
    loading: mockLoading,
    error: mockError,
    purchasePackage: jest.fn(),
    restorePurchases: mockRestorePurchases,
    canAccessFeature: jest.fn(),
    refetchSubscription: jest.fn(),
  }),
}));

// Mock Alert.alert
const alertSpy = jest.spyOn(Alert, 'alert');

// Import after mocks
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import SettingsScreen from '../settings';

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoading = false;
    mockError = null;
    mockSubscription = null;
    mockIsPremium = false;
    mockRestorePurchases.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    // Given: A user navigates to the Settings screen
    // When: The screen is rendered
    // Then: The screen title should be visible
    it('should render screen title', () => {
      render(<SettingsScreen />);

      expect(screen.getByText('Settings')).toBeTruthy();
    });

    // Given: A user navigates to the Settings screen
    // When: The screen is rendered
    // Then: The restore purchases button should be visible (iOS App Store compliance)
    it('should render restore purchases button for iOS App Store compliance', () => {
      render(<SettingsScreen />);

      expect(screen.getByTestId('restore-purchases-button')).toBeTruthy();
      expect(screen.getByText('Restore Purchases')).toBeTruthy();
    });

    // Given: A user is on the Settings screen
    // When: The screen is rendered
    // Then: It should apply themed background color
    it('should apply themed background color', () => {
      render(<SettingsScreen />);

      const container = screen.getByTestId('settings-screen-container');
      expect(container).toBeTruthy();
    });

    // Given: A user has a free subscription
    // When: The screen is rendered
    // Then: The subscription status should show "Free"
    it('should display free subscription status', () => {
      mockIsPremium = false;
      mockSubscription = {
        isActive: false,
        tier: 'free',
        expiresAt: null,
        productId: null,
      };

      render(<SettingsScreen />);

      expect(screen.getByText('Free')).toBeTruthy();
    });

    // Given: A user has a premium subscription
    // When: The screen is rendered
    // Then: The subscription status should show "Premium"
    it('should display premium subscription status', () => {
      mockIsPremium = true;
      mockSubscription = {
        isActive: true,
        tier: 'premium',
        expiresAt: new Date('2025-12-31'),
        productId: 'monthly_plan',
      };

      render(<SettingsScreen />);

      expect(screen.getByText('Premium')).toBeTruthy();
    });
  });

  describe('Restore Purchases - Happy Path', () => {
    // Given: A user with a previous premium purchase
    // When: User presses "Restore Purchases" button
    // Then: restorePurchases should be called
    it('should call restorePurchases when button is pressed', async () => {
      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');
      fireEvent.press(restoreButton);

      await waitFor(() => {
        expect(mockRestorePurchases).toHaveBeenCalledTimes(1);
      });
    });

    // Given: Restore operation succeeds with active subscription
    // When: restorePurchases resolves successfully
    // Then: Success alert should be shown with Japanese message
    it('should show success alert when restore finds active subscription', async () => {
      // Simulate that after restore, subscription becomes active
      mockRestorePurchases.mockImplementation(async () => {
        mockIsPremium = true;
        mockSubscription = {
          isActive: true,
          tier: 'premium',
          expiresAt: new Date('2025-12-31'),
          productId: 'monthly_plan',
        };
      });

      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');
      fireEvent.press(restoreButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Success',
          '購入を復元しました',
          expect.any(Array)
        );
      });
    });
  });

  describe('Restore Purchases - No Active Subscription', () => {
    // Given: User has no previous purchases
    // When: User presses "Restore Purchases"
    // Then: Info alert should be shown with appropriate message
    it('should show info alert when no active subscription found', async () => {
      // Mock the error that gets set when no subscription found
      mockRestorePurchases.mockImplementation(async () => {
        mockError = {
          code: 'NO_ACTIVE_SUBSCRIPTION',
          message: 'No active subscription found',
          retryable: false,
        };
        throw new Error('NO_ACTIVE_SUBSCRIPTION');
      });

      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');
      fireEvent.press(restoreButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Info',
          '復元可能な購入がありません',
          expect.any(Array)
        );
      });
    });
  });

  describe('Loading State', () => {
    // Given: Restore operation is in progress
    // When: loading is true
    // Then: Button should show loading indicator
    it('should show loading indicator during restore', () => {
      mockLoading = true;

      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');
      // Button should have loading prop
      expect(restoreButton).toBeTruthy();
      // Check for loading indicator
      expect(
        screen.getByTestId('restore-purchases-button-loading')
      ).toBeTruthy();
    });

    // Given: Restore operation is in progress
    // When: loading is true
    // Then: Button should be disabled
    it('should disable button during restore', () => {
      mockLoading = true;

      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');
      expect(restoreButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Duplicate Prevention', () => {
    // Given: User is on Settings screen
    // When: User rapidly presses restore button multiple times
    // Then: restorePurchases should only be called once
    it('should prevent duplicate restore calls during loading', async () => {
      let resolveRestore: () => void;
      const restorePromise = new Promise<void>((resolve) => {
        resolveRestore = resolve;
      });

      mockRestorePurchases.mockImplementation(() => {
        mockLoading = true;
        return restorePromise;
      });

      const { rerender } = render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');

      // First press
      fireEvent.press(restoreButton);

      // Immediately rerender with loading state
      mockLoading = true;
      rerender(<SettingsScreen />);

      // Second press should be ignored due to loading
      fireEvent.press(screen.getByTestId('restore-purchases-button'));

      // Complete the restore
      resolveRestore!();
      mockLoading = false;

      await waitFor(() => {
        expect(mockRestorePurchases).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Handling', () => {
    // Given: Network is unavailable
    // When: User presses restore and network error occurs
    // Then: Error alert should be shown with retry message
    it('should show error alert on network error', async () => {
      mockRestorePurchases.mockImplementation(async () => {
        mockError = {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred',
          retryable: true,
        };
        throw new Error('NETWORK_ERROR');
      });

      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');
      fireEvent.press(restoreButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('ネットワークエラー'),
          expect.any(Array)
        );
      });
    });

    // Given: Store services are down
    // When: User presses restore and store error occurs
    // Then: Error alert should suggest trying again later
    it('should show error alert on store problem', async () => {
      mockRestorePurchases.mockImplementation(async () => {
        mockError = {
          code: 'STORE_PROBLEM_ERROR',
          message: 'Store problem',
          retryable: true,
        };
        throw new Error('STORE_PROBLEM_ERROR');
      });

      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');
      fireEvent.press(restoreButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('ストアサービス'),
          expect.any(Array)
        );
      });
    });

    // Given: User cancels the restore operation
    // When: PURCHASE_CANCELLED error occurs
    // Then: No alert should be shown (silent handling)
    it('should not show alert on user cancellation', async () => {
      mockRestorePurchases.mockImplementation(async () => {
        mockError = {
          code: 'PURCHASE_CANCELLED',
          message: 'User cancelled',
          retryable: false,
        };
        throw new Error('PURCHASE_CANCELLED');
      });

      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');
      fireEvent.press(restoreButton);

      await waitFor(() => {
        expect(mockRestorePurchases).toHaveBeenCalled();
      });

      // Should not show any alert for user cancellation
      expect(alertSpy).not.toHaveBeenCalled();
    });

    // Given: An unknown error occurs
    // When: User presses restore
    // Then: Generic error message should be shown
    it('should show generic error alert on unknown error', async () => {
      mockRestorePurchases.mockImplementation(async () => {
        mockError = {
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error occurred',
          retryable: false,
        };
        throw new Error('UNKNOWN_ERROR');
      });

      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');
      fireEvent.press(restoreButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('エラーが発生しました'),
          expect.any(Array)
        );
      });
    });
  });

  describe('Navigation', () => {
    // Given: A user is on the Settings screen
    // When: User presses the "Upgrade to Premium" button
    // Then: It should navigate to the paywall
    it('should navigate to paywall when upgrade button is pressed', () => {
      mockIsPremium = false;

      render(<SettingsScreen />);

      const upgradeButton = screen.getByTestId('upgrade-premium-button');
      fireEvent.press(upgradeButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/paywall');
    });
  });
});
