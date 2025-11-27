/**
 * Database Client Tests
 *
 * TDD: Tests for Drizzle ORM client initialization
 */

// Mock expo-sqlite before importing client
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn().mockReturnValue({
    execSync: jest.fn(),
    runSync: jest.fn().mockReturnValue({ changes: 0, lastInsertRowId: 1 }),
    getFirstSync: jest.fn().mockReturnValue(null),
    getAllSync: jest.fn().mockReturnValue([]),
    prepareSync: jest.fn().mockReturnValue({
      executeSync: jest.fn(),
      finalizeSync: jest.fn(),
    }),
  }),
}));

import { openDatabaseSync } from 'expo-sqlite';
import { db, DATABASE_NAME } from '../client';

describe('Database Client', () => {
  describe('db instance', () => {
    it('should export db instance', () => {
      expect(db).toBeDefined();
    });

    it('should be a Drizzle ORM instance with query methods', () => {
      // Drizzle instance should have select, insert, update, delete methods
      expect(typeof db.select).toBe('function');
      expect(typeof db.insert).toBe('function');
      expect(typeof db.update).toBe('function');
      expect(typeof db.delete).toBe('function');
    });
  });

  describe('database initialization', () => {
    it('should call openDatabaseSync with correct database name', () => {
      expect(openDatabaseSync).toHaveBeenCalledWith(
        'app.db',
        expect.any(Object)
      );
    });

    it('should enable change listener for live queries', () => {
      expect(openDatabaseSync).toHaveBeenCalledWith(
        'app.db',
        expect.objectContaining({ enableChangeListener: true })
      );
    });
  });

  describe('DATABASE_NAME constant', () => {
    it('should export DATABASE_NAME constant', () => {
      expect(DATABASE_NAME).toBe('app.db');
    });
  });
});
