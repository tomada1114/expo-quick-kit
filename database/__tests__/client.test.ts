/**
 * Database Client Tests
 *
 * TDD: Tests for Drizzle ORM client initialization
 */

const mockExpoDb = {
  execSync: jest.fn(),
  runSync: jest.fn().mockReturnValue({ changes: 0, lastInsertRowId: 1 }),
  getFirstSync: jest.fn().mockReturnValue(null),
  getAllSync: jest.fn().mockReturnValue([]),
  prepareSync: jest.fn().mockReturnValue({
    executeSync: jest.fn(),
    finalizeSync: jest.fn(),
  }),
};

const mockOpenDatabaseSync = jest.fn().mockReturnValue(mockExpoDb);

// Mock expo-sqlite before importing client
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: mockOpenDatabaseSync,
}));

describe('Database Client', () => {
  // Import after mock setup
  const { db, DATABASE_NAME, DatabaseInitError } = require('../client');
  const { openDatabaseSync } = require('expo-sqlite');

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

  describe('DatabaseInitError', () => {
    it('should be exported', () => {
      expect(DatabaseInitError).toBeDefined();
    });

    it('should create error with message and cause', () => {
      const cause = new Error('Original error');
      const error = new DatabaseInitError('Test message', cause);

      expect(error.message).toBe('Test message');
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('DatabaseInitError');
    });

    it('should be instanceof Error', () => {
      const error = new DatabaseInitError('Test');
      expect(error).toBeInstanceOf(Error);
    });
  });
});
