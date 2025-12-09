# Coding Conventions

This document describes the coding standards and conventions used in expo-quick-kit.

## Naming Conventions

### Files and Directories

All files and directories use **kebab-case**:

```
✅ Good
components/themed-text.tsx
hooks/use-color-scheme.ts
features/posts/components/post-card.tsx
services/api-client.ts

❌ Bad
components/ThemedText.tsx
hooks/useColorScheme.ts
features/posts/components/PostCard.tsx
services/apiClient.ts
```

### React Components

- **Component files**: kebab-case (`themed-text.tsx`)
- **Component names**: PascalCase (`ThemedText`)
- **Props interfaces**: ComponentName + `Props` (`ThemedTextProps`)

```typescript
// themed-text.tsx
export interface ThemedTextProps {
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

export function ThemedText({ style, children }: ThemedTextProps) {
  // ...
}
```

### Hooks

- **Hook files**: `use-` prefix with kebab-case (`use-color-scheme.ts`)
- **Hook functions**: `use` prefix with camelCase (`useColorScheme`)

```typescript
// use-color-scheme.ts
export function useColorScheme() {
  // ...
}
```

### Types and Interfaces

- **Type files**: kebab-case (`item-types.ts`) or `types.ts` in feature folders
- **Type/Interface names**: PascalCase (`Item`, `ItemListProps`)

```typescript
// types.ts
export interface Item {
  id: string;
  name: string;
}
```

## File Organization

### Barrel Exports

Each directory should have an `index.ts` for clean imports:

```typescript
// components/index.ts
export * from './ui';
export { ThemedText, type ThemedTextProps } from './themed-text';
export { ThemedView, type ThemedViewProps } from './themed-view';
```

Usage:
```typescript
import { Button, Card, ThemedText } from '@/components';
```

### Feature Module Structure

```
features/
└── feature-name/
    ├── components/
    │   ├── component-a.tsx
    │   ├── component-b.tsx
    │   └── index.ts
    ├── hooks/
    │   ├── use-feature-hook.ts
    │   └── index.ts
    ├── services/
    │   ├── api.ts              # External API calls
    │   ├── repository.ts       # Database operations
    │   ├── query-keys.ts       # TanStack Query keys
    │   └── index.ts
    ├── store/                  # Optional: Feature-specific state
    │   ├── store.ts
    │   └── index.ts
    ├── types.ts                # Feature-specific types
    ├── index.ts                # Main export
    └── __tests__/              # Tests alongside code
        ├── components.test.tsx
        ├── hooks.test.ts
        └── repository.test.ts
```

See [FEATURE_DEVELOPMENT.md](./FEATURE_DEVELOPMENT.md) for detailed feature structure and best practices.

## Import Order

Imports should be organized in the following order:

1. React/React Native
2. External libraries
3. Internal aliases (`@/...`)
4. Relative imports

```typescript
// 1. React/React Native
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. External libraries
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 3. Internal aliases
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components';

// 4. Relative imports
import { ItemCard } from './item-card';
import type { Item } from '../types';
```

## Path Aliases

Use the `@/` alias for all imports from the project root:

```typescript
// ✅ Good
import { Colors } from '@/constants/theme';
import { Button } from '@/components/ui/button';

// ❌ Bad
import { Colors } from '../../constants/theme';
import { Button } from '../../components/ui/button';
```

## Component Patterns

### Functional Components with TypeScript

```typescript
import { View, StyleSheet } from 'react-native';

interface MyComponentProps {
  title: string;
  onPress?: () => void;
}

export function MyComponent({ title, onPress }: MyComponentProps) {
  return (
    <View style={styles.container}>
      {/* ... */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

### Hooks Pattern

```typescript
import { useState, useCallback } from 'react';

export function useMyHook(initialValue: string) {
  const [value, setValue] = useState(initialValue);

  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  return { value, updateValue };
}
```

## Style Guidelines

### StyleSheet Usage

Always use `StyleSheet.create()` for styles:

```typescript
// ✅ Good
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

// ❌ Bad
const styles = {
  container: {
    flex: 1,
    padding: 16,
  },
};
```

### Theme Colors

Use theme colors from `@/constants/theme`:

```typescript
import { useThemedColors } from '@/hooks/use-theme-color';

function MyComponent() {
  const { colors } = useThemedColors();

  return (
    <View style={{ backgroundColor: colors.background.base }}>
      <Text style={{ color: colors.text.primary }}>Hello</Text>
    </View>
  );
}
```

## Error Handling

### Result Pattern for Utilities

```typescript
type Result<T> = { success: true; data: T } | { success: false; error: Error };

export async function fetchData(): Promise<Result<Data>> {
  try {
    const data = await api.get();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

## Code Quality

### ESLint and Prettier

- Run `pnpm lint` before committing
- Run `pnpm format` to auto-format code
- Run `pnpm check` to run all checks

### TypeScript

- Enable strict mode
- Avoid `any` type
- Use explicit return types for exported functions
