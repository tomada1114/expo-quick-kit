/**
 * _example Feature Types
 *
 * Feature-specific type definitions for the example module
 * Re-exports database types for convenience
 */

import type { Item as DbItem, NewItem as DbNewItem } from '@/database/schema';

/**
 * Item entity - represents a stored item
 * Re-exported from database schema for feature use
 */
export type Item = DbItem;

/**
 * Input for creating a new item
 * Re-exported from database schema for feature use
 */
export type NewItem = DbNewItem;

/**
 * Input for creating an item (required fields only)
 */
export interface CreateItemInput {
  title: string;
  description?: string;
}

/**
 * Input for updating an existing item
 */
export type UpdateItemInput = Partial<CreateItemInput>;
