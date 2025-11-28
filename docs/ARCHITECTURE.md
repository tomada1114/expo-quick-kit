# Architecture

This document describes the architecture of expo-quick-kit.

## Overview

expo-quick-kit is built on Clean Architecture principles, organizing code into distinct layers with clear boundaries and dependencies that flow inward.

## Folder Structure

```
expo-quick-kit/
├── app/                      # expo-router (file-based routing)
│   ├── (tabs)/               # Tab navigation group
│   │   ├── _layout.tsx       # Tab bar configuration
│   │   ├── index.tsx         # Home screen
│   │   └── demo.tsx          # Demo screen
│   ├── _layout.tsx           # Root layout with providers
│   ├── modal.tsx             # Modal screen example
│   └── +not-found.tsx        # 404 page
│
├── features/                 # Feature-based modules
│   └── _example/             # Example feature structure
│       ├── components/       # Feature-specific components
│       ├── hooks/            # Feature-specific hooks
│       ├── services/         # API calls, repositories, query keys
│       └── types.ts          # Feature-specific types
│
├── components/               # Shared UI components
│   ├── ui/                   # Reusable UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── spacer.tsx
│   │   └── icon-symbol.tsx
│   ├── themed-text.tsx       # Theme-aware Text component
│   ├── themed-view.tsx       # Theme-aware View component
│   └── index.ts              # Barrel export
│
├── hooks/                    # Shared hooks
│   ├── use-color-scheme.ts   # System color scheme detection
│   └── use-theme-color.ts    # Theme color utilities
│
├── constants/                # Constants and theme
│   └── theme.ts              # Colors following iOS HIG
│
├── lib/                      # Shared utilities
│   ├── validation.ts         # Zod schemas
│   ├── date.ts               # date-fns utilities
│   ├── secure-storage.ts     # expo-secure-store wrapper
│   └── query-client.ts       # TanStack Query config
│
├── store/                    # Zustand state management
│   └── index.ts
│
├── database/                 # Drizzle ORM + SQLite
│   ├── schema.ts             # Database schema
│   └── client.ts             # SQLite client
│
├── services/                 # External service wrappers
│   └── notifications.ts      # expo-notifications service
│
└── types/                    # Shared type definitions
    └── index.ts
```

## Layer Responsibilities

### Presentation Layer (`app/`, `components/`)

- **app/**: Screen components with file-based routing via expo-router
- **components/**: Reusable UI components shared across features

Responsibilities:
- Render UI based on state
- Handle user interactions
- Navigate between screens

### Feature Layer (`features/`)

Each feature module is self-contained with:
- **components/**: Feature-specific UI components
- **hooks/**: Feature-specific React hooks
- **services/**: API calls, data fetching logic, query keys
- **types.ts**: TypeScript types for the feature

Responsibilities:
- Encapsulate feature-specific logic
- Define data fetching with TanStack Query
- Manage feature-local state

### Infrastructure Layer (`database/`, `services/`, `lib/`)

- **database/**: SQLite database access via Drizzle ORM
- **services/**: External service integrations (notifications, etc.)
- **lib/**: Shared utility functions and configurations

Responsibilities:
- Implement data persistence
- Handle external service communication
- Provide utility functions

### State Layer (`store/`)

Zustand stores for global application state.

Responsibilities:
- Manage global UI state
- Persist state when needed

## Data Flow

```
User Action
    │
    ▼
┌─────────────────────┐
│  Presentation Layer │  (app/, components/)
│  - Screen Components│
│  - UI Components    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Feature Layer     │  (features/)
│  - Hooks            │
│  - Services         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Infrastructure Layer│  (database/, services/, lib/)
│  - Drizzle ORM      │
│  - External APIs    │
└─────────────────────┘
```

## Key Patterns

### Feature-First Organization

Features are organized by business domain, not technical layer. Each feature contains all necessary code to function independently.

### Barrel Exports

Each module uses `index.ts` for clean imports:
```typescript
import { Button, Card, ThemedText } from '@/components';
import { ItemList } from '@/features/_example';
```

### Path Aliases

Single alias `@/*` maps to project root:
```typescript
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Routing | expo-router (file-based) |
| State Management | Zustand |
| Data Fetching | TanStack Query |
| Local Database | Drizzle ORM + expo-sqlite |
| Validation | Zod |
| Styling | React Native StyleSheet |
| Theming | iOS System Colors (HIG) |
