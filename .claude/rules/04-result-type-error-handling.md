---
alwaysApply: false
globs:
  - "**/types.ts"
  - "**/repository.ts"
  - "**/service.ts"
  - lib/**/*.ts
---

# Result Type & Error Handling

## Purpose

Explicit error handling without exceptions using the Result pattern.

## Result Type Definition

```typescript
/**
 * Result type for error handling without exceptions.
 * Following the Result pattern for explicit error handling.
 */
export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };
```

## Error Type Definition

Define errors as discriminated unions with consistent structure:

```typescript
export type FeatureError =
  | { code: 'NOT_FOUND'; message: string; retryable: false }
  | { code: 'VALIDATION_ERROR'; message: string; retryable: false }
  | { code: 'NETWORK_ERROR'; message: string; retryable: true }
  | { code: 'TIMEOUT_ERROR'; message: string; retryable: true }
  | { code: 'UNAUTHORIZED'; message: string; retryable: false }
  | { code: 'UNKNOWN_ERROR'; message: string; retryable: false };

// Extract error code type for type-safe handling
export type FeatureErrorCode = FeatureError['code'];
```

### Error Properties

| Property | Type | Description |
|----------|------|-------------|
| `code` | string literal | Machine-readable error identifier |
| `message` | string | Human-readable error message |
| `retryable` | boolean | Whether operation can be retried |

## Repository Pattern

Never throw from repository functions:

```typescript
export async function fetchData(): Promise<Result<Data, FeatureError>> {
  try {
    const response = await sdk.fetch();
    return { success: true, data: toData(response) };
  } catch (error) {
    return { success: false, error: mapError(error) };
  }
}
```

### Error Mapping

```typescript
function mapSDKError(error: SDKError): FeatureError {
  switch (error.code) {
    case 'NETWORK':
      return { code: 'NETWORK_ERROR', message: error.message, retryable: true };
    case 'TIMEOUT':
      return { code: 'TIMEOUT_ERROR', message: error.message, retryable: true };
    case 'NOT_FOUND':
      return { code: 'NOT_FOUND', message: error.message, retryable: false };
    default:
      return { code: 'UNKNOWN_ERROR', message: String(error), retryable: false };
  }
}
```

### Type Guards

```typescript
function isSDKError(error: unknown): error is SDKError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as SDKError).code === 'string'
  );
}
```

## Service Pattern

Services handle business logic and delegate to repository:

```typescript
export async function processData(
  input: Input
): Promise<Result<Output, FeatureError>> {
  // Validation
  if (!isValidInput(input)) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', retryable: false },
    };
  }

  // Delegate to repository
  const result = await repository.fetch(input.id);

  if (!result.success) {
    // Log and return error
    console.error('[processData]', result.error);
    return result;
  }

  // Business logic
  const output = transform(result.data);
  return { success: true, data: output };
}
```

## Handling Results

### At Call Site

```typescript
const result = await fetchData();

if (result.success) {
  // TypeScript narrows to { success: true; data: T }
  console.log(result.data);
} else {
  // TypeScript narrows to { success: false; error: E }
  console.error(result.error.message);

  if (result.error.retryable) {
    // Retry logic
  }
}
```

### With Fallback

```typescript
const result = await fetchSubscription();

if (!result.success) {
  console.warn('[Subscription] Using free tier fallback:', result.error);
  return DEFAULT_FREE_SUBSCRIPTION;
}

return result.data;
```

### Error Code Handling

```typescript
if (!result.success) {
  switch (result.error.code) {
    case 'NETWORK_ERROR':
      showToast('Network error. Please check your connection.');
      break;
    case 'NOT_FOUND':
      navigate('/not-found');
      break;
    case 'UNAUTHORIZED':
      logout();
      break;
    default:
      showToast('An error occurred. Please try again.');
  }
}
```

## Utility Functions

### Combine Results

```typescript
function combineResults<T, E>(
  results: Result<T, E>[]
): Result<T[], E> {
  const errors = results.filter((r): r is { success: false; error: E } => !r.success);

  if (errors.length > 0) {
    return { success: false, error: errors[0].error };
  }

  const data = results
    .filter((r): r is { success: true; data: T } => r.success)
    .map((r) => r.data);

  return { success: true, data };
}
```

### Wrap Async

```typescript
async function wrapAsync<T>(
  fn: () => Promise<T>,
  errorMapper: (e: unknown) => FeatureError
): Promise<Result<T, FeatureError>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: errorMapper(error) };
  }
}
```

## Anti-Patterns

### Never Throw from Repository/Service

```typescript
// BAD
async function fetchData(): Promise<Data> {
  const response = await sdk.fetch();
  if (!response) {
    throw new Error('Not found'); // Don't throw
  }
  return response;
}

// GOOD
async function fetchData(): Promise<Result<Data, FeatureError>> {
  const response = await sdk.fetch();
  if (!response) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Not found', retryable: false } };
  }
  return { success: true, data: response };
}
```

### Always Handle Both Cases

```typescript
// BAD
const result = await fetchData();
console.log(result.data); // Type error: data might not exist

// GOOD
const result = await fetchData();
if (result.success) {
  console.log(result.data);
}
```
