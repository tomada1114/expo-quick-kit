/**
 * Android Google Play Billing Repository Tests
 *
 * Tests for Android-specific purchase repository implementation.
 * Covers product metadata retrieval, purchase flow, and offline caching.
 *
 * @module features/purchase/infrastructure/__tests__/repository-android.test
 */

import type { Transaction, PurchaseError, Product } from '../../core/types';
import { createAndroidBillingRepository } from '../repository-android';

/**
 * Mock types for Google Play Billing Library
 */
interface MockProductDetails {
  productId: string;
  title: string;
  description: string;
  oneTimePurchaseOfferDetails?: {
    priceMicros: number;
    formattedPrice: string;
    currencyCode: string;
  };
}

interface MockPurchaseDetails {
  purchaseToken: string;
  productIds: string[];
  purchaseTimeMs: number;
  purchaseState: 0 | 1; // 0 = purchased, 1 = pending
  signature: string;
  originalJson: string;
}

/**
 * Mock Google Play Billing Client
 */
const createMockBillingClient = () => ({
  queryProductDetails: jest
    .fn()
    .mockResolvedValue({
      productDetailsList: [
        {
          productId: 'premium_unlock',
          title: 'Premium Unlock',
          description: 'Unlock all premium features',
          oneTimePurchaseOfferDetails: {
            priceMicros: 9990000,
            formattedPrice: '$9.99',
            currencyCode: 'USD',
          },
        } as MockProductDetails,
      ],
      billingResult: {
        responseCode: 0,
        debugMessage: 'OK',
      },
    }),
  launchBillingFlow: jest.fn().mockResolvedValue({
    responseCode: 0,
    debugMessage: 'OK',
  }),
  queryPurchasesAsync: jest.fn().mockResolvedValue([
    {
      purchaseToken: 'token-123',
      productIds: ['premium_unlock'],
      purchaseTimeMs: Date.now(),
      purchaseState: 0,
      signature: 'sig-123',
      originalJson: '{"orderId":"order-123"}',
    } as MockPurchaseDetails,
  ]),
});

