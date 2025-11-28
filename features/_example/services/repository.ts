/**
 * Item Repository
 *
 * Repository pattern implementation for Item CRUD operations
 * using Drizzle ORM with expo-sqlite.
 *
 * Usage:
 *   import { itemRepository } from '@/features/_example';
 *
 *   // Get all items
 *   const items = await itemRepository.getAll();
 *
 *   // Create new item
 *   const newItem = await itemRepository.create({ title: 'My Item' });
 */

import { db } from '@/database/client';
import { items } from '@/database/schema';
import { desc, eq } from 'drizzle-orm';
import type { CreateItemInput, Item, UpdateItemInput } from '../types';

/**
 * Repository class for Item entity
 * Provides type-safe database operations
 */
export class ItemRepository {
  /**
   * Get all items sorted by creation date (newest first)
   * @returns Array of items sorted by createdAt DESC
   */
  async getAll(): Promise<Item[]> {
    return db.select().from(items).orderBy(desc(items.createdAt));
  }

  /**
   * Get a single item by ID
   * @param id - Item ID
   * @returns Item if found, null otherwise
   */
  async getById(id: number): Promise<Item | null> {
    const result = await db.select().from(items).where(eq(items.id, id));
    return result[0] ?? null;
  }

  /**
   * Create a new item
   * @param input - Item data (title required, description optional)
   * @returns Created item with generated ID and timestamp
   */
  async create(input: CreateItemInput): Promise<Item> {
    const result = await db.insert(items).values(input).returning();
    return result[0];
  }

  /**
   * Update an existing item
   * @param id - Item ID to update
   * @param input - Partial item data to update
   * @returns Updated item if found, null otherwise
   */
  async update(id: number, input: UpdateItemInput): Promise<Item | null> {
    const result = await db
      .update(items)
      .set(input)
      .where(eq(items.id, id))
      .returning();
    return result[0] ?? null;
  }

  /**
   * Delete an item by ID
   * @param id - Item ID to delete
   * @returns true if deleted, false if not found
   */
  async delete(id: number): Promise<boolean> {
    const result = await db.delete(items).where(eq(items.id, id)).returning();
    return result.length > 0;
  }
}

/**
 * Singleton repository instance
 * Use this for all item operations in the application
 */
export const itemRepository = new ItemRepository();
