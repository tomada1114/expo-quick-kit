/**
 * Database Client
 *
 * Drizzle ORM client initialization for expo-sqlite
 */

import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';
import { eq } from 'drizzle-orm';
import migrations from '../drizzle/migrations';
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

    // Run migrations
    console.log('Running database migrations...');
    await migrate(drizzleDb, migrations);
    console.log('Database migrations completed');

    isInitialized = true;
  } catch (error) {
    console.error('Database initialization error:', error);
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

/**
 * Get all purchases that unlock a specific feature
 *
 * Task 11.3: Query purchases by feature using purchase_features junction table
 *
 * Process:
 * 1. Query purchase_features table for matching featureId
 * 2. Join with purchases table to get purchase details
 * 3. Return all matching purchase records
 *
 * Given/When/Then:
 * - Given: Feature unlocked by multiple purchases
 * - When: getPurchasesByFeature is called with valid featureId
 * - Then: Returns all purchases that unlock the feature
 *
 * - Given: Feature with no associated purchases
 * - When: getPurchasesByFeature is called
 * - Then: Returns empty array
 *
 * - Given: Database error occurs
 * - When: Query fails
 * - Then: Throws DatabaseError or returns error result
 *
 * @param featureId - Feature identifier to query
 * @returns Array of purchases that unlock the feature, or empty array if none found
 * @throws Error if database is not initialized
 *
 * @example
 * ```typescript
 * import { getPurchasesByFeature } from '@/database/client';
 *
 * const purchases = getPurchasesByFeature('premium_unlock');
 * purchases.forEach(p => {
 *   console.log(`Purchase ${p.transactionId} unlocks premium_unlock`);
 * });
 * ```
 */
export function getPurchasesByFeature(
  featureId: string
): (typeof schema.purchases.$inferSelect)[] {
  if (!drizzleDb) {
    throw new DatabaseInitError(
      'Database not initialized. Call initializeDatabase() first.'
    );
  }

  const { purchases: purchasesTable, purchaseFeatures } = schema;

  // Query: SELECT purchases.* FROM purchases
  //        INNER JOIN purchase_features ON purchases.id = purchase_features.purchase_id
  //        WHERE purchase_features.feature_id = featureId
  const results = drizzleDb
    .select()
    .from(purchasesTable)
    .innerJoin(
      purchaseFeatures,
      purchasesTable.id === purchaseFeatures.purchaseId
    )
    .where(eq(purchaseFeatures.featureId, featureId))
    .all();

  // Extract just the purchase records from the join results
  return results.map((result) => result.purchases);
}
