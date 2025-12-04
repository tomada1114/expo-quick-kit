/**
 * Restore UI Handler - Task 8.3
 *
 * Manages UI state transitions and notifications for purchase restoration flow.
 *
 * Responsibilities:
 * - Generate UI state based on error type and operation status
 * - Manage loading, error, and success states
 * - Show/hide retry and support buttons
 * - Generate user notifications
 * - Handle state transitions (loading → error/success)
 *
 * UI States:
 * - Loading: Show loading indicator, disable interactions (except cancel)
 * - Error: Show error message with appropriate action (retry or support)
 * - Success: Show success message with restoration counts
 * - Empty: Show "no purchases" state when restoration finds nothing
 *
 * @module features/purchase/infrastructure/restore-ui-handler
 */

import type { RestoreError, RestoreResult } from '../application/restore-service';

/**
 * UI state for restoration flow
 */
export interface RestoreUIState {
  isLoading: boolean;
  errorMessage?: string;
  successMessage?: string;
  emptyStateMessage?: string;
  progressMessage?: string;
  showRetryButton: boolean;
  showSupportButton: boolean;
  showCancelButton: boolean;
}

/**
 * Notification content for user
 */
export interface RestoreNotification {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * Restore UI Handler - Manages restoration UI flow
 */
export class RestoreUIHandler {
  /**
   * Get UI state based on error
   *
   * Given: RestoreError from failed restoration
   * When: UI needs to display error state
   * Then: UI state with appropriate error message and action buttons
   *
   * @param error - RestoreError or null
   * @returns UI state with error messaging
   */
  getUIState(error: RestoreError | null | undefined): RestoreUIState {
    if (!error || typeof error !== 'object') {
      return {
        isLoading: false,
        errorMessage: 'An unexpected error occurred. Please try again.',
        showRetryButton: false,
        showSupportButton: true,
        showCancelButton: false,
      };
    }

    const { code, retryable } = error as any;

    const isRetryable = retryable !== false && ['NETWORK_ERROR', 'STORE_PROBLEM_ERROR', 'DB_ERROR'].includes(code);

    return {
      isLoading: false,
      errorMessage: this.getErrorMessage(code),
      showRetryButton: isRetryable,
      showSupportButton: !isRetryable || code === 'UNKNOWN_ERROR',
      showCancelButton: false,
    };
  }

  /**
   * Get loading state for restoration in progress
   *
   * Given: Restoration is in progress
   * When: UI should show progress to user
   * Then: Loading state with indicator and cancel option
   *
   * @returns Loading UI state
   */
  getLoadingState(): RestoreUIState {
    return {
      isLoading: true,
      progressMessage: 'Restoring purchases...',
      showRetryButton: false,
      showSupportButton: false,
      showCancelButton: true,
    };
  }

  /**
   * Get success state after successful restoration
   *
   * Given: Restoration completed successfully with counts
   * When: UI should show result to user
   * Then: Success state with restoration summary
   *
   * @param result - RestoreResult with counts
   * @returns Success UI state
   */
  getSuccessState(result: RestoreResult): RestoreUIState {
    const { restoredCount, newCount, updatedCount } = result;

    if (restoredCount === 0) {
      return {
        isLoading: false,
        emptyStateMessage:
          'No purchase history found. You have no purchases to restore at this time.',
        showRetryButton: false,
        showSupportButton: false,
        showCancelButton: false,
      };
    }

    const message =
      newCount > 0 && updatedCount > 0
        ? `Restored ${restoredCount} purchases (${newCount} new, ${updatedCount} updated)`
        : newCount > 0
          ? `Restored ${newCount} new purchases`
          : `Updated ${updatedCount} purchases`;

    return {
      isLoading: false,
      successMessage: message,
      showRetryButton: false,
      showSupportButton: false,
      showCancelButton: false,
    };
  }

  /**
   * Get reset state (neutral state before any operation)
   *
   * Given: User wants to retry or dismiss error
   * When: UI should return to neutral state
   * Then: Empty state with no messages or buttons
   *
   * @returns Reset UI state
   */
  getResetState(): RestoreUIState {
    return {
      isLoading: false,
      showRetryButton: false,
      showSupportButton: false,
      showCancelButton: false,
    };
  }

  /**
   * Get notification content for user
   *
   * Given: Restoration result (success or error)
   * When: Notification should be displayed to user
   * Then: Notification content with title and message
   *
   * @param type - Notification type ('success' or 'error')
   * @param data - RestoreResult or RestoreError
   * @returns Notification content
   */
  getNotification(
    type: 'success' | 'error',
    data: RestoreResult | RestoreError
  ): RestoreNotification {
    if (type === 'success') {
      const result = data as RestoreResult;
      return {
        title: result.restoredCount === 0 ? 'No Purchases' : 'Restoration Complete',
        message:
          result.restoredCount === 0
            ? 'No purchase history found.'
            : `Restored ${result.restoredCount} purchases successfully.`,
        type: 'success',
      };
    } else {
      const error = data as RestoreError;
      return {
        title: this.getErrorTitle(error.code),
        message: this.getErrorMessage(error.code),
        type: 'error',
      };
    }
  }

  /**
   * Get error message for error code
   *
   * @param code - Error code
   * @returns User-friendly error message
   *
   * @private
   */
  private getErrorMessage(code: string): string {
    switch (code) {
      case 'NETWORK_ERROR':
        return 'Network connection failed. Please check your internet connection and try again.';
      case 'STORE_PROBLEM_ERROR':
        return 'The App Store/Play Store is temporarily unavailable. Please try again later.';
      case 'DB_ERROR':
        return 'Failed to save purchase information. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again or contact support.';
    }
  }

  /**
   * Get error title for notification
   *
   * @param code - Error code
   * @returns Error title for notification
   *
   * @private
   */
  private getErrorTitle(code: string): string {
    switch (code) {
      case 'NETWORK_ERROR':
        return 'Network Error';
      case 'STORE_PROBLEM_ERROR':
        return 'Store Unavailable';
      case 'DB_ERROR':
        return 'Database Error';
      default:
        return 'Restoration Failed';
    }
  }
}
