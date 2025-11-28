# Utility Modules

This directory contains reusable utility modules for the expo-quick-kit boilerplate.

## Available Modules

### validation.ts - Zod Validation Schemas

Type-safe form validation using [zod](https://github.com/colinhacks/zod).

#### Schemas

| Schema | Description |
|--------|-------------|
| `emailSchema` | Email validation with localized error messages |
| `passwordSchema` | Password validation (8+ chars, uppercase, lowercase, number) |
| `phoneSchema` | Japanese phone number format validation |

#### Usage

```typescript
import { emailSchema, passwordSchema, phoneSchema, validateData } from '@/lib/validation';

// Validate email
const emailResult = validateData(emailSchema, 'user@example.com');
if (emailResult.success) {
  console.log('Valid email:', emailResult.data);
} else {
  console.log('Errors:', emailResult.errors);
}

// Validate password
const passwordResult = validateData(passwordSchema, 'MyPassword123');

// Validate phone
const phoneResult = validateData(phoneSchema, '09012345678');
```

#### Custom Schemas

Create custom schemas with localized error messages:

```typescript
import { z } from 'zod';
import { validateData } from '@/lib/validation';

const userSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  age: z.number().min(0, { message: 'Age must be non-negative' }),
});

const result = validateData(userSchema, { email: 'test@example.com', name: 'John', age: 25 });
```

---

### date.ts - Date Formatting Utilities

Date formatting functions using [date-fns](https://date-fns.org/) with Japanese locale as default.

#### Functions

| Function | Description |
|----------|-------------|
| `formatDate(date, formatStr)` | Format date with custom format string |
| `formatDistanceToNow(date, baseDate?)` | Relative time (e.g., '3日前') |
| `formatRelativeDate(date, baseDate?)` | Relative date (e.g., '今日', '昨日') |

#### Usage

```typescript
import { formatDate, formatDistanceToNow, formatRelativeDate } from '@/lib/date';

const now = new Date();

// Format with pattern
formatDate(now, 'yyyy-MM-dd');          // '2024-01-15'
formatDate(now, 'yyyy年MM月dd日');       // '2024年01月15日'
formatDate(now, 'EEEE');                // '月曜日'

// Relative time
const yesterday = new Date(Date.now() - 86400000);
formatDistanceToNow(yesterday);         // '1日前'

const nextWeek = new Date(Date.now() + 604800000);
formatDistanceToNow(nextWeek);          // '約1週間後'

// Relative date
formatRelativeDate(now);                // '今日 12:00'
formatRelativeDate(yesterday);          // '昨日 12:00'
```

#### Format Patterns

Common date-fns format tokens:

| Token | Description | Example |
|-------|-------------|---------|
| `yyyy` | 4-digit year | 2024 |
| `MM` | 2-digit month | 01 |
| `dd` | 2-digit day | 15 |
| `HH` | 24-hour format | 14 |
| `mm` | Minutes | 30 |
| `ss` | Seconds | 45 |
| `EEEE` | Day of week | 月曜日 |

---

### secure-storage.ts - Encrypted Storage Wrapper

Type-safe wrapper for [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) with Result pattern error handling.

#### Storage Keys

```typescript
enum SecureStorageKey {
  AUTH_TOKEN = 'auth_token',
  USER_ID = 'user_id',
  API_KEY = 'api_key',
}
```

#### Functions

| Function | Description |
|----------|-------------|
| `saveSecure(key, value)` | Store value securely |
| `getSecure(key)` | Retrieve value |
| `deleteSecure(key)` | Delete value |

#### Usage

```typescript
import { saveSecure, getSecure, deleteSecure, SecureStorageKey } from '@/lib/secure-storage';

// Save token
const saveResult = await saveSecure(SecureStorageKey.AUTH_TOKEN, 'my-secret-token');
if (saveResult.success) {
  console.log('Token saved');
} else {
  console.error('Failed:', saveResult.error);
}

// Retrieve token
const getResult = await getSecure(SecureStorageKey.AUTH_TOKEN);
if (getResult.success) {
  console.log('Token:', getResult.data);  // 'my-secret-token' or null
}

// Delete token
const deleteResult = await deleteSecure(SecureStorageKey.AUTH_TOKEN);
```

#### Limitations

- **Payload size**: Maximum ~2048 bytes on iOS (Keychain limitation)
- **Platform support**: iOS Keychain, Android EncryptedSharedPreferences
- **Expo Go**: Limited functionality; use Development Build for full support

---

### query-client.ts - TanStack Query Configuration

Pre-configured QueryClient for async state management.

#### Configuration

| Option | Value | Description |
|--------|-------|-------------|
| `staleTime` | 5 minutes | Data remains fresh |
| `gcTime` | 10 minutes | Unused data garbage collected |
| `retry` | 1 | Single retry on failure |
| `refetchOnWindowFocus` | true | Refetch when app foregrounds |
| `refetchOnReconnect` | true | Refetch on network reconnect |

#### Usage

```typescript
import { queryClient } from '@/lib/query-client';

// Already configured in app/_layout.tsx
// Just use TanStack Query hooks in your components
```

---

### format.ts - Basic Formatting Utilities

Simple formatting utilities using native JavaScript APIs.

#### Functions

| Function | Description |
|----------|-------------|
| `formatDate(date, options?)` | Format date using `toLocaleDateString` |

#### Usage

```typescript
import { formatDate, DEFAULT_LOCALE } from '@/lib/format';

formatDate(new Date());                           // '2024年1月15日' (ja-JP)
formatDate(new Date(), { locale: 'en-US' });      // 'Jan 15, 2024'
```

---

## Related Services

### services/notifications.ts - Push Notification Service

Wrapper for [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/).

#### Functions

| Function | Description |
|----------|-------------|
| `requestNotificationPermissions()` | Request permissions and get push token |
| `scheduleNotification(title, body, trigger)` | Schedule local notification |
| `cancelNotification(id)` | Cancel scheduled notification |
| `getAllScheduledNotifications()` | Get all pending notifications |
| `setupForegroundHandler(handler?)` | Configure foreground notification display |

#### Usage

```typescript
import {
  requestNotificationPermissions,
  scheduleNotification,
  setupForegroundHandler,
} from '@/services/notifications';

// Initialize (call once in app/_layout.tsx)
setupForegroundHandler();

// Request permission
const result = await requestNotificationPermissions();
if (result.status === 'granted') {
  console.log('Push token:', result.token);
}

// Schedule notification
const id = await scheduleNotification(
  'Reminder',
  'Time to check the app!',
  { seconds: 5 }
);

// Or schedule at specific date
const id = await scheduleNotification(
  'Meeting',
  'Starting now',
  { date: new Date('2024-01-15T10:00:00') }
);
```

#### Requirements

- **Development Build required**: Push notifications do not work in Expo Go
- **Physical device**: Required for push token retrieval
- **Android 8.0+**: Notification channel automatically configured

---

## Type Definitions

### ValidationResult

```typescript
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };
```

### SecureStorageResult

```typescript
type SecureStorageResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### PermissionResult

```typescript
type PermissionResult =
  | { status: 'granted'; token: string }
  | { status: 'denied'; error: string };
```
