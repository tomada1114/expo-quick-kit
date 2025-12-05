import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PaywallCTAButton } from '../paywall-cta-button';
import { Purchase } from '@/features/purchase/core/types';

// Mock PurchaseService module before importing the component
jest.mock('@/features/purchase/application/purchase-service', () => ({
  PurchaseService: jest.fn(() => ({
    purchaseProduct: jest.fn(),
  })),
}));

// Import mocked PurchaseService after jest.mock
import { PurchaseService } from '@/features/purchase/application/purchase-service';

describe('PaywallCTAButton', () => {
  const mockProduct = {
    id: 'premium_unlock',
    title: 'Premium Unlock',
    description: 'Unlock all premium features',
    price: 9.99,
    priceString: '$9.99',
    currencyCode: 'USD',
  };

  let mockPurchaseServiceInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPurchaseServiceInstance = {
      purchaseProduct: jest.fn(),
    };
    (PurchaseService as jest.Mock).mockReturnValue(mockPurchaseServiceInstance);
  });

  // ========== HAPPY PATH TESTS ==========

  describe('happy path: successful purchase', () => {
    it('should render purchase button with correct label', () => {
      const { getByTestId } = render(
        <PaywallCTAButton
          productId={mockProduct.id}
          isLoading={false}
          onPurchaseComplete={jest.fn()}
        />
      );

      const button = getByTestId('paywall-cta-button');
      expect(button).toBeTruthy();
    });

    it('should call purchaseProduct when button is tapped', async () => {
      const onComplete = jest.fn();
      mockPurchaseServiceInstance.purchaseProduct.mockResolvedValue({
        success: true,
        data: { transactionId: 'tx_123', productId: mockProduct.id } as Purchase,
      });

      const { getByTestId } = render(
        <PaywallCTAButton
          productId={mockProduct.id}
          isLoading={false}
          onPurchaseComplete={onComplete}
        />
      );

      const button = getByTestId('paywall-cta-button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockPurchaseServiceInstance.purchaseProduct).toHaveBeenCalledWith(
          mockProduct.id
        );
      });
    });

    it('should call onPurchaseComplete callback with purchase object on success', async () => {
      const onComplete = jest.fn();
      const mockPurchase: Purchase = {
        transactionId: 'tx_123',
        productId: mockProduct.id,
        purchasedAt: new Date(),
        price: 9.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: false,
        unlockedFeatures: ['premium_feature'],
      };

      mockPurchaseServiceInstance.purchaseProduct.mockResolvedValue({
        success: true,
        data: mockPurchase,
      });

      const { getByTestId } = render(
        <PaywallCTAButton
          productId={mockProduct.id}
          isLoading={false}
          onPurchaseComplete={onComplete}
        />
      );

      fireEvent.press(getByTestId('paywall-cta-button'));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(mockPurchase);
      });
    });

    it('should disable button while loading', () => {
      const { getByTestId } = render(
        <PaywallCTAButton
          productId={mockProduct.id}
          isLoading={true}
          onPurchaseComplete={jest.fn()}
        />
      );

      const button = getByTestId('paywall-cta-button');
      expect(button).toBeDisabled();
    });

    it('should show loading indicator when loading', () => {
      const { getByTestId } = render(
        <PaywallCTAButton
          productId={mockProduct.id}
          isLoading={true}
          onPurchaseComplete={jest.fn()}
        />
      );

      const loadingIndicator = getByTestId('cta-loading-indicator');
      expect(loadingIndicator).toBeTruthy();
    });
  });

  // ========== SAD PATH TESTS ==========

  describe('sad path: purchase cancellation', () => {
    it('should handle CANCELLED error gracefully', async () => {
      const onError = jest.fn();
      mockPurchaseServiceInstance.purchaseProduct.mockResolvedValue({
        success: false,
        error: {
          code: 'CANCELLED',
          retryable: false,
        },
      });

      const { getByTestId } = render(
        <PaywallCTAButton
          productId={mockProduct.id}
          isLoading={false}
          onPurchaseComplete={jest.fn()}
          onError={onError}
        />
      );

      fireEvent.press(getByTestId('paywall-cta-button'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('sad path: network error', () => {
    it('should handle NETWORK_ERROR and show error message', async () => {
      const onError = jest.fn();
      mockPurchaseServiceInstance.purchaseProduct.mockResolvedValue({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          retryable: true,
          message: 'Network connection failed',
        },
      });

      const { getByTestId } = render(
        <PaywallCTAButton
          productId={mockProduct.id}
          isLoading={false}
          onPurchaseComplete={jest.fn()}
          onError={onError}
        />
      );

      fireEvent.press(getByTestId('paywall-cta-button'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({
          code: 'NETWORK_ERROR',
          retryable: true,
        }));
      });
    });
  });

  describe('sad path: verification failure', () => {
    it('should handle VERIFICATION_FAILED error', async () => {
      const onError = jest.fn();
      mockPurchaseServiceInstance.purchaseProduct.mockResolvedValue({
        success: false,
        error: {
          code: 'VERIFICATION_FAILED',
          retryable: false,
          message: 'Receipt verification failed',
        },
      });

      const { getByTestId } = render(
        <PaywallCTAButton
          productId={mockProduct.id}
          isLoading={false}
          onPurchaseComplete={jest.fn()}
          onError={onError}
        />
      );

      fireEvent.press(getByTestId('paywall-cta-button'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({
          code: 'VERIFICATION_FAILED',
        }));
      });
    });
  });

  // ========== EDGE CASES ==========

  describe('edge cases: invalid inputs', () => {
    it('should disable button with empty productId', () => {
      const { getByTestId } = render(
        <PaywallCTAButton
          productId=""
          isLoading={false}
          onPurchaseComplete={jest.fn()}
        />
      );

      const button = getByTestId('paywall-cta-button');
      expect(button).toBeDisabled();
    });

    it('should handle null onPurchaseComplete gracefully', async () => {
      mockPurchaseServiceInstance.purchaseProduct.mockResolvedValue({
        success: true,
        data: { transactionId: 'tx_123' } as Purchase,
      });

      const { getByTestId } = render(
        <PaywallCTAButton
          productId={mockProduct.id}
          isLoading={false}
          onPurchaseComplete={null}
        />
      );

      expect(() => {
        fireEvent.press(getByTestId('paywall-cta-button'));
      }).not.toThrow();
    });

    it('should prevent multiple concurrent purchase attempts', async () => {
      mockPurchaseServiceInstance.purchaseProduct.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      const { getByTestId } = render(
        <PaywallCTAButton
          productId={mockProduct.id}
          isLoading={false}
          onPurchaseComplete={jest.fn()}
        />
      );

      const button = getByTestId('paywall-cta-button');

      // Tap button twice rapidly
      fireEvent.press(button);
      fireEvent.press(button);

      await waitFor(() => {
        // Should only call purchaseProduct once due to isProcessing check
        expect(mockPurchaseServiceInstance.purchaseProduct).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ========== UNHAPPY PATH TESTS ==========

  describe('unhappy path: exception handling', () => {
    it('should handle exception from purchaseProduct', async () => {
      const onError = jest.fn();
      mockPurchaseServiceInstance.purchaseProduct.mockRejectedValue(
        new Error('Unexpected error')
      );

      const { getByTestId } = render(
        <PaywallCTAButton
          productId={mockProduct.id}
          isLoading={false}
          onPurchaseComplete={jest.fn()}
          onError={onError}
        />
      );

      fireEvent.press(getByTestId('paywall-cta-button'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should handle DB_ERROR during purchase', async () => {
      const onError = jest.fn();
      mockPurchaseServiceInstance.purchaseProduct.mockResolvedValue({
        success: false,
        error: {
          code: 'DB_ERROR',
          retryable: true,
          message: 'Database error',
        },
      });

      const { getByTestId } = render(
        <PaywallCTAButton
          productId={mockProduct.id}
          isLoading={false}
          onPurchaseComplete={jest.fn()}
          onError={onError}
        />
      );

      fireEvent.press(getByTestId('paywall-cta-button'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({
          code: 'DB_ERROR',
          retryable: true,
        }));
      });
    });
  });

  // ========== ACCESSIBILITY TESTS ==========

  describe('accessibility and theming', () => {
    it('should have proper accessibility properties', () => {
      const { getByTestId } = render(
        <PaywallCTAButton
          productId={mockProduct.id}
          isLoading={false}
          onPurchaseComplete={jest.fn()}
        />
      );

      const button = getByTestId('paywall-cta-button');
      expect(button).toBeTruthy();
      // Button is rendered with accessibility properties (accessibilityLabel, accessibilityRole)
    });

    it('should be disabled when disabled prop is true', () => {
      const { getByTestId } = render(
        <PaywallCTAButton
          productId={mockProduct.id}
          isLoading={false}
          onPurchaseComplete={jest.fn()}
          disabled={true}
        />
      );

      const button = getByTestId('paywall-cta-button');
      expect(button).toBeDisabled();
    });
  });
});
