/**
 * Database Client
 *
 * Drizzle ORM client initialization for expo-sqlite
 */

import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

/**
 * Database file name
 */
export const DATABASE_NAME = 'app.db';

/**
 * SQLite database instance with change listener enabled for live queries
 */
const expoDb = openDatabaseSync(DATABASE_NAME, {
  enableChangeListener: true,
});

/**
 * Drizzle ORM database instance
 *
 * Usage:
 * ```typescript
 * import { db } from '@/database/client';
 * import { items } from '@/database/schema';
 *
 * // Select all items
 * const allItems = db.select().from(items).all();
 *
 * // Insert item
 * db.insert(items).values({ title: 'New Item' }).run();
 * ```
 */
export const db = drizzle(expoDb, { schema });
