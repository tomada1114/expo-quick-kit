# Project Structure & Patterns

## File Organization

```
expo-quick-kit/
├── app/                      # Routes (expo-router file-based)
│   ├── _layout.tsx          # Root layout with providers
│   ├── (tabs)/              # Route group for tab navigation
│   │   ├── _layout.tsx      # Tab bar configuration
│   │   ├── index.tsx        # Home screen
│   │   └── demo.tsx         # Demo screen
│   └── modal.tsx            # Modal screen example
├── components/              # Shared UI components
│   ├── themed-*.tsx         # Theme-aware components
│   └── ui/                  # Design system primitives (Button, Card, etc.)
├── features/                # Feature modules (domain-specific)
│   └── _example/            # Reference implementation
│       ├── components/      # Feature-specific UI
│       ├── hooks/           # Feature-specific hooks
│       ├── services/        # Repository, query keys
│       └── types.ts         # Feature types
├── database/                # Drizzle ORM layer
│   ├── schema.ts            # Table definitions
│   ├── client.ts            # Database client & operations
│   └── index.ts             # Public exports
├── store/                   # Zustand state management
│   ├── index.ts             # Store creation with persistence
│   ├── slices/              # State slices
│   └── types.ts             # Store types
├── lib/                     # Shared utilities
│   ├── query-client.ts      # TanStack Query configuration
│   └── format.ts            # Formatting helpers
├── constants/
│   └── theme.ts             # iOS Design System (Colors, Spacing, Typography)
├── hooks/                   # Shared hooks
│   ├── use-color-scheme.ts  # System theme detection
│   └── use-theme-color.ts   # Theme color access
└── types/                   # Global type definitions
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
- `app/(tabs)/demo.tsx` → `/demo`

## Theming System (iOS Design System)

**constants/theme.ts**で定義されたApple HIG準拠のデザインシステム：

```typescript
// 構造化されたカラーパレット
export const Colors = {
  light: {
    primary: '#007AFF',
    background: { base, secondary, tertiary },
    text: { primary, secondary, tertiary, inverse },
    semantic: { success, warning, error, info },
    interactive: { separator, fill, fillSecondary },
  },
  dark: { /* +10% brightness rule適用 */ }
};

// その他のデザイントークン
export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 };
export const Typography = { largeTitle, title1, headline, body, ... };
export const BorderRadius = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 };
export const TouchTarget = { min: 44 }; // iOS minimum
```

**Access Pattern**:

```typescript
// 推奨: useThemedColors() - 構造化されたアクセス
const { colors, colorScheme } = useThemedColors();
<View style={{ backgroundColor: colors.background.base }} />
<Text style={{ color: colors.text.primary }} />

// レガシー: useThemeColor() - トップレベルカラーのみ
const tintColor = useThemeColor({}, 'tint');
```

## Code Patterns

### 1. Theme Access

- `useThemedColors()`: 構造化されたカラーオブジェクトを取得
- `useColorScheme()`: システムテーマ（'light' | 'dark'）を検出
- Design tokens: `Spacing`, `Typography`, `BorderRadius`を直接インポート

### 2. StyleSheet for All Styling

- No CSS or inline style libraries
- Platform variants via `Platform.select()`

### 3. Feature Module Pattern

新機能は`features/`配下にモジュールとして配置：

```
features/my-feature/
├── components/     # UI components
├── hooks/          # Custom hooks (useMyFeature)
├── services/       # Repository, API, query keys
├── types.ts        # Type definitions
└── index.ts        # Public exports
```

**参照実装**: `features/_example/`

### 4. Data Layer Pattern

```typescript
// Repository pattern (database/client.ts or features/*/services/repository.ts)
export const itemRepository = {
  getAll: () => db.select().from(items),
  create: (data: NewItem) => db.insert(items).values(data),
  // ...
};

// TanStack Query integration
export const useItemList = () => useQuery({
  queryKey: itemQueryKeys.all,
  queryFn: () => itemRepository.getAll(),
});
```

### 5. State Management Pattern

- **Server state**: TanStack Query（キャッシュ、フェッチ）
- **Client state**: Zustand（UI状態、ユーザー設定）
- **Local DB**: Drizzle ORM（永続化データ）

## Development Commands

```bash
pnpm start        # Start Expo dev server
pnpm ios          # Run on iOS simulator
pnpm android      # Run on Android emulator
pnpm web          # Run on web
pnpm dev:ios      # Run on iOS with dev-client and tunnel

pnpm lint         # Run ESLint
pnpm check        # Run all checks (format + lint + typecheck + test)
pnpm test         # Run Jest tests
pnpm test <pattern>  # Run specific test (e.g., pnpm test button)

pnpm db:generate  # Generate Drizzle migrations
pnpm db:studio    # Open Drizzle Studio
```

## Configuration Files

- **app.json**: Expo app metadata, plugins, experiments (newArchEnabled, reactCompiler, typedRoutes)
- **tsconfig.json**: TypeScript config with paths alias and strict mode
- **eslint.config.js**: Flat ESLint config using expo preset
- **package.json**: Dependencies, scripts, pnpm config
