/**
 * RestoreButton Component Tests
 *
 * Task 14.2: Restore Purchases button implementation
 *
 * Comprehensive test coverage:
 * - Happy path: Successful restoration, empty results, callback invocation
 * - Sad path: Network/store errors with retry, database errors
 * - Edge cases: Concurrent prevention, state recovery
 * - Unhappy path: Service exceptions, invalid responses
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

jest.mock('../../application/restore-service');

import { RestoreButton } from '../restore-button';
import { restoreService } from '../../application/restore-service';
import type { RestoreResult, RestoreError } from '../../application/restore-service';

// Spy on Alert.alert
const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation();

describe('RestoreButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockClear();
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  describe('Happy Path - Successful Restoration', () => {
    it('should display success message with restored count', async () => {
      const mockResult: RestoreResult = {
        restoredCount: 2,
        newCount: 1,
        updatedCount: 1,
      };

      (restoreService.restorePurchases as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockResult,
      });

      const { getByTestId } = render(<RestoreButton />);
      fireEvent.press(getByTestId('restore-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Success',
          expect.stringContaining('2'),
          expect.any(Array)
        );
      });
    });

    it('should display info message when no purchases found', async () => {
      const mockResult: RestoreResult = {
        restoredCount: 0,
        newCount: 0,
        updatedCount: 0,
      };

      (restoreService.restorePurchases as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockResult,
      });

      const { getByTestId } = render(<RestoreButton />);
      fireEvent.press(getByTestId('restore-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Info',
          expect.stringContaining('No purchases'),
          expect.any(Array)
        );
      });
    });

    it('should call onRestoreComplete callback on success', async () => {
      const mockCallback = jest.fn();
      const mockResult: RestoreResult = {
        restoredCount: 1,
        newCount: 0,
        updatedCount: 1,
      };

      (restoreService.restorePurchases as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockResult,
      });

      const { getByTestId } = render(<RestoreButton onRestoreComplete={mockCallback} />);
      fireEvent.press(getByTestId('restore-button'));

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith(mockResult);
      });
    });
  });

  describe('Sad Path - Recoverable Errors', () => {
    it('should display retry option on network error', async () => {
      const mockError: RestoreError = {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to App Store',
        retryable: true,
      };

      (restoreService.restorePurchases as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: mockError,
      });

      const { getByTestId } = render(<RestoreButton />);
      fireEvent.press(getByTestId('restore-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('Failed to connect'),
          expect.arrayContaining([
            expect.objectContaining({ text: 'Retry' }),
            expect.objectContaining({ text: 'Cancel' }),
          ])
        );
      });
    });

    it('should display store problem error with retry', async () => {
      const mockError: RestoreError = {
        code: 'STORE_PROBLEM_ERROR',
        message: 'App Store temporarily unavailable',
        retryable: true,
      };

      (restoreService.restorePurchases as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: mockError,
      });

      const { getByTestId } = render(<RestoreButton />);
      fireEvent.press(getByTestId('restore-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          expect.any(String),
          expect.arrayContaining([expect.objectContaining({ text: 'Retry' })])
        );
      });
    });

    it('should display database error with retry', async () => {
      const mockError: RestoreError = {
        code: 'DB_ERROR',
        message: 'Failed to save purchase',
        retryable: true,
      };

      (restoreService.restorePurchases as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: mockError,
      });

      const { getByTestId } = render(<RestoreButton />);
      fireEvent.press(getByTestId('restore-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('Failed to save'),
          expect.arrayContaining([expect.objectContaining({ text: 'Retry' })])
        );
      });
    });
  });

  describe('Sad Path - Non-Recoverable Errors', () => {
    it('should display error without retry on non-retryable error', async () => {
      const mockError: RestoreError = {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        retryable: false,
      };

      (restoreService.restorePurchases as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: mockError,
      });

      const { getByTestId } = render(<RestoreButton />);
      fireEvent.press(getByTestId('restore-button'));

      await waitFor(() => {
        const call = alertSpy.mock.calls[0];
        const buttons = call[2];
        expect(buttons).not.toContainEqual(expect.objectContaining({ text: 'Retry' }));
        expect(buttons).toContainEqual(expect.objectContaining({ text: 'Cancel' }));
      });
    });
  });

  describe('Edge Cases', () => {
    it('should prevent concurrent restore operations', async () => {
      (restoreService.restorePurchases as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ success: true, data: { restoredCount: 0, newCount: 0, updatedCount: 0 } }),
              100
            )
          )
      );

      const { getByTestId } = render(<RestoreButton />);

      fireEvent.press(getByTestId('restore-button'));
      fireEvent.press(getByTestId('restore-button'));
      fireEvent.press(getByTestId('restore-button'));

      await waitFor(() => {
        expect(restoreService.restorePurchases).toHaveBeenCalledTimes(1);
      });
    });

    it('should show error alert on network error recovery', async () => {
      const mockError: RestoreError = {
        code: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
      };

      (restoreService.restorePurchases as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: mockError,
      });

      const { getByTestId } = render(<RestoreButton />);
      fireEvent.press(getByTestId('restore-button'));

      // Verify error alert is shown with retry option
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          'Network error',
          expect.arrayContaining([expect.objectContaining({ text: 'Retry' })])
        );
      });
    });

    it('should display detailed counts in message', async () => {
      const mockResult: RestoreResult = {
        restoredCount: 5,
        newCount: 3,
        updatedCount: 2,
      };

      (restoreService.restorePurchases as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockResult,
      });

      const { getByTestId } = render(<RestoreButton />);
      fireEvent.press(getByTestId('restore-button'));

      await waitFor(() => {
        const call = alertSpy.mock.calls[0];
        const message = call[1];
        expect(message).toContain('5');
        expect(message).toContain('3');
        expect(message).toContain('2');
      });
    });
  });

  describe('Unhappy Path - Unexpected Errors', () => {
    it('should handle service throwing exception', async () => {
      (restoreService.restorePurchases as jest.Mock).mockRejectedValueOnce(
        new Error('Service error')
      );

      const { getByTestId } = render(<RestoreButton />);
      fireEvent.press(getByTestId('restore-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('Service error'),
          expect.any(Array)
        );
      });
    });

    it('should handle malformed service response', async () => {
      (restoreService.restorePurchases as jest.Mock).mockResolvedValueOnce(null);

      const { getByTestId } = render(<RestoreButton />);
      fireEvent.press(getByTestId('restore-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('Invalid service response'),
          expect.any(Array)
        );
      });
    });

    it('should handle service exceptions gracefully', async () => {
      (restoreService.restorePurchases as jest.Mock).mockRejectedValueOnce(
        new Error('Service unavailable')
      );

      const { getByTestId } = render(<RestoreButton />);
      fireEvent.press(getByTestId('restore-button'));

      // Verify error alert is shown for service exception
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('Service unavailable'),
          expect.any(Array)
        );
      });
    });
  });

  describe('Button Props and Accessibility', () => {
    it('should render with disabled prop', () => {
      const { getByTestId } = render(<RestoreButton disabled={true} />);
      expect(getByTestId('restore-button')).toBeTruthy();
    });

    it('should render with custom variant prop', () => {
      const { getByTestId } = render(<RestoreButton variant="secondary" />);
      expect(getByTestId('restore-button')).toBeTruthy();
    });

    it('should render button with text', () => {
      const { getByTestId } = render(<RestoreButton />);
      const button = getByTestId('restore-button');
      expect(button).toBeTruthy();
      // Button renders with children (text content)
    });
  });
});
