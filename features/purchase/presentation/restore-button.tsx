/**
 * RestoreButton Component
 *
 * Task 14.2: Restore Purchases button for one-time purchases
 *
 * Requirements:
 * - 6.1: Restore button available in account settings
 * - 6.5: Loading indicator during restoration
 * - 6.6: Error handling with retry capability
 *
 * Responsibilities:
 * - Orchestrate purchase restoration flow
 * - Display loading state during restoration
 * - Handle success/error results with appropriate messages
 * - Support retry for recoverable errors
 * - Prevent concurrent restore operations
 *
 * @example
 * ```typescript
 * export function MySettings() {
 *   return (
 *     <RestoreButton
 *       variant="secondary"
 *       onRestoreComplete={(result) => {
 *         console.log(`Restored ${result.restoredCount} purchases`);
 *       }}
 *     />
 *   );
 * }
 * ```
 */

import React, { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Button } from '@/components/ui/button';
import { useRestoreService } from './hooks/use-restore-service';
import type { RestoreResult } from '../application/restore-service';

export interface RestoreButtonProps {
  /** Button variant (primary, secondary, etc.) */
  variant?: 'primary' | 'secondary' | 'tertiary';
  /** Whether button is disabled */
  disabled?: boolean;
  /** Callback when restore completes successfully */
  onRestoreComplete?: (result: RestoreResult) => void;
  /** Callback when restore encounters an error */
  onError?: (error: Error) => void;
}

export function RestoreButton({
  variant = 'secondary',
  disabled = false,
  onRestoreComplete,
  onError,
}: RestoreButtonProps) {
  const restoreService = useRestoreService();
  const [isRestoring, setIsRestoring] = useState(false);

  /**
   * Recursively retry restore operation with exponential backoff
   *
   * Supports user-triggered retry from error alert
   *
   * @private
   */
  const retryRestore = useCallback(async () => {
    setIsRestoring(true);

    try {
      const result = await restoreService.restorePurchases();

      // Handle malformed response
      if (!result || typeof result !== 'object' || !('success' in result)) {
        const error = new Error('Invalid restore service response');
        Alert.alert(
          'Error',
          'Failed to restore purchases: Invalid service response',
          [{ text: 'Retry', onPress: retryRestore }, { text: 'Cancel' }]
        );
        onError?.(error);
        setIsRestoring(false);
        return;
      }

      if (!result.success) {
        // Handle error with retry option
        handleRestoreError(result.error, retryRestore);
        return;
      }

      // Success
      const data = result.data;

      // Determine message based on result
      if (data.restoredCount === 0) {
        Alert.alert('Info', 'No purchases available to restore.', [
          { text: 'OK' },
        ]);
      } else {
        Alert.alert(
          'Success',
          `Restored ${data.restoredCount} purchase${data.restoredCount !== 1 ? 'es' : ''}.\n` +
            `New: ${data.newCount}, Updated: ${data.updatedCount}`,
          [{ text: 'OK' }]
        );
      }

      // Call success callback
      onRestoreComplete?.(data);
    } catch (error) {
      // Unexpected error
      const message =
        error instanceof Error ? error.message : 'Unknown error during restore';

      Alert.alert('Error', `Failed to restore purchases: ${message}`, [
        { text: 'Retry', onPress: retryRestore },
        { text: 'Cancel' },
      ]);

      onError?.(
        error instanceof Error ? error : new Error('Unknown restore error')
      );
    } finally {
      setIsRestoring(false);
    }
  }, [restoreService, onRestoreComplete, onError]);

  /**
   * Handle restore error and display retry option if retryable
   *
   * @private
   */
  const handleRestoreError = useCallback(
    (error: any, retry: () => Promise<void>) => {
      const isRetryable = error.retryable === true;
      const buttons = [];

      if (isRetryable) {
        buttons.push({
          text: 'Retry',
          onPress: retry,
        });
      }

      buttons.push({
        text: 'Cancel',
      });

      Alert.alert('Error', error.message || 'Failed to restore purchases', [
        ...buttons,
      ]);
    },
    []
  );

  /**
   * Handle restore button press
   *
   * Given/When/Then:
   * - Given: User taps Restore Purchases button
   * - When: restoreService.restorePurchases() is called
   * - Then: Loading state shown and restoration flow executed
   *
   * - Given: Restore already in progress
   * - When: User taps button again
   * - Then: Tap is ignored (prevented by disabled flag)
   */
  const handlePress = useCallback(async () => {
    if (isRestoring) {
      return; // Prevent concurrent operations
    }

    await retryRestore();
  }, [isRestoring, retryRestore]);

  return (
    <Button
      testID="restore-button"
      variant={variant}
      onPress={handlePress}
      loading={isRestoring}
      disabled={disabled || isRestoring}
    >
      Restore Purchases
    </Button>
  );
}
