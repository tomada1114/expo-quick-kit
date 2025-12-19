---
alwaysApply: false
globs:
  - components/**/*.tsx
  - features/**/components/**/*.tsx
---

# Component Development Guidelines

## Purpose

Guidelines for creating React Native UI components following iOS Human Interface Guidelines and project conventions.

## File Structure

```typescript
/**
 * Component Name
 * Brief description
 *
 * Usage:
 *   <Component prop="value" />
 *   <Component variant="secondary" />
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { useThemedColors } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing, TouchTarget, Typography } from '@/constants/theme';

// 1. Type definitions
export type ComponentVariant = 'primary' | 'secondary' | 'ghost';
export type ComponentSize = 'sm' | 'md' | 'lg';

// 2. Props interface with JSDoc
export interface ComponentProps {
  /** Description of prop */
  variant?: ComponentVariant;
  /** Description of another prop */
  size?: ComponentSize;
}

// 3. Configuration constants
const SIZE_CONFIG = {
  sm: { height: 36, padding: Spacing.sm },
  md: { height: TouchTarget.min, padding: Spacing.md }, // 44pt minimum
  lg: { height: 48, padding: Spacing.lg },
} as const;

// 4. Component function
export function Component({ variant = 'primary', size = 'md' }: ComponentProps) {
  const { colors } = useThemedColors();
  // ...
}

// 5. Styles at bottom
const styles = StyleSheet.create({
  container: { /* ... */ },
});
```

## Required Patterns

### Theme Colors

Always use `useThemedColors()` for dynamic colors:

```typescript
const { colors } = useThemedColors();

// Access colors via structure
backgroundColor: colors.background.base
color: colors.text.primary
borderColor: colors.interactive.separator
```

### Accessibility

Every interactive component MUST include:

```typescript
<Pressable
  testID={testID}
  accessibilityLabel={accessibilityLabel ?? title}
  accessibilityRole="button"
  accessibilityState={{ disabled: isDisabled }}
  // ...
>
```

### Touch Targets

Use `TouchTarget.min` (44pt) for minimum touch target:

```typescript
import { TouchTarget } from '@/constants/theme';

const SIZE_CONFIG = {
  md: { height: TouchTarget.min }, // 44pt - iOS minimum
};
```

### Variant Pattern

Define variants as discriminated union types:

```typescript
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

const getBackgroundColor = (variant: ButtonVariant): string => {
  switch (variant) {
    case 'primary': return colors.primary;
    case 'secondary': return colors.background.secondary;
    case 'ghost': return 'transparent';
    case 'destructive': return colors.semantic.error;
  }
};
```

## Design System Constants

Import from `@/constants/theme`:

| Constant | Usage |
|----------|-------|
| `Spacing` | Padding, margins (`xs`, `sm`, `md`, `lg`, `xl`) |
| `BorderRadius` | Corner radius (`sm`, `md`, `lg`, `full`) |
| `Typography` | Font sizes and line heights |
| `TouchTarget.min` | 44pt minimum touch target |

## Props Interface

Document each prop with JSDoc:

```typescript
export interface ButtonProps extends Omit<PressableProps, 'style'> {
  /** Button text content */
  title?: string;
  /** Button variant style */
  variant?: ButtonVariant;
  /** Disabled state */
  disabled?: boolean;
  /** Custom button style */
  style?: StyleProp<ViewStyle>;
}
```

## File Naming

- Use kebab-case: `button.tsx`, `error-fallback.tsx`
- Test files: `__tests__/button.test.tsx`
- Platform-specific: `component.ios.tsx`, `component.android.tsx`

## Exports

Use barrel exports in `index.ts`:

```typescript
// components/ui/index.ts
export { Button, type ButtonProps, type ButtonVariant } from './button';
export { Card, type CardProps, type CardVariant } from './card';
```
