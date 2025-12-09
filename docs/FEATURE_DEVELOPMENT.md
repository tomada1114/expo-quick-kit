# Feature Development Guide

This guide outlines the recommended patterns and structure for developing new features in expo-quick-kit.

## Feature Structure

Follow this folder structure for each feature:

```
features/
└── feature-name/              # Feature folder (kebab-case)
    ├── components/            # Feature-specific UI components
    │   ├── component-a.tsx
    │   ├── component-b.tsx
    │   └── index.ts           # Export public components
    ├── hooks/                 # Feature-specific hooks
    │   ├── use-hook-a.ts
    │   ├── use-hook-b.ts
    │   └── index.ts           # Export public hooks
    ├── services/              # API calls, repositories, state
    │   ├── repository.ts      # Database operations
    │   ├── api.ts            # External API calls
    │   ├── query-keys.ts     # TanStack Query key factory
    │   └── index.ts          # Export public services
    ├── store/                 # Feature-specific Zustand store (if needed)
    │   ├── store.ts
    │   └── index.ts
    ├── types.ts              # Feature-specific TypeScript types
    ├── index.ts              # Main export file
    └── __tests__/            # Tests alongside implementation
        ├── components.test.tsx
        ├── hooks.test.ts
        ├── repository.test.ts
        └── integration.test.tsx
```

## Step-by-Step: Building a Feature

### Step 1: Define Types

Create `features/feature-name/types.ts`:

```typescript
export interface Item {
  id: number;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemInput {
  title: string;
  description: string;
}

export interface UpdateItemInput extends Partial<CreateItemInput> {}
```

### Step 2: Create Database Schema (if needed)

Edit `database/schema.ts`:

```typescript
import { relations } from 'drizzle-orm';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});
```

Then generate migration:

```bash
pnpm db:generate
```

### Step 3: Create Repository

Create `features/feature-name/services/repository.ts`:

```typescript
import { db } from '@/database/client';
import { items, eq, desc } from '@/database/schema';
import type { Item, CreateItemInput, UpdateItemInput } from '../types';

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export const itemRepository = {
  async create(input: CreateItemInput): Promise<Result<Item>> {
    try {
      const result = await db
        .insert(items)
        .values(input)
        .returning();
      return { success: true, data: result[0] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async getById(id: number): Promise<Item | null> {
    return db.query.items.findFirst({
      where: eq(items.id, id),
    });
  },

  async getAll(): Promise<Item[]> {
    return db.query.items.findMany({
      orderBy: desc(items.createdAt),
    });
  },

  async update(id: number, input: UpdateItemInput): Promise<Result<Item>> {
    try {
      const result = await db
        .update(items)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(items.id, id))
        .returning();
      return { success: true, data: result[0] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async delete(id: number): Promise<Result<void>> {
    try {
      await db.delete(items).where(eq(items.id, id));
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
};
```

### Step 4: Create Query Keys

Create `features/feature-name/services/query-keys.ts`:

```typescript
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filters: any) => [...itemKeys.lists(), { filters }] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: number) => [...itemKeys.details(), id] as const,
};
```

### Step 5: Create Hooks

Create `features/feature-name/hooks/use-items.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemRepository } from '@/features/feature-name/services/repository';
import { itemKeys } from '@/features/feature-name/services/query-keys';

export function useItems() {
  return useQuery({
    queryKey: itemKeys.lists(),
    queryFn: () => itemRepository.getAll(),
  });
}

export function useItem(id: number) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => itemRepository.getById(id),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: itemRepository.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: any }) =>
      itemRepository.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: itemRepository.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}
```

### Step 6: Create Components

Create `features/feature-name/components/item-card.tsx`:

```typescript
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import type { Item } from '../types';

interface ItemCardProps {
  item: Item;
  onPress?: (item: Item) => void;
}

export function ItemCard({ item, onPress }: ItemCardProps) {
  return (
    <Card
      onPress={() => onPress?.(item)}
      style={styles.container}
    >
      <ThemedText style={styles.title}>{item.title}</ThemedText>
      {item.description && (
        <ThemedText style={styles.description}>{item.description}</ThemedText>
      )}
      <ThemedText style={styles.date}>
        {item.createdAt.toLocaleDateString()}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  title: {
    fontWeight: '600',
  },
  description: {
    marginTop: 4,
  },
  date: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.6,
  },
});
```

### Step 7: Create Feature Screen

Create `app/(tabs)/feature-name.tsx`:

```typescript
import React, { useCallback } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ItemCard } from '@/features/feature-name/components/item-card';
import { useItems, useCreateItem, useDeleteItem } from '@/features/feature-name/hooks/use-items';
import { useThemedColors } from '@/hooks/use-theme-color';

export default function FeatureScreen() {
  const { colors } = useThemedColors();
  const { data: items, isLoading } = useItems();
  const createMutation = useCreateItem();
  const deleteMutation = useDeleteItem();

  const handleCreate = useCallback(() => {
    createMutation.mutate(
      { title: 'New Item', description: 'Created at ' + new Date().toLocaleTimeString() },
      {
        onError: (error) => {
          Alert.alert('Error', error.message);
        },
      }
    );
  }, [createMutation]);

  const handleDelete = useCallback((id: number) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  }, [deleteMutation]);

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background.base }]}>
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => handleDelete(item.id)}
          />
        )}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <Button
            onPress={handleCreate}
            loading={createMutation.isPending}
          >
            Add Item
          </Button>
        }
        refreshing={isLoading}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

### Step 8: Add Route to Navigation

Edit `app/(tabs)/_layout.tsx`:

```typescript
<Tabs.Screen
  name="feature-name"
  options={{
    title: 'Feature Name',
    tabBarIcon: ({ color }) => (
      <IconSymbol size={28} name="star.fill" color={color} />
    ),
  }}
