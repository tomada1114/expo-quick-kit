/**
 * Paywall Screen Tests
 *
 * Tests for the paywall screen route at app/paywall.tsx
 * Verifies:
 * - Screen renders with themed colors
 * - Integration with Paywall component
 * - Navigation behavior
 * - Purchase/restore event handling
 */

/* eslint-disable @typescript-eslint/no-require-imports, import/first */

import React from 'react';

// Mock expo-router
const mockRouter = {
  back: jest.fn(),
};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

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
};

jest.mock('@/hooks/use-theme-color', () => ({
  useThemedColors: () => ({
    colors: mockColors,
    colorScheme: 'light',
  }),
}));

// Mock useSubscription hook
const mockRefetchSubscription = jest.fn().mockResolvedValue(undefined);
jest.mock('@/features/subscription/hooks', () => ({
  useSubscription: () => ({
    isPremium: false,
    isFree: true,
    usageLimits: { maxItems: 10, maxExports: 1, hasAds: true },
    subscription: null,
    loading: false,
    error: null,
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    canAccessFeature: jest.fn(),
    refetchSubscription: mockRefetchSubscription,
  }),
}));

// Mock Paywall component from features/subscription/components
const mockOnPurchaseSuccess = jest.fn();
const mockOnRestoreSuccess = jest.fn();
const mockOnError = jest.fn();
const mockOnDismiss = jest.fn();

jest.mock('@/features/subscription/components', () => {
  const { View, Text } = require('react-native');
  return {
    Paywall: (props: {
      onPurchaseSuccess?: () => void;
      onRestoreSuccess?: () => void;
      onError?: (error: unknown) => void;
      onDismiss?: () => void;
    }) => {
      // Store props for test assertions
      mockOnPurchaseSuccess.mockImplementation(props.onPurchaseSuccess);
      mockOnRestoreSuccess.mockImplementation(props.onRestoreSuccess);
      mockOnError.mockImplementation(props.onError);
      mockOnDismiss.mockImplementation(props.onDismiss);

      return (
        <View testID="paywall-component">
          <Text>Mock Paywall</Text>
        </View>
      );
    },
  };
});

// Import after mocks
import { render, screen, waitFor } from '@testing-library/react-native';
import PaywallScreen from '@/app/paywall';

describe('PaywallScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    // Given: A user navigates to the paywall screen
    // When: The screen is rendered
    // Then: It should display the Paywall component
    it('should render the Paywall component', () => {
      render(<PaywallScreen />);

      expect(screen.getByTestId('paywall-component')).toBeTruthy();
    });

    // Given: A user is on the paywall screen
    // When: The screen is rendered
    // Then: It should apply themed background color from useThemedColors
    it('should apply themed background color', () => {
      render(<PaywallScreen />);

      const container = screen.getByTestId('paywall-screen-container');
      expect(container).toBeTruthy();
      // Style can be an array, so we flatten and check for the color
      const flatStyle = [container.props.style].flat();
      const hasBackgroundColor = flatStyle.some(
        (style: Record<string, unknown>) =>
          style?.backgroundColor === mockColors.background.base
      );
      expect(hasBackgroundColor).toBe(true);
    });

    // Given: A user is on the paywall screen
    // When: The screen is rendered
    // Then: The container should have flex: 1 to fill the screen
    it('should fill the screen with flex: 1', () => {
      render(<PaywallScreen />);

      const container = screen.getByTestId('paywall-screen-container');
      // Style can be an array, so we flatten and check for flex
      const flatStyle = [container.props.style].flat();
      const hasFlex = flatStyle.some(
        (style: Record<string, unknown>) => style?.flex === 1
      );
      expect(hasFlex).toBe(true);
    });
  });

  describe('Purchase Event Handling', () => {
    // Given: A user completes a purchase on the paywall
    // When: The onPurchaseSuccess callback is triggered
    // Then: It should refetch subscription state
    it('should refetch subscription on purchase success', async () => {
      render(<PaywallScreen />);

      // Simulate purchase success callback
      mockOnPurchaseSuccess();

      await waitFor(() => {
        expect(mockRefetchSubscription).toHaveBeenCalled();
      });
    });
  });

  describe('Restore Event Handling', () => {
    // Given: A user restores purchases on the paywall
    // When: The onRestoreSuccess callback is triggered
    // Then: It should refetch subscription state
    it('should refetch subscription on restore success', async () => {
      render(<PaywallScreen />);

      // Simulate restore success callback
      mockOnRestoreSuccess();

      await waitFor(() => {
        expect(mockRefetchSubscription).toHaveBeenCalled();
      });
    });
  });

  describe('Dismiss Handling', () => {
    // Given: A user dismisses the paywall
    // When: The onDismiss callback is triggered
    // Then: It should navigate back
    it('should navigate back on dismiss', () => {
      render(<PaywallScreen />);

      // Simulate dismiss callback
      mockOnDismiss();

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    // Given: An error occurs during purchase/restore
    // When: The onError callback is triggered
    // Then: The error should be logged (no additional action in initial implementation)
    it('should handle errors without crashing', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(<PaywallScreen />);

      // Simulate error callback
      const testError = { code: 1, message: 'Test error' };
      mockOnError(testError);

      // Should not throw
      expect(consoleErrorSpy).toHaveBeenCalledWith('Paywall error:', testError);

      consoleErrorSpy.mockRestore();
    });
  });
});
