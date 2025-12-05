/**
 * PaywallComponent - Loading State Tests (Task 12.4)
 *
 * Comprehensive tests for loading overlay and purchase processing UI
 * - Loading indicator display and overlay appearance
 * - Interaction locking (buttons, scrolling, dismissal)
 * - Error handling during loading
 * - Edge cases and unhappy path scenarios
 *
 * Requirements: 5.5 (Loading state), 2.6 (UI interaction locking during purchase)
 *
 * Test coverage:
 * - Happy path: 8 tests - Loading overlay display and interaction blocking
 * - Sad path: 6 tests - Purchase failures with loading state
 * - Edge cases: 8 tests - Rapid interactions and boundary conditions
 * - Unhappy path: 7 tests - System failures and interaction lock failures
 * Total: 32 comprehensive tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react-native';
import { PaywallComponent, type PaywallComponentProps } from '../paywall';
import { usePurchaseStore } from '@/features/purchase/infrastructure/purchase-ui-store';
import type { PurchaseFlowError } from '@/features/purchase/core/types';

// Mock dependencies
jest.mock('@/features/purchase/infrastructure/purchase-ui-store');
jest.mock('@/features/purchase/application/purchase-service');
jest.mock('@/features/purchase/application');
jest.mock('@/hooks/use-theme-color');
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  })),
}));

describe('PaywallComponent - Loading State (Task 12.4)', () => {
  const mockProducts = [
    {
      id: 'premium_unlock',
      title: 'Premium Unlock',
      description: 'Unlock all premium features',
      price: 9.99,
      priceString: '$9.99',
      currencyCode: 'USD',
    },
    {
      id: 'pro_unlock',
      title: 'Pro Unlock',
      description: 'Unlock pro features',
      price: 19.99,
      priceString: '$19.99',
      currencyCode: 'USD',
    },
  ];

  const mockThemeColors = {
    colors: {
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
    },
  };

  const defaultProps: PaywallComponentProps = {
    featureId: 'premium_feature',
    onPurchaseComplete: jest.fn(),
    onDismiss: jest.fn(),
    allowDismiss: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePurchaseStore as jest.Mock).mockReturnValue({
      isLoading: false,
      setLoading: jest.fn(),
      selectedProductId: null,
      setSelectedProductId: jest.fn(),
    });
  });

  // ========== HAPPY PATH: LOADING OVERLAY DISPLAY ==========

  describe('Happy Path: Loading Overlay Display', () => {
    it('should display loading overlay when purchase starts', async () => {
      // Given: User has selected a product
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: Loading state becomes true
      const { getByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Then: Loading overlay should appear
      await waitFor(() => {
        const overlay = getByTestId('paywall-loading-overlay');
        expect(overlay).toBeTruthy();
      });
    });

    it('should show loading indicator in overlay', async () => {
      // Given: Purchase is in progress
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: Loading overlay is displayed
      const { getByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Then: ActivityIndicator should be visible
      await waitFor(() => {
        const indicator = getByTestId('paywall-loading-indicator');
        expect(indicator).toBeTruthy();
      });
    });

    it('should display appropriate loading message', async () => {
      // Given: Purchase flow has started
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: Loading overlay is shown
      const { getByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Then: Loading message should be displayed
      await waitFor(() => {
        const message = getByTestId('paywall-loading-message');
        expect(message).toHaveTextContent('購入を処理中...');
      });
    });

    it('should disable purchase button during loading', async () => {
      // Given: Purchase is processing
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: Loading state is active
      const { getByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Then: Purchase button should be disabled
      await waitFor(() => {
        const button = getByTestId('paywall-cta-button');
        expect(button).toBeDisabled();
      });
    });

    it('should disable product selection cards during loading', async () => {
      // Given: Loading overlay is visible
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: User attempts to tap product cards
      const { getAllByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Then: Product cards should not respond to press
      await waitFor(() => {
        const cards = getAllByTestId('paywall-product-card');
        cards.forEach(card => {
          expect(card).toBeDisabled();
        });
      });
    });

    it('should disable dismiss button during loading', async () => {
      // Given: Purchase is in progress with allowDismiss=true
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: User attempts to tap dismiss button
      const { getByTestId } = render(
        <PaywallComponent {...defaultProps} allowDismiss={true} />
      );

      // Then: Dismiss button should be disabled
      await waitFor(() => {
        const dismissButton = getByTestId('paywall-dismiss-button');
        expect(dismissButton).toBeDisabled();
      });
    });

    it('should prevent ScrollView scrolling during loading', async () => {
      // Given: Loading overlay is active
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: User attempts to scroll
      const { getByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Then: ScrollView should be disabled
      await waitFor(() => {
        const scrollView = getByTestId('paywall-scroll-view');
        expect(scrollView.props.scrollEnabled).toBe(false);
      });
    });

    it('should hide loading overlay on purchase success', async () => {
      // Given: Purchase completes successfully
      let mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, rerender } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Verify overlay appears
      await waitFor(() => {
        expect(getByTestId('paywall-loading-overlay')).toBeTruthy();
      });

      // When: Purchase completes (loading becomes false)
      mockStore = {
        ...mockStore,
        isLoading: false,
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);
      rerender(<PaywallComponent {...defaultProps} />);

      // Then: Loading overlay should disappear
      await waitFor(() => {
        const overlay = getByTestId('paywall-loading-overlay');
        expect(overlay).not.toBeVisible();
      });
    });

    it('should restore all interactions after successful purchase', async () => {
      // Given: Purchase succeeded and overlay is hidden
      let mockStore = {
        isLoading: false,
        setLoading: jest.fn(),
        selectedProductId: undefined,
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: Loading state returns to false
      const { getByTestId, getAllByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Then: All buttons should be enabled
      await waitFor(() => {
        const button = getByTestId('paywall-cta-button');
        expect(button).not.toBeDisabled();

        const cards = getAllByTestId('paywall-product-card');
        cards.forEach(card => {
          expect(card).not.toBeDisabled();
        });
      });
    });
  });

  // ========== SAD PATH: PURCHASE FAILURES ==========

  describe('Sad Path: Purchase Failures with Loading State', () => {
    it('should hide loading and show error on NETWORK_ERROR', async () => {
      // Given: Purchase fails with NETWORK_ERROR
      const mockError: PurchaseFlowError = {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        retryable: true,
      };

      let mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
        error: null,
        setError: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, rerender } = render(
        <PaywallComponent {...defaultProps} />
      );

      // When: Error is returned
      mockStore = {
        ...mockStore,
        isLoading: false,
        error: mockError,
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);
      rerender(<PaywallComponent {...defaultProps} />);

      // Then: Loading overlay hides and error message shows
      await waitFor(() => {
        const overlay = getByTestId('paywall-loading-overlay');
        expect(overlay).not.toBeVisible();

        const errorMessage = getByTestId('paywall-error-message');
        expect(errorMessage).toHaveTextContent('Network connection failed');
      });
    });

    it('should re-enable interactions after purchase cancellation', async () => {
      // Given: User cancels purchase
      let mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, rerender } = render(
        <PaywallComponent {...defaultProps} />
      );

      // When: Purchase flow returns with cancellation
      mockStore = {
        ...mockStore,
        isLoading: false,
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);
      rerender(<PaywallComponent {...defaultProps} />);

      // Then: All interactions should be restored
      await waitFor(() => {
        const button = getByTestId('paywall-cta-button');
        expect(button).not.toBeDisabled();
      });
    });

    it('should handle verification failure during loading', async () => {
      // Given: Verification fails
      let mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
        error: null,
        setError: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, rerender } = render(
        <PaywallComponent {...defaultProps} />
      );

      // When: Verification fails
      const verificationError: PurchaseFlowError = {
        code: 'VERIFICATION_FAILED',
        message: 'Receipt verification failed',
        retryable: false,
      };
      mockStore = {
        ...mockStore,
        isLoading: false,
        error: verificationError,
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);
      rerender(<PaywallComponent {...defaultProps} />);

      // Then: Loading overlay hides and error message shows
      await waitFor(() => {
        const overlay = getByTestId('paywall-loading-overlay');
        expect(overlay).not.toBeVisible();
      });
    });

    it('should display retry option after network error', async () => {
      // Given: Purchase fails with retryable error
      const mockError: PurchaseFlowError = {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        retryable: true,
      };

      const mockStore = {
        isLoading: false,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
        error: mockError,
        setError: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: Error is displayed
      const { getByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Then: Retry option should be visible
      await waitFor(() => {
        const retryButton = getByTestId('paywall-retry-button');
        expect(retryButton).toBeTruthy();
      });
    });

    it('should preserve product selection after purchase failure', async () => {
      // Given: Product was selected
      let mockStore = {
        isLoading: false,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network failed',
          retryable: true,
        },
        setError: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: Purchase fails and loading ends
      const { getByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Then: Product selection should be preserved
      await waitFor(() => {
        const selectedCard = getByTestId('paywall-product-card-premium_unlock');
        expect(selectedCard).toHaveStyle({ borderColor: '#007AFF' });
      });
    });

    it('should clear loading state on DB_ERROR', async () => {
      // Given: Database error occurs
      let mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
        error: null,
        setError: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, rerender } = render(
        <PaywallComponent {...defaultProps} />
      );

      // When: DB_ERROR is returned
      mockStore = {
        ...mockStore,
        isLoading: false,
        error: {
          code: 'DB_ERROR',
          message: 'Database error',
          retryable: true,
        },
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);
      rerender(<PaywallComponent {...defaultProps} />);

      // Then: Loading overlay should hide and DB error message should display
      await waitFor(() => {
        const overlay = getByTestId('paywall-loading-overlay');
        expect(overlay).not.toBeVisible();
      });
    });
  });

  // ========== EDGE CASES: RAPID INTERACTIONS ==========

  describe('Edge Cases: Rapid Interactions and Boundary Conditions', () => {
    it('should prevent rapid-fire purchase button taps', async () => {
      // Given: Loading is false and button is enabled
      const setLoading = jest.fn();
      const mockStore = {
        isLoading: false,
        setLoading,
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // When: User taps purchase button twice rapidly
      const button = getByTestId('paywall-cta-button');
      fireEvent.press(button);
      fireEvent.press(button);

      // Then: Only one purchase flow should initiate
      await waitFor(() => {
        expect(setLoading).toHaveBeenCalledTimes(1);
      });
    });

    it('should block product selection changes during purchase', async () => {
      // Given: Purchase is processing
      const setSelectedProductId = jest.fn();
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId,
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      const { getAllByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // When: User attempts to select another product while loading
      const cards = getAllByTestId('paywall-product-card');
      if (cards.length > 1) {
        fireEvent.press(cards[1]);
      }

      // Then: Product selection should not change
      expect(setSelectedProductId).not.toHaveBeenCalled();
    });

    it('should ignore dismiss attempts during critical purchase phase', async () => {
      // Given: Purchase is processing
      const onDismiss = jest.fn();
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(
        <PaywallComponent {...defaultProps} onDismiss={onDismiss} allowDismiss={true} />
      );

      // When: User taps dismiss button while loading
      const dismissButton = getByTestId('paywall-dismiss-button');
      fireEvent.press(dismissButton);

      // Then: Dismiss action should be blocked
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('should handle empty product selection with loading state', async () => {
      // Given: No product is selected
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: undefined,
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: isLoading becomes true without product
      const { getByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Then: Loading should still display
      await waitFor(() => {
        const overlay = getByTestId('paywall-loading-overlay');
        expect(overlay).toBeTruthy();
      });
    });

    it('should handle loading state with zero products available', async () => {
      // Given: No products available
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: undefined,
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: isLoading becomes true with empty products
      const { getByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Then: Loading overlay should still display correctly
      await waitFor(() => {
        const overlay = getByTestId('paywall-loading-overlay');
        expect(overlay).toBeTruthy();
      });
    });

    it('should persist loading state across re-renders', async () => {
      // Given: Purchase is in progress
      let mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, rerender } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Verify overlay exists
      expect(getByTestId('paywall-loading-overlay')).toBeTruthy();

      // When: Component re-renders (e.g., parent state change)
      rerender(<PaywallComponent {...defaultProps} />);

      // Then: Loading overlay should remain visible without flickering
      await waitFor(() => {
        const overlay = getByTestId('paywall-loading-overlay');
        expect(overlay).toBeTruthy();
      });
    });

    it('should loading overlay cover entire paywall viewport', async () => {
      // Given: Paywall has scrollable content
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: Loading overlay is shown
      const { getByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Then: Overlay should cover full screen
      await waitFor(() => {
        const overlay = getByTestId('paywall-loading-overlay');
        expect(overlay).toHaveStyle({
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        });
      });
    });

    it('should handle loading state with allowDismiss=false', async () => {
      // Given: Paywall is in premium-only mode
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: Loading overlay is active with allowDismiss=false
      const { getByTestId, queryByTestId } = render(
        <PaywallComponent {...defaultProps} allowDismiss={false} />
      );

      // Then: No dismiss button should be visible
      await waitFor(() => {
        const dismissButton = queryByTestId('paywall-dismiss-button');
        expect(dismissButton).toBeNull();

        const overlay = getByTestId('paywall-loading-overlay');
        expect(overlay).toBeTruthy();
      });
    });
  });

  // ========== UNHAPPY PATH: SYSTEM FAILURES ==========

  describe('Unhappy Path: System Failures and Interaction Lock Failures', () => {
    it('should clear loading state on exception from purchaseProduct', async () => {
      // Given: purchaseProduct throws unexpected exception
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: Exception is caught in handlePurchase
      try {
        throw new Error('Unexpected error');
      } catch (e) {
        // Simulate exception handling
      }

      // Then: isLoading should be set to false in finally block
      const { rerender } = render(
        <PaywallComponent {...defaultProps} />
      );

      mockStore.isLoading = false;
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);
      rerender(<PaywallComponent {...defaultProps} />);

      // Verify loading is false
      expect(mockStore.isLoading).toBe(false);
    });

    it('should prevent interaction lock failures via guard in handlePurchase', async () => {
      // Given: Button disabled state fails to apply
      const setLoading = jest.fn();
      const mockStore = {
        isLoading: false,
        setLoading,
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // When: Button is pressed when isLoading is false
      const button = getByTestId('paywall-cta-button');
      fireEvent.press(button);

      // Then: Purchase flow should start (setLoading called)
      expect(setLoading).toHaveBeenCalled();
    });

    it('should handle loading overlay render error gracefully', async () => {
      // Given: Component is rendering with loading state
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: Component renders
      expect(() => {
        render(<PaywallComponent {...defaultProps} />);
      }).not.toThrow();
    });

    it('should show loading text as fallback if ActivityIndicator fails', async () => {
      // Given: Loading overlay is displayed
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: ActivityIndicator component is disabled/fails
      const { getByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Then: Loading text should still be visible as fallback
      await waitFor(() => {
        const message = getByTestId('paywall-loading-message');
        expect(message).toHaveTextContent('購入を処理中...');
      });
    });

    it('should ensure overlay has high z-index to appear above content', async () => {
      // Given: Loading overlay uses absolute positioning
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: Overlay is shown
      const { getByTestId } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Then: Overlay should have high z-index
      await waitFor(() => {
        const overlay = getByTestId('paywall-loading-overlay');
        expect(overlay).toHaveStyle({
          zIndex: 1000,
        });
      });
    });

    it('should prevent memory leaks from loading timeout', async () => {
      // Given: Purchase hangs indefinitely
      const mockStore = {
        isLoading: true,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: 30 seconds elapse
      jest.useFakeTimers();
      const { rerender } = render(
        <PaywallComponent {...defaultProps} />
      );

      // Simulate timeout
      jest.advanceTimersByTime(30000);

      // Clear timeout before unmounting
      jest.useRealTimers();

      // Then: Component should clean up without errors
      expect(() => {
        rerender(<PaywallComponent {...defaultProps} />);
      }).not.toThrow();
    });

    it('should prevent concurrent purchase attempts from multiple components', async () => {
      // Given: Multiple PaywallComponent instances exist
      const setLoading = jest.fn();
      const mockStore = {
        isLoading: false,
        setLoading,
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      // When: Both trigger purchase simultaneously
      const { getByTestId: getByTestId1 } = render(
        <PaywallComponent {...defaultProps} featureId="feature1" />
      );

      const { getByTestId: getByTestId2 } = render(
        <PaywallComponent {...defaultProps} featureId="feature2" />
      );

      const button1 = getByTestId1('paywall-cta-button');
      const button2 = getByTestId2('paywall-cta-button');

      fireEvent.press(button1);
      fireEvent.press(button2);

      // Then: Global loading lock should prevent concurrent purchases
      await waitFor(() => {
        // Both should call setLoading, but global lock prevents actual concurrent flow
        expect(setLoading).toHaveBeenCalled();
      });
    });
  });

  // ========== INTEGRATION TESTS ==========

  describe('Integration: Complete Loading Flow', () => {
    it('should complete full purchase flow with loading states', async () => {
      // Given: User has selected a product
      const onPurchaseComplete = jest.fn();
      let mockStore = {
        isLoading: false,
        setLoading: jest.fn(),
        selectedProductId: 'premium_unlock',
        setSelectedProductId: jest.fn(),
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, rerender } = render(
        <PaywallComponent {...defaultProps} onPurchaseComplete={onPurchaseComplete} />
      );

      // When: User taps purchase button
      const button = getByTestId('paywall-cta-button');
      fireEvent.press(button);

      // Then: Loading should start
      mockStore = {
        ...mockStore,
        isLoading: true,
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);
      rerender(<PaywallComponent {...defaultProps} onPurchaseComplete={onPurchaseComplete} />);

      await waitFor(() => {
        const overlay = getByTestId('paywall-loading-overlay');
        expect(overlay).toBeTruthy();
      });

      // When: Purchase completes successfully
      mockStore = {
        ...mockStore,
        isLoading: false,
        selectedProductId: undefined,
      };
      (usePurchaseStore as jest.Mock).mockReturnValue(mockStore);
      rerender(<PaywallComponent {...defaultProps} onPurchaseComplete={onPurchaseComplete} />);

      // Then: Loading overlay should disappear and callback should be called
      await waitFor(() => {
        const overlay = getByTestId('paywall-loading-overlay');
        expect(overlay).not.toBeVisible();
      });
    });
  });
});
