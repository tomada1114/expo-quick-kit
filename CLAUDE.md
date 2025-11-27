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

# Code Quality
pnpm lint               # Run ESLint (expo lint)
```

## Architecture

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
```

### Key Directories

- `components/` - Reusable UI components (themed-text, themed-view, ui/)
- `constants/theme.ts` - Colors and Fonts with light/dark mode support
- `hooks/` - Custom hooks (use-color-scheme, use-theme-color)

### Naming Convention

Files use **kebab-case**: `themed-text.tsx`, `use-color-scheme.ts`

### Theming

Colors and Fonts are defined in `constants/theme.ts` with light/dark variants. Access via `useColorScheme()` hook.

## Configuration

- **New Architecture**: Enabled (`newArchEnabled: true`)
- **React Compiler**: Enabled (`experiments.reactCompiler: true`)
- **Typed Routes**: Enabled (`experiments.typedRoutes: true`)
- **ESLint**: Flat config format (`eslint.config.js`)
