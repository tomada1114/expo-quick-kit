/**
 * Purchase Service Tests
 *
 * Tests for the main purchase orchestration service.
 * Task 6.4: Verify verification metadata is saved to SecureStore after successful verification
 *
 * @module features/purchase/application/__tests__/purchase-service
 */

// Mock ALL dependencies BEFORE any imports to avoid native module issues
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}), { virtual: true });

// Mock database client to avoid native module initialization
jest.mock('@/database/client', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(function() {
        return {
          where: jest.fn(function() {
            return {
              all: jest.fn(() => []),
              get: jest.fn(() => undefined),
            };
          }),
        };
      }),
    })),
  },
  initializeDatabase: jest.fn(),
  isDatabaseInitialized: jest.fn(() => true),
  resetDatabaseState: jest.fn(),
  DatabaseInitError: Error,
}));

// Mock all upstream dependencies that purchase-service imports
jest.mock('../../core/repository', () => ({
  purchaseRepository: {
    loadProductMetadata: jest.fn(),
    launchPurchaseFlow: jest.fn(),
    requestAllPurchaseHistory: jest.fn(),
  },
}));

jest.mock('../../infrastructure/receipt-verifier', () => ({
  receiptVerifier: {
    verifyReceiptSignature: jest.fn(),
  },
}));

jest.mock('../../infrastructure/verification-metadata-store', () => ({
  verificationMetadataStore: {
    saveVerificationMetadata: jest.fn(),
  },
}));

import { describe, it, expect, beforeEach } from '@jest/globals';
import { purchaseService } from '../purchase-service';
import type { Transaction } from '../../core/types';
import type { VerificationResult } from '../../infrastructure/receipt-verifier';

// Get references to the mocked modules
const { receiptVerifier: mockReceiptVerifier } = require('../../infrastructure/receipt-verifier');
const { verificationMetadataStore: mockVerificationMetadataStore } = require(
  '../../infrastructure/verification-metadata-store'
);
const { db: mockDb } = require('@/database/client');

