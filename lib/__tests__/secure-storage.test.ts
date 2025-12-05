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

/**
 * Additional test suite for comprehensive coverage
 * Covering: P0 Priority scenarios, boundary values, concurrent access, and purchase-specific use cases
 */
describe('SecureStorage - Purchase Verification Keys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should store iOS verification key for receipt validation', async () => {
    // Given: A JWS verification key for iOS receipt validation
    const verificationKey = JSON.stringify({
      kty: 'EC',
      use: 'sig',
      kid: 'abc123',
      x: 'base64encodedX',
      y: 'base64encodedY',
    });
    mockSecureStore.setItemAsync.mockResolvedValueOnce(undefined);
    mockSecureStore.getItemAsync.mockResolvedValueOnce(verificationKey);

    // When: Storing and retrieving verification key
    await saveSecure(SecureStorageKey.VERIFICATION_KEY_IOS, verificationKey);
    const result = await getSecure(SecureStorageKey.VERIFICATION_KEY_IOS);

    // Then: Should successfully retrieve the key
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(verificationKey);
    }
  });

  it('should store Android verification key for receipt validation', async () => {
    // Given: A public key for Android Play Billing verification
    const androidKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...';
    mockSecureStore.setItemAsync.mockResolvedValueOnce(undefined);
    mockSecureStore.getItemAsync.mockResolvedValueOnce(androidKey);

    // When: Storing and retrieving Android key
    await saveSecure(SecureStorageKey.VERIFICATION_KEY_ANDROID, androidKey);
    const result = await getSecure(SecureStorageKey.VERIFICATION_KEY_ANDROID);

    // Then: Should successfully retrieve the key
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(androidKey);
    }
  });

  it('should store and retrieve complex purchase metadata', async () => {
    // Given: Purchase metadata with nested structure
    const metadata = JSON.stringify({
      transactionId: 'txn_123',
      productId: 'premium_unlock',
      verifiedAt: Date.now(),
      platform: 'ios',
      signature: 'base64signature',
    });
    mockSecureStore.setItemAsync.mockResolvedValueOnce(undefined);
    mockSecureStore.getItemAsync.mockResolvedValueOnce(metadata);

    // When: Storing and retrieving metadata
    await saveSecure(SecureStorageKey.PURCHASE_METADATA, metadata);
    const result = await getSecure(SecureStorageKey.PURCHASE_METADATA);

    // Then: Should retrieve complete metadata structure
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.data!);
      expect(parsed.transactionId).toBe('txn_123');
      expect(parsed.platform).toBe('ios');
    }
  });

  it('should handle large JSON structure for purchase history', async () => {
    // Given: Large but valid JSON (e.g., transaction history array)
    const largeJson = JSON.stringify({
      transactions: Array(100).fill({
        id: 'txn_123',
        amount: 9.99,
        timestamp: Date.now(),
      }),
    });
    mockSecureStore.setItemAsync.mockResolvedValueOnce(undefined);

    // When: Storing large JSON
    const result = await saveSecure(
      SecureStorageKey.PURCHASE_METADATA,
      largeJson
    );

    // Then: Should handle large but valid structure
    expect(result.success).toBe(true);
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
      'purchase_metadata',
      largeJson
    );
  });
});

describe('SecureStorage - Boundary Values', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle exactly 2048 bytes (iOS Keychain limit)', async () => {
    // Given: Data at exact iOS Keychain size limit
    const exactLimit = 'a'.repeat(2048);
    mockSecureStore.setItemAsync.mockResolvedValueOnce(undefined);

    // When: Saving data at size limit
    const result = await saveSecure(SecureStorageKey.AUTH_TOKEN, exactLimit);

    // Then: Should succeed at boundary
    expect(result.success).toBe(true);
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
      'auth_token',
      exactLimit
    );
  });

  it('should attempt to store 2049 bytes (platform error handling)', async () => {
    // Given: Data just over iOS Keychain limit
    const overLimit = 'a'.repeat(2049);
    const sizeError = new Error('Data too large for Keychain');
    mockSecureStore.setItemAsync.mockRejectedValueOnce(sizeError);

    // When: Saving data over size limit
    const result = await saveSecure(SecureStorageKey.AUTH_TOKEN, overLimit);

    // Then: Should propagate platform-specific error
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Data too large');
    }
  });

  it('should handle single character value', async () => {
    // Given: Minimum non-empty value
    mockSecureStore.setItemAsync.mockResolvedValueOnce(undefined);
    mockSecureStore.getItemAsync.mockResolvedValueOnce('a');

    // When: Storing single character
    await saveSecure(SecureStorageKey.AUTH_TOKEN, 'a');
    const result = await getSecure(SecureStorageKey.AUTH_TOKEN);

    // Then: Should handle minimum boundary
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('a');
    }
  });

  it('should handle all defined SecureStorageKey enum values', async () => {
    // Given: All enum keys defined in SecureStorageKey
    const keys = [
      SecureStorageKey.AUTH_TOKEN,
      SecureStorageKey.USER_ID,
      SecureStorageKey.API_KEY,
      SecureStorageKey.VERIFICATION_KEY_IOS,
      SecureStorageKey.VERIFICATION_KEY_ANDROID,
      SecureStorageKey.PURCHASE_METADATA,
    ];

    mockSecureStore.setItemAsync.mockResolvedValue(undefined);

    // When: Saving to each key
    const results = await Promise.all(
      keys.map((key) => saveSecure(key, 'test'))
    );

    // Then: All keys should succeed
    results.forEach((result) => expect(result.success).toBe(true));
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledTimes(keys.length);
  });

  it('should distinguish between null (key not found) and undefined', async () => {
    // Given: Key does not exist in secure store
    mockSecureStore.getItemAsync.mockResolvedValueOnce(null);

    // When: Retrieving non-existent key
    const result = await getSecure(SecureStorageKey.AUTH_TOKEN);

    // Then: Should return success with null data (not undefined)
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
      expect(result.data).not.toBeUndefined();
    }
  });
});

