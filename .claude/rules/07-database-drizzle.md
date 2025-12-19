---
alwaysApply: false
globs:
  - database/**/*.ts
---

# Database (Drizzle ORM) Guidelines

## Purpose

Drizzle ORM patterns for SQLite with expo-sqlite.

## Directory Structure

```
database/
├── schema.ts      # Table definitions
├── client.ts      # Database client initialization
├── migrations/    # Generated migrations
└── index.ts       # Barrel export
```

## Schema Definition

```typescript
// database/schema.ts
import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Items table
 * Stores user-created items with metadata.
 */
export const items = sqliteTable('items', {
  /** Primary key, auto-increment */
  id: integer('id').primaryKey({ autoIncrement: true }),

  /** Item name (required) */
  name: text('name').notNull(),

  /** Item description (optional) */
  description: text('description'),

  /** Creation timestamp (Unix epoch seconds) */
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),

  /** Last update timestamp */
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),

  /** Soft delete flag */
  isDeleted: integer('is_deleted', { mode: 'boolean' })
    .notNull()
    .default(false),
});

// Type inference exports
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
```

## Type Inference

Always export inferred types:

```typescript
// Select type (full row from database)
export type Item = typeof items.$inferSelect;
// { id: number; name: string; description: string | null; createdAt: Date; ... }

// Insert type (for creating new rows)
export type NewItem = typeof items.$inferInsert;
// { name: string; description?: string | null; createdAt?: Date; ... }
```

## Client Initialization

```typescript
// database/client.ts
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const expo = openDatabaseSync('app.db');

export const db = drizzle(expo, { schema });

// Export schema for use in queries
export { schema };
```

## Common Patterns

### Insert

```typescript
import { db } from '@/database/client';
import { items, type NewItem } from '@/database/schema';

async function createItem(data: NewItem): Promise<Item> {
  const [result] = await db.insert(items).values(data).returning();
  return result;
}
```

### Select

```typescript
import { eq, desc, and, isNull } from 'drizzle-orm';

// Select all non-deleted items
async function getItems(): Promise<Item[]> {
  return db
    .select()
    .from(items)
    .where(eq(items.isDeleted, false))
    .orderBy(desc(items.createdAt));
}

// Select by ID
async function getItemById(id: number): Promise<Item | undefined> {
  const [result] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), eq(items.isDeleted, false)));
  return result;
}
```

### Update

```typescript
async function updateItem(
  id: number,
  data: Partial<NewItem>
): Promise<Item | undefined> {
  const [result] = await db
    .update(items)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(items.id, id))
    .returning();
  return result;
}
```

### Delete (Soft)

```typescript
async function deleteItem(id: number): Promise<boolean> {
  const [result] = await db
    .update(items)
    .set({
      isDeleted: true,
      updatedAt: new Date(),
    })
    .where(eq(items.id, id))
    .returning();
  return result !== undefined;
}
```

### Delete (Hard)

```typescript
async function hardDeleteItem(id: number): Promise<boolean> {
  const result = await db.delete(items).where(eq(items.id, id));
  return result.changes > 0;
}
```

## Migrations

### Generate Migration

```bash
pnpm db:generate
```

### View Database (Development)

```bash
pnpm db:studio
```

## Column Types

| Drizzle Type | SQLite Type | TypeScript Type |
|--------------|-------------|-----------------|
| `integer()` | INTEGER | `number` |
| `integer({mode: 'boolean'})` | INTEGER | `boolean` |
| `integer({mode: 'timestamp'})` | INTEGER | `Date` |
| `text()` | TEXT | `string` |
| `real()` | REAL | `number` |
| `blob()` | BLOB | `Buffer` |

## Timestamps

Use Unix epoch for timestamps:

```typescript
// Definition
createdAt: integer('created_at', { mode: 'timestamp' })
  .notNull()
  .default(sql`(unixepoch())`),

// Usage (automatic)
await db.insert(items).values({ name: 'New Item' });
// createdAt is auto-set to current time

// Usage (manual)
await db.insert(items).values({
  name: 'New Item',
  createdAt: new Date(),
});
```

## Relations (Future)

```typescript
// Define relations for type-safe joins
export const itemsRelations = relations(items, ({ many }) => ({
  tags: many(itemTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  items: many(itemTags),
}));
```

## Error Handling

Wrap database operations with Result type:

```typescript
import type { Result } from '@/features/subscription/core/types';

type DbError =
  | { code: 'NOT_FOUND'; message: string }
  | { code: 'CONSTRAINT_ERROR'; message: string }
  | { code: 'UNKNOWN_ERROR'; message: string };

async function getItemSafe(id: number): Promise<Result<Item, DbError>> {
  try {
    const item = await getItemById(id);

    if (!item) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: `Item ${id} not found` },
      };
    }

    return { success: true, data: item };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
```

## Barrel Export

```typescript
// database/index.ts
export { db, schema } from './client';
export * from './schema';
```
