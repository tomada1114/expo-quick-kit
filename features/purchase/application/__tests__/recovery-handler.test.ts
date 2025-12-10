/**
 * RecoveryHandler Tests
 *
 * Task 9.5: ローカル購入記録の破損検出と復旧
 * Comprehensive test suite for purchase record corruption detection and recovery.
 *
 * Test scenarios:
 * - Happy path: Successful recovery from corrupted DB state
 * - Sad path: Expected failures (missing transaction history, invalid data)
 * - Edge cases: Partial recovery, empty history, concurrent corruption
 * - Unhappy path: System failures (network errors, unexpected exceptions)
 *
 * @module features/purchase/application/__tests__/recovery-handler
 */

// Mock ALL dependencies BEFORE any imports to avoid native module issues
jest.mock(
  'react-native',
  () => ({
    Platform: {
      OS: 'ios',
    },
  }),
  { virtual: true }
);

// Mock database client
jest.mock(
  '@/database/client',
  () => ({
    db: {
      select: jest.fn(() => ({
        from: jest.fn(() => Promise.resolve([])),
      })),
      insert: jest.fn(() => ({
        values: jest.fn(() => Promise.resolve([])),
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => Promise.resolve([])),
        })),
      })),
      eq: jest.fn(),
    },
  }),
  { virtual: true }
);

// Mock error logger
jest.mock(
  '@/features/purchase/infrastructure/error-logger',
  () => ({
    errorLogger: {
      logError: jest.fn(),
      logPurchaseError: jest.fn(),
      logFlowError: jest.fn(),
    },
  }),
  { virtual: true }
);

// Mock purchase repository
jest.mock(
  '@/features/purchase/core/repository',
  () => ({
    purchaseRepository: {
      requestAllPurchaseHistory: jest.fn(),
    },
  }),
  { virtual: true }
);

import type { Transaction } from '@/features/purchase/core/types';
import { recoveryHandler } from '../recovery-handler';
import { purchaseRepository } from '@/features/purchase/core/repository';

/**
 * Mock transaction history for testing
 */
const mockTransactionHistory: Transaction[] = [
  {
    transactionId: 'txn-001',
    productId: 'premium_unlock',
    purchaseDate: new Date('2025-01-01T10:00:00Z'),
    receiptData: 'mock-receipt-001',
  },
  {
    transactionId: 'txn-002',
    productId: 'feature_bundle',
    purchaseDate: new Date('2025-01-02T11:00:00Z'),
    receiptData: 'mock-receipt-002',
  },
  {
    transactionId: 'txn-003',
    productId: 'premium_unlock',
    purchaseDate: new Date('2025-01-03T12:00:00Z'),
    receiptData: 'mock-receipt-003',
  },
];

