/**
 * Database Schema
 *
 * Drizzle ORM schema definitions for SQLite tables
 */

import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

/**
 * Items table - Sample table for demonstrating CRUD operations
 */
export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Type for selecting items (includes all columns)
 */
export type Item = typeof items.$inferSelect;

/**
 * Type for inserting items (id and createdAt are optional)
 */
export type NewItem = typeof items.$inferInsert;

/**
 * Purchases table - One-time purchase records
 *
 * Stores information about one-time purchases made by users.
 * Each purchase is identified by a unique transactionId from the payment platform.
 * - transactionId: unique identifier from payment platform
 * - productId: identifies which product was purchased (used in feature gating)
 * - isVerified: signature verification status
 * - isSynced: server synchronization status (for offline support)
 * - Indexes: transactionId (unique), productId, isSynced for common query patterns
 */
export const purchases = sqliteTable(
  'purchases',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    transactionId: text('transaction_id').unique().notNull(),
    productId: text('product_id').notNull(),
    purchasedAt: integer('purchased_at').notNull(),
    price: real('price').notNull(),
    currencyCode: text('currency_code').notNull(),
    isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
    isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
    syncedAt: integer('synced_at'),
    createdAt: integer('created_at').default(sql`(unixepoch())`),
    updatedAt: integer('updated_at').default(sql`(unixepoch())`),
  },
  (table) => ({
    productIdIdx: index('idx_product_id').on(table.productId),
    isSyncedIdx: index('idx_is_synced').on(table.isSynced),
  })
);

/**
 * Type for selecting purchases (includes all columns)
 */
export type Purchase = typeof purchases.$inferSelect;

/**
 * Type for inserting purchases (id, createdAt, and updatedAt are optional)
 */
export type NewPurchase = typeof purchases.$inferInsert;

/**
 * Purchase Features junction table - Maps purchases to unlocked features
 *
 * Implements many-to-many relationship between purchases and features.
 * A single purchase can unlock multiple features.
 * - purchaseId: foreign key to purchases(id) with ON DELETE CASCADE
 * - featureId: identifier of unlocked feature
 * - Constraints: unique(purchase_id, feature_id) and indexes defined in migration
 * - Query patterns: by purchaseId (find features for a purchase), by featureId (find purchases that unlock feature)
 */
export const purchaseFeatures = sqliteTable(
  'purchase_features',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    purchaseId: integer('purchase_id').notNull(),
    featureId: text('feature_id').notNull(),
    createdAt: integer('created_at').default(sql`(unixepoch())`),
  },
  (table) => ({
    purchaseIdFeatureIdUnique: uniqueIndex(
      'purchase_features_purchase_id_feature_id_unique'
    ).on(table.purchaseId, table.featureId),
    purchaseIdIdx: index('idx_purchase_id').on(table.purchaseId),
    featureIdIdx: index('idx_feature_id').on(table.featureId),
  })
);

/**
 * Type for selecting purchase features (includes all columns)
 */
export type PurchaseFeature = typeof purchaseFeatures.$inferSelect;

/**
 * Type for inserting purchase features
 */
export type NewPurchaseFeature = typeof purchaseFeatures.$inferInsert;
