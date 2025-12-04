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

describe('PurchaseService - Task 6.4: Save verification metadata to SecureStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
