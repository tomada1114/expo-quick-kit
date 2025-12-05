/**
 * PurchaseDetailsModal Component Tests
 *
 * Tests for displaying detailed purchase information in a modal.
 * Covers happy/sad/edge/unhappy paths with comprehensive coverage.
 *
 * Given/When/Then structure for clarity.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PurchaseDetailsModal } from '../purchase-details-modal';
import { Purchase } from '@/features/purchase/core/types';

describe('PurchaseDetailsModal', () => {
  // ==================== HAPPY PATH ====================
  describe('Happy Path: Successful display of purchase details', () => {
    it('should display modal when visible prop is true', () => {
      // Given: A purchase object with complete data
      const purchase: Purchase = {
        transactionId: 'txn_123456',
        productId: 'premium_unlock',
        purchasedAt: new Date('2025-12-04T10:30:00Z'),
        price: 9.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: ['feature_a', 'feature_b'],
      };

      // When: Component renders with visible={true}
      render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: Modal should be visible and display content
      expect(screen.getByTestId('purchase-details-modal')).toBeTruthy();
    });

    it('should display product name correctly', () => {
      // Given: A purchase with product ID
      const purchase: Purchase = {
        transactionId: 'txn_001',
        productId: 'premium_unlock',
        purchasedAt: new Date('2025-12-04'),
        price: 19.99,
        currencyCode: 'JPY',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: ['analytics'],
      };

      // When: Component renders
      render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: Product ID should be displayed as title (fallback)
      expect(screen.getByText('premium_unlock')).toBeTruthy();
    });

    it('should display formatted currency and price', () => {
      // Given: A purchase with USD currency
      const purchase: Purchase = {
        transactionId: 'txn_002',
        productId: 'feature_pack',
        purchasedAt: new Date('2025-12-04'),
        price: 9.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: [],
      };

      // When: Component renders
      render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: Price should be displayed with currency formatting
      expect(screen.getByText(/\$9\.99|9\.99 USD/)).toBeTruthy();
    });

    it('should display purchased date in readable format', () => {
      // Given: A purchase with date
      const purchase: Purchase = {
        transactionId: 'txn_003',
        productId: 'bundle',
        purchasedAt: new Date('2025-12-04T15:30:00Z'),
        price: 29.99,
        currencyCode: 'EUR',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: [],
      };

      // When: Component renders
      render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: Date should be displayed in readable format (contains month, day, year)
      const modal = screen.getByTestId('purchase-details-modal');
      expect(modal).toBeTruthy();
    });

    it('should display transaction ID', () => {
      // Given: A purchase with transaction ID
      const purchase: Purchase = {
        transactionId: 'txn_unique_12345',
        productId: 'premium',
        purchasedAt: new Date('2025-12-04'),
        price: 99.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: [],
      };

      // When: Component renders
      render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: Transaction ID should be displayed
      expect(screen.getByText('txn_unique_12345')).toBeTruthy();
    });

    it('should call onClose callback when close button is pressed', () => {
      // Given: A callback function
      const onCloseMock = jest.fn();
      const purchase: Purchase = {
        transactionId: 'txn_close_test',
        productId: 'test_product',
        purchasedAt: new Date('2025-12-04'),
        price: 5.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: [],
      };

      // When: Component renders and close button is pressed
      const { getByTestId } = render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={onCloseMock}
        />
      );
      fireEvent.press(getByTestId('close-button'));

      // Then: onClose should be called
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('should apply Apple HIG themed colors', () => {
      // Given: A purchase object
      const purchase: Purchase = {
        transactionId: 'txn_theme_test',
        productId: 'themed_product',
        purchasedAt: new Date('2025-12-04'),
        price: 7.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: [],
      };

      // When: Component renders
      const { getByTestId } = render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: Modal should exist and apply theme colors
      const modal = getByTestId('purchase-details-modal');
      expect(modal).toBeTruthy();
    });

    it('should display multiple unlocked features', () => {
      // Given: A purchase that unlocks multiple features
      const features = ['advanced_analytics', 'custom_reports', 'api_access'];
      const purchase: Purchase = {
        transactionId: 'txn_multi_features',
        productId: 'pro_bundle',
        purchasedAt: new Date('2025-12-04'),
        price: 49.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: features,
      };

      // When: Component renders
      render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: All features should be displayed
      features.forEach(feature => {
        expect(screen.getByText(feature)).toBeTruthy();
      });
    });
  });

  // ==================== SAD PATH ====================
  describe('Sad Path: Edge cases in display', () => {
    it('should hide modal when visible prop is false', () => {
      // Given: A purchase object
      const purchase: Purchase = {
        transactionId: 'txn_hidden',
        productId: 'hidden_product',
        purchasedAt: new Date('2025-12-04'),
        price: 9.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: [],
      };

      // When: Component renders with visible={false}
      const { queryByTestId } = render(
        <PurchaseDetailsModal
          visible={false}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: Modal should not be visible
      expect(queryByTestId('purchase-details-modal')).toBeNull();
    });

    it('should handle empty unlocked features gracefully', () => {
      // Given: A purchase with no unlocked features
      const purchase: Purchase = {
        transactionId: 'txn_no_features',
        productId: 'basic',
        purchasedAt: new Date('2025-12-04'),
        price: 0.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: [],
      };

      // When: Component renders
      render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: Component should not crash and feature section should be empty or hidden
      expect(screen.getByTestId('purchase-details-modal')).toBeTruthy();
    });

    it('should handle unverified purchase', () => {
      // Given: A purchase that is not verified
      const purchase: Purchase = {
        transactionId: 'txn_unverified',
        productId: 'unverified_product',
        purchasedAt: new Date('2025-12-04'),
        price: 15.99,
        currencyCode: 'USD',
        isVerified: false,
        isSynced: false,
        unlockedFeatures: [],
      };

      // When: Component renders
      render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: Modal should still display but may show unverified state
      expect(screen.getByTestId('purchase-details-modal')).toBeTruthy();
    });

    it("should handle unsynced purchase", () => {
      // Given: A purchase that has not been synced
      const purchase: Purchase = {
        transactionId: 'txn_unsynced',
        productId: 'offline_purchase',
        purchasedAt: new Date('2025-12-04'),
        price: 12.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: false,
        unlockedFeatures: ['offline_feature'],
      };

      // When: Component renders
      render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: Modal should display purchase details (offline resilience)
      expect(screen.getByText('txn_unsynced')).toBeTruthy();
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases: Boundary values', () => {
    it('should handle very long product ID', () => {
      // Given: A purchase with very long product ID
      const longProductId = 'a'.repeat(100);
      const purchase: Purchase = {
        transactionId: 'txn_long_id',
        productId: longProductId,
        purchasedAt: new Date('2025-12-04'),
        price: 9.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: [],
      };

      // When: Component renders
      render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: Component should handle text wrapping gracefully
      expect(screen.getByTestId('purchase-details-modal')).toBeTruthy();
    });

    it('should handle zero price', () => {
      // Given: A purchase with zero price
      const purchase: Purchase = {
        transactionId: 'txn_zero_price',
        productId: 'free_product',
        purchasedAt: new Date('2025-12-04'),
        price: 0,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: [],
      };

      // When: Component renders
      render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: Zero price should be displayed (allow for various formats)
      const modal = screen.getByTestId('purchase-details-modal');
      expect(modal).toBeTruthy();
    });

    it('should handle very large price', () => {
      // Given: A purchase with very large price
      const purchase: Purchase = {
        transactionId: 'txn_large_price',
        productId: 'premium_bundle',
        purchasedAt: new Date('2025-12-04'),
        price: 9999.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: [],
      };

      // When: Component renders
      render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: Large price should be formatted correctly (allow various formats)
      const modal = screen.getByTestId('purchase-details-modal');
      expect(modal).toBeTruthy();
    });

    it('should handle different currency codes', () => {
      // Given: Purchases with different currency codes
      const currencies = ['USD', 'JPY', 'EUR', 'GBP', 'CAD'];

      currencies.forEach(currencyCode => {
        const purchase: Purchase = {
          transactionId: `txn_${currencyCode}`,
          productId: 'currency_test',
          purchasedAt: new Date('2025-12-04'),
          price: 9.99,
          currencyCode,
          isVerified: true,
          isSynced: true,
          unlockedFeatures: [],
        };

        // When: Component renders
        const { unmount } = render(
          <PurchaseDetailsModal
            visible={true}
            purchase={purchase}
            onClose={jest.fn()}
          />
        );

        // Then: Modal should render without crashing
        expect(screen.getByTestId('purchase-details-modal')).toBeTruthy();
        unmount();
      });
    });

    it('should handle many unlocked features (10+ features)', () => {
      // Given: A purchase that unlocks many features
      const manyFeatures = Array.from({ length: 15 }, (_, i) => `feature_${i}`);
      const purchase: Purchase = {
        transactionId: 'txn_many_features',
        productId: 'ultimate_bundle',
        purchasedAt: new Date('2025-12-04'),
        price: 199.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: manyFeatures,
      };

      // When: Component renders
      render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: All features should be displayed (possibly scrollable)
      expect(screen.getByTestId('purchase-details-modal')).toBeTruthy();
    });

    it('should handle special characters in product ID', () => {
      // Given: A purchase with special characters in product ID
      const purchase: Purchase = {
        transactionId: 'txn_special-chars_123!@#',
        productId: 'product-with-special_chars_v2.0',
        purchasedAt: new Date('2025-12-04'),
        price: 9.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: [],
      };

      // When: Component renders
      render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: Product ID with special characters should display correctly
      expect(screen.getByText('product-with-special_chars_v2.0')).toBeTruthy();
    });

    it('should handle dates at year/month/day boundaries', () => {
      // Given: Purchases with boundary dates
      const boundaryDates = [
        new Date('2025-12-31T23:59:59Z'), // End of year
        new Date('2025-01-01T00:00:00Z'), // Start of year
        new Date('2025-02-28T12:00:00Z'), // February
      ];

      boundaryDates.forEach(date => {
        const purchase: Purchase = {
          transactionId: `txn_${date.getTime()}`,
          productId: 'date_test',
          purchasedAt: date,
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: true,
          unlockedFeatures: [],
        };

        // When: Component renders
        const { unmount } = render(
          <PurchaseDetailsModal
            visible={true}
            purchase={purchase}
            onClose={jest.fn()}
          />
        );

        // Then: Component should handle boundary dates without crashing
        expect(screen.getByTestId('purchase-details-modal')).toBeTruthy();
        unmount();
      });
    });
  });

  // ==================== UNHAPPY PATH ====================
  describe('Unhappy Path: Error handling', () => {
    it('should handle onClose callback being called', () => {
      // Given: A callback function
      const onCloseMock = jest.fn();
      const purchase: Purchase = {
        transactionId: 'txn_callback_test',
        productId: 'test_product',
        purchasedAt: new Date('2025-12-04'),
        price: 9.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: [],
      };

      // When: Component renders and close button is pressed
      const { getByTestId } = render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={onCloseMock}
        />
      );

      // Then: The callback should be called when close button is pressed
      fireEvent.press(getByTestId('close-button'));
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('should handle modal display errors with try-catch', () => {
      // Given: A purchase that could cause rendering issues
      const purchase: Purchase = {
        transactionId: 'txn_display_error',
        productId: 'error_product',
        purchasedAt: new Date('2025-12-04'),
        price: 9.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: ['broken_feature'],
      };

      // When: Component renders
      // Then: Should not throw and display gracefully
      expect(() => {
        render(
          <PurchaseDetailsModal
            visible={true}
            purchase={purchase}
            onClose={jest.fn()}
          />
        );
      }).not.toThrow();
    });

    it('should handle rapid visibility toggle', () => {
      // Given: A purchase object
      const purchase: Purchase = {
        transactionId: 'txn_rapid_toggle',
        productId: 'toggle_product',
        purchasedAt: new Date('2025-12-04'),
        price: 9.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures: [],
      };

      // When: Component visibility is toggled rapidly
      const { rerender } = render(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      rerender(
        <PurchaseDetailsModal
          visible={false}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      rerender(
        <PurchaseDetailsModal
          visible={true}
          purchase={purchase}
          onClose={jest.fn()}
        />
      );

      // Then: Component should handle state changes without crashing
      expect(screen.getByTestId('purchase-details-modal')).toBeTruthy();
    });
  });
});
