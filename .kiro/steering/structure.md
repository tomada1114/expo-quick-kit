# Project Structure & Patterns

## File Organization

```
expo-quick-kit/
├── app/                      # Routes (expo-router file-based)
│   ├── _layout.tsx          # Root layout with ThemeProvider
│   ├── (tabs)/              # Route group for tab navigation
│   │   ├── _layout.tsx      # Tab bar configuration & colors
│   │   ├── index.tsx        # Home screen
│   │   └── explore.tsx      # Explore screen
│   └── modal.tsx            # Modal screen example
├── components/              # Reusable UI components
│   ├── themed-*.tsx         # Themed versions (text, view, etc.)
│   ├── ui/                  # Generic UI primitives
│   │   ├── icon-symbol.tsx  # Icon wrapper
│   │   └── collapsible.tsx  # Disclosure component
│   └── [feature]*.tsx       # Feature-specific components
├── constants/
│   └── theme.ts             # Colors & Fonts (light/dark variants)
├── hooks/
│   ├── use-color-scheme.ts  # Re-export + platform variants
│   └── use-theme-color.ts   # Lookup helper for theme values
├── assets/                  # Images, icons, fonts
└── app.json                 # Expo configuration
```

## Naming Convention

**kebab-case** for all file names:
- Components: `themed-text.tsx`, `icon-symbol.tsx`
- Hooks: `use-color-scheme.ts`, `use-theme-color.ts`
- Not CamelCase: `ThemedText.tsx` (incorrect)

## Import Path Alias

Single alias `@/*` maps to project root:

```typescript
// ✅ Correct
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';

// ❌ Incorrect (relative paths allowed but prefer alias)
import { Colors } from '../../../constants/theme';
```

**Benefit**: Imports remain clean and stable regardless of file depth.

## Component Pattern

### Themed Components

Components that respond to light/dark mode:

```typescript
import { useThemeColor } from '@/hooks/use-theme-color';

export function ThemedText({ lightColor, darkColor, ...props }) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  return <Text style={[{ color }, ...]} {...props} />;
}
```

**Pattern**:
1. Accept optional `lightColor` / `darkColor` props
2. Use `useThemeColor()` to resolve to current scheme
3. Default to theme palette (e.g., 'text' → resolves to Colors[scheme].text)

### Routing Structure

**File-based routing** (expo-router):
- `app/` = routes
- `app/_layout.tsx` = root layout (wraps all routes)
- `app/(tabs)/` = route group for tab UI
- `app/(tabs)/_layout.tsx` = tab bar config
- Nested files become nested routes

**Grouping with parentheses** doesn't create URL segments:
- `app/(tabs)/index.tsx` → `/` (not `/(tabs)`)
- `app/(tabs)/explore.tsx` → `/explore`

## Theming System

**Centralized in constants/theme.ts**:

```typescript
export const Colors = {
  light: { text: '#11181C', background: '#fff', tint: '#0a7ea4', ... },
  dark: { text: '#ECEDEE', background: '#151718', tint: '#fff', ... }
};

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', ... },
  default: { sans: 'normal', serif: 'serif', ... },
  web: { sans: 'system-ui, -apple-system, ...', ... }
});
```

**Access Pattern**:
```typescript
const colorScheme = useColorScheme(); // 'light' | 'dark' | null
const color = Colors[colorScheme ?? 'light'].text;
```

**No context/providers for theming**: useColorScheme (from React Native) handles system preference subscriptions.

## Code Patterns

### 1. Hook-Based Theme Access
- Use `useColorScheme()` to subscribe to theme changes
- Use `useThemeColor()` helper to resolve named colors
- Re-export hooks from `hooks/` for consistent API

### 2. StyleSheet for All Styling
- No CSS or inline style libraries
- Platform variants via `Platform.select()`
- Example: Fonts defined as `Platform.select({ ios: {...}, default: {...}, web: {...} })`

### 3. Component Composition
- Prefer small, focused components (e.g., ThemedText, ThemedView)
- Reuse via props, not creation of dozens of variants
- Export type props for component contract clarity

### 4. Tab Navigation Pattern
- Use `(tabs)` route group with `_layout.tsx` for tab bar
- Define screens in tab layout, not as separate routes
- Access `colorScheme` in tab layout to set tint colors dynamically

## Development Commands

```bash
pnpm start        # Start Expo dev server
pnpm ios          # Run on iOS simulator
pnpm android      # Run on Android emulator
pnpm web          # Run on web
pnpm lint         # Run ESLint (expo lint)
```

## Configuration Files

- **app.json**: Expo app metadata, plugins, experiments (newArchEnabled, reactCompiler, typedRoutes)
- **tsconfig.json**: TypeScript config with paths alias and strict mode
- **eslint.config.js**: Flat ESLint config using expo preset
- **package.json**: Dependencies, scripts, pnpm config
