# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

expo-quick-kit is an Expo SDK 54 boilerplate template with tabs navigation, designed as a starting point for React Native mobile apps. Uses React 19, React Native 0.81, and expo-router for file-based routing.

## Commands

```bash
# Development
pnpm start              # Start Expo dev server (for simulator)
pnpm dev                # Start dev server with tunnel (for physical device)
pnpm ios                # Build and run on iOS simulator
pnpm ios --device       # Build and install on physical iOS device
pnpm android            # Run on Android emulator
pnpm web                # Run on web

# Code Quality
pnpm lint               # Run ESLint
pnpm lint:fix           # Run ESLint with auto-fix
pnpm format             # Run Prettier
pnpm typecheck          # TypeScript type check
pnpm check              # Run all checks (format + lint + typecheck + test)

# Testing
pnpm test               # Run all Jest tests
pnpm test:coverage      # Run tests with coverage report
pnpm test <pattern>     # Run specific test file (e.g., pnpm test button)

# Database (Drizzle ORM)
pnpm db:generate        # Generate Drizzle migrations
pnpm db:studio          # Open Drizzle Studio
```

## MCP

When getting the latest information about libraries, refer to Context7 MCP.

## Architecture

### Project Structure

```
app/                    # expo-router file-based routing
├── (tabs)/            # Tab navigation group
├── _layout.tsx        # Root layout with ThemeProvider
└── modal.tsx          # Modal screen example

components/            # Shared UI components
├── ui/               # Reusable UI components (Button, Card, Spacer, etc.)
└── themed-*.tsx      # Theme-aware components

features/             # Feature-based modules
└── _example/         # Example feature structure
    ├── components/   # Feature-specific components
    ├── hooks/        # Feature-specific hooks
    ├── services/     # API calls, repositories, query keys
    └── types.ts      # Feature-specific types

database/             # Drizzle ORM setup
├── schema.ts         # Database schema definitions
└── client.ts         # SQLite client initialization

store/                # Zustand state management

lib/                  # Shared utilities and configurations
├── validation.ts     # Zod validation schemas
├── date.ts           # date-fns utilities (Japanese locale)
├── secure-storage.ts # expo-secure-store wrapper
├── query-client.ts   # TanStack Query configuration
└── README.md         # Utility module documentation

services/             # External service wrappers
└── notifications.ts  # expo-notifications service

constants/            # Theme, colors, and other constants
```

### File-Based Routing (expo-router)

Routes are defined in `app/` directory:

- `app/_layout.tsx` - Root layout with ThemeProvider
- `app/(tabs)/` - Tab navigation group
- `app/(tabs)/_layout.tsx` - Tab bar configuration
- `app/modal.tsx` - Modal screen example

### Path Aliases

Single alias `@/*` maps to project root (`./`):

```typescript
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/button';
import { ItemList } from '@/features/_example';
```

### Naming Convention

Files use **kebab-case**: `themed-text.tsx`, `use-color-scheme.ts`

### Testing

- Tests are located in `__tests__/` directories alongside the code they test
- Test files follow the pattern: `*.test.ts` or `*.test.tsx`
- Run specific tests: `pnpm test <pattern>` (e.g., `pnpm test button`)

### Key Libraries

- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Local Database**: Drizzle ORM + expo-sqlite
- **Validation**: Zod (type-safe form validation)
- **Date Utilities**: date-fns (Japanese locale configured)
- **Secure Storage**: expo-secure-store (encrypted key-value storage)
- **Push Notifications**: expo-notifications (local notifications, Development Build required)

### Utility Modules (lib/)

| Module | Description | Documentation |
|--------|-------------|---------------|
| `validation.ts` | Zod validation schemas (email, password, phone) | [lib/README.md](lib/README.md) |
| `date.ts` | date-fns wrappers with Japanese locale | [lib/README.md](lib/README.md) |
| `secure-storage.ts` | expo-secure-store wrapper with Result pattern | [lib/README.md](lib/README.md) |
| `query-client.ts` | TanStack Query configuration | [lib/README.md](lib/README.md) |

### Services (services/)

| Service | Description |
|---------|-------------|
| `notifications.ts` | Push notification permission, scheduling, and handlers |

### Theming (iOS System Colors)

Theme is defined in `constants/theme.ts` following Apple Human Interface Guidelines.

```typescript
// Recommended: useThemedColors() for full color palette access
import { useThemedColors } from '@/hooks/use-theme-color';

const { colors, colorScheme } = useThemedColors();

// Access nested colors
<View style={{ backgroundColor: colors.background.base }} />
<Text style={{ color: colors.text.primary }} />
<Text style={{ color: colors.semantic.error }} />

// Legacy: useThemeColor() for top-level colors only
const tintColor = useThemeColor({}, 'tint');
```

Color structure: `primary`, `background.{base,secondary,tertiary}`, `text.{primary,secondary,tertiary,inverse}`, `semantic.{success,warning,error,info}`, `interactive.{separator,fill,fillSecondary}`

## Configuration

- **New Architecture**: Enabled (`newArchEnabled: true`)
- **React Compiler**: Enabled (`experiments.reactCompiler: true`)
- **Typed Routes**: Enabled (`experiments.typedRoutes: true`)
- **ESLint**: Flat config format (`eslint.config.js`)

## Design System

refer to `expo-design-system` Claude Skill.

## Skill Activation Rules

| Skill | Trigger Keywords |
|-------|------------------|
| `expo-design-system` | colors, theme, Dark Mode, typography, spacing, iOS System Colors |
| `expo-subscription-monetization` | subscription, monetization, RevenueCat, paywall, in-app purchase |
| `mobile-ux-design` | user flow, navigation, gestures, forms, loading states, onboarding |

## Development Guidelines

### Language

- **Default language: English**
- Generate all responses, documentation, and file content in English unless explicitly specified otherwise
- This includes: Markdown files (requirements.md, design.md, tasks.md, research.md), code comments, commit messages, validation reports, and all other project documentation
- For specifications: Follow the language configured in spec.json.language if different from the default