describe('SecureStorage - Platform-Specific Errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle iOS Keychain access denied error', async () => {
    // Given: Keychain access denied (user locked device, permission error)
    const keychainError = new Error('Keychain access denied');
    mockSecureStore.getItemAsync.mockRejectedValueOnce(keychainError);

    // When: Attempting to retrieve data
    const result = await getSecure(SecureStorageKey.AUTH_TOKEN);

    // Then: Should return error with access denied message
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Keychain access denied');
    }
  });

  it('should handle Android Keystore initialization failure', async () => {
    // Given: Keystore not available (device encryption not set up)
    const keystoreError = new Error('Keystore unavailable');
    mockSecureStore.setItemAsync.mockRejectedValueOnce(keystoreError);

    // When: Attempting to save data
    const result = await saveSecure(SecureStorageKey.API_KEY, 'key123');

    // Then: Should return error with Keystore message
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Keystore unavailable');
    }
  });

  it('should handle storage quota exceeded error', async () => {
    // Given: Storage quota exceeded error from expo-secure-store
    const quotaError = new Error('Storage quota exceeded');
    mockSecureStore.setItemAsync.mockRejectedValueOnce(quotaError);

    // When: Attempting to save data
    const result = await saveSecure(SecureStorageKey.AUTH_TOKEN, 'token');

    // Then: Should return error with quota message
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Storage quota exceeded');
    }
  });

  it('should handle expo-secure-store module unavailable', async () => {
    // Given: expo-secure-store throws module not found error
    const moduleError = new Error('expo-secure-store module not available');
    mockSecureStore.setItemAsync.mockRejectedValueOnce(moduleError);

    // When: Attempting to save data
    const result = await saveSecure(SecureStorageKey.AUTH_TOKEN, 'token');

    // Then: Should return error with module message
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('module not available');
    }
  });
});

describe('SecureStorage - Special Characters and Unicode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle special characters (newlines, tabs, quotes)', async () => {
    // Given: Value with special characters
    const specialValue = 'token\nwith\ttabs\r\nand"quotes"';
    mockSecureStore.setItemAsync.mockResolvedValueOnce(undefined);
    mockSecureStore.getItemAsync.mockResolvedValueOnce(specialValue);

    // When: Storing and retrieving special characters
    await saveSecure(SecureStorageKey.AUTH_TOKEN, specialValue);
    const result = await getSecure(SecureStorageKey.AUTH_TOKEN);

    // Then: Should preserve special characters
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(specialValue);
    }
  });

  it('should handle Unicode and emoji characters', async () => {
    // Given: Value with Unicode and emoji
    const unicodeValue = '🔒 Secure トークン 🔐';
    mockSecureStore.setItemAsync.mockResolvedValueOnce(undefined);
    mockSecureStore.getItemAsync.mockResolvedValueOnce(unicodeValue);

    // When: Storing and retrieving Unicode
    await saveSecure(SecureStorageKey.AUTH_TOKEN, unicodeValue);
    const result = await getSecure(SecureStorageKey.AUTH_TOKEN);

    // Then: Should preserve Unicode characters
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(unicodeValue);
    }
  });

  it('should handle corrupted data retrieval (invalid JSON)', async () => {
    // Given: Corrupted/invalid JSON stored
    const corruptedData = '{invalid json';
    mockSecureStore.getItemAsync.mockResolvedValueOnce(corruptedData);

    // When: Retrieving corrupted data
    const result = await getSecure(SecureStorageKey.PURCHASE_METADATA);

    // Then: Should return success with raw data (validation is caller's responsibility)
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(corruptedData);
    }
  });
});

