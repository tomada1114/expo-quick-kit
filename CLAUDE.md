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

- Think in English, generate responses in Japanese. All Markdown content written to project files (e.g., requirements.md, design.md, tasks.md, research.md, validation reports) MUST be written in the target language configured for this specification (see spec.json.language).

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
