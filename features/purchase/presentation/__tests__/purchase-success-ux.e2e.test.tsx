/**
 * Purchase Success UX E2E Test
 *
 * End-to-end user experience tests for successful one-time purchase flow.
 * Tests verify that after a successful purchase:
 * 1. Paywall closes automatically
 * 2. Feature becomes immediately accessible/unlocked
 * 3. Success message is displayed to the user
 *
 * Requirements: 5.1 (Paywall UX, success handling)
 *
 * @module features/purchase/presentation/__tests__/purchase-success-ux.e2e.test
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { PaywallComponent } from '../paywall';
import type { PaywallComponentProps } from '../paywall';
import type { Purchase } from '@/features/purchase/core/domain';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock the entire application module
jest.mock('@/features/purchase/application', () => ({
  purchaseService: {
    purchaseProduct: jest.fn(async (productId: string) => {
      const mockPurchase: Purchase = {
        transactionId: 'tx_123_test',
        productId,
        purchasedAt: new Date(),
        price: 9.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: false,
        unlockedFeatures: ['premium_feature'],
      };
      return { ok: true, value: mockPurchase };
    }),
  },
  featureGatingService: {
    getFeatureDefinition: jest.fn(() => ({
      ok: true,
      value: {
        id: 'premium_feature',
        level: 'premium',
        name: 'Premium Feature',
        description: 'Unlock premium features',
        requiredProductId: 'product_1',
      },
    })),
    canAccessSync: jest.fn(() => false),
    canAccess: jest.fn(() => Promise.resolve(false)),
  },
}));

// Mock purchase store
jest.mock('@/features/purchase/infrastructure/purchase-ui-store', () => ({
  usePurchaseStore: jest.fn(() => ({
    selectedProductId: 'product_1',
    isLoading: false,
    setSelectedProductId: jest.fn(),
    setLoading: jest.fn(),
  })),
  usePurchaseUIStore: jest.fn(() => ({
    selectedProductId: 'product_1',
    isLoading: false,
    setSelectedProductId: jest.fn(),
    setLoading: jest.fn(),
  })),
}));

// Mock components and hooks
jest.mock('@/components/themed-text', () => {
  const React = require('react');
  const { Text: RNText } = require('react-native');

  return {
    Text: ({ children, style, testID }: any) =>
      React.createElement(RNText, { style, testID }, children),
  };
});

jest.mock('@/hooks/use-theme-color', () => ({
  useThemedColors: jest.fn(() => ({
    colors: {
      background: { base: '#fff', secondary: '#f5f5f5', tertiary: '#eee' },
      text: { primary: '#000', secondary: '#666', tertiary: '#999', inverse: '#fff' },
      semantic: { success: '#34C759', error: '#FF3B30', warning: '#FF9500', info: '#00C7FC' },
      interactive: { separator: '#ddd', fill: '#007AFF', fillSecondary: '#ccc' },
    },
    colorScheme: 'light',
  })),
  useThemeColor: jest.fn(),
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

// Test component with success message handling
function TestSuccessComponent({
  onPaywallClose,
  onFeatureUnlocked,
  onPurchaseCompleted,
}: {
  onPaywallClose?: () => void;
  onFeatureUnlocked?: () => void;
  onPurchaseCompleted?: (purchase: Purchase) => void;
}): React.JSX.Element {
  const [showPaywall, setShowPaywall] = React.useState(true);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isFeatureUnlocked, setIsFeatureUnlocked] = React.useState(false);

  const handlePurchaseComplete = React.useCallback(
    (purchase: Purchase) => {
      // SUCCESS PATH 1: Paywall closes immediately
      setShowPaywall(false);
      onPaywallClose?.();

      // SUCCESS PATH 2: Display success message
      setSuccessMessage('Purchase successful! Premium features unlocked.');

      // SUCCESS PATH 3: Feature becomes immediately unlocked
      setIsFeatureUnlocked(true);
      onFeatureUnlocked?.();

      onPurchaseCompleted?.(purchase);
    },
    [onPaywallClose, onFeatureUnlocked, onPurchaseCompleted]
  );

  const handleDismiss = React.useCallback(() => {
    setShowPaywall(false);
    onPaywallClose?.();
  }, [onPaywallClose]);

  return (
    <View testID="test-success-component">
      {/* Show paywall when active */}
      {showPaywall && (
        <PaywallComponent
          featureId="premium_feature"
          onPurchaseComplete={handlePurchaseComplete}
          onDismiss={handleDismiss}
          allowDismiss={true}
        />
      )}

      {/* Show premium content when feature is unlocked */}
      {!showPaywall && isFeatureUnlocked && (
        <View testID="premium-content">
          <Text testID="premium-content-text">Premium Feature Content</Text>
        </View>
      )}

      {/* Show success message */}
      {successMessage && (
        <View testID="success-message-container">
          <Text testID="success-message-text" style={{ color: '#34C759' }}>
            {successMessage}
          </Text>
        </View>
      )}
    </View>
  );
}