describe('Android Google Play Billing Repository', () => {
  let mockBillingClient: ReturnType<typeof createMockBillingClient>;

  beforeEach(() => {
    mockBillingClient = createMockBillingClient();
    jest.clearAllMocks();
  });

  describe('loadProductMetadata', () => {
    it('Given product IDs, When metadata retrieved, Then returns Product array', async () => {
      // Arrange
      const repository = createAndroidBillingRepository(mockBillingClient);
      const productIds = ['premium_unlock'];

      // Act
      const result = await repository.loadProductMetadata(productIds);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const products = result.data;
        expect(products).toHaveLength(1);
        expect(products[0]).toEqual({
          id: 'premium_unlock',
          title: 'Premium Unlock',
          description: 'Unlock all premium features',
          price: 9.99,
          priceString: '$9.99',
          currencyCode: 'USD',
        });
      }
    });

    it('When network error occurs, Then returns retryable error', async () => {
      // Arrange
      mockBillingClient.queryProductDetails.mockRejectedValueOnce(
        new Error('Network unavailable')
      );
      const repository = createAndroidBillingRepository(mockBillingClient);
      const productIds = ['premium_unlock'];

      // Act
      const result = await repository.loadProductMetadata(productIds);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error as Extract<
          PurchaseError,
          { code: 'NETWORK_ERROR' }
        >;
        expect(error.code).toBe('NETWORK_ERROR');
        expect(error.retryable).toBe(true);
        expect(error.platform).toBe('android');
      }
    });

    it('When product details list is empty, Then returns empty Product array', async () => {
      // Arrange
      mockBillingClient.queryProductDetails.mockResolvedValueOnce({
        productDetailsList: [],
        billingResult: { responseCode: 0, debugMessage: 'OK' },
      });
      const repository = createAndroidBillingRepository(mockBillingClient);
      const productIds = ['unknown_product'];

      // Act
      const result = await repository.loadProductMetadata(productIds);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('When BillingClient error, Then returns STORE_PROBLEM_ERROR', async () => {
      // Arrange
      mockBillingClient.queryProductDetails.mockResolvedValueOnce({
        productDetailsList: [],
        billingResult: {
          responseCode: 6,
          debugMessage: 'Service is unavailable',
        },
      });
      const repository = createAndroidBillingRepository(mockBillingClient);
      const productIds = ['premium_unlock'];

      // Act
      const result = await repository.loadProductMetadata(productIds);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error as Extract<
          PurchaseError,
          { code: 'STORE_PROBLEM_ERROR' }
        >;
        expect(error.code).toBe('STORE_PROBLEM_ERROR');
        expect(error.retryable).toBe(true);
      }
    });
  });

  describe('getCachedProducts', () => {
    it('When cache available, Then returns cached products', async () => {
      // Arrange
      const repository = createAndroidBillingRepository(mockBillingClient);
      const productIds = ['premium_unlock'];

      // First load populates cache
      await repository.loadProductMetadata(productIds);

      // Act - Call cache
      const cachedProducts = await repository.getCachedProducts();

      // Assert
      expect(cachedProducts).toHaveLength(1);
      expect(cachedProducts[0].id).toBe('premium_unlock');
    });

    it('When no cache, Then returns empty array', async () => {
      // Arrange
      const repository = createAndroidBillingRepository(mockBillingClient);

      // Act
      const cachedProducts = await repository.getCachedProducts();

      // Assert
      expect(cachedProducts).toEqual([]);
    });
  });

  describe('launchPurchaseFlow', () => {
    it('Given product ID, When purchase flow completes, Then returns Transaction', async () => {
      // Arrange
      const repository = createAndroidBillingRepository(mockBillingClient);
      const productId = 'premium_unlock';

      // Mock successful purchase - should return purchase details
      mockBillingClient.launchBillingFlow.mockResolvedValueOnce({
        responseCode: 0,
        purchaseDetails: {
          purchaseToken: 'token-456',
          productIds: ['premium_unlock'],
          purchaseTimeMs: 1700000000000,
          purchaseState: 0,
          signature: 'sig-456',
          originalJson: '{"orderId":"order-456"}',
        } as MockPurchaseDetails,
      });

      // Act
      const result = await repository.launchPurchaseFlow(productId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const transaction = result.data as Transaction;
        expect(transaction.transactionId).toBe('token-456');
        expect(transaction.productId).toBe('premium_unlock');
        expect(transaction.signature).toBe('sig-456');
        expect(typeof transaction.receiptData).toBe('string');
      }
    });

    it('When user cancels purchase, Then returns PURCHASE_CANCELLED error', async () => {
      // Arrange
      mockBillingClient.launchBillingFlow.mockResolvedValueOnce({
        responseCode: 1, // BILLING_RESULT_DEVELOPER_ERROR
        debugMessage: 'User cancelled',
      });
      const repository = createAndroidBillingRepository(mockBillingClient);
      const productId = 'premium_unlock';

      // Act
      const result = await repository.launchPurchaseFlow(productId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error as Extract<
          PurchaseError,
          { code: 'PURCHASE_CANCELLED' }
        >;
        expect(error.code).toBe('PURCHASE_CANCELLED');
        expect(error.retryable).toBe(false);
      }
    });

    it('When network error during purchase, Then returns retryable NETWORK_ERROR', async () => {
      // Arrange
      mockBillingClient.launchBillingFlow.mockRejectedValueOnce(
        new Error('Network timeout')
      );
      const repository = createAndroidBillingRepository(mockBillingClient);
      const productId = 'premium_unlock';

      // Act
      const result = await repository.launchPurchaseFlow(productId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error as Extract<
          PurchaseError,
          { code: 'NETWORK_ERROR' }
        >;
        expect(error.code).toBe('NETWORK_ERROR');
        expect(error.retryable).toBe(true);
      }
    });
  });

  describe('requestAllPurchaseHistory', () => {
    it('When transactions exist, Then returns all Transaction array', async () => {
      // Arrange
      const repository = createAndroidBillingRepository(mockBillingClient);

      // Act
      const result = await repository.requestAllPurchaseHistory();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const transactions = result.data;
        expect(transactions).toHaveLength(1);
        expect(transactions[0].transactionId).toBe('token-123');
        expect(transactions[0].productId).toBe('premium_unlock');
      }
    });

    it('When no purchases exist, Then returns empty Transaction array', async () => {
      // Arrange
      mockBillingClient.queryPurchasesAsync.mockResolvedValueOnce([]);
      const repository = createAndroidBillingRepository(mockBillingClient);

      // Act
      const result = await repository.requestAllPurchaseHistory();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('When network error, Then returns retryable error', async () => {
      // Arrange
      mockBillingClient.queryPurchasesAsync.mockRejectedValueOnce(
        new Error('Service unavailable')
      );
      const repository = createAndroidBillingRepository(mockBillingClient);

      // Act
      const result = await repository.requestAllPurchaseHistory();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error as Extract<
          PurchaseError,
          { code: 'NETWORK_ERROR' }
        >;
        expect(error.code).toBe('NETWORK_ERROR');
        expect(error.retryable).toBe(true);
      }
    });
  });

  describe('verifyTransaction', () => {
    it('Given valid transaction, When verified, Then returns success', async () => {
      // Arrange
      const repository = createAndroidBillingRepository(mockBillingClient);
      const transaction: Transaction = {
        transactionId: 'token-123',
        productId: 'premium_unlock',
        purchaseDate: new Date(Date.now()),
        receiptData: 'receipt-data',
        signature: 'valid-signature',
      };

      // Act
      const result = await repository.verifyTransaction(transaction);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('Given transaction without signature, Then returns PURCHASE_INVALID error', async () => {
      // Arrange
      const repository = createAndroidBillingRepository(mockBillingClient);
      const transaction: Transaction = {
        transactionId: 'token-123',
        productId: 'premium_unlock',
        purchaseDate: new Date(Date.now()),
        receiptData: 'receipt-data',
        // missing signature
      };

      // Act
      const result = await repository.verifyTransaction(transaction);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error as Extract<
          PurchaseError,
          { code: 'PURCHASE_INVALID' }
        >;
        expect(error.code).toBe('PURCHASE_INVALID');
        expect(error.reason).toBe('not_signed');
      }
    });
  });
});
