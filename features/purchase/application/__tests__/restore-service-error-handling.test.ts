/**
 * Restore Service Error Handling Integration Tests - Task 8.3
 *
 * Tests for error handling integration within RestoreService.
 * Verifies that RestoreErrorHandler and RestoreUIHandler are properly
 * integrated to provide comprehensive error handling and UI feedback.
 *
 * Task 8.3: Integration test coverage
 * - Verify error classification during restoration failures
 * - Verify UI state generation for error scenarios
 * - Verify retry handling for transient errors
 * - Verify error logging and metadata extraction
 *
 * Given/When/Then scenarios for error handling workflows
 */

import { restoreService } from '../restore-service';
import { RestoreErrorHandler } from '../../infrastructure/restore-error-handler';
import { RestoreUIHandler } from '../../infrastructure/restore-ui-handler';
import { purchaseRepository } from '../../core/repository';
import { purchaseService } from '../purchase-service';

jest.mock('../../core/repository');
jest.mock('../purchase-service');

describe('RestoreService - Task 8.3: Error Handling Integration', () => {
  const errorHandler = new RestoreErrorHandler();
  const uiHandler = new RestoreUIHandler();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * NETWORK ERROR HANDLING TESTS
   */

  describe('Network Error Handling', () => {
    test('should classify network error and provide retry UI', async () => {
      // Given: Platform API fails with network error
      const networkError = {
        code: 'NETWORK_ERROR' as const,
        message: 'Connection timeout',
        retryable: true,
      };

      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValue({
        success: false,
        error: networkError,
      });

      // When: Restoration is attempted
      const result = await restoreService.restorePurchases();

      // Then: Error should be returned
      expect(result.success).toBe(false);

      // And: Error should be classifiable for UI
      const classified = errorHandler.classifyError(result.error);
      expect(classified.retryable).toBe(true);
      expect(classified.showRetryButton).toBe(true);

      // And: UI state should show retry option
      const uiState = uiHandler.getUIState(result.error);
      expect(uiState.showRetryButton).toBe(true);
    });

    test('should provide metadata for network error logging', async () => {
      // Given: Network error
      const networkError = {
        code: 'NETWORK_ERROR' as const,
        message: 'Connection timeout',
        retryable: true,
      };

      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValue({
        success: false,
        error: networkError,
      });

      // When: Restoration fails
      const result = await restoreService.restorePurchases();

      // Then: Error metadata should be extractable for logging
      const metadata = errorHandler.extractMetadata(result.error);
      expect(metadata.code).toBe('NETWORK_ERROR');
      expect(metadata.severity).toBe('WARNING');
      expect(metadata.timestamp).toBeDefined();
    });
  });

  /**
   * STORE ERROR HANDLING TESTS
   */

  describe('Store Problem Error Handling', () => {
    test('should handle store unavailability with retry guidance', async () => {
      // Given: Store API is temporarily unavailable
      const storeError = {
        code: 'STORE_PROBLEM_ERROR' as const,
        message: 'App Store service unavailable',
        retryable: true,
      };

      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValue({
        success: false,
        error: storeError,
      });

      // When: Restoration is attempted
      const result = await restoreService.restorePurchases();

      // Then: Error should be classified as store problem
      const classified = errorHandler.classifyError(result.error);
      expect(classified.code).toBe('STORE_PROBLEM_ERROR');
      expect(classified.retryable).toBe(true);

      // And: User message should suggest waiting and retrying
      expect(classified.suggestionMessage).toBeDefined();
      expect(classified.recoveryAction).toBeDefined();
    });
  });

  /**
   * DATABASE ERROR HANDLING TESTS
   */

  describe('Database Error Handling', () => {
    test('should handle DB errors during restoration', async () => {
      // Given: Platform returns data, but DB fetch fails
      const mockTransaction = {
        transactionId: 'txn-1',
        productId: 'product-a',
        purchaseDate: new Date(),
        receiptData: 'receipt-1',
      };

      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: [mockTransaction],
      });

      // DB error when fetching existing purchases
      const dbError = {
        code: 'DB_ERROR' as const,
        message: 'Database connection failed',
        retryable: true,
      };

      (purchaseService.getActivePurchases as jest.Mock).mockResolvedValue({
        success: false,
        error: dbError,
      });

      // When: Restoration is attempted
      const result = await restoreService.restorePurchases();

      // Then: Should return DB error
      expect(result.error?.code).toBe('DB_ERROR');

      // And: Error should indicate retry is possible
      const classified = errorHandler.classifyError(result.error);
      expect(classified.retryable).toBe(true);
      expect(classified.maxRetries).toBeGreaterThan(0);
    });
  });

  /**
   * CRITICAL ERROR HANDLING TESTS
   */

  describe('Critical Error Handling', () => {
    test('should handle unknown errors without retry', async () => {
      // Given: Unexpected error occurs
      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockRejectedValue(new Error('Unexpected native module error'));

      // When: Restoration is attempted
      const result = await restoreService.restorePurchases();

      // Then: Should return unknown error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');

      // And: Should not offer retry
      const classified = errorHandler.classifyError(result.error);
      expect(classified.retryable).toBe(false);
      expect(classified.showSupportButton).toBe(true);
    });
  });

  /**
   * UI STATE INTEGRATION TESTS
   */

  describe('UI State Integration', () => {
    test('should provide loading state before restoration', () => {
      // When: Restoration is starting
      const loadingState = uiHandler.getLoadingState();

      // Then: Should show loading indicator
      expect(loadingState.isLoading).toBe(true);
      expect(loadingState.showCancelButton).toBe(true);
    });

    test('should transition from loading to error state on failure', async () => {
      // Given: Loading state
      let uiState = uiHandler.getLoadingState();
      expect(uiState.isLoading).toBe(true);

      // And: Network error occurs
      const networkError = {
        code: 'NETWORK_ERROR' as const,
        message: 'Connection timeout',
        retryable: true,
      };

      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValue({
        success: false,
        error: networkError,
      });

      // When: Restoration fails
      const result = await restoreService.restorePurchases();

      // Then: UI should transition to error state
      uiState = uiHandler.getUIState(result.error);
      expect(uiState.isLoading).toBe(false);
      expect(uiState.errorMessage).toBeDefined();
      expect(uiState.showRetryButton).toBe(true);
    });

    test('should provide success notification on restoration complete', async () => {
      // Given: Restoration succeeds
      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: [
          {
            transactionId: 'txn-1',
            productId: 'product-a',
            purchaseDate: new Date(),
            receiptData: 'receipt-1',
          },
        ],
      });

      (purchaseService.getActivePurchases as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      // When: Restoration completes
      const result = await restoreService.restorePurchases();

      // Then: Should provide success notification
      if (result.success) {
        const notification = uiHandler.getNotification('success', result.data);
        expect(notification.type).toBe('success');
        expect(notification.title).toBeDefined();
        expect(notification.message).toContain('1');
      }
    });
  });

  /**
   * ERROR LOGGING TESTS
   */

  describe('Error Logging and Metadata', () => {
    test('should extract detailed error metadata for logging', async () => {
      // Given: Network error
      const networkError = {
        code: 'NETWORK_ERROR' as const,
        message: 'Socket timeout after 30 seconds',
        retryable: true,
      };

      (
        purchaseRepository.requestAllPurchaseHistory as jest.Mock
      ).mockResolvedValue({
        success: false,
        error: networkError,
      });

      // When: Restoration fails
      const result = await restoreService.restorePurchases();

      // Then: Should provide detailed metadata for logging
      const metadata = errorHandler.extractMetadata(result.error);
      expect(metadata).toMatchObject({
        code: 'NETWORK_ERROR',
        message: expect.any(String),
        timestamp: expect.any(Number),
        severity: 'WARNING',
      });

      // And: Timestamp should be recent
      const now = Date.now();
      expect(metadata.timestamp).toBeLessThanOrEqual(now);
      expect(metadata.timestamp).toBeGreaterThan(now - 5000);
    });
  });

  /**
   * RETRY CONFIGURATION TESTS
   */

  describe('Retry Configuration', () => {
    test('should provide appropriate retry configuration for network errors', () => {
      // Given: Network error
      const networkError = {
        code: 'NETWORK_ERROR' as const,
        message: 'Connection timeout',
        retryable: true,
      };

      // When: Error is classified
      const classified = errorHandler.classifyError(networkError);

      // Then: Should provide retry configuration
      expect(classified.maxRetries).toBe(3);
      expect(classified.retryBackoffMs).toBe(1000); // Initial 1 second delay
    });

    test('should provide different retry config for store errors', () => {
      // Given: Store error
      const storeError = {
        code: 'STORE_PROBLEM_ERROR' as const,
        message: 'Store unavailable',
        retryable: true,
      };

      // When: Error is classified
      const classified = errorHandler.classifyError(storeError);

      // Then: Should have longer initial backoff
      expect(classified.maxRetries).toBe(3);
      expect(classified.retryBackoffMs).toBe(2000); // 2 second delay
    });

    test('should not allow retry for critical errors', () => {
      // Given: Unknown error
      const criticalError = {
        code: 'UNKNOWN_ERROR' as const,
        message: 'Unexpected error',
        retryable: false,
      };

      // When: Error is classified
      const classified = errorHandler.classifyError(criticalError);

      // Then: Should not allow retry
      expect(classified.maxRetries).toBe(0);
      expect(classified.retryable).toBe(false);
    });
  });
});
