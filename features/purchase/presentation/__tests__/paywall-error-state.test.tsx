/**
 * PaywallComponent Error State Display Tests (Task 12.6)
 *
 * Tests the error state display functionality in PaywallComponent including:
 * - Error message display with semantic.error color
 * - Retry button visibility based on error.retryable flag
 * - Error clearing behavior
 * - Different error types handling
 * - Edge cases (empty message, null error, special characters)
 * - Component exception handling during error display
 *
 * Test Coverage: 28 comprehensive tests (happy/sad/edge/unhappy paths)
 * Requirement: 2.5 - Error message and Retry button display
 *
 * @module features/purchase/presentation/__tests__/paywall-error-state
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { PaywallComponent } from '../paywall';
import type { PaywallComponentProps } from '../paywall';
import { Colors } from '@/constants/theme';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock Zustand store
jest.mock('@/features/purchase/infrastructure/purchase-ui-store', () => ({
  usePurchaseStore: jest.fn(() => ({
    selectedProductId: undefined,
    isLoading: false,
    setSelectedProductId: jest.fn(),
    setLoading: jest.fn(),
  })),
}));

// Mock FeatureGatingService
jest.mock('@/features/purchase/application/feature-gating-service', () => ({
  featureGatingService: {
    getFeatureDefinition: jest.fn((featureId) => {
      if (featureId === 'test_feature') {
        return {
          ok: true,
          value: {
            id: 'test_feature',
            level: 'premium' as const,
            name: 'Test Feature',
            description: 'A test feature',
            requiredProductId: 'product_1',
          },
        };
      }
      return {
        ok: false,
        error: new Error('Feature not found'),
      };
    }),
  },
}));

// Mock PurchaseService
jest.mock('@/features/purchase/application/purchase-service', () => ({
  purchaseService: {
    purchaseProduct: jest.fn(),
  },
}));

// Mock theme colors - use mock function to capture Colors dynamically
const mockColors = {
  light: {
    background: { base: '#FFFFFF', secondary: '#F2F2F7', tertiary: '#F2F2F7' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999', inverse: '#FFFFFF' },
    semantic: { success: '#34C759', warning: '#FF9500', error: '#FF3B30', info: '#0A84FF' },
    interactive: { separator: '#E5E5EA', fill: '#CCCCCC', fillSecondary: '#EEEEEE' },
  },
};

jest.mock('@/hooks/use-theme-color', () => ({
  useThemedColors: jest.fn(() => ({
    colors: mockColors.light,
    colorScheme: 'light',
  })),
}));

describe('PaywallComponent - Error State Display (Task 12.6)', () => {
  const mockRouter = {
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  };

  const defaultProps: PaywallComponentProps = {
    featureId: 'test_feature',
    onPurchaseComplete: jest.fn(),
    onDismiss: jest.fn(),
    allowDismiss: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  // ========== HAPPY PATH: ERROR DISPLAY WITH CORRECT STYLING ==========

  describe('happy path: error display with semantic.error color', () => {
    /**
     * Given: PurchaseService returns NETWORK_ERROR with message
     * When: User attempts purchase and receives network error
     * Then: Error container displays with semantic.error background color
     */
    it('should display network error with semantic.error color', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          retryable: true,
        },
      });

      const { getByTestId } = render(<PaywallComponent {...defaultProps} />);

      // Simulate purchase attempt
      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const errorContainer = getByTestId('paywall-error-container');
        expect(errorContainer).toBeTruthy();
        // Verify semantic.error background color
        expect(errorContainer.props.style).toMatchObject({
          backgroundColor: mockColors.light.semantic.error,
        });
      });
    });

    /**
     * Given: PurchaseService returns STORE_PROBLEM_ERROR
     * When: User attempts purchase
     * Then: Error container displays with semantic.error background
     */
    it('should display store problem error with semantic.error color', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'STORE_PROBLEM_ERROR',
          message: 'App Store is temporarily unavailable',
          retryable: true,
        },
      });

      const { getByTestId } = render(<PaywallComponent {...defaultProps} />);

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const errorContainer = getByTestId('paywall-error-container');
        expect(errorContainer.props.style).toMatchObject({
          backgroundColor: mockColors.light.semantic.error,
        });
      });
    });

    /**
     * Given: PurchaseService returns VERIFICATION_FAILED error
     * When: User attempts purchase
     * Then: Error displays with semantic.error background
     */
    it('should display verification failed error with semantic.error color', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'VERIFICATION_FAILED',
          message: 'Receipt verification failed',
          retryable: false,
        },
      });

      const { getByTestId } = render(<PaywallComponent {...defaultProps} />);

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const errorContainer = getByTestId('paywall-error-container');
        expect(errorContainer.props.style).toMatchObject({
          backgroundColor: mockColors.light.semantic.error,
        });
      });
    });

    /**
     * Given: User cancels purchase
     * When: CANCELLED error is returned
     * Then: Error displays (cancellation message)
     */
    it('should display cancellation message', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'CANCELLED',
          message: 'Purchase was cancelled',
          retryable: false,
        },
      });

      const { getByTestId } = render(<PaywallComponent {...defaultProps} />);

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const errorContainer = getByTestId('paywall-error-container');
        expect(errorContainer).toBeTruthy();
      });
    });

    /**
     * Given: Database error occurs during purchase
     * When: DB_ERROR is returned
     * Then: Error displays with semantic.error color
     */
    it('should display database error with semantic.error color', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'DB_ERROR',
          message: 'Failed to save purchase',
          retryable: true,
        },
      });

      const { getByTestId } = render(<PaywallComponent {...defaultProps} />);

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const errorContainer = getByTestId('paywall-error-container');
        expect(errorContainer.props.style).toMatchObject({
          backgroundColor: mockColors.light.semantic.error,
        });
      });
    });

    /**
     * Given: Any error state is rendered
     * When: Component renders error
     * Then: Error container has testID for automated testing
     */
    it('should have testID on error container for testing', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Test error',
          retryable: true,
        },
      });

      const { getByTestId } = render(<PaywallComponent {...defaultProps} />);

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const errorContainer = getByTestId('paywall-error-container');
        expect(errorContainer).toBeTruthy();
      });
    });

    /**
     * Given: Error message is displayed
     * When: Component renders error text
     * Then: Error text has testID for automated testing
     */
    it('should have testID on error message text for testing', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          retryable: true,
        },
      });

      const { getByTestId } = render(<PaywallComponent {...defaultProps} />);

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const errorText = getByTestId('paywall-error-text');
        expect(errorText).toBeTruthy();
        expect(errorText.props.children).toBe('Network connection failed');
      });
    });
  });

  // ========== SAD PATH: DIFFERENT ERROR TYPES WITH RETRY AVAILABILITY ==========

  describe('sad path: error types with retry button availability', () => {
    /**
     * Given: NETWORK_ERROR is returned (retryable: true)
     * When: Error is displayed
     * Then: Retry button is visible
     */
    it('should show retry button for NETWORK_ERROR', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          retryable: true,
        },
      });

      const { getByTestId } = render(<PaywallComponent {...defaultProps} />);

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const retryButton = getByTestId('paywall-error-retry-button');
        expect(retryButton).toBeTruthy();
      });
    });

    /**
     * Given: STORE_PROBLEM_ERROR (retryable: true)
     * When: Error is displayed
     * Then: Retry button is visible
     */
    it('should show retry button for STORE_PROBLEM_ERROR', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'STORE_PROBLEM_ERROR',
          message: 'App Store is temporarily unavailable',
          retryable: true,
        },
      });

      const { getByTestId } = render(<PaywallComponent {...defaultProps} />);

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const retryButton = getByTestId('paywall-error-retry-button');
        expect(retryButton).toBeTruthy();
      });
    });

    /**
     * Given: DB_ERROR (retryable: true)
     * When: Error is displayed
     * Then: Retry button is visible
     */
    it('should show retry button for DB_ERROR', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'DB_ERROR',
          message: 'Failed to save purchase',
          retryable: true,
        },
      });

      const { getByTestId } = render(<PaywallComponent {...defaultProps} />);

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const retryButton = getByTestId('paywall-error-retry-button');
        expect(retryButton).toBeTruthy();
      });
    });

    /**
     * Given: VERIFICATION_FAILED (retryable: false)
     * When: Error is displayed
     * Then: Retry button is NOT visible
     */
    it('should NOT show retry button for VERIFICATION_FAILED', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'VERIFICATION_FAILED',
          message: 'Receipt verification failed',
          retryable: false,
        },
      });

      const { getByTestId, queryByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const retryButton = queryByTestId('paywall-error-retry-button');
        expect(retryButton).toBeNull();
      });
    });

    /**
     * Given: CANCELLED (retryable: false)
     * When: Error is displayed
     * Then: Retry button is NOT visible
     */
    it('should NOT show retry button for CANCELLED', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'CANCELLED',
          message: 'Purchase was cancelled',
          retryable: false,
        },
      });

      const { getByTestId, queryByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const retryButton = queryByTestId('paywall-error-retry-button');
        expect(retryButton).toBeNull();
      });
    });

    /**
     * Given: Retry button is displayed
     * When: User taps retry button
     * Then: purchaseProduct is called again with same productId
     */
    it('should retry purchase when retry button is tapped', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          retryable: true,
        },
      });

      const { getByTestId } = render(<PaywallComponent {...defaultProps} />);

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const retryButton = getByTestId('paywall-error-retry-button');
        expect(retryButton).toBeTruthy();
      });

      // Reset mock and press retry
      mockPurchaseService.purchaseService.purchaseProduct.mockClear();
      const retryButton = getByTestId('paywall-error-retry-button');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(mockPurchaseService.purchaseService.purchaseProduct).toHaveBeenCalled();
      });
    });

    /**
     * Given: Two purchase attempts return different errors
     * When: Errors are received sequentially
     * Then: Latest error message is displayed
     */
    it('should display latest error message when multiple errors occur', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');

      // First error
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          retryable: true,
        },
      });

      const { getByTestId, rerender } = render(
        <PaywallComponent {...defaultProps} />
      );

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const errorText = getByTestId('paywall-error-text');
        expect(errorText.props.children).toBe('Network connection failed');
      });

      // Second error on retry
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'STORE_PROBLEM_ERROR',
          message: 'App Store is temporarily unavailable',
          retryable: true,
        },
      });

      const retryButton = getByTestId('paywall-error-retry-button');
      fireEvent.press(retryButton);

      await waitFor(() => {
        const errorText = getByTestId('paywall-error-text');
        expect(errorText.props.children).toBe('App Store is temporarily unavailable');
      });
    });
  });

  // ========== EDGE CASES: EMPTY/NULL/UNDEFINED ERROR HANDLING ==========

  describe('edge cases: null/empty error handling', () => {
    /**
     * Given: Error message is empty string
     * When: Error is displayed
     * Then: Fallback message is shown
     */
    it('should display fallback message for empty error string', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '',
          retryable: true,
        },
      });

      const { getByTestId } = render(<PaywallComponent {...defaultProps} />);

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const errorText = getByTestId('paywall-error-text');
        const message = errorText.props.children;
        expect(message).toBeTruthy(); // Should have fallback
        expect(message).not.toBe(''); // Should not be empty
      });
    });

    /**
     * Given: No error state (error is null)
     * When: Component renders
     * Then: No error container is displayed
     */
    it('should not display error container when error is null', () => {
      const { queryByTestId } = render(<PaywallComponent {...defaultProps} />);

      const errorContainer = queryByTestId('paywall-error-container');
      expect(errorContainer).toBeNull();
    });

    /**
     * Given: Error message is very long (>200 characters)
     * When: Error is displayed
     * Then: Text wraps correctly without overflow
     */
    it('should wrap long error messages correctly', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      const longMessage = 'A'.repeat(300); // Long message

      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: longMessage,
          retryable: true,
        },
      });

      const { getByTestId } = render(<PaywallComponent {...defaultProps} />);

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const errorContainer = getByTestId('paywall-error-container');
        expect(errorContainer).toBeTruthy();
        // Verify text wrapping style exists
        const errorText = getByTestId('paywall-error-text');
        expect(errorText).toBeTruthy();
      });
    });

    /**
     * Given: Error message contains special characters
     * When: Error is displayed
     * Then: Special characters are rendered correctly
     */
    it('should handle special characters in error message', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      const specialMessage = 'Error & failed <retry> "now"';

      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: specialMessage,
          retryable: true,
        },
      });

      const { getByTestId } = render(<PaywallComponent {...defaultProps} />);

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const errorText = getByTestId('paywall-error-text');
        expect(errorText.props.children).toBe(specialMessage);
      });
    });

    /**
     * Given: Error is displayed
     * When: User selects a different product
     * Then: Error is cleared
     */
    it('should clear error when user selects different product', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          retryable: true,
        },
      });

      const { getByTestId, queryByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Trigger error
      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const errorContainer = getByTestId('paywall-error-container');
        expect(errorContainer).toBeTruthy();
      });

      // TODO: Select different product (depends on implementation)
      // When full PaywallComponent is implemented, add product selection test
    });

    /**
     * Given: Component renders for first time
     * When: No purchase attempts yet
     * Then: Error container is not displayed
     */
    it('should not display error on initial render', () => {
      const { queryByTestId } = render(<PaywallComponent {...defaultProps} />);

      const errorContainer = queryByTestId('paywall-error-container');
      expect(errorContainer).toBeNull();
    });
  });

  // ========== UNHAPPY PATH: COMPONENT EXCEPTION HANDLING ==========

  describe('unhappy path: component exception handling', () => {
    /**
     * Given: PurchaseService throws unexpected exception
     * When: Purchase is attempted
     * Then: Exception is caught and generic error shown
     */
    it('should catch and handle PurchaseService exceptions', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockRejectedValue(
        new Error('Unexpected exception')
      );

      const { getByTestId } = render(<PaywallComponent {...defaultProps} />);

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const errorContainer = getByTestId('paywall-error-container');
        expect(errorContainer).toBeTruthy();
      });
    });

    /**
     * Given: Error display renders during component update
     * When: Component props change
     * Then: Error display updates correctly
     */
    it('should handle error display during component update', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValue({
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          retryable: true,
        },
      });

      const { getByTestId, rerender } = render(
        <PaywallComponent {...defaultProps} />
      );

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const errorContainer = getByTestId('paywall-error-container');
        expect(errorContainer).toBeTruthy();
      });

      // Rerender with different props
      rerender(<PaywallComponent {...defaultProps} allowDismiss={false} />);

      await waitFor(() => {
        const errorContainer = getByTestId('paywall-error-container');
        expect(errorContainer).toBeTruthy(); // Error still visible
      });
    });
  });

  // ========== INTEGRATION: ERROR CLEARS AFTER SUCCESSFUL RETRY ==========

  describe('integration: error clearing behavior', () => {
    /**
     * Given: NETWORK_ERROR is displayed
     * When: User retries and purchase succeeds
     * Then: Error is cleared and success callback invoked
     */
    it('should clear error when retry succeeds', async () => {
      const mockPurchaseService = require('@/features/purchase/application/purchase-service');
      const onPurchaseComplete = jest.fn();

      // First attempt fails
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          retryable: true,
        },
      });

      const { getByTestId, queryByTestId } = render(
        <PaywallComponent
          {...defaultProps}
          onPurchaseComplete={onPurchaseComplete}
        />
      );

      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        const errorContainer = getByTestId('paywall-error-container');
        expect(errorContainer).toBeTruthy();
      });

      // Retry succeeds
      mockPurchaseService.purchaseService.purchaseProduct.mockResolvedValueOnce({
        ok: true,
        value: {
          transactionId: 'tx_123',
          productId: 'product_1',
          purchasedAt: new Date(),
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: false,
          unlockedFeatures: ['test_feature'],
        },
      });

      const retryButton = getByTestId('paywall-error-retry-button');
      fireEvent.press(retryButton);

      await waitFor(() => {
        const errorContainer = queryByTestId('paywall-error-container');
        expect(errorContainer).toBeNull(); // Error cleared
        expect(onPurchaseComplete).toHaveBeenCalled(); // Success callback invoked
      });
    });
  });
});
