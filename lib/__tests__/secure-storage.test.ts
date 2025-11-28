/**
 * Secure Storage Utility Tests
 *
 * Tests cover:
 * - saveSecure function (成功・失敗パス)
 * - getSecure function (値あり・値なし・エラー)
 * - deleteSecure function (成功・失敗)
 * - SecureStorageKey enum type safety
 */

import * as SecureStore from 'expo-secure-store';
import {
  saveSecure,
  getSecure,
  deleteSecure,
  SecureStorageKey,
  type SecureStorageResult,
} from '../secure-storage';

// Mock expo-secure-store
jest.mock('expo-secure-store');

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('SecureStorageKey enum', () => {
  it('should have AUTH_TOKEN key', () => {
    expect(SecureStorageKey.AUTH_TOKEN).toBe('auth_token');
  });

  it('should have USER_ID key', () => {
    expect(SecureStorageKey.USER_ID).toBe('user_id');
  });

  it('should have API_KEY key', () => {
    expect(SecureStorageKey.API_KEY).toBe('api_key');
  });

  it('should be type-safe for function parameters', () => {
    // This test validates that TypeScript type checking works
    const key: SecureStorageKey = SecureStorageKey.AUTH_TOKEN;
    expect(key).toBeDefined();
  });
});

describe('saveSecure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save value and return success', async () => {
    mockSecureStore.setItemAsync.mockResolvedValueOnce(undefined);

    const result = await saveSecure(SecureStorageKey.AUTH_TOKEN, 'token123');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeUndefined();
    }
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
      'auth_token',
      'token123'
    );
  });

  it('should save value with USER_ID key', async () => {
    mockSecureStore.setItemAsync.mockResolvedValueOnce(undefined);

    const result = await saveSecure(SecureStorageKey.USER_ID, 'user123');

    expect(result.success).toBe(true);
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
      'user_id',
      'user123'
    );
  });

  it('should return error when save fails', async () => {
    const error = new Error('Storage full');
    mockSecureStore.setItemAsync.mockRejectedValueOnce(error);

    const result = await saveSecure(SecureStorageKey.AUTH_TOKEN, 'token123');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Failed to save auth_token');
      expect(result.error).toContain('Storage full');
    }
  });

  it('should handle unknown error type', async () => {
    mockSecureStore.setItemAsync.mockRejectedValueOnce('Unknown error');

    const result = await saveSecure(SecureStorageKey.AUTH_TOKEN, 'token123');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Failed to save auth_token');
    }
  });

  it('should save empty string', async () => {
    mockSecureStore.setItemAsync.mockResolvedValueOnce(undefined);

    const result = await saveSecure(SecureStorageKey.AUTH_TOKEN, '');

    expect(result.success).toBe(true);
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', '');
  });

  it('should save long string', async () => {
    const longValue = 'a'.repeat(2000);
    mockSecureStore.setItemAsync.mockResolvedValueOnce(undefined);

    const result = await saveSecure(SecureStorageKey.AUTH_TOKEN, longValue);

    expect(result.success).toBe(true);
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
      'auth_token',
      longValue
    );
  });
});

describe('getSecure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve value successfully', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce('token123');

    const result = await getSecure(SecureStorageKey.AUTH_TOKEN);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('token123');
    }
    expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
  });

  it('should return null when key does not exist', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce(null);

    const result = await getSecure(SecureStorageKey.AUTH_TOKEN);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it('should retrieve value from different key', async () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce('user123');

    const result = await getSecure(SecureStorageKey.USER_ID);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('user123');
    }
    expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('user_id');
  });

  it('should return error when retrieval fails', async () => {
    const error = new Error('Access denied');
    mockSecureStore.getItemAsync.mockRejectedValueOnce(error);

    const result = await getSecure(SecureStorageKey.AUTH_TOKEN);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Failed to get auth_token');
      expect(result.error).toContain('Access denied');
    }
  });

  it('should handle unknown error type on retrieval', async () => {
    mockSecureStore.getItemAsync.mockRejectedValueOnce('Network error');

    const result = await getSecure(SecureStorageKey.API_KEY);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Failed to get api_key');
    }
  });

  it('should return typed SecureStorageResult', () => {
    mockSecureStore.getItemAsync.mockResolvedValueOnce('token123');

    const result: SecureStorageResult<string | null> = getSecure(
      SecureStorageKey.AUTH_TOKEN
    ) as any;
    expect(result).toBeDefined();
  });
});

describe('deleteSecure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete value and return success', async () => {
    mockSecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);

    const result = await deleteSecure(SecureStorageKey.AUTH_TOKEN);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeUndefined();
    }
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
  });

  it('should delete from different key', async () => {
    mockSecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);

    const result = await deleteSecure(SecureStorageKey.USER_ID);

    expect(result.success).toBe(true);
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('user_id');
  });

  it('should return error when deletion fails', async () => {
    const error = new Error('Key not found');
    mockSecureStore.deleteItemAsync.mockRejectedValueOnce(error);

    const result = await deleteSecure(SecureStorageKey.AUTH_TOKEN);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Failed to delete auth_token');
      expect(result.error).toContain('Key not found');
    }
  });

  it('should handle unknown error type on deletion', async () => {
    mockSecureStore.deleteItemAsync.mockRejectedValueOnce('Unexpected error');

    const result = await deleteSecure(SecureStorageKey.API_KEY);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Failed to delete api_key');
    }
  });

  it('should handle deletion of non-existent key gracefully', async () => {
    // On iOS/Android, deleting a non-existent key usually succeeds silently
    mockSecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);

    const result = await deleteSecure(SecureStorageKey.AUTH_TOKEN);

    expect(result.success).toBe(true);
  });
});

describe('SecureStorageResult type', () => {
  it('should handle success result type', () => {
    const result: SecureStorageResult<string> = {
      success: true,
      data: 'test',
    };
    expect(result.success).toBe(true);
  });

  it('should handle error result type', () => {
    const result: SecureStorageResult<string> = {
      success: false,
      error: 'Failed',
    };
    expect(result.success).toBe(false);
  });
});
