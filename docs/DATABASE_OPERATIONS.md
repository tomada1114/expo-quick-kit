# Database Operations Guide

This guide covers how to work with SQLite databases using Drizzle ORM in this boilerplate.

## Overview

The boilerplate uses **Drizzle ORM** for type-safe database operations with **expo-sqlite**.

- **Type-safe queries**: Full TypeScript support
- **Migrations**: Automatic schema management
- **Transactions**: Multi-step operations with rollback support
- **Relations**: Easy relational data queries

## Project Structure

```
database/
├── schema.ts         # Database schema definitions
└── client.ts         # SQLite client initialization
```

## Setting Up a New Table

### 1. Define Your Schema

Edit `database/schema.ts`:

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Define your table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
});

// Define table relations if needed
export const userRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const postRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));
```

### 2. Generate Migration

```bash
pnpm db:generate
```

This creates a migration file in the database directory.

### 3. (Optional) Check with Drizzle Studio

```bash
pnpm db:studio
```

Opens a visual database editor where you can inspect your schema.

## Creating a Repository

Create a repository for your feature to handle database operations:

```typescript
// features/users/services/repository.ts
import { db } from '@/database/client';
import { users, eq } from '@/database/schema';

export const userRepository = {
  // Create
  async create(email: string, name: string) {
    try {
      const result = await db
        .insert(users)
        .values({ email, name })
        .returning();
      return { success: true as const, data: result[0] };
    } catch (error) {
      return { success: false as const, error: String(error) };
    }
  },

  // Read - Single
  async getById(id: number) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return user || null;
  },

  // Read - All
  async getAll() {
    return db.query.users.findMany();
  },

  // Update
  async update(id: number, data: Partial<typeof users.$inferInsert>) {
    try {
      const result = await db
        .update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning();
      return { success: true as const, data: result[0] };
    } catch (error) {
      return { success: false as const, error: String(error) };
    }
  },

  // Delete
  async delete(id: number) {
    try {
      await db.delete(users).where(eq(users.id, id));
      return { success: true as const };
    } catch (error) {
      return { success: false as const, error: String(error) };
    }
  },
};
```

## Common Operations

### Simple Queries

```typescript
import { db } from '@/database/client';
import { users, eq, and, or } from '@/database/schema';

// Find by condition
const user = await db.query.users.findFirst({
  where: eq(users.email, 'user@example.com'),
});

// Find multiple with filter
const activeUsers = await db.query.users.findMany({
  where: eq(users.isActive, true),
});

// Multiple conditions
const result = await db.query.users.findFirst({
  where: and(
    eq(users.email, 'user@example.com'),
    eq(users.isActive, true)
  ),
});

// OR conditions
const result = await db.query.users.findMany({
  where: or(
    eq(users.id, 1),
    eq(users.id, 2),
    eq(users.id, 3)
  ),
});
```

### Sorting and Pagination

```typescript
import { db } from '@/database/client';
import { users, desc } from '@/database/schema';

// Sort
const recent = await db.query.users.findMany({
  orderBy: desc(users.createdAt),
});

// Pagination
const page = 1;
const limit = 10;
const offset = (page - 1) * limit;

const paged = await db.query.users.findMany({
  orderBy: desc(users.createdAt),
  limit,
  offset,
});
```

### Relations

```typescript
import { db } from '@/database/client';

// Query with related data
const user = await db.query.users.findFirst({
  where: eq(users.id, 1),
  with: {
    posts: true, // Eagerly load posts
  },
});

// With nested relations
const user = await db.query.users.findFirst({
  where: eq(users.id, 1),
  with: {
    posts: {
      with: {
        comments: true,
      },
    },
  },
});
```

### Transactions

```typescript
import { db } from '@/database/client';

try {
  const result = await db.transaction(async (tx) => {
    // Create user
    const user = await tx
      .insert(users)
      .values({ email: 'user@example.com', name: 'John' })
      .returning();

    // Create post for that user
    const post = await tx
      .insert(posts)
      .values({
        userId: user[0].id,
        title: 'First Post',
        content: 'Hello World',
      })
      .returning();

    return { user: user[0], post: post[0] };
  });
} catch (error) {
  // Automatically rolled back on error
  console.error('Transaction failed:', error);
}
```

## Integration with TanStack Query

### Query Keys

Create a query key factory:

```typescript
// features/users/services/query-keys.ts
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: any) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
};
```

### Query Hooks

```typescript
// features/users/hooks/use-users.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userRepository } from '@/features/users/services/repository';
import { userKeys } from '@/features/users/services/query-keys';

// Fetch all users
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => userRepository.getAll(),
  });
}

// Fetch single user
export function useUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userRepository.getById(id),
    enabled: !!id,
  });
}

// Create user mutation
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; name: string }) =>
      userRepository.create(data.email, data.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      userRepository.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

// Delete user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
```

## Usage in Components

```typescript
import { useUsers, useCreateUser } from '@/features/users/hooks/use-users';

export function UserList() {
  const { data: users, isLoading } = useUsers();
  const createUserMutation = useCreateUser();

  const handleAddUser = () => {
    createUserMutation.mutate(
      { email: 'new@example.com', name: 'New User' },
      {
        onSuccess: () => {
          console.log('User created');
        },
      }
    );
  };

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <FlatList
      data={users}
      renderItem={({ item }) => <Text>{item.name}</Text>}
      keyExtractor={(item) => String(item.id)}
      ListFooterComponent={
        <Button
          onPress={handleAddUser}
          loading={createUserMutation.isPending}
        >
          Add User
        </Button>
      }
    />
  );
}
```

## Error Handling

### Result Pattern

Always use a Result pattern to handle database errors:

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export const userRepository = {
  async getById(id: number): Promise<Result<User>> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
};
```

### Component Error Handling

```typescript
const { mutate } = useCreateUser();

mutate(
  { email: 'user@example.com', name: 'John' },
  {
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  }
);
```

## Best Practices

### 1. Type Safety

Use Drizzle's type inference for maximum safety:

```typescript
// Inferred types
type User = typeof users.$inferSelect; // For SELECT queries
type NewUser = typeof users.$inferInsert; // For INSERT queries
```

### 2. Validation

Validate data before inserting:

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().min(2),
});

export async function createUser(data: unknown) {
  const result = createUserSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  return userRepository.create(result.data.email, result.data.name);
}
```

### 3. Query Optimization

```typescript
// ❌ N+1 query problem
const users = await db.query.users.findMany();
for (const user of users) {
  const posts = await db.query.posts.findMany({
    where: eq(posts.userId, user.id),
  }); // Called for each user!
}

// ✅ Efficient with relations
const users = await db.query.users.findMany({
  with: {
    posts: true,
  },
});
```

### 4. Migration Workflow

When updating your schema:

1. Modify `database/schema.ts`
2. Run `pnpm db:generate`
3. Review generated migration
4. Schema is automatically applied on app startup

## Troubleshooting

### Database Locked

**Symptom**: `database is locked` error

**Solution**: Ensure only one connection is open. The client is global, so this shouldn't happen in normal usage.

### Type Errors

**Symptom**: TypeScript errors in queries

**Solution**:
- Run `pnpm typecheck`
- Ensure your schema definitions match your queries
- Use `typeof schema.$inferSelect` for type hints

### Migration Issues

**Symptom**: Schema version mismatch

**Solution**:
- Delete the database file (app's local storage)
- Re-run `pnpm ios` or `pnpm android` to reinitialize

## Related Documentation

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [expo-sqlite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/)
