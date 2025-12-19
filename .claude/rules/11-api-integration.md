---
alwaysApply: false
globs:
  - features/**/services/**/*.ts
  - features/**/hooks/use-*-query.ts
  - features/**/hooks/use-*-mutation.ts
  - lib/query-client.ts
---

# API Integration Guidelines

## Purpose

TanStack Query patterns for data fetching, caching, and state management.

## Query Client Configuration

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 minutes
      gcTime: 30 * 60 * 1000,         // 30 minutes (garbage collection)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,    // Disable for mobile
    },
    mutations: {
      retry: 1,
    },
  },
});
```

## Query Key Factory

```typescript
// features/{feature}/services/query-keys.ts

export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filters: ItemFilters) => [...itemKeys.lists(), filters] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
};

// Usage
queryClient.invalidateQueries({ queryKey: itemKeys.all });
queryClient.invalidateQueries({ queryKey: itemKeys.detail('123') });
```

## API Service Layer

```typescript
// features/{feature}/services/api.ts
import type { Result } from '@/features/subscription/core/types';

const API_BASE = 'https://api.example.com';

type ApiError =
  | { code: 'NOT_FOUND'; message: string; retryable: false }
  | { code: 'UNAUTHORIZED'; message: string; retryable: false }
  | { code: 'NETWORK_ERROR'; message: string; retryable: true }
  | { code: 'SERVER_ERROR'; message: string; retryable: true };

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<Result<T, ApiError>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      return {
        success: false,
        error: mapHttpError(response.status),
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error',
        retryable: true,
      },
    };
  }
}

// Exported API functions
export async function fetchItems(): Promise<Result<Item[], ApiError>> {
  return fetchApi<Item[]>('/items');
}

export async function fetchItem(id: string): Promise<Result<Item, ApiError>> {
  return fetchApi<Item>(`/items/${id}`);
}

export async function createItem(
  data: CreateItemInput
): Promise<Result<Item, ApiError>> {
  return fetchApi<Item>('/items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

## Query Hooks

### Basic Query

```typescript
// features/{feature}/hooks/use-items-query.ts
import { useQuery } from '@tanstack/react-query';

import { fetchItems } from '../services/api';
import { itemKeys } from '../services/query-keys';

export function useItemsQuery() {
  return useQuery({
    queryKey: itemKeys.lists(),
    queryFn: async () => {
      const result = await fetchItems();
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });
}
```

### Query with Parameters

```typescript
// features/{feature}/hooks/use-item-query.ts
import { useQuery } from '@tanstack/react-query';

import { fetchItem } from '../services/api';
import { itemKeys } from '../services/query-keys';

export function useItemQuery(id: string | undefined) {
  return useQuery({
    queryKey: itemKeys.detail(id!),
    queryFn: async () => {
      const result = await fetchItem(id!);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!id, // Only fetch when id is defined
  });
}
```

### Query with Options

```typescript
export function useItemsQuery(options?: {
  enabled?: boolean;
  staleTime?: number;
}) {
  return useQuery({
    queryKey: itemKeys.lists(),
    queryFn: async () => {
      const result = await fetchItems();
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime,
  });
}
```

## Mutation Hooks

### Basic Mutation

```typescript
// features/{feature}/hooks/use-create-item-mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createItem } from '../services/api';
import { itemKeys } from '../services/query-keys';

export function useCreateItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateItemInput) => {
      const result = await createItem(input);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}
```

### Optimistic Updates

```typescript
export function useUpdateItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateItemInput }) => {
      const result = await updateItem(id, data);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: itemKeys.detail(id) });

      // Snapshot previous value
      const previousItem = queryClient.getQueryData<Item>(itemKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData<Item>(itemKeys.detail(id), (old) =>
        old ? { ...old, ...data } : old
      );

      return { previousItem };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousItem) {
        queryClient.setQueryData(itemKeys.detail(id), context.previousItem);
      }
    },
    onSettled: (_, __, { id }) => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(id) });
    },
  });
}
```

## Usage in Components

```typescript
function ItemList() {
  const { data: items, isLoading, error, refetch } = useItemsQuery();
  const createMutation = useCreateItemMutation();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  const handleCreate = async (input: CreateItemInput) => {
    try {
      await createMutation.mutateAsync(input);
      // Success handling
    } catch (error) {
      // Error handling
    }
  };

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => <ItemCard item={item} />}
      ListHeaderComponent={
        <CreateItemForm
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      }
    />
  );
}
```

## Cache Invalidation Strategies

### Invalidate Related Queries

```typescript
onSuccess: (newItem) => {
  // Invalidate list
  queryClient.invalidateQueries({ queryKey: itemKeys.lists() });

  // Update detail cache directly
  queryClient.setQueryData(itemKeys.detail(newItem.id), newItem);
},
```

### Invalidate All

```typescript
// After logout or major state change
queryClient.invalidateQueries();
```

### Remove Specific Cache

```typescript
// On delete
queryClient.removeQueries({ queryKey: itemKeys.detail(id) });
queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
```

## Error Handling in Components

```typescript
function ItemDetail({ id }: { id: string }) {
  const { data, isLoading, error, refetch } = useItemQuery(id);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorView
        message={error.message}
        onRetry={refetch}
        retryable={true}
      />
    );
  }

  if (!data) {
    return <NotFoundView />;
  }

  return <ItemContent item={data} />;
}
```

## Barrel Export

```typescript
// features/{feature}/hooks/index.ts
export { useItemsQuery } from './use-items-query';
export { useItemQuery } from './use-item-query';
export { useCreateItemMutation } from './use-create-item-mutation';
export { useUpdateItemMutation } from './use-update-item-mutation';
export { useDeleteItemMutation } from './use-delete-item-mutation';
```