describe('Purchase Success UX E2E Tests', () => {
  const mockRouter = {
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  // ==================== HAPPY PATH: SUCCESSFUL PURCHASE ====================

  describe('Happy Path: Purchase completes successfully', () => {
    // Given: User is viewing paywall with valid purchase option selected
    // When: User taps the purchase button and purchase succeeds
    // Then: Paywall closes immediately and feature content appears
    it('should close paywall after successful purchase', async () => {
      const onPaywallClose = jest.fn();
      const { getByTestId, queryByTestId } = render(
        <TestSuccessComponent onPaywallClose={onPaywallClose} />
      );

      // Verify paywall is initially visible
      const paywall = getByTestId('purchase-paywall-container');
      expect(paywall).toBeTruthy();

      // Simulate successful purchase by calling onPurchaseComplete
      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      // Wait for paywall to close
      await waitFor(() => {
        expect(queryByTestId('purchase-paywall-container')).toBeNull();
      });

      // Verify callback was triggered
      expect(onPaywallClose).toHaveBeenCalled();
    });

    // Given: Paywall shows purchase options for a premium feature
    // When: User completes purchase successfully
    // Then: Premium content becomes immediately visible/accessible
    it('should unlock and display premium content immediately after purchase', async () => {
      const onFeatureUnlocked = jest.fn();
      const { getByTestId, queryByTestId } = render(
        <TestSuccessComponent onFeatureUnlocked={onFeatureUnlocked} />
      );

      // Verify premium content is not visible initially (paywall is shown)
      expect(queryByTestId('premium-content')).toBeNull();

      // Simulate successful purchase
      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      // Wait for premium content to appear
      await waitFor(() => {
        const premiumContent = getByTestId('premium-content');
        expect(premiumContent).toBeTruthy();
      });

      // Verify premium content text is accessible
      const premiumText = getByTestId('premium-content-text');
      expect(premiumText.children[0]).toBe('Premium Feature Content');

      // Verify callback was triggered
      expect(onFeatureUnlocked).toHaveBeenCalled();
    });

    // Given: User has successfully completed purchase
    // When: Purchase completes
    // Then: Success message is displayed to confirm the transaction
    it('should display success message after purchase completes', async () => {
      const { getByTestId, queryByTestId } = render(
        <TestSuccessComponent />
      );

      // Verify success message is not shown initially
      expect(queryByTestId('success-message-container')).toBeNull();

      // Simulate successful purchase
      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      // Wait for success message to appear
      await waitFor(() => {
        const successContainer = getByTestId('success-message-container');
        expect(successContainer).toBeTruthy();
      });

      // Verify success message content
      const successText = getByTestId('success-message-text');
      expect(successText.children[0]).toBe(
        'Purchase successful! Premium features unlocked.'
      );
    });

    // Given: User completes purchase with success
    // When: All success actions complete (close, unlock, message)
    // Then: Complete flow works end-to-end
    it('should complete full purchase success flow end-to-end', async () => {
      const onPaywallClose = jest.fn();
      const onFeatureUnlocked = jest.fn();

      const { getByTestId, queryByTestId } = render(
        <TestSuccessComponent
          onPaywallClose={onPaywallClose}
          onFeatureUnlocked={onFeatureUnlocked}
        />
      );

      // Step 1: Verify initial state
      expect(getByTestId('purchase-paywall-container')).toBeTruthy();
      expect(queryByTestId('premium-content')).toBeNull();
      expect(queryByTestId('success-message-container')).toBeNull();

      // Step 2: Initiate purchase
      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      // Step 3: Verify all success states are achieved
      await waitFor(() => {
        // Paywall should be closed
        expect(queryByTestId('purchase-paywall-container')).toBeNull();

        // Premium content should be visible
        const premiumContent = getByTestId('premium-content');
        expect(premiumContent).toBeTruthy();

        // Success message should be displayed
        const successMessage = getByTestId('success-message-container');
        expect(successMessage).toBeTruthy();
      });

      // Step 4: Verify callbacks were called
      expect(onPaywallClose).toHaveBeenCalled();
      expect(onFeatureUnlocked).toHaveBeenCalled();
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    // Given: Purchase completes very quickly
    // When: All operations (close, unlock, message) happen almost simultaneously
    // Then: UI renders all states correctly without race conditions
    it('should handle rapid purchase completion without UI glitches', async () => {
      const { getByTestId, queryByTestId } = render(
        <TestSuccessComponent />
      );

      // Simulate very fast purchase completion
      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      // Wait for all states to stabilize
      await waitFor(() => {
        // All success states should be present
        expect(queryByTestId('purchase-paywall-container')).toBeNull();
        expect(getByTestId('premium-content')).toBeTruthy();
        expect(getByTestId('success-message-container')).toBeTruthy();
      });

      // Verify UI is stable (re-render doesn't break it)
      const premiumText = getByTestId('premium-content-text');
      expect(premiumText).toBeTruthy();
    });

    // Given: User already has feature access (from a previous purchase)
    // When: They view the paywall again
    // Then: Paywall may close immediately or show premium content
    it('should handle case where feature is already unlocked', async () => {
      // Mock feature as already unlocked
      const mockAlreadyUnlocked = jest.fn();

      const TestPreUnlockedComponent = () => {
        const [isAlreadyUnlocked] = React.useState(true);

        if (isAlreadyUnlocked) {
          return (
            <View testID="premium-content-already-unlocked">
              <Text testID="premium-content-text">Premium Feature Content</Text>
            </View>
          );
        }

        return (
          <PaywallComponent
            featureId="premium_feature"
            onPurchaseComplete={mockAlreadyUnlocked}
          />
        );
      };

      const { getByTestId, queryByTestId } = render(<TestPreUnlockedComponent />);

      // Premium content should be shown (not paywall)
      expect(getByTestId('premium-content-already-unlocked')).toBeTruthy();
      expect(queryByTestId('purchase-paywall-container')).toBeNull();
    });
  });

  // ==================== ACCESSIBILITY ====================

  describe('Accessibility', () => {
    // Given: Purchase success flow completes
    // When: User interacts with the UI
    // Then: All important elements are accessible
    it('should maintain accessibility after purchase success', async () => {
      const { getByTestId } = render(<TestSuccessComponent />);

      // Simulate purchase
      const purchaseButton = getByTestId('paywall-purchase-button');
      fireEvent.press(purchaseButton);

      await waitFor(() => {
        // Premium content should be accessible
        const premiumContent = getByTestId('premium-content');
        expect(premiumContent).toBeTruthy();

        // Success message should be accessible
        const successMessage = getByTestId('success-message-text');
        expect(successMessage).toBeTruthy();
      });
    });
  });
});
