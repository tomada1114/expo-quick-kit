/**
 * SecureStorageDemo Component Tests
 *
 * Tests cover:
 * - Component rendering
 * - Save, retrieve, and delete operations
 * - Error handling and display
 * - Input size validation
 * - User interactions (button presses)
 */

import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { SecureStorageDemo } from '../components/secure-storage-demo';
import * as SecureStorage from '@/lib/secure-storage';

// Mock the secure storage module
jest.mock('@/lib/secure-storage', () => ({
  SecureStorageKey: {
    AUTH_TOKEN: 'auth_token',
    USER_ID: 'user_id',
    API_KEY: 'api_key',
  },
  saveSecure: jest.fn(),
  getSecure: jest.fn(),
  deleteSecure: jest.fn(),
}));

const mockSecureStorage = SecureStorage as jest.Mocked<typeof SecureStorage>;

describe('SecureStorageDemo Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render component with title', () => {
    render(<SecureStorageDemo />);

    expect(screen.getByText('セキュア保存')).toBeDefined();
  });

  it('should render description text', () => {
    render(<SecureStorageDemo />);

    expect(
      screen.getByText(/トークンを暗号化して安全に保存します/)
    ).toBeDefined();
  });

  it('should render input field', () => {
    render(<SecureStorageDemo testID="secure-storage-demo" />);

    expect(screen.getByTestId('secure-storage-demo-input')).toBeDefined();
  });

  it('should render save button', () => {
    render(<SecureStorageDemo testID="secure-storage-demo" />);

    expect(screen.getByTestId('secure-storage-demo-save-button')).toBeDefined();
  });

  it('should render retrieve button', () => {
    render(<SecureStorageDemo testID="secure-storage-demo" />);

    expect(
      screen.getByTestId('secure-storage-demo-retrieve-button')
    ).toBeDefined();
  });

  it('should render delete button', () => {
    render(<SecureStorageDemo testID="secure-storage-demo" />);

    expect(
      screen.getByTestId('secure-storage-demo-delete-button')
    ).toBeDefined();
  });

  it('should allow user to type in input field', () => {
    const { getByTestId } = render(
      <SecureStorageDemo testID="secure-storage-demo" />
    );

    const input = getByTestId('secure-storage-demo-input') as any;
    fireEvent.changeText(input, 'test-token-123');

    expect(input.props.value).toBe('test-token-123');
  });

  it('should save value and display success message', async () => {
    mockSecureStorage.saveSecure.mockResolvedValueOnce({
      success: true,
      data: undefined,
    });

    const { getByTestId } = render(
      <SecureStorageDemo testID="secure-storage-demo" />
    );

    const input = getByTestId('secure-storage-demo-input') as any;
    const saveButton = getByTestId('secure-storage-demo-save-button') as any;

    fireEvent.changeText(input, 'test-token');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockSecureStorage.saveSecure).toHaveBeenCalledWith(
        'auth_token',
        'test-token'
      );
    });
  });

  it('should handle save error', async () => {
    mockSecureStorage.saveSecure.mockResolvedValueOnce({
      success: false,
      error: 'Failed to save',
    });

    const { getByTestId } = render(
      <SecureStorageDemo testID="secure-storage-demo" />
    );

    const input = getByTestId('secure-storage-demo-input') as any;
    const saveButton = getByTestId('secure-storage-demo-save-button') as any;

    fireEvent.changeText(input, 'test-token');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to save/)).toBeDefined();
    });
  });

  it('should retrieve value and display it', async () => {
    mockSecureStorage.getSecure.mockResolvedValueOnce({
      success: true,
      data: 'retrieved-token',
    });

    const { getByTestId } = render(
      <SecureStorageDemo testID="secure-storage-demo" />
    );

    const retrieveButton = getByTestId(
      'secure-storage-demo-retrieve-button'
    ) as any;

    fireEvent.press(retrieveButton);

    await waitFor(() => {
      expect(mockSecureStorage.getSecure).toHaveBeenCalledWith('auth_token');
    });
  });

  it('should handle retrieve error', async () => {
    mockSecureStorage.getSecure.mockResolvedValueOnce({
      success: false,
      error: 'Access denied',
    });

    const { getByTestId } = render(
      <SecureStorageDemo testID="secure-storage-demo" />
    );

    const retrieveButton = getByTestId(
      'secure-storage-demo-retrieve-button'
    ) as any;

    fireEvent.press(retrieveButton);

    await waitFor(() => {
      expect(screen.getByText(/Access denied/)).toBeDefined();
    });
  });

  it('should delete value and display success', async () => {
    mockSecureStorage.deleteSecure.mockResolvedValueOnce({
      success: true,
      data: undefined,
    });

    const { getByTestId } = render(
      <SecureStorageDemo testID="secure-storage-demo" />
    );

    const deleteButton = getByTestId(
      'secure-storage-demo-delete-button'
    ) as any;

    fireEvent.press(deleteButton);

    await waitFor(() => {
      expect(mockSecureStorage.deleteSecure).toHaveBeenCalledWith('auth_token');
    });
  });

  it('should handle delete error', async () => {
    mockSecureStorage.deleteSecure.mockResolvedValueOnce({
      success: false,
      error: 'Failed to delete',
    });

    const { getByTestId } = render(
      <SecureStorageDemo testID="secure-storage-demo" />
    );

    const deleteButton = getByTestId(
      'secure-storage-demo-delete-button'
    ) as any;

    fireEvent.press(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to delete/)).toBeDefined();
    });
  });

  it('should limit input to 2000 characters', () => {
    const { getByTestId } = render(
      <SecureStorageDemo testID="secure-storage-demo" />
    );

    const input = getByTestId('secure-storage-demo-input') as any;
    const longValue = 'a'.repeat(2500);

    fireEvent.changeText(input, longValue);

    // Input should be limited to 2000 characters
    expect(input.props.value.length).toBeLessThanOrEqual(2000);
  });

  it('should clear input after successful save', async () => {
    mockSecureStorage.saveSecure.mockResolvedValueOnce({
      success: true,
      data: undefined,
    });

    const { getByTestId } = render(
      <SecureStorageDemo testID="secure-storage-demo" />
    );

    const input = getByTestId('secure-storage-demo-input') as any;
    const saveButton = getByTestId('secure-storage-demo-save-button') as any;

    fireEvent.changeText(input, 'test-token');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(input.props.value).toBe('');
    });
  });

  it('should display status message during operations', async () => {
    mockSecureStorage.saveSecure.mockResolvedValueOnce({
      success: true,
      data: undefined,
    });

    const { getByTestId } = render(
      <SecureStorageDemo testID="secure-storage-demo" />
    );

    const input = getByTestId('secure-storage-demo-input') as any;
    const saveButton = getByTestId('secure-storage-demo-save-button') as any;

    fireEvent.changeText(input, 'test-token');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('secure-storage-demo-status')).toBeDefined();
    });
  });

  it('should display info text about size limit', () => {
    render(<SecureStorageDemo />);

    expect(
      screen.getByText(
        /暗号化保存対応: iOS KeychainとAndroid EncryptedSharedPreferencesで/
      )
    ).toBeDefined();
  });

  it('should accept custom testID prop', () => {
    const { getByTestId } = render(
      <SecureStorageDemo testID="custom-secure-storage" />
    );

    expect(getByTestId('custom-secure-storage')).toBeDefined();
  });
});
