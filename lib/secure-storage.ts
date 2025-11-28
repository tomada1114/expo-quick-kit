import * as SecureStore from 'expo-secure-store';

/**
 * Secure storage keys (enum for type safety)
 */
export enum SecureStorageKey {
  AUTH_TOKEN = 'auth_token',
  USER_ID = 'user_id',
  API_KEY = 'api_key',
}

/**
 * Result type for secure storage operations
 */
export type SecureStorageResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Save value to secure storage
 * @param key - Storage key (enum)
 * @param value - Value to store (max ~2048 bytes on iOS)
 * @returns Result with success/error
 */
export async function saveSecure(
  key: SecureStorageKey,
  value: string
): Promise<SecureStorageResult<void>> {
  try {
    await SecureStore.setItemAsync(key, value);
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: `Failed to save ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Retrieve value from secure storage
 * @param key - Storage key (enum)
 * @returns Result with value or error
 */
export async function getSecure(
  key: SecureStorageKey
): Promise<SecureStorageResult<string | null>> {
  try {
    const value = await SecureStore.getItemAsync(key);
    return { success: true, data: value };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Delete value from secure storage
 * @param key - Storage key (enum)
 * @returns Result with success/error
 */
export async function deleteSecure(
  key: SecureStorageKey
): Promise<SecureStorageResult<void>> {
  try {
    await SecureStore.deleteItemAsync(key);
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: `Failed to delete ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
