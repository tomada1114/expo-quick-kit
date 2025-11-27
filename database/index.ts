/**
 * Database Layer Barrel Export
 * SQLite + Drizzle ORM client and schemas
 */

// Database client
export { db, DATABASE_NAME } from './client';

// Schema definitions and types
export { items } from './schema';
export type { Item, NewItem } from './schema';