describe('SecureStorage - Concurrent Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle concurrent writes to same key (race condition)', async () => {
    // Given: Multiple concurrent write operations to same key
    mockSecureStore.setItemAsync
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    // When: Writing concurrently
    const [result1, result2] = await Promise.all([
      saveSecure(SecureStorageKey.AUTH_TOKEN, 'token1'),
      saveSecure(SecureStorageKey.AUTH_TOKEN, 'token2'),
    ]);

    // Then: Both operations should complete (last write wins)
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledTimes(2);
  });

  it('should handle concurrent read and write to same key', async () => {
    // Given: Simultaneous read and write operations
    mockSecureStore.getItemAsync.mockResolvedValueOnce('oldToken');
    mockSecureStore.setItemAsync.mockResolvedValueOnce(undefined);

    // When: Reading and writing concurrently
    const [getResult, saveResult] = await Promise.all([
      getSecure(SecureStorageKey.AUTH_TOKEN),
      saveSecure(SecureStorageKey.AUTH_TOKEN, 'newToken'),
    ]);

    // Then: Both operations should complete
    expect(getResult.success).toBe(true);
    expect(saveResult.success).toBe(true);
  });

  it('should handle concurrent delete and read operations', async () => {
    // Given: Simultaneous delete and read
    mockSecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);
    mockSecureStore.getItemAsync.mockResolvedValueOnce(null);

    // When: Deleting and reading concurrently
    const [deleteResult, getResult] = await Promise.all([
      deleteSecure(SecureStorageKey.AUTH_TOKEN),
      getSecure(SecureStorageKey.AUTH_TOKEN),
    ]);

    // Then: Both should succeed (read may return null after delete)
    expect(deleteResult.success).toBe(true);
    expect(getResult.success).toBe(true);
  });

  it('should handle concurrent operations on different keys', async () => {
    // Given: Multiple operations on different keys
    mockSecureStore.setItemAsync.mockResolvedValue(undefined);
    mockSecureStore.getItemAsync.mockResolvedValue('value');
    mockSecureStore.deleteItemAsync.mockResolvedValue(undefined);

    // When: Operating on different keys concurrently
    const results = await Promise.all([
      saveSecure(SecureStorageKey.AUTH_TOKEN, 'token'),
      getSecure(SecureStorageKey.USER_ID),
      deleteSecure(SecureStorageKey.API_KEY),
    ]);

    // Then: All operations should succeed independently
    results.forEach((result) => expect(result.success).toBe(true));
  });

  it('should handle error in one concurrent operation without affecting others', async () => {
    // Given: One operation fails, others succeed
    mockSecureStore.setItemAsync.mockResolvedValueOnce(undefined);
    mockSecureStore.getItemAsync.mockRejectedValueOnce(
      new Error('Read failed')
    );
    mockSecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);

    // When: Concurrent operations with one failure
    const [saveResult, getResult, deleteResult] = await Promise.all([
      saveSecure(SecureStorageKey.AUTH_TOKEN, 'token'),
      getSecure(SecureStorageKey.USER_ID),
      deleteSecure(SecureStorageKey.API_KEY),
    ]);

    // Then: Success and failure results should be independent
    expect(saveResult.success).toBe(true);
    expect(getResult.success).toBe(false);
    expect(deleteResult.success).toBe(true);
  });
});

describe('SecureStorage - Sequential Operations Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle save → get → delete sequential operations', async () => {
    // Given: A fresh secure storage state
    mockSecureStore.setItemAsync.mockResolvedValueOnce(undefined);
    mockSecureStore.getItemAsync.mockResolvedValueOnce('token123');
    mockSecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);

    // When: Performing sequential operations
    const saveResult = await saveSecure(
      SecureStorageKey.AUTH_TOKEN,
      'token123'
    );
    const getResult = await getSecure(SecureStorageKey.AUTH_TOKEN);
    const deleteResult = await deleteSecure(SecureStorageKey.AUTH_TOKEN);

    // Then: All operations should succeed
    expect(saveResult.success).toBe(true);
    expect(getResult.success).toBe(true);
    if (getResult.success) {
      expect(getResult.data).toBe('token123');
    }
    expect(deleteResult.success).toBe(true);
  });

  it('should handle multiple save-get cycles', async () => {
    // Given: Multiple iterations of save and get
    mockSecureStore.setItemAsync.mockResolvedValue(undefined);
    mockSecureStore.getItemAsync
      .mockResolvedValueOnce('token1')
      .mockResolvedValueOnce('token2')
      .mockResolvedValueOnce('token3');

    // When: Multiple save-get cycles
    await saveSecure(SecureStorageKey.AUTH_TOKEN, 'token1');
    const result1 = await getSecure(SecureStorageKey.AUTH_TOKEN);

    await saveSecure(SecureStorageKey.AUTH_TOKEN, 'token2');
    const result2 = await getSecure(SecureStorageKey.AUTH_TOKEN);

    await saveSecure(SecureStorageKey.AUTH_TOKEN, 'token3');
    const result3 = await getSecure(SecureStorageKey.AUTH_TOKEN);

    // Then: Each iteration should succeed
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result3.success).toBe(true);
    if (result1.success) expect(result1.data).toBe('token1');
    if (result2.success) expect(result2.data).toBe('token2');
    if (result3.success) expect(result3.data).toBe('token3');
  });
});
