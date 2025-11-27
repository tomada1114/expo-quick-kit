/**
 * Database Schema
 *
 * Drizzle ORM schema definitions for SQLite tables
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
