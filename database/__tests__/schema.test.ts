/**
 * Database Schema Tests
 *
 * TDD: Tests for items table schema definition
 */

import { getTableName } from 'drizzle-orm';
import { items } from '../schema';

describe('Database Schema', () => {
  describe('items table', () => {
    it('should have correct table name', () => {
      expect(getTableName(items)).toBe('items');
    });

    it('should have id column as primary key', () => {
      expect(items.id).toBeDefined();
      expect(items.id.name).toBe('id');
    });

    it('should have title column as text not null', () => {
      expect(items.title).toBeDefined();
      expect(items.title.name).toBe('title');
      expect(items.title.notNull).toBe(true);
    });

    it('should have description column as optional text', () => {
      expect(items.description).toBeDefined();
      expect(items.description.name).toBe('description');
      expect(items.description.notNull).toBe(false);
    });

    it('should have createdAt column with snake_case name', () => {
      expect(items.createdAt).toBeDefined();
      expect(items.createdAt.name).toBe('created_at');
    });
  });
});
