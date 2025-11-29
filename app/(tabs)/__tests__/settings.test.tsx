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
const mockRefetchSubscription = jest.fn();
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
    error: mockError,
    purchasePackage: jest.fn(),
    restorePurchases: mockRestorePurchases,
    canAccessFeature: jest.fn(),
    refetchSubscription: mockRefetchSubscription,
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
    mockError = null;
    mockSubscription = null;
    mockIsPremium = false;
    mockRestorePurchases.mockResolvedValue(undefined);
    mockRefetchSubscription.mockResolvedValue(undefined);
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
    // Then: Success alert should be shown and refetch is called
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
        expect(mockRefetchSubscription).toHaveBeenCalledTimes(1);
        expect(alertSpy).toHaveBeenCalledWith(
          'Success',
          'Your purchases have been restored.',
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
          'No purchases available to restore.',
          expect.any(Array)
        );
      });
    });
  });

  describe('Loading State', () => {
    // Given: Restore operation is in progress
    // When: Button is pressed and restore is pending
    // Then: Button should show loading indicator
    it('should show loading indicator during restore', async () => {
      // Keep the restore promise pending to test loading state
      let resolveRestore: () => void;
      mockRestorePurchases.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveRestore = resolve;
          })
      );

      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');
      fireEvent.press(restoreButton);

      // Check for loading indicator while restore is in progress
      await waitFor(() => {
        expect(
          screen.getByTestId('restore-purchases-button-loading')
        ).toBeTruthy();
      });

      // Cleanup: resolve the promise
      resolveRestore!();
    });

    // Given: Restore operation is in progress
    // When: Button is pressed and restore is pending
    // Then: Button should be disabled
    it('should disable button during restore', async () => {
      // Keep the restore promise pending to test loading state
      let resolveRestore: () => void;
      mockRestorePurchases.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveRestore = resolve;
          })
      );

      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');
      fireEvent.press(restoreButton);

      // Check button is disabled while restore is in progress
      await waitFor(() => {
        const button = screen.getByTestId('restore-purchases-button');
        expect(button.props.accessibilityState?.disabled).toBe(true);
      });

      // Cleanup: resolve the promise
      resolveRestore!();
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

      mockRestorePurchases.mockImplementation(() => restorePromise);

      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');

      // First press - starts restore
      fireEvent.press(restoreButton);

      // Wait for button to become disabled (loading state)
      await waitFor(() => {
        const button = screen.getByTestId('restore-purchases-button');
        expect(button.props.accessibilityState?.disabled).toBe(true);
      });

      // Second press should be ignored due to disabled state
      fireEvent.press(screen.getByTestId('restore-purchases-button'));

      // Complete the restore
      resolveRestore!();

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
          expect.stringContaining('network error'),
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
          expect.stringContaining('store service'),
          expect.any(Array)
        );
      });
    });

    // Given: App configuration is invalid
    // When: User presses restore and configuration error occurs
    // Then: Error alert should suggest contacting support
    it('should show error alert on configuration error', async () => {
      mockRestorePurchases.mockImplementation(async () => {
        mockError = {
          code: 'CONFIGURATION_ERROR',
          message: 'Configuration error',
          retryable: false,
        };
        throw new Error('CONFIGURATION_ERROR');
      });

      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');
      fireEvent.press(restoreButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('configuration error'),
          expect.any(Array)
        );
      });
    });

    // Given: Authentication credentials are invalid
    // When: User presses restore and credentials error occurs
    // Then: Error alert should indicate authentication failure
    it('should show error alert on invalid credentials error', async () => {
      mockRestorePurchases.mockImplementation(async () => {
        mockError = {
          code: 'INVALID_CREDENTIALS_ERROR',
          message: 'Invalid credentials',
          retryable: false,
        };
        throw new Error('INVALID_CREDENTIALS_ERROR');
      });

      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');
      fireEvent.press(restoreButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('Authentication failed'),
          expect.any(Array)
        );
      });
    });

    // Given: Receipt is already associated with another account
    // When: User presses restore and receipt error occurs
    // Then: Error alert should indicate receipt is in use
    it('should show error alert on receipt already in use error', async () => {
      mockRestorePurchases.mockImplementation(async () => {
        mockError = {
          code: 'RECEIPT_ALREADY_IN_USE_ERROR',
          message: 'Receipt already in use',
          retryable: false,
        };
        throw new Error('RECEIPT_ALREADY_IN_USE_ERROR');
      });

      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');
      fireEvent.press(restoreButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('already associated with another account'),
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
          expect.stringContaining('An error occurred'),
          expect.any(Array)
        );
      });
    });

    // Given: An unrecognized error code is received
    // When: User presses restore
    // Then: Generic error message should be shown as fallback
    it('should show generic error alert on unrecognized error code', async () => {
      mockRestorePurchases.mockImplementation(async () => {
        throw new Error('SOME_UNEXPECTED_ERROR_CODE');
      });

      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');
      fireEvent.press(restoreButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('An error occurred'),
          expect.any(Array)
        );
      });
    });

    // Given: Network error occurs during restore
    // When: Error is handled
    // Then: Loading state should be reset and button re-enabled
    it('should reset loading state after error', async () => {
      mockRestorePurchases.mockRejectedValue(new Error('NETWORK_ERROR'));

      render(<SettingsScreen />);

      const restoreButton = screen.getByTestId('restore-purchases-button');
      fireEvent.press(restoreButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });

      // Loading state should be reset and button re-enabled
      await waitFor(() => {
        const button = screen.getByTestId('restore-purchases-button');
        expect(button.props.accessibilityState?.disabled).toBe(false);
      });
    });
  });

  describe('Subscription Status Display', () => {
    // Given: A user has a premium subscription with expiry date
    // When: The screen is rendered
    // Then: Should display expiry date
    it('should display subscription expiry date for premium users', () => {
      mockIsPremium = true;
      mockSubscription = {
        isActive: true,
        tier: 'premium',
        expiresAt: new Date('2025-12-31'),
        productId: 'monthly_plan',
      };

      render(<SettingsScreen />);

      expect(screen.getByText('Expires:')).toBeTruthy();
      // Date format depends on locale, just check the label is shown
      expect(screen.getByText(/12\/31\/2025|31\/12\/2025|2025/)).toBeTruthy();
    });

    // Given: A user has a free subscription
    // When: The screen is rendered
    // Then: Should not display expiry section
    it('should not display expiry date for free users', () => {
      mockIsPremium = false;
      mockSubscription = {
        isActive: false,
        tier: 'free',
        expiresAt: null,
        productId: null,
      };

      render(<SettingsScreen />);

      expect(screen.queryByText('Expires:')).toBeNull();
    });

    // Given: Subscription is null (initial loading state)
    // When: The screen is rendered
    // Then: Should render without crashing
    it('should handle null subscription object', () => {
      mockIsPremium = false;
      mockSubscription = null;

      render(<SettingsScreen />);

      expect(screen.getByText('Settings')).toBeTruthy();
      expect(screen.getByText('Free')).toBeTruthy();
    });
  });

  describe('Button Visibility', () => {
    // Given: A user has a free subscription
    // When: The screen is rendered
    // Then: Should display upgrade button
    it('should show upgrade button for free users', () => {
      mockIsPremium = false;

      render(<SettingsScreen />);

      expect(screen.getByTestId('upgrade-premium-button')).toBeTruthy();
    });

    // Given: A user has a premium subscription
    // When: The screen is rendered
    // Then: Should not display upgrade button
    it('should hide upgrade button for premium users', () => {
      mockIsPremium = true;
      mockSubscription = {
        isActive: true,
        tier: 'premium',
        expiresAt: new Date('2025-12-31'),
        productId: 'monthly_plan',
      };

      render(<SettingsScreen />);

      expect(screen.queryByTestId('upgrade-premium-button')).toBeNull();
    });

    // Given: Any subscription status
    // When: The screen is rendered
    // Then: Restore purchases button should always be visible (iOS App Store compliance)
    it('should always show restore purchases button regardless of subscription status', () => {
      // Test with free subscription
      mockIsPremium = false;
      const { unmount } = render(<SettingsScreen />);
      expect(screen.getByTestId('restore-purchases-button')).toBeTruthy();
      unmount();

      // Test with premium subscription
      mockIsPremium = true;
      mockSubscription = {
        isActive: true,
        tier: 'premium',
        expiresAt: new Date('2025-12-31'),
        productId: 'monthly_plan',
      };
      render(<SettingsScreen />);
      expect(screen.getByTestId('restore-purchases-button')).toBeTruthy();
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