/>
```

## Testing Pattern

Create comprehensive tests for your feature:

### 1. Component Tests

`features/feature-name/__tests__/components.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ItemCard } from '../components/item-card';

describe('ItemCard', () => {
  it('renders item title', () => {
    const item = {
      id: 1,
      title: 'Test Item',
      description: 'Description',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<ItemCard item={item} />);
    expect(screen.getByText('Test Item')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const item = { /* ... */ };

    const { getByText } = render(
      <ItemCard item={item} onPress={onPress} />
    );

    fireEvent.press(getByText('Test Item'));
    expect(onPress).toHaveBeenCalledWith(item);
  });
});
```

### 2. Hook Tests

`features/feature-name/__tests__/hooks.test.ts`:

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useItems } from '../hooks/use-items';

describe('useItems', () => {
  it('fetches items on mount', async () => {
    const { result } = renderHook(() => useItems());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

### 3. Repository Tests

`features/feature-name/__tests__/repository.test.ts`:

```typescript
import { itemRepository } from '../services/repository';

describe('itemRepository', () => {
  describe('create', () => {
    it('creates and returns an item', async () => {
      const result = await itemRepository.create({
        title: 'Test',
        description: 'Desc',
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Test');
    });

    it('returns error on failure', async () => {
      // Mock database error
      const result = await itemRepository.create({
        title: '', // Invalid
        description: '',
      });

      expect(result.success).toBe(false);
    });
  });
});
```

## State Management Patterns

### Local Component State

For simple UI state (form inputs, toggles):

```typescript
const [isExpanded, setIsExpanded] = useState(false);
```

### Server State (TanStack Query)

For data from database/API:

```typescript
const { data: items } = useItems();
```

### Global App State (Zustand)

For app-wide state (user login, theme preference):

```typescript
const isOnboarded = useStore((state) => state.isOnboarded);
```

### Feature-Specific State (Zustand)

For feature-level state that persists:

```typescript
// store/feature-store.ts
import { create } from 'zustand';

interface FeatureStore {
  filter: 'all' | 'active' | 'completed';
  setFilter: (filter: string) => void;
}

export const useFeatureStore = create<FeatureStore>((set) => ({
  filter: 'all',
  setFilter: (filter) => set({ filter }),
}));
```

## Navigation Patterns

### Tab Navigation

For main navigation:

```typescript
// app/(tabs)/feature-name.tsx
export default function FeatureScreen() {
  // Feature content
}

// In app/(tabs)/_layout.tsx
<Tabs.Screen
  name="feature-name"
  options={{ title: 'Feature' }}
/>
```

### Stack Navigation (within feature)

For hierarchical screens:

```typescript
// app/feature-name/_layout.tsx
import { Stack } from 'expo-router';

export default function FeatureLayout() {
  return <Stack />;
}

// app/feature-name/index.tsx - List
// app/feature-name/[id].tsx - Detail
// app/feature-name/new.tsx - Create
```

## Error Handling

Always handle errors gracefully:

```typescript
const { mutate } = useCreateItem();

mutate(data, {
  onSuccess: () => {
    Alert.alert('Success', 'Item created');
  },
  onError: (error) => {
    Alert.alert('Error', error.message || 'Failed to create item');
  },
});
```

## Best Practices

### 1. Single Responsibility

Each file should have one responsibility:

- `components/`: UI rendering only
- `hooks/`: Data fetching and state management
- `services/`: Business logic and API calls
- `types.ts`: Type definitions

### 2. Avoid Prop Drilling

Use hooks instead of passing props deeply:

```typescript
// ❌ Prop drilling
<Screen items={items} onDelete={onDelete} ... />

// ✅ Use hooks
const { data: items } = useItems();
const { mutate: deleteItem } = useDeleteItem();
```

### 3. Keep Components Simple

Components should focus on rendering:

```typescript
// ❌ Complex component
export function ItemList() {
  const [items, setItems] = useState([]);
  // ... lots of logic

  return <FlatList data={items} ... />;
}

// ✅ Simple component
export function ItemList({ items, onDelete }) {
  return (
    <FlatList
      data={items}
      renderItem={({ item }) => (
        <ItemCard item={item} onDelete={onDelete} />
      )}
    />
  );
}
```

### 4. Test-Driven Development

Write tests before or alongside implementation to ensure correctness and catch edge cases early.

### 5. Type Safety

Use TypeScript fully:

```typescript
// ❌ Loose typing
async function getItems(data: any) {
  // ...
}

// ✅ Type-safe
async function getItems(data: CreateItemInput): Promise<Item[]> {
  // ...
}
```

## Common Patterns

### Optimistic Updates

Update UI immediately while the request is in flight:

```typescript
const updateMutation = useMutation({
  mutationFn: itemRepository.update,
  onMutate: (newItem) => {
    queryClient.setQueryData(
      itemKeys.detail(newItem.id),
      newItem
    );
  },
  onError: () => {
    queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
  },
});
```

### Form Validation

Use Zod with your types:

```typescript
import { z } from 'zod';
import { validateData } from '@/lib/validation';

const createItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

// In component
const [errors, setErrors] = useState<Record<string, string>>({});
const result = validateData(createItemSchema, formData);
if (!result.success) {
  setErrors(result.errors);
}
```

## Related Documentation

- [DATABASE_OPERATIONS.md](./DATABASE_OPERATIONS.md) - Database patterns
- [API_INTEGRATION.md](./API_INTEGRATION.md) - API integration patterns
- [TESTING.md](./TESTING.md) - Testing best practices
- [CONVENTIONS.md](./CONVENTIONS.md) - Code style conventions
