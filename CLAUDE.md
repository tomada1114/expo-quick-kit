# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

expo-quick-kit is an Expo SDK 54 boilerplate template with tabs navigation, designed as a starting point for React Native mobile apps. Uses React 19, React Native 0.81, and expo-router for file-based routing.

## Commands

```bash
# Development
pnpm start              # Start Expo dev server
pnpm ios                # Run on iOS simulator
pnpm android            # Run on Android emulator
pnpm web                # Run on web
pnpm dev:ios            # Run on iOS with dev-client and tunnel (for testing on physical device)

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

# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Design System

refer to `expo-design-system` Claude Skill.

## Project Context

### Paths

- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications

- Check `.kiro/specs/` for active specifications
- Use `/kiro:spec-status [feature-name]` to check progress

## Development Guidelines

### Language

- **Default language: English**
- Generate all responses, documentation, and file content in English unless explicitly specified otherwise
- This includes: Markdown files (requirements.md, design.md, tasks.md, research.md), code comments, commit messages, validation reports, and all other project documentation
- For specifications: Follow the language configured in spec.json.language if different from the default

## Minimal Workflow

- Phase 0 (optional): `/kiro:steering`, `/kiro:steering-custom`
- Phase 1 (Specification):
  - `/kiro:spec-init "description"`
  - `/kiro:spec-requirements {feature}`
  - `/kiro:validate-gap {feature}` (optional: for existing codebase)
  - `/kiro:spec-design {feature} [-y]`
  - `/kiro:validate-design {feature}` (optional: design review)
  - `/kiro:spec-tasks {feature} [-y]`
- Phase 2 (Implementation): `/kiro:spec-impl {feature} [tasks]`
  - `/kiro:validate-impl {feature}` (optional: after implementation)
- Progress check: `/kiro:spec-status {feature}` (use anytime)

## Development Rules

- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/kiro:spec-status`
- Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

## Steering Configuration

- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro:steering-custom`)
