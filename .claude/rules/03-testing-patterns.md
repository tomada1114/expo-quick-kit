---
alwaysApply: false
globs:
  - "**/__tests__/**/*.test.ts"
  - "**/__tests__/**/*.test.tsx"
---

# Testing Patterns

## Purpose

Test organization, coverage requirements, and patterns for Jest tests.

## File Structure

```
components/ui/
├── button.tsx
├── __tests__/
│   └── button.test.tsx
```

Tests are colocated in `__tests__/` directories alongside source files.

## Test File Structure

```typescript
/**
 * Component/Module Tests
 * Brief description
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { Component } from '../component';

describe('Component', () => {
  // Group by behavior category
  describe('rendering', () => {
    it('should render with default props', () => { /* ... */ });
    it('should render children when provided', () => { /* ... */ });
  });

  describe('variants', () => {
    it('should render primary variant by default', () => { /* ... */ });
    it('should render secondary variant', () => { /* ... */ });
  });

  describe('states', () => {
    it('should handle onPress', () => { /* ... */ });
    it('should not call onPress when disabled', () => { /* ... */ });
    it('should show loading indicator when loading', () => { /* ... */ });
  });

  describe('accessibility', () => {
    it('should have minimum touch target height', () => { /* ... */ });
    it('should apply accessibilityLabel', () => { /* ... */ });
  });
});
```

## Coverage Requirements

### Happy Path
Normal successful flows:
```typescript
it('should render with title', () => {
  const { getByText } = render(<Button title="Click me" />);
  expect(getByText('Click me')).toBeTruthy();
});
```

### Sad Path
Expected errors (validation failures, not found):
```typescript
it('should not call onPress when disabled', () => {
  const onPressMock = jest.fn();
  const { getByText } = render(
    <Button title="Disabled" onPress={onPressMock} disabled />
  );
  fireEvent.press(getByText('Disabled'));
  expect(onPressMock).not.toHaveBeenCalled();
});
```

### Edge Cases
Boundaries (empty, null, undefined, extreme values):
```typescript
it('should handle empty title', () => {
  const { getByTestId } = render(<Button testID="button" />);
  expect(getByTestId('button')).toBeTruthy();
});

it('should reject password without uppercase', () => {
  const result = validatePassword('lowercase123!');
  expect(result.success).toBe(false);
});
```

### Unhappy Path
System failures (network errors, timeouts):
```typescript
it('should return error on network failure', async () => {
  jest.spyOn(sdk, 'fetch').mockRejectedValue(new Error('Network error'));
  const result = await repository.fetch();
  expect(result.success).toBe(false);
  expect(result.error.code).toBe('NETWORK_ERROR');
});
```

## Mock Patterns

### Mock Functions
```typescript
const onPressMock = jest.fn();

afterEach(() => {
  jest.clearAllMocks();
});

it('should call onPress', () => {
  fireEvent.press(getByText('Press'));
  expect(onPressMock).toHaveBeenCalledTimes(1);
});
```

### Mock Factories
```typescript
function createMockRepository(): FeatureRepository {
  return {
    fetch: jest.fn().mockResolvedValue({ success: true, data: mockEntity }),
    update: jest.fn().mockResolvedValue({ success: true, data: mockEntity }),
  };
}

const mockRepository = createMockRepository();
```

### Mock Modules
```typescript
jest.mock('@/services/api', () => ({
  fetchData: jest.fn(),
}));

import { fetchData } from '@/services/api';
const mockedFetchData = fetchData as jest.MockedFunction<typeof fetchData>;
```

## Test Isolation

```typescript
describe('Service', () => {
  let service: FeatureService;
  let mockRepository: FeatureRepository;

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = createService({ repository: mockRepository });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
```

## Component Testing

### Render and Query
```typescript
const { getByText, getByTestId, queryByText } = render(
  <Button title="Save" testID="save-btn" />
);

// getBy* - throws if not found (use for assertions)
expect(getByText('Save')).toBeTruthy();

// queryBy* - returns null if not found (use for negative assertions)
expect(queryByText('Loading')).toBeNull();
```

### User Interactions
```typescript
import { fireEvent } from '@testing-library/react-native';

fireEvent.press(getByText('Submit'));
fireEvent.changeText(getByTestId('input'), 'new value');
```

### Async Operations
```typescript
import { waitFor } from '@testing-library/react-native';

await waitFor(() => {
  expect(getByText('Loaded')).toBeTruthy();
});
```

## Service/Repository Testing

### Result Type Testing
```typescript
it('should return success result', async () => {
  const result = await service.fetch();

  // Type guard
  if (result.success) {
    expect(result.data.id).toBe('123');
  } else {
    fail('Expected success result');
  }
});

it('should return error result on failure', async () => {
  mockRepository.fetch.mockRejectedValue(new Error('fail'));

  const result = await service.fetch();

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.code).toBe('UNKNOWN_ERROR');
  }
});
```

## Accessibility Testing

```typescript
import { TouchTarget } from '@/constants/theme';

it('should have minimum touch target height', () => {
  const { getByTestId } = render(<Button testID="button" size="md" />);
  const button = getByTestId('button');
  const style = button.props.style;
  const flattenedStyle = Array.isArray(style)
    ? style.reduce((acc, s) => ({ ...acc, ...s }), {})
    : style;
  expect(flattenedStyle.minHeight).toBeGreaterThanOrEqual(TouchTarget.min);
});
```

## Test Naming

Use descriptive names that explain the expected behavior:

```typescript
// Good
it('should not call onPress when disabled')
it('should show loading indicator when loading prop is true')
it('should return NETWORK_ERROR when fetch fails')

// Bad
it('test disabled')
it('loading works')
it('error handling')
```
