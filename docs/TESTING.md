# Testing Guide

This document describes the testing standards and practices used in expo-quick-kit.

## Overview

expo-quick-kit uses Jest with jest-expo preset for testing React Native components and utilities.

## Test File Location

Tests are located in `__tests__/` directories alongside the code they test:

```
components/
├── ui/
│   ├── __tests__/
│   │   └── button.test.tsx
│   └── button.tsx
└── themed-text.tsx

lib/
├── __tests__/
│   ├── validation.test.ts
│   └── date.test.ts
├── validation.ts
└── date.ts

features/
└── _example/
    ├── __tests__/
    │   └── item-list.test.tsx
    └── components/
        └── item-list.tsx
```

## Test File Naming

Test files follow the pattern: `*.test.ts` or `*.test.tsx`

```
✅ Good
button.test.tsx
validation.test.ts
use-color-scheme.test.ts

❌ Bad
button.spec.tsx
validation_test.ts
testValidation.ts
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test button

# Run tests in watch mode
pnpm test --watch
```

## Writing Tests

### Component Tests

Use `@testing-library/react-native` for component testing:

```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '../button';

describe('Button', () => {
  it('should render with label', () => {
    render(<Button label="Click me" onPress={() => {}} />);
    expect(screen.getByText('Click me')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button label="Click" onPress={onPress} />);

    fireEvent.press(screen.getByText('Click'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    render(<Button label="Click" onPress={onPress} disabled />);

    fireEvent.press(screen.getByText('Click'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
```

### Hook Tests

Use `@testing-library/react-hooks` or render hooks in a test component:

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useCounter } from '../use-counter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter(0));
    expect(result.current.count).toBe(0);
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### Utility Tests

Test pure functions directly:

```typescript
import { formatDate, parseDate } from '../date';

describe('date utilities', () => {
  describe('formatDate', () => {
    it('should format date in Japanese format', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date, 'yyyy年MM月dd日')).toBe('2024年01月15日');
    });
  });

  describe('parseDate', () => {
    it('should parse date string', () => {
      const result = parseDate('2024-01-15', 'yyyy-MM-dd');
      expect(result.getFullYear()).toBe(2024);
    });
  });
});
```

## Mocking

### Mocking Modules

```typescript
// Mock external modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

// Mock internal modules
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));
```

### Mocking Components

```typescript
jest.mock('@/components/ui/icon-symbol', () => ({
  IconSymbol: ({ name, color }: { name: string; color: string }) => {
    const { View } = require('react-native');
    return <View testID={`icon-${name}`} />;
  },
}));
```

### Mock Placement

Place mocks before imports that use them:

```typescript
// 1. Jest mocks first
jest.mock('expo-router', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => children,
}));

// 2. Then imports
import { render } from '@testing-library/react-native';
import { MyComponent } from '../my-component';
```

## Test Organization

### describe Blocks

Organize tests with nested `describe` blocks:

```typescript
describe('Button', () => {
  describe('rendering', () => {
    it('should render with label', () => {});
    it('should render with icon', () => {});
  });

  describe('interactions', () => {
    it('should handle press', () => {});
    it('should handle long press', () => {});
  });

  describe('states', () => {
    it('should show loading state', () => {});
    it('should show disabled state', () => {});
  });
});
```

### Test Naming

Use descriptive test names that explain the expected behavior:

```typescript
✅ Good
it('should display error message when validation fails', () => {});
it('should call onSubmit with form data when submitted', () => {});

❌ Bad
it('works', () => {});
it('test1', () => {});
```

## Coverage

### Running Coverage

```bash
pnpm test:coverage
```

### Coverage Thresholds

Library integration modules require 80% minimum coverage:

- `lib/validation.ts`
- `lib/date.ts`
- `lib/secure-storage.ts`
- `services/notifications.ts`

### Coverage Report

Coverage reports are generated in the `coverage/` directory:

- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI

## Best Practices

1. **Test behavior, not implementation** - Focus on what the component does, not how it does it

2. **Keep tests independent** - Each test should be able to run in isolation

3. **Use meaningful assertions** - Test the actual output, not just that something exists

4. **Avoid testing implementation details** - Don't test private methods or internal state

5. **Clean up after tests** - Use `afterEach` to reset mocks and state

```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

6. **Test edge cases** - Include tests for empty states, error states, and boundary conditions

7. **Keep tests fast** - Mock expensive operations like network requests and timers
