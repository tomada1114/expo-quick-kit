---
alwaysApply: false
globs:
  - hooks/**/*.ts
  - features/**/hooks/**/*.ts
---

# Custom Hooks Guidelines

## Purpose

Patterns and conventions for React custom hooks.

## File Naming

- File: `use-{name}.ts` (kebab-case)
- Hook: `useXxx` (camelCase)

```
hooks/
├── use-color-scheme.ts
├── use-theme-color.ts
├── use-debounce.ts
└── index.ts
```

## Hook Structure

```typescript
/**
 * useFeature Hook
 *
 * Description of what the hook does.
 *
 * Usage:
 *   const { data, isLoading, error } = useFeature();
 *
 * @returns {UseFeatureReturn} Hook return values
 */
import { useState, useCallback, useMemo } from 'react';

// Return type interface
export interface UseFeatureReturn {
  /** The current data */
  data: Data | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refresh data */
  refresh: () => void;
}

export function useFeature(): UseFeatureReturn {
  const [data, setData] = useState<Data | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(() => {
    // Refresh logic
  }, []);

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}
```

## Memoization

### useMemo for Derived State

```typescript
export function useSubscription(): UseSubscriptionReturn {
  const context = useSubscriptionContext();

  // Memoize derived state
  const isPremium = useMemo(
    () => context.subscription.tier === 'premium',
    [context.subscription.tier]
  );

  const limits = useMemo(
    () => context.service.getUsageLimits(),
    [context.subscription.tier]
  );

  return {
    ...context,
    isPremium,
    limits,
  };
}
```

### useCallback for Functions

```typescript
const handlePress = useCallback(() => {
  onPress?.(item);
}, [onPress, item]);

const fetchData = useCallback(async () => {
  setIsLoading(true);
  try {
    const result = await api.fetch();
    setData(result);
  } finally {
    setIsLoading(false);
  }
}, [api]);
```

## Context Hooks

### Context Validation

```typescript
const FeatureContext = createContext<FeatureContextValue | null>(null);

export function useFeatureContext(): FeatureContextValue {
  const context = useContext(FeatureContext);

  if (!context) {
    throw new Error(
      'useFeatureContext must be used within a FeatureProvider'
    );
  }

  return context;
}
```

### Wrapper Hook with Derived State

```typescript
// Internal context hook
function useFeatureContext(): FeatureContextValue {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatureContext must be used within FeatureProvider');
  }
  return context;
}

// Public hook with derived state
export function useFeature(): UseFeatureReturn {
  const { state, actions } = useFeatureContext();

  // Add derived state
  const isActive = useMemo(() => state.status === 'active', [state.status]);

  return {
    ...state,
    ...actions,
    isActive,
  };
}
```

## Platform-Specific Hooks

Create separate files for platform-specific implementations:

```
hooks/
├── use-haptics.ts        # Shared interface
├── use-haptics.ios.ts    # iOS implementation
├── use-haptics.android.ts # Android implementation
└── use-haptics.web.ts    # Web implementation (no-op)
```

```typescript
// use-haptics.ts (shared interface)
export interface UseHapticsReturn {
  impact: (style: 'light' | 'medium' | 'heavy') => void;
  notification: (type: 'success' | 'warning' | 'error') => void;
}

// use-haptics.ios.ts
import * as Haptics from 'expo-haptics';

export function useHaptics(): UseHapticsReturn {
  return {
    impact: (style) => Haptics.impactAsync(/* ... */),
    notification: (type) => Haptics.notificationAsync(/* ... */),
  };
}

// use-haptics.web.ts (no-op)
export function useHaptics(): UseHapticsReturn {
  return {
    impact: () => {},
    notification: () => {},
  };
}
```

## Effect Hooks

### Cleanup Pattern

```typescript
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id); // Cleanup
  }, [delay]);
}
```

### Async Effect Pattern

```typescript
export function useAsyncEffect(
  effect: () => Promise<void>,
  deps: DependencyList
) {
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (!cancelled) {
          await effect();
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[useAsyncEffect]', error);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, deps);
}
```

## Barrel Exports

```typescript
// hooks/index.ts
export { useColorScheme } from './use-color-scheme';
export { useThemedColors, useThemeColor } from './use-theme-color';
export { useDebounce } from './use-debounce';
export type { UseColorSchemeReturn } from './use-color-scheme';
```

## Anti-Patterns

### Avoid Inline Object/Array Dependencies

```typescript
// BAD - creates new array every render
useMemo(() => compute(data), [data, [item1, item2]]);

// GOOD - stable dependencies
const items = useMemo(() => [item1, item2], [item1, item2]);
useMemo(() => compute(data), [data, items]);
```

### Avoid Missing Dependencies

```typescript
// BAD - missing dependency
const handleClick = useCallback(() => {
  console.log(count); // count is not in deps
}, []);

// GOOD
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);
```
