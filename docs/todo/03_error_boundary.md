# 03. Error Boundary Implementation

**Priority**: 🔴 High
**Status**: Pending

## Overview

Implement a global error boundary to display user-friendly error screens when crashes occur, with options to retry or restart the app.

## Background

When unhandled errors cause crashes, users see blank white screens with no context. A minimum fallback UI is essential for user experience. This prevents user confusion and provides recovery options.

## File Locations

```
/app/_layout.tsx                    # Root layout - export ErrorBoundary
/components/ui/ErrorFallback.tsx    # Error screen component
```

## Requirements

### Integration with expo-router

| Requirement | Details |
|-------------|---------|
| expo-router integration | Use `ErrorBoundary` export in root layout |
| Global placement | Wrap all screens at root level |
| User-friendly messaging | Hide technical error messages from users |
| Recovery mechanisms | "Retry" and "Restart App" buttons |
| Debug support | Show error details in development mode only |

### ErrorFallback Component Requirements

The error fallback component should include:

- Error icon or appropriate illustration
- User-friendly message (e.g., "Something went wrong")
- "Retry" button (calls `retry` function)
- "Restart App" button (`Updates.reloadAsync()` or `DevSettings.reload()`)
- Error stack trace (only visible when `__DEV__` is true)

### expo-router Implementation Pattern

```typescript
// app/_layout.tsx
export { ErrorBoundary } from '@/components/ui/ErrorFallback';

export default function RootLayout() {
  // ... existing layout code
}
```

### ErrorFallback Component Interface

```typescript
interface ErrorBoundaryProps {
  error: Error;
  retry: () => void;
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  // Component implementation
}
```

### Error Logging

- Use `console.error` to log error details (for development debugging)
- In production, hide technical details from users
- Consider logging to crash reporting service (optional, future enhancement)

## Design Requirements

### Visual Elements

- Clear error indication (icon or illustration)
- Calm, reassuring color scheme
- Large, readable text
- Accessible button sizes (minimum 44x44 points)
- Proper spacing and padding

### Content

**User-facing message (production)**:
```
Something went wrong

We're sorry, but something unexpected happened.
Please try again or restart the app.
```

**Developer-facing (development mode)**:
```
[User-facing message above]

--- Debug Information ---
Error: [error.message]
Stack: [error.stack]
```

### Recovery Actions

1. **Retry Button**: Attempt to re-render the failed component
2. **Restart Button**: Reload the entire app
   - Use `expo-updates` in production: `Updates.reloadAsync()`
   - Use `DevSettings` in development: `DevSettings.reload()`

## Implementation Notes

- `ErrorBoundary` only catches React lifecycle errors
- Does not catch:
  - Native crashes (OOM, etc.)
  - Async errors (Promise rejections) - these need separate handling
  - Event handler errors - wrap in try-catch
- Consider adding unhandled promise rejection handler:

```typescript
const errorHandler = (error: Error, isFatal?: boolean) => {
  // Log error
  console.error('Unhandled error:', error, 'isFatal:', isFatal);
};

if (ErrorUtils) {
  ErrorUtils.setGlobalHandler(errorHandler);
}
```

## Testing

### Manual Testing Scenarios

1. **Intentional crash**: Add a button that throws an error
2. **Retry functionality**: Verify retry button re-renders component
3. **Restart functionality**: Verify restart button reloads app
4. **Development mode**: Verify error stack is visible
5. **Production mode**: Verify technical details are hidden

### Test Component

Create a test component to trigger errors:

```typescript
// For testing only - remove from production
function CrashTestButton() {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error('Test crash');
  }

  return (
    <Button onPress={() => setShouldCrash(true)}>
      Trigger Error Boundary
    </Button>
  );
}
```

## Acceptance Criteria

- [ ] `ErrorFallback.tsx` component created in `components/ui/`
- [ ] Component exported from `app/_layout.tsx` as `ErrorBoundary`
- [ ] User-friendly error message displayed
- [ ] "Retry" button functions correctly
- [ ] "Restart App" button reloads the app
- [ ] Error details shown in `__DEV__` mode only
- [ ] Technical details hidden in production
- [ ] Component follows design system colors and typography
- [ ] Tested with intentional crash

## Future Enhancements (Out of Scope)

- Crash reporting integration (Sentry, BugSnag)
- Error analytics
- User feedback form on crash screen
- Automatic error recovery strategies

## References

- [expo-router Error Handling](https://docs.expo.dev/router/error-handling/)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [expo-updates API](https://docs.expo.dev/versions/latest/sdk/updates/)
