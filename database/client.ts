/**
 * Database Client
 *
 * Drizzle ORM client initialization for expo-sqlite
 */

import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
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
 * Track initialization state
 */
let isInitialized = false;
let expoDb: SQLiteDatabase | null = null;
let drizzleDb: ExpoSQLiteDatabase<typeof schema> | null = null;

/**
 * Initialize SQLite database synchronously with error handling
 */
function openDatabase(): SQLiteDatabase {
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
 * Async database initialization for use in app startup
 * This allows parallel initialization with other services
 *
 * @throws DatabaseInitError if initialization fails
 */
export async function initializeDatabase(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    // Open the database
    expoDb = openDatabase();

    // Create Drizzle instance
    drizzleDb = drizzle(expoDb, { schema });

    // Run any pending migrations (placeholder for future migration support)
    // await runMigrations(drizzleDb);

    isInitialized = true;
  } catch (error) {
    throw new DatabaseInitError('Database initialization failed', error);
  }
}

/**
 * Get the Drizzle ORM database instance
 * Must call initializeDatabase() first
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
export const db = new Proxy({} as ExpoSQLiteDatabase<typeof schema>, {
  get(_, prop) {
    if (!drizzleDb) {
      throw new DatabaseInitError(
        'Database not initialized. Call initializeDatabase() first.'
      );
    }
    return drizzleDb[prop as keyof typeof drizzleDb];
  },
});

/**
 * Check if database is initialized
 */
export function isDatabaseInitialized(): boolean {
  return isInitialized;
}

/**
 * Reset database state (for testing purposes)
 */
export function resetDatabaseState(): void {
  isInitialized = false;
  expoDb = null;
  drizzleDb = null;
}
