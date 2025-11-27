/**
 * Database Client
 *
 * Drizzle ORM client initialization for expo-sqlite
 */

import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';
import * as schema from './schema';

/**
 * Database file name
 */
export const DATABASE_NAME = 'app.db';

/**
 * Database initialization error
 */
export class DatabaseInitError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'DatabaseInitError';
  }
}

/**
 * Initialize SQLite database with error handling
 */
function initializeDatabase(): SQLiteDatabase {
  try {
    return openDatabaseSync(DATABASE_NAME, {
      enableChangeListener: true,
    });
  } catch (error) {
    throw new DatabaseInitError(
      `Failed to open database "${DATABASE_NAME}"`,
      error
    );
  }
}

/**
 * SQLite database instance with change listener enabled for live queries
 */
const expoDb = initializeDatabase();

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