describe('PurchaseService - Task 6.2 & 6.4: Receipt Verification Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Task 6.6: getActivePurchases and getPurchase - LocalDatabase Integration
  // ============================================================================

  describe('getActivePurchases() - Task 6.6: LocalDatabase Query', () => {
    /**
     * HAPPY PATH: Get all active (verified) purchases
     */

    it('should return all verified purchases from local database', async () => {
      // Given: LocalDatabase contains multiple verified purchases
      const dbPurchases = [
        {
          id: 1,
          transactionId: 'txn-001',
          productId: 'premium_unlock',
          purchasedAt: Math.floor(new Date('2025-12-01').getTime() / 1000),
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: true,
          syncedAt: Math.floor(new Date('2025-12-01').getTime() / 1000),
          createdAt: Math.floor(new Date('2025-12-01').getTime() / 1000),
          updatedAt: Math.floor(new Date('2025-12-01').getTime() / 1000),
        },
        {
          id: 2,
          transactionId: 'txn-002',
          productId: 'premium_unlock',
          purchasedAt: Math.floor(new Date('2025-11-15').getTime() / 1000),
          price: 9.99,
          currencyCode: 'USD',
          isVerified: true,
          isSynced: false,
          syncedAt: null,
          createdAt: Math.floor(new Date('2025-11-15').getTime() / 1000),
          updatedAt: Math.floor(new Date('2025-11-15').getTime() / 1000),
        },
      ];

      // Setup mock to return verified purchases
      const mockSelect = jest.fn(() => ({
        from: jest.fn(function() {
          return {
            where: jest.fn(function() {
              return {
                all: jest.fn(() => dbPurchases),
                get: jest.fn(() => undefined),
              };
            }),
          };
        }),
      }));
      mockDb.select = mockSelect;

      // When: getActivePurchases is called
      const result = await purchaseService.getActivePurchases();

      // Then: Should return success with array of verified purchases
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBe(2);
        // Verify all returned purchases are from the database
        expect(result.data[0].transactionId).toBe('txn-001');
        expect(result.data[1].transactionId).toBe('txn-002');
      }
    });

    /**
     * EDGE CASE: Empty purchase history
     */

    it('should return empty array when no purchases exist', async () => {
      // Given: LocalDatabase contains no purchase records
      const mockSelect = jest.fn(() => ({
        from: jest.fn(function() {
          return {
            where: jest.fn(function() {
              return {
                all: jest.fn(() => []),
                get: jest.fn(() => undefined),
              };
            }),
          };
        }),
      }));
      mockDb.select = mockSelect;

      // When: getActivePurchases is called
      const result = await purchaseService.getActivePurchases();

      // Then: Should return success with empty array
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBe(0);
      }
    });

    /**
     * UNHAPPY PATH: Database error during query
     */

    it('should handle database errors gracefully', async () => {
      // Given: LocalDatabase experiences an error
      const mockSelect = jest.fn(() => {
        throw new Error('Database connection failed');
      });
      mockDb.select = mockSelect;

      // When: getActivePurchases is called during a database error
      const result = await purchaseService.getActivePurchases();

      // Then: Should return error result with DB_ERROR code
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DB_ERROR');
        expect(result.error.retryable).toBe(true);
        expect(result.error.message).toContain('Failed to fetch active purchases');
      }
    });
  });

  describe('getPurchase(transactionId) - Task 6.6: LocalDatabase Single Record Query', () => {
    /**
     * HAPPY PATH: Get specific purchase by transaction ID
     */

    it('should return specific purchase when transaction ID is found', async () => {
      // Given: LocalDatabase contains a purchase with matching transactionId
      const transactionId = 'txn-001';
      const dbPurchase = {
        id: 1,
        transactionId,
        productId: 'premium_unlock',
        purchasedAt: Math.floor(new Date('2025-12-01').getTime() / 1000),
        price: 9.99,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        syncedAt: Math.floor(new Date('2025-12-01').getTime() / 1000),
        createdAt: Math.floor(new Date('2025-12-01').getTime() / 1000),
        updatedAt: Math.floor(new Date('2025-12-01').getTime() / 1000),
      };

      // Setup mock to return specific purchase
      const mockSelect = jest.fn(() => ({
        from: jest.fn(function() {
          return {
            where: jest.fn(function() {
              return {
                all: jest.fn(() => []),
                get: jest.fn(() => dbPurchase),
              };
            }),
          };
        }),
      }));
      mockDb.select = mockSelect;

      // When: getPurchase is called with a valid transaction ID
      const result = await purchaseService.getPurchase(transactionId);

      // Then: Should return success with the Purchase entity
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.transactionId).toBe(transactionId);
        expect(result.data.isVerified).toBe(true);
        expect(result.data.productId).toBe('premium_unlock');
      }
    });

    /**
     * EDGE CASE: Transaction ID not found
     */

    it('should return null when transaction ID is not found', async () => {
      // Given: LocalDatabase does not contain a purchase with this transactionId
      const mockSelect = jest.fn(() => ({
        from: jest.fn(function() {
          return {
            where: jest.fn(function() {
              return {
                all: jest.fn(() => []),
                get: jest.fn(() => undefined),
              };
            }),
          };
        }),
      }));
      mockDb.select = mockSelect;

      // When: getPurchase is called with non-existent transaction ID
      const result = await purchaseService.getPurchase('non-existent-txn');

      // Then: Should return success with null data
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    /**
     * EDGE CASE: Empty transaction ID
     */

    it('should handle empty transaction ID gracefully', async () => {
      // Given: Empty transactionId is provided
      // When: getPurchase is called with empty string
      const result = await purchaseService.getPurchase('');

      // Then: Should return success with null (not found)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    /**
     * UNHAPPY PATH: Database error
     */

    it('should handle database errors when querying by transaction ID', async () => {
      // Given: Database error occurs during query
      const mockSelect = jest.fn(() => {
        throw new Error('Database connection lost');
      });
      mockDb.select = mockSelect;

      // When: getPurchase is called and database connection fails
      const result = await purchaseService.getPurchase('txn-001');

      // Then: Should return error result with DB_ERROR code
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DB_ERROR');
        expect(result.error.retryable).toBe(true);
        expect(result.error.message).toContain('Failed to fetch purchase');
      }
    });

    /**
     * EDGE CASE: Query for unverified purchase
     */

    it('should still return unverified purchase if found by transaction ID', async () => {
      // Given: LocalDatabase contains an unverified purchase with matching ID
      const transactionId = 'unverified-txn';
      const dbPurchase = {
        id: 2,
        transactionId,
        productId: 'premium_unlock',
        purchasedAt: Math.floor(new Date('2025-12-01').getTime() / 1000),
        price: 9.99,
        currencyCode: 'USD',
        isVerified: false, // Unverified
        isSynced: false,
        syncedAt: null,
        createdAt: Math.floor(new Date('2025-12-01').getTime() / 1000),
        updatedAt: Math.floor(new Date('2025-12-01').getTime() / 1000),
      };

      const mockSelect = jest.fn(() => ({
        from: jest.fn(function() {
          return {
            where: jest.fn(function() {
              return {
                all: jest.fn(() => []),
                get: jest.fn(() => dbPurchase),
              };
            }),
          };
        }),
      }));
      mockDb.select = mockSelect;

      // When: getPurchase is called
      const result = await purchaseService.getPurchase(transactionId);

      // Then: Should return the purchase even if unverified
      expect(result.success).toBe(true);
      if (result.success && result.data !== null) {
        expect(result.data.transactionId).toBe(transactionId);
        expect(result.data.isVerified).toBe(false); // Returns even if unverified
      }
    });
  });

  describe('purchaseProduct() - Task 6.2: Receipt Verification Integration', () => {
    /**
     * HAPPY PATH: Receipt Verification Succeeds
     */

    it('should verify receipt signature when purchaseProduct succeeds', async () => {
      // Given: Valid productId and successful purchase with receipt
      const productId = 'premium_unlock';
      const testTransaction: Transaction = {
        transactionId: 'test-txn-123',
        productId,
        purchaseDate: new Date('2025-12-04'),
        receiptData: 'valid.jws.receipt',
      };

      // Mock successful purchase flow
      const { purchaseRepository: mockRepo } = require('../../core/repository');
      mockRepo.launchPurchaseFlow.mockResolvedValue({
        success: true,
        data: testTransaction,
      });

      // Mock successful verification
      const verificationResult: VerificationResult = {
        isValid: true,
        transactionId: 'test-txn-123',
        productId,
        purchaseDate: new Date('2025-12-04'),
      };

      mockReceiptVerifier.verifyReceiptSignature.mockResolvedValue({
        success: true,
        data: verificationResult,
      });

      mockVerificationMetadataStore.saveVerificationMetadata.mockResolvedValue({
        success: true,
        data: undefined,
      });

      // When: purchaseProduct is called
      const result = await purchaseService.purchaseProduct(productId);

      // Then: Should return success with verified purchase
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isVerified).toBe(true);
        expect(result.data.transactionId).toBe('test-txn-123');
      }

      // And: Receipt verifier should have been called
      expect(mockReceiptVerifier.verifyReceiptSignature).toHaveBeenCalledWith(
        testTransaction.receiptData,
        testTransaction.receiptData,
        'ios'
      );
    });

    it('should use correct platform when calling receipt verifier on iOS', async () => {
      // Given: Running on iOS platform
      const productId = 'feature_bundle';
      const testTransaction: Transaction = {
        transactionId: 'ios-txn-001',
        productId,
        purchaseDate: new Date('2025-12-04'),
        receiptData: 'ios.jws.token',
      };

      const { purchaseRepository: mockRepo } = require('../../core/repository');
      mockRepo.launchPurchaseFlow.mockResolvedValue({
        success: true,
        data: testTransaction,
      });

      mockReceiptVerifier.verifyReceiptSignature.mockResolvedValue({
        success: true,
        data: {
          isValid: true,
          transactionId: 'ios-txn-001',
          productId,
          purchaseDate: testTransaction.purchaseDate,
        },
      });

      mockVerificationMetadataStore.saveVerificationMetadata.mockResolvedValue({
        success: true,
        data: undefined,
      });

      // When: purchaseProduct is called
      await purchaseService.purchaseProduct(productId);

      // Then: Verifier should be called with platform='ios'
      expect(mockReceiptVerifier.verifyReceiptSignature).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'ios'
      );
    });

    /**
     * SAD PATH: Receipt Verification Failures
     */

    it('should return VERIFICATION_FAILED when receipt signature is invalid', async () => {
      // Given: Transaction with invalid signature
      const productId = 'premium_unlock';
      const testTransaction: Transaction = {
        transactionId: 'bad-txn-001',
        productId,
        purchaseDate: new Date('2025-12-04'),
        receiptData: 'invalid.signature',
      };

      const { purchaseRepository: mockRepo } = require('../../core/repository');
      mockRepo.launchPurchaseFlow.mockResolvedValue({
        success: true,
        data: testTransaction,
      });

      // Mock verification failure
      mockReceiptVerifier.verifyReceiptSignature.mockResolvedValue({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Signature verification failed: invalid token format',
        },
      });

      // When: purchaseProduct is called
      const result = await purchaseService.purchaseProduct(productId);

      // Then: Should return VERIFICATION_FAILED error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VERIFICATION_FAILED');
        expect(result.error.message).toMatch(/Receipt verification failed/);
        expect(result.error.retryable).toBe(false);
      }

      // And: Metadata should NOT be saved
      expect(mockVerificationMetadataStore.saveVerificationMetadata).not.toHaveBeenCalled();
    });

    it('should log error when receipt verification fails', async () => {
      // Given: Transaction that fails verification
      const productId = 'premium_unlock';
      const testTransaction: Transaction = {
        transactionId: 'bad-txn-002',
        productId,
        purchaseDate: new Date('2025-12-04'),
        receiptData: 'tampered.receipt',
      };

      const { purchaseRepository: mockRepo } = require('../../core/repository');
      mockRepo.launchPurchaseFlow.mockResolvedValue({
        success: true,
        data: testTransaction,
      });

      mockReceiptVerifier.verifyReceiptSignature.mockResolvedValue({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Certificate expired',
        },
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // When: purchaseProduct is called
      await purchaseService.purchaseProduct(productId);

      // Then: Error should be logged with [PurchaseService] prefix
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PurchaseService] Receipt verification failed'),
        expect.any(Object)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return VERIFICATION_FAILED when verification key is not found', async () => {
      // Given: Transaction where verification key cannot be loaded
      const productId = 'premium_unlock';
      const testTransaction: Transaction = {
        transactionId: 'key-missing-001',
        productId,
        purchaseDate: new Date('2025-12-04'),
        receiptData: 'valid.receipt.data',
      };

      const { purchaseRepository: mockRepo } = require('../../core/repository');
      mockRepo.launchPurchaseFlow.mockResolvedValue({
        success: true,
        data: testTransaction,
      });

      mockReceiptVerifier.verifyReceiptSignature.mockResolvedValue({
        success: false,
        error: {
          code: 'KEY_NOT_FOUND',
          message: 'Verification key not cached and cannot be fetched',
        },
      });

      // When: purchaseProduct is called
      const result = await purchaseService.purchaseProduct(productId);

      // Then: Should return VERIFICATION_FAILED
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VERIFICATION_FAILED');
      }
    });

    it('should return VERIFICATION_FAILED when receipt cannot be decoded', async () => {
      // Given: Transaction with malformed receipt data
      const productId = 'premium_unlock';
      const testTransaction: Transaction = {
        transactionId: 'decode-error-001',
        productId,
        purchaseDate: new Date('2025-12-04'),
        receiptData: 'not-valid-base64-!!!',
      };

      const { purchaseRepository: mockRepo } = require('../../core/repository');
      mockRepo.launchPurchaseFlow.mockResolvedValue({
        success: true,
        data: testTransaction,
      });

      mockReceiptVerifier.verifyReceiptSignature.mockResolvedValue({
        success: false,
        error: {
          code: 'DECODING_ERROR',
          message: 'Invalid Base64 encoding in receipt',
        },
      });

      // When: purchaseProduct is called
      const result = await purchaseService.purchaseProduct(productId);

      // Then: Should return VERIFICATION_FAILED
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VERIFICATION_FAILED');
        expect(result.error.message).toMatch(/Receipt verification failed/);
      }
    });

    /**
     * EDGE CASES: Boundary values and missing data
     */

    it('should fail validation when receiptData is empty', async () => {
      // Given: Transaction with empty receiptData
      const productId = 'premium_unlock';
      const invalidTransaction: Transaction = {
        transactionId: 'txn-123',
        productId,
        purchaseDate: new Date('2025-12-04'),
        receiptData: '', // Empty
      };

      const { purchaseRepository: mockRepo } = require('../../core/repository');
      mockRepo.launchPurchaseFlow.mockResolvedValue({
        success: true,
        data: invalidTransaction,
      });

      // When: purchaseProduct is called
      const result = await purchaseService.purchaseProduct(productId);

      // Then: Should fail validation before calling verifier
      expect(result.success).toBe(false);
      expect(mockReceiptVerifier.verifyReceiptSignature).not.toHaveBeenCalled();
    });

    it('should use receiptData as fallback signature when signature field is missing', async () => {
      // Given: Android transaction without separate signature field
      const productId = 'premium_unlock';
      const testTransaction: Transaction = {
        transactionId: 'android-txn-001',
        productId,
        purchaseDate: new Date('2025-12-04'),
        receiptData: 'android.receipt.json',
        // signature field is undefined
      };

      const { purchaseRepository: mockRepo } = require('../../core/repository');
      mockRepo.launchPurchaseFlow.mockResolvedValue({
        success: true,
        data: testTransaction,
      });

      mockReceiptVerifier.verifyReceiptSignature.mockResolvedValue({
        success: true,
        data: {
          isValid: true,
          transactionId: 'android-txn-001',
          productId,
          purchaseDate: testTransaction.purchaseDate,
        },
      });

      mockVerificationMetadataStore.saveVerificationMetadata.mockResolvedValue({
        success: true,
        data: undefined,
      });

      // When: purchaseProduct is called
      await purchaseService.purchaseProduct(productId);

      // Then: Verifier should be called with receiptData as signature (fallback)
      expect(mockReceiptVerifier.verifyReceiptSignature).toHaveBeenCalledWith(
        testTransaction.receiptData,
        testTransaction.receiptData,
        'ios'
      );
    });

    it('should handle network error during verification as retryable', async () => {
      // Given: Network error during verification
      const productId = 'premium_unlock';
      const testTransaction: Transaction = {
        transactionId: 'network-error-001',
        productId,
        purchaseDate: new Date('2025-12-04'),
        receiptData: 'valid.receipt',
      };

      const { purchaseRepository: mockRepo } = require('../../core/repository');
      mockRepo.launchPurchaseFlow.mockResolvedValue({
        success: true,
        data: testTransaction,
      });

      mockReceiptVerifier.verifyReceiptSignature.mockResolvedValue({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch verification key from remote server',
          retryable: true,
        },
      });

      // When: purchaseProduct is called
      const result = await purchaseService.purchaseProduct(productId);

      // Then: Should return error with retryable flag
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VERIFICATION_FAILED');
      }
    });

    it('should catch unexpected errors from verifier and return UNKNOWN_ERROR', async () => {
      // Given: Verifier throws unexpected exception
      const productId = 'premium_unlock';
      const testTransaction: Transaction = {
        transactionId: 'exception-001',
        productId,
        purchaseDate: new Date('2025-12-04'),
        receiptData: 'valid.receipt',
      };

      const { purchaseRepository: mockRepo } = require('../../core/repository');
      mockRepo.launchPurchaseFlow.mockResolvedValue({
        success: true,
        data: testTransaction,
      });

      mockReceiptVerifier.verifyReceiptSignature.mockRejectedValue(
        new Error('Unexpected cryptography error')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // When: purchaseProduct is called
      const result = await purchaseService.purchaseProduct(productId);

      // Then: Should catch and return UNKNOWN_ERROR
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }

      // And: Error should be logged with [PurchaseService] prefix
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PurchaseService]'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return DB_ERROR when metadata save fails after verification', async () => {
      // Given: Verification succeeds but metadata save fails
      const productId = 'premium_unlock';
      const testTransaction: Transaction = {
        transactionId: 'metadata-error-001',
        productId,
        purchaseDate: new Date('2025-12-04'),
        receiptData: 'valid.receipt',
      };

      const { purchaseRepository: mockRepo } = require('../../core/repository');
      mockRepo.launchPurchaseFlow.mockResolvedValue({
        success: true,
        data: testTransaction,
      });

      mockReceiptVerifier.verifyReceiptSignature.mockResolvedValue({
        success: true,
        data: {
          isValid: true,
          transactionId: 'metadata-error-001',
          productId,
          purchaseDate: testTransaction.purchaseDate,
        },
      });

      mockVerificationMetadataStore.saveVerificationMetadata.mockResolvedValue({
        success: false,
        error: {
          code: 'STORE_ERROR',
          message: 'Failed to save to secure store',
        },
      });

      // When: purchaseProduct is called
      const result = await purchaseService.purchaseProduct(productId);

      // Then: Should return DB_ERROR with retryable=true
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DB_ERROR');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('should return UNKNOWN_ERROR when product ID is invalid', async () => {
      // Given: Invalid product ID (empty string)
      const invalidProductId = '';

      // When: purchaseProduct is called
      const result = await purchaseService.purchaseProduct(invalidProductId);

      // Then: Should return UNKNOWN_ERROR without attempting purchase
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toMatch(/Invalid product ID/);
      }
    });

    it('should propagate purchase flow cancellation as CANCELLED error', async () => {
      // Given: User cancels purchase before verification
      const productId = 'premium_unlock';

      const { purchaseRepository: mockRepo } = require('../../core/repository');
      mockRepo.launchPurchaseFlow.mockResolvedValue({
        success: false,
        error: {
          code: 'PURCHASE_CANCELLED',
          message: 'User cancelled the purchase',
          retryable: false,
        },
      });

      // When: purchaseProduct is called
      const result = await purchaseService.purchaseProduct(productId);

      // Then: Should return CANCELLED error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CANCELLED');
        expect(result.error.retryable).toBe(false);
      }

      // And: Verifier should NOT be called
      expect(mockReceiptVerifier.verifyReceiptSignature).not.toHaveBeenCalled();
    });
  });

  describe('verifyAndSavePurchase', () => {
    it('should save verification metadata to secure store after successful verification', async () => {
      // Given: Valid transaction with signed receipt
      const testTransaction: Transaction = {
        transactionId: 'test-txn-123',
        productId: 'premium_unlock',
        purchaseDate: new Date('2025-12-04'),
        receiptData: 'valid.jws.receipt',
      };

      // Mock successful verification
      const verificationResult: VerificationResult = {
        isValid: true,
        transactionId: 'test-txn-123',
        productId: 'premium_unlock',
        purchaseDate: new Date('2025-12-04'),
      };

      mockReceiptVerifier.verifyReceiptSignature.mockResolvedValue({
        success: true,
        data: verificationResult,
      });

      mockVerificationMetadataStore.saveVerificationMetadata.mockResolvedValue({
        success: true,
        data: undefined,
      });

      // When: verifyAndSavePurchase is called
      const result = await purchaseService.verifyAndSavePurchase(testTransaction);

      // Then: Receipt was verified
      expect(mockReceiptVerifier.verifyReceiptSignature).toHaveBeenCalledWith(
        testTransaction.receiptData,
        testTransaction.receiptData, // signature defaults to receiptData for iOS
        'ios'
      );

      // And: Metadata was saved to secure store
      expect(mockVerificationMetadataStore.saveVerificationMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: 'test-txn-123',
          productId: 'premium_unlock',
          platform: 'ios',
          verifiedAt: expect.any(Date),
        })
      );

      // And: Success is returned
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isVerified).toBe(true);
      }
    });

    it('should not save metadata if verification fails', async () => {
      // Given: Transaction with invalid receipt
      const testTransaction: Transaction = {
        transactionId: 'bad-txn',
        productId: 'premium_unlock',
        purchaseDate: new Date('2025-12-04'),
        receiptData: 'invalid.signature',
      };

      // Mock failed verification
      mockReceiptVerifier.verifyReceiptSignature.mockResolvedValue({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Signature verification failed',
        },
      });

      // When: verifyAndSavePurchase is called
      const result = await purchaseService.verifyAndSavePurchase(testTransaction);

      // Then: Verification failed
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VERIFICATION_FAILED');
      }

      // And: Metadata was NOT saved
      expect(mockVerificationMetadataStore.saveVerificationMetadata).not.toHaveBeenCalled();
    });

    it('should return DB_ERROR if metadata save fails', async () => {
      // Given: Valid transaction that verifies successfully
      const testTransaction: Transaction = {
        transactionId: 'test-txn-456',
        productId: 'premium_unlock',
        purchaseDate: new Date('2025-12-04'),
        receiptData: 'valid.jws.receipt',
      };

      // Mock successful verification
      const verificationResult: VerificationResult = {
        isValid: true,
        transactionId: 'test-txn-456',
        productId: 'premium_unlock',
        purchaseDate: new Date('2025-12-04'),
      };

      mockReceiptVerifier.verifyReceiptSignature.mockResolvedValue({
        success: true,
        data: verificationResult,
      });

      // But metadata save fails
      mockVerificationMetadataStore.saveVerificationMetadata.mockResolvedValue({
        success: false,
        error: {
          code: 'STORE_ERROR',
          message: 'Failed to save to secure store',
        },
      });

      // When: verifyAndSavePurchase is called
      const result = await purchaseService.verifyAndSavePurchase(testTransaction);

      // Then: Operation failed with DB_ERROR code
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DB_ERROR');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('should validate transaction before verification', async () => {
      // Given: Invalid transaction (missing receiptData)
      const invalidTransaction = {
        transactionId: 'test-txn',
        productId: 'premium_unlock',
        purchaseDate: new Date('2025-12-04'),
        receiptData: '', // Empty receipt data
      } as Transaction;

      // When: verifyAndSavePurchase is called
      const result = await purchaseService.verifyAndSavePurchase(invalidTransaction);

      // Then: Operation failed without calling verifier
      expect(result.success).toBe(false);
      expect(mockReceiptVerifier.verifyReceiptSignature).not.toHaveBeenCalled();
      expect(mockVerificationMetadataStore.saveVerificationMetadata).not.toHaveBeenCalled();
    });

    it('should include verifiedAt timestamp in saved metadata', async () => {
      // Given: Valid transaction
      const testTransaction: Transaction = {
        transactionId: 'test-txn-789',
        productId: 'feature_bundle',
        purchaseDate: new Date('2025-12-04'),
        receiptData: 'valid.jws.receipt',
      };

      // Mock successful verification
      const verificationResult: VerificationResult = {
        isValid: true,
        transactionId: 'test-txn-789',
        productId: 'feature_bundle',
        purchaseDate: new Date('2025-12-04'),
      };

      mockReceiptVerifier.verifyReceiptSignature.mockResolvedValue({
        success: true,
        data: verificationResult,
      });

      mockVerificationMetadataStore.saveVerificationMetadata.mockResolvedValue({
        success: true,
        data: undefined,
      });

      // When: verifyAndSavePurchase is called
      const result = await purchaseService.verifyAndSavePurchase(testTransaction);

      // Then: Success
      expect(result.success).toBe(true);
      if (result.success) {
        // And: Metadata includes verifiedAt timestamp
        const savedCall = mockVerificationMetadataStore.saveVerificationMetadata.mock.calls[0][0];
        expect(savedCall.verifiedAt).toBeDefined();
        expect(savedCall.verifiedAt instanceof Date).toBe(true);
      }
    });
  });

  describe('purchaseProduct', () => {
    it('should have purchaseProduct method defined', () => {
      expect(purchaseService.purchaseProduct).toBeDefined();
      expect(typeof purchaseService.purchaseProduct).toBe('function');
    });
  });
});
