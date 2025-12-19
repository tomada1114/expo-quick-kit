---
alwaysApply: false
globs:
  - services/**/*.ts
  - lib/**/*.ts
---

# Services & Infrastructure Guidelines

## Purpose

Service wrappers and infrastructure utilities for external APIs and system features.

## Service File Structure

```typescript
/**
 * Feature Service
 *
 * Description of what this service provides.
 *
 * Requirements:
 * - List any requirements (e.g., "Development Build required")
 * - List any platform limitations
 *
 * Best Practices:
 * - Usage recommendations
 * - Common pitfalls to avoid
 *
 * @module services/{feature}
 */

import { Platform } from 'react-native';

// 1. Type exports
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface FeatureResult {
  status: PermissionStatus;
  canAskAgain: boolean;
}

// 2. Constants
const DEFAULT_TIMEOUT = 5000;

// 3. Main functions
export async function requestPermission(): Promise<FeatureResult> {
  // Implementation
}

// 4. Helper functions (internal)
function mapNativeStatus(status: string): PermissionStatus {
  // Internal helper
}
```

## Platform-Specific Handling

```typescript
import { Platform } from 'react-native';

export async function requestNotificationPermission(): Promise<PermissionResult> {
  if (Platform.OS === 'android') {
    // Android-specific: Check API level for notification channels
    if (Platform.Version >= 33) {
      // Android 13+ requires explicit permission
      return await Notifications.requestPermissionsAsync();
    }
    // Older Android versions grant by default
    return { status: 'granted', canAskAgain: false };
  }

  // iOS and other platforms
  return await Notifications.requestPermissionsAsync();
}
```

## Error Handling

Use Result type for operations that can fail:

```typescript
import type { Result } from '@/features/subscription/core/types';

type StorageError =
  | { code: 'NOT_FOUND'; message: string }
  | { code: 'STORAGE_FULL'; message: string }
  | { code: 'ENCRYPTION_ERROR'; message: string }
  | { code: 'UNKNOWN_ERROR'; message: string };

export async function saveSecure(
  key: string,
  value: string
): Promise<Result<void, StorageError>> {
  try {
    await SecureStore.setItemAsync(key, value);
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('storage full')) {
      return {
        success: false,
        error: { code: 'STORAGE_FULL', message },
      };
    }

    return {
      success: false,
      error: { code: 'UNKNOWN_ERROR', message },
    };
  }
}
```

## Type-Safe Keys with Enums

```typescript
// lib/secure-storage.ts

/**
 * Secure storage keys.
 * Using enum ensures type-safety and prevents typos.
 */
export enum SecureStorageKey {
  AuthToken = 'auth_token',
  RefreshToken = 'refresh_token',
  UserPreferences = 'user_preferences',
  BiometricEnabled = 'biometric_enabled',
}

export async function getSecure(
  key: SecureStorageKey
): Promise<Result<string | null, StorageError>> {
  try {
    const value = await SecureStore.getItemAsync(key);
    return { success: true, data: value };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
```

## Validation Module Pattern

```typescript
// lib/validation.ts
import { z } from 'zod';

/**
 * Email validation schema.
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format');

/**
 * Password validation schema.
 * Requirements: 8+ chars, uppercase, lowercase, number, special char.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');

/**
 * Generic validation function with Result type.
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Result<T, ValidationError> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: result.error.errors[0]?.message ?? 'Validation failed',
      fields: result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    },
  };
}
```

## Date Utilities Pattern

```typescript
// lib/date.ts
import { format, formatDistance, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * Format date with Japanese locale.
 *
 * @example
 * formatDate(new Date()) // "2024年1月15日"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy年M月d日', { locale: ja });
}

/**
 * Format relative time.
 *
 * @example
 * formatRelative(new Date(Date.now() - 60000)) // "1分前"
 */
export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(d, new Date(), { addSuffix: true, locale: ja });
}
```

## Configuration Pattern

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query client configuration.
 *
 * Default settings:
 * - staleTime: 5 minutes
 * - gcTime: 30 minutes
 * - retry: 3 times with exponential backoff
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,        // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});
```

## JSDoc Best Practices

```typescript
/**
 * Request push notification permissions.
 *
 * Requirements:
 * - Expo Development Build (not Expo Go)
 * - iOS: Prompts user for permission
 * - Android 13+: Prompts user for permission
 * - Android <13: Granted by default
 *
 * @returns Permission result with status and canAskAgain flag
 *
 * @example
 * const result = await requestNotificationPermission();
 * if (result.status === 'granted') {
 *   // Schedule notifications
 * }
 */
export async function requestNotificationPermission(): Promise<PermissionResult> {
  // ...
}
```

## Barrel Export

```typescript
// lib/index.ts
export * from './validation';
export * from './date';
export * from './secure-storage';
export { queryClient } from './query-client';

// services/index.ts
export * from './notifications';
export * from './analytics';
```
