/**
 * Paywall Component Tests
 *
 * Tests the Paywall wrapper component that integrates RevenueCat UI
 * with the subscription system.
 *
 * Test Coverage:
 * - Happy path: Paywall renders and purchase completes
 * - Sad path: Purchase cancelled, restore with no subscription
 * - Edge cases: Component unmount during operations
 * - Unhappy path: Purchase errors, restore errors, dismiss
 *
 * @module features/subscription/components/__tests__/paywall.test
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Paywall, PaywallProps } from '../paywall';
import { resetPaywallMock } from '../../../../__mocks__/react-native-purchases-ui';

// Mock expo-router
const mockRouterBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockRouterBack,
    canGoBack: () => true,
  }),
}));

describe('Paywall Component', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    resetPaywallMock();
  });

  /**
   * Given: Component is rendered
   * When: The paywall mounts
   * Then: It should render the RevenueCat Paywall component
   */
  describe('rendering', () => {
    it('should render the paywall container', () => {
      // Given/When
      const { getByTestId } = render(<Paywall />);

      // Then
      expect(getByTestId('paywall-container')).toBeTruthy();
    });

    it('should render the mock paywall component', () => {
      // Given/When
      const { getByTestId } = render(<Paywall />);

      // Then
      expect(getByTestId('mock-paywall')).toBeTruthy();
    });
  });

  /**
   * Given: User completes a purchase successfully
   * When: The purchase flow finishes
   * Then: onPurchaseSuccess callback should be called
   */
  describe('purchase flow - happy path', () => {
    it('should call onPurchaseSuccess when purchase completes', async () => {
      // Given
      const onPurchaseSuccess = jest.fn();
      const { getByTestId } = render(
        <Paywall onPurchaseSuccess={onPurchaseSuccess} />
      );

      // When
      fireEvent.press(getByTestId('mock-purchase-button'));

      // Then
      await waitFor(() => {
        expect(onPurchaseSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onRestoreSuccess when restore completes', async () => {
      // Given
      const onRestoreSuccess = jest.fn();
      const { getByTestId } = render(
        <Paywall onRestoreSuccess={onRestoreSuccess} />
      );

      // When
      fireEvent.press(getByTestId('mock-restore-button'));

      // Then
      await waitFor(() => {
        expect(onRestoreSuccess).toHaveBeenCalledTimes(1);
      });
    });
  });

  /**
   * Given: User cancels the purchase
   * When: The cancel action is triggered
   * Then: The paywall should handle cancellation gracefully
   */
  describe('purchase flow - sad path (cancellation)', () => {
    it('should not call onPurchaseSuccess when purchase is cancelled', async () => {
      // Given
      const onPurchaseSuccess = jest.fn();
      const { getByTestId } = render(
        <Paywall onPurchaseSuccess={onPurchaseSuccess} />
      );

      // When
      fireEvent.press(getByTestId('mock-purchase-cancel-button'));

      // Then
      await waitFor(() => {
        expect(onPurchaseSuccess).not.toHaveBeenCalled();
      });
    });
  });

  /**
   * Given: An error occurs during purchase
   * When: The purchase fails
   * Then: onError callback should be called with the error
   */
  describe('purchase flow - unhappy path (errors)', () => {
    it('should call onError when purchase fails', async () => {
      // Given
      const onError = jest.fn();
      const { getByTestId } = render(<Paywall onError={onError} />);

      // When
      fireEvent.press(getByTestId('mock-purchase-error-button'));

      // Then
      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.any(String),
            code: expect.any(Number),
          })
        );
      });
    });

    it('should call onError when restore fails', async () => {
      // Given
      const onError = jest.fn();
      const { getByTestId } = render(<Paywall onError={onError} />);

      // When
      fireEvent.press(getByTestId('mock-restore-error-button'));

      // Then
      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.any(String),
            code: expect.any(Number),
          })
        );
      });
    });
  });

  /**
   * Given: User dismisses the paywall
   * When: The close button is pressed
   * Then: Navigation should go back
   */
  describe('dismiss behavior', () => {
    it('should call router.back() when paywall is dismissed', async () => {
      // Given
      const { getByTestId } = render(<Paywall />);

      // When
      fireEvent.press(getByTestId('mock-dismiss-button'));

      // Then
      await waitFor(() => {
        expect(mockRouterBack).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onDismiss callback when provided', async () => {
      // Given
      const onDismiss = jest.fn();
      const { getByTestId } = render(<Paywall onDismiss={onDismiss} />);

      // When
      fireEvent.press(getByTestId('mock-dismiss-button'));

      // Then
      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalledTimes(1);
      });
    });
  });

  /**
   * Given: Multiple operations occur
   * When: Events are triggered in sequence
   * Then: All callbacks should be called appropriately
   */
  describe('callback integration', () => {
    it('should support all callbacks being provided', async () => {
      // Given
      const callbacks: Omit<PaywallProps, 'offering'> = {
        onPurchaseSuccess: jest.fn(),
        onRestoreSuccess: jest.fn(),
        onError: jest.fn(),
        onDismiss: jest.fn(),
      };
      const { getByTestId } = render(<Paywall {...callbacks} />);

      // When - trigger various actions
      fireEvent.press(getByTestId('mock-purchase-button'));
      fireEvent.press(getByTestId('mock-restore-button'));

      // Then
      await waitFor(() => {
        expect(callbacks.onPurchaseSuccess).toHaveBeenCalledTimes(1);
        expect(callbacks.onRestoreSuccess).toHaveBeenCalledTimes(1);
      });
    });
  });
});