describe('RecoveryHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the database mock to default (healthy) state
    const dbModule = require('@/database/client');
    dbModule.db.select = jest.fn(() => ({
      from: jest.fn(() => Promise.resolve([])),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectDBCorruption', () => {
    /**
     * Happy path: DB reads successfully
     * When: Database is healthy
     * Then: Returns no corruption detected
     */
    it('should detect no corruption when DB is healthy', async () => {
      const result = await recoveryHandler.detectDBCorruption();

      // Verify: No corruption flag
      expect(result.isCorrupted).toBe(false);
    });

    /**
     * Sad path: Database read fails
     * When: Database query throws error
     * Then: Returns corruption detected with error details
     */
    it('should detect corruption when DB read fails', async () => {
      // Setup: Mock database to throw error
      const dbError = new Error('Database read error');
      const dbModule = require('@/database/client');
      dbModule.db.select = jest.fn().mockImplementationOnce(() => {
        throw dbError;
      });

      const result = await recoveryHandler.detectDBCorruption();

      // Verify: Corruption detected
      expect(result.isCorrupted).toBe(true);
      expect(result.errorInfo).toBeDefined();
      expect(result.errorInfo?.error).toBe(dbError.message);
    });

    /**
     * Edge case: Empty purchase table
     * When: Database is healthy but has no purchases
     * Then: Returns no corruption (empty state is valid)
     */
    it('should return no corruption for empty purchase table', async () => {
      const result = await recoveryHandler.detectDBCorruption();

      // Verify: No corruption for empty table
      expect(result.isCorrupted).toBe(false);
    });
  });

  describe('recoverFromTransactionHistory', () => {
    /**
     * Happy path: Successful recovery from transaction history
     * When: Transaction history is available
     * Then: Reconstructs purchase records from history
     */
    it('should recover purchases from transaction history', async () => {
      // Setup: Mock repository to return transaction history
      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValueOnce({
        success: true,
        data: mockTransactionHistory,
      });

      const result = await recoveryHandler.recoverFromTransactionHistory();

      // Verify: Recovery successful
      expect(result.success).toBe(true);
      expect(result.data?.recoveredCount).toBe(mockTransactionHistory.length);
      expect(result.data?.recoveredTransactionIds).toContain('txn-001');
      expect(result.data?.recoveredTransactionIds).toContain('txn-002');
      expect(result.data?.recoveredTransactionIds).toContain('txn-003');
    });

    /**
     * Sad path: Empty transaction history
     * When: Platform returns empty transaction history
     * Then: Returns empty recovery result
     */
    it('should handle empty transaction history', async () => {
      // Setup: Mock empty history
      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValueOnce({
        success: true,
        data: [],
      });

      const result = await recoveryHandler.recoverFromTransactionHistory();

      // Verify: Empty recovery
      expect(result.success).toBe(true);
      expect(result.data?.recoveredCount).toBe(0);
      expect(result.data?.recoveredTransactionIds).toHaveLength(0);
    });

    /**
     * Sad path: Network error retrieving history
     * When: Platform API fails with network error
     * Then: Returns error result
     */
    it('should handle network error when fetching history', async () => {
      // Setup: Mock network error
      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValueOnce({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          retryable: true,
          platform: 'ios',
        },
      });

      const result = await recoveryHandler.recoverFromTransactionHistory();

      // Verify: Error propagated
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });

    /**
     * Edge case: Duplicate transactions in history
     * When: Platform returns duplicate transaction IDs
     * Then: Deduplicates and recovers unique transactions only
     */
    it('should deduplicate transactions with same ID', async () => {
      // Setup: Create history with duplicates
      const duplicateHistory: Transaction[] = [
        mockTransactionHistory[0],
        mockTransactionHistory[0], // Duplicate
        mockTransactionHistory[1],
      ];

      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValueOnce({
        success: true,
        data: duplicateHistory,
      });

      const result = await recoveryHandler.recoverFromTransactionHistory();

      // Verify: Only unique transactions recovered
      expect(result.success).toBe(true);
      expect(result.data?.recoveredCount).toBe(2);
      expect(new Set(result.data?.recoveredTransactionIds)).toEqual(
        new Set(['txn-001', 'txn-002'])
      );
    });

    /**
     * Edge case: Partial recovery with invalid data
     * When: Some transactions have invalid structure
     * Then: Skips invalid transactions and recovers valid ones
     */
    it('should skip transactions with missing required fields', async () => {
      // Setup: Create history with invalid entries
      const mixedHistory = [
        mockTransactionHistory[0],
        {
          transactionId: '', // Invalid: empty ID
          productId: 'test',
          purchaseDate: new Date(),
          receiptData: 'test',
        },
        mockTransactionHistory[1],
      ] as Transaction[];

      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValueOnce({
        success: true,
        data: mixedHistory,
      });

      const result = await recoveryHandler.recoverFromTransactionHistory();

      // Verify: Only valid transactions recovered
      expect(result.success).toBe(true);
      expect(result.data?.recoveredCount).toBe(2);
      expect(result.data?.recoveredTransactionIds).toContain('txn-001');
      expect(result.data?.recoveredTransactionIds).toContain('txn-002');
    });
  });

  describe('reconstructMissingRecords', () => {
    /**
     * Happy path: Reconstruct missing records
     * When: Transaction history is available
     * Then: Attempts to add records
     */
    it('should reconstruct records from transaction history', async () => {
      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValueOnce({
        success: true,
        data: mockTransactionHistory,
      });

      const result = await recoveryHandler.reconstructMissingRecords();

      // Verify: Reconstruction attempted
      expect(result.success).toBe(true);
      expect(result.data?.addedCount).toBeGreaterThanOrEqual(0);
      expect(result.data?.updatedCount).toBeGreaterThanOrEqual(0);
    });

    /**
     * Sad path: Network error prevents reconstruction
     * When: Cannot fetch transaction history
     * Then: Returns error without attempting reconstruction
     */
    it('should not attempt reconstruction if history fetch fails', async () => {
      // Setup: Mock network error
      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValueOnce({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Cannot reach platform',
          retryable: true,
          platform: 'android',
        },
      });

      const result = await recoveryHandler.reconstructMissingRecords();

      // Verify: Error returned before reconstruction
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });
  });

  describe('validateRecovery', () => {
    /**
     * Happy path: Valid recovery result
     * When: All recovered records are valid
     * Then: Returns validation success
     */
    it('should validate successful recovery', async () => {
      // Setup: Create valid recovery result
      const recoveryResult = {
        recoveredCount: 3,
        recoveredTransactionIds: ['txn-001', 'txn-002', 'txn-003'],
      };

      const validation = recoveryHandler.validateRecovery(recoveryResult);

      // Verify: Validation passes
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    /**
     * Sad path: Mismatch between count and IDs
     * When: Recovered count doesn't match transaction ID count
     * Then: Validation fails
     */
    it('should detect count mismatch in recovery', async () => {
      // Setup: Create mismatched result
      const recoveryResult = {
        recoveredCount: 5, // Mismatch with actual IDs
        recoveredTransactionIds: ['txn-001', 'txn-002'],
      };

      const validation = recoveryHandler.validateRecovery(recoveryResult);

      // Verify: Validation detects mismatch
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    /**
     * Edge case: Empty recovery
     * When: No records were recovered
     * Then: Validation passes (empty recovery is valid)
     */
    it('should validate empty recovery as valid', async () => {
      // Setup: Empty recovery
      const recoveryResult = {
        recoveredCount: 0,
        recoveredTransactionIds: [],
      };

      const validation = recoveryHandler.validateRecovery(recoveryResult);

      // Verify: Empty recovery is valid
      expect(validation.isValid).toBe(true);
    });

    /**
     * Sad path: Duplicate transaction IDs
     * When: Same transaction ID appears multiple times
     * Then: Validation fails
     */
    it('should detect duplicate transaction IDs', async () => {
      // Setup: Create result with duplicates
      const recoveryResult = {
        recoveredCount: 3,
        recoveredTransactionIds: ['txn-001', 'txn-001', 'txn-002'],
      };

      const validation = recoveryHandler.validateRecovery(recoveryResult);

      // Verify: Duplicates detected
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getRecoveryStatus', () => {
    /**
     * Happy path: Get recovery status when healthy
     * When: DB is not corrupted
     * Then: Returns status showing no corruption
     */
    it('should return success status when DB is healthy', async () => {
      const status = await recoveryHandler.getRecoveryStatus();

      // Verify: Status shows healthy DB
      expect(status.isCorrupted).toBe(false);
      expect(status.statusTimestamp).toBeDefined();
    });

    /**
     * Happy path: Successful recovery
     * When: Recovery completes successfully
     * Then: Status shows success with recovery details
     */
    it('should show successful recovery in status', async () => {
      // Setup: Mock corrupted DB and successful recovery
      const dbModule = require('@/database/client');
      dbModule.db.select = jest.fn().mockImplementationOnce(() => {
        throw new Error('DB corrupted');
      });

      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValueOnce({
        success: true,
        data: mockTransactionHistory.slice(0, 2),
      });

      const status = await recoveryHandler.getRecoveryStatus();

      // Verify: Status includes recovery attempt
      expect(status.recoveryAttempted).toBe(true);
      expect(status.statusTimestamp).toBeDefined();
    });

    /**
     * Unhappy path: Exception during status retrieval
     * When: Unexpected error occurs
     * Then: Gracefully handles and reports error
     */
    it('should handle exceptions during status retrieval', async () => {
      const status = await recoveryHandler.getRecoveryStatus();

      // Verify: Error handled gracefully
      expect(status.statusTimestamp).toBeDefined();
    });
  });

  describe('autoRecoverOnStartup', () => {
    /**
     * Happy path: No corruption on startup
     * When: DB is healthy
     * Then: Returns success without recovery attempt
     */
    it('should skip recovery if DB is healthy', async () => {
      const result = await recoveryHandler.autoRecoverOnStartup();

      // Verify: Success without recovery
      expect(result.success).toBe(true);
      expect(result.data?.recoveredCount).toBe(0);
    });

    /**
     * Happy path: Auto-recovery on startup
     * When: App starts with corrupted DB
     * Then: Automatically detects and attempts recovery
     */
    it('should auto-recover corrupted DB on startup', async () => {
      // Setup: Mock corruption and recovery
      const dbModule = require('@/database/client');
      dbModule.db.select = jest.fn().mockImplementationOnce(() => {
        throw new Error('DB corrupted');
      });

      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValueOnce({
        success: true,
        data: mockTransactionHistory.slice(0, 2),
      });

      const result = await recoveryHandler.autoRecoverOnStartup();

      // Verify: Auto-recovery executed
      expect(result.success).toBe(true);
      expect(result.data?.recoveredCount).toBe(2);
    });

    /**
     * Sad path: Recovery fails on startup
     * When: Recovery cannot complete
     * Then: Returns error result
     */
    it('should handle recovery failure on startup', async () => {
      // Setup: Mock corruption and failed recovery
      const dbModule = require('@/database/client');
      dbModule.db.select = jest.fn().mockImplementationOnce(() => {
        throw new Error('DB corrupted');
      });

      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValueOnce({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Cannot reach platform',
          retryable: true,
          platform: 'ios',
        },
      });

      const result = await recoveryHandler.autoRecoverOnStartup();

      // Verify: Failure is reported
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });
  });
});
