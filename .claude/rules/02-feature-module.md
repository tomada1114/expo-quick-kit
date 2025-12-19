---
alwaysApply: false
globs:
  - features/**/*.ts
  - features/**/*.tsx
---

# Feature Module Guidelines

## Purpose

Clean Architecture / Onion Architecture patterns for feature-based modules.

## Directory Structure

```
features/{feature-name}/
├── core/                    # Domain layer
│   ├── types.ts            # Domain entities, value objects, Result types
│   ├── service.ts          # Application service with business logic
│   ├── repository.ts       # Infrastructure adapter (SDK wrappers)
│   └── index.ts            # Barrel export
├── hooks/                  # React hooks
│   ├── use-{feature}.ts   # Main feature hook
│   └── index.ts
├── providers/              # Context providers
│   ├── {feature}-provider.tsx
│   └── index.ts
├── components/             # Feature-specific UI
│   ├── {component}.tsx
│   └── index.ts
└── index.ts               # Public API barrel export
```

## Module JSDoc Header

```typescript
/**
 * Feature Name Service
 *
 * Description of what this module does.
 *
 * @module features/{feature-name}/core/service
 */
```

## Types File Pattern

```typescript
/**
 * Feature Domain Types
 *
 * @module features/{feature-name}/core/types
 */

// Domain entity
export interface Entity {
  /** Property description */
  id: string;
  /** Another property */
  name: string;
}

// Value object with constants
export interface Limits {
  maxItems: number;
  hasAds: boolean;
}

// Error types as discriminated union
export type FeatureError =
  | { code: 'NOT_FOUND'; message: string; retryable: false }
  | { code: 'NETWORK_ERROR'; message: string; retryable: true }
  | { code: 'UNKNOWN_ERROR'; message: string; retryable: false };

// Result type
export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

// Default constants
export const DEFAULT_LIMITS: Limits = {
  maxItems: 10,
  hasAds: true,
};
```

## Service Pattern

```typescript
/**
 * Feature Application Service
 *
 * @module features/{feature-name}/core/service
 */

import type { Entity, Limits, Result, FeatureError } from './types';

export interface FeatureServiceConfig {
  onStateChange?: (entity: Entity) => void;
}

export interface FeatureService {
  getEntity(): Entity;
  canAccessFeature(featureLevel: string): boolean;
  getLimits(): Limits;
}

export function createFeatureService(
  config: FeatureServiceConfig = {}
): FeatureService {
  const { onStateChange } = config;

  let currentEntity: Entity = { /* default */ };

  return {
    getEntity: () => currentEntity,

    canAccessFeature: (level) => {
      // Business logic
      return currentEntity.tier === 'premium' || level === 'basic';
    },

    getLimits: () => {
      // Domain logic
      return currentEntity.tier === 'premium'
        ? PREMIUM_LIMITS
        : FREE_LIMITS;
    },
  };
}
```

## Repository Pattern

```typescript
/**
 * Feature Repository
 *
 * Infrastructure adapter wrapping external SDK.
 *
 * @module features/{feature-name}/core/repository
 */

import type { Result, Entity, FeatureError } from './types';

// Type converter from SDK types to domain types
function toEntity(sdkResponse: SDKResponse): Entity {
  return {
    id: sdkResponse.identifier,
    name: sdkResponse.displayName,
  };
}

// Type guard for error handling
function isSDKError(error: unknown): error is SDKError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export async function fetchEntity(): Promise<Result<Entity, FeatureError>> {
  try {
    const response = await sdk.fetch();
    return { success: true, data: toEntity(response) };
  } catch (error) {
    if (isSDKError(error)) {
      return { success: false, error: mapSDKError(error) };
    }
    return {
      success: false,
      error: { code: 'UNKNOWN_ERROR', message: String(error), retryable: false },
    };
  }
}
```

## Barrel Exports

Each directory has an `index.ts`:

```typescript
// features/{feature-name}/core/index.ts
export * from './types';
export { createFeatureService, type FeatureService } from './service';
export { fetchEntity, updateEntity } from './repository';

// features/{feature-name}/index.ts (public API)
export { FeatureProvider, useFeatureContext } from './providers';
export { useFeature } from './hooks';
export type { Entity, Limits, FeatureError } from './core';
```

## Interface-Based Abstraction

Define interfaces for testability:

```typescript
// Interface for mocking in tests
export interface FeatureRepository {
  fetch(): Promise<Result<Entity, FeatureError>>;
  update(data: Partial<Entity>): Promise<Result<Entity, FeatureError>>;
}

// Implementation
export const featureRepository: FeatureRepository = {
  fetch: fetchEntity,
  update: updateEntity,
};
```

## Layer Dependencies

```
UI Components → Hooks → Providers → Service → Repository → External SDK
     ↓           ↓         ↓           ↓           ↓
   (View)    (ViewModel) (Context)  (UseCase)  (Infrastructure)
```

Inner layers MUST NOT depend on outer layers.
