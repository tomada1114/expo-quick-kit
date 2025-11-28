/**
 * Database Client Tests
 *
 * TDD: Tests for Drizzle ORM client initialization
 */

const mockStatement = {
  executeSync: jest.fn().mockReturnValue({ changes: 0, lastInsertRowId: 0 }),
  executeForRawResultSync: jest.fn().mockReturnValue({
    getAllSync: jest.fn().mockReturnValue([]),
    getFirstSync: jest.fn().mockReturnValue(null),
  }),
  finalizeSync: jest.fn(),
};

const mockExpoDb = {
  execSync: jest.fn(),
  runSync: jest.fn().mockReturnValue({ changes: 0, lastInsertRowId: 1 }),
  getFirstSync: jest.fn().mockReturnValue(null),
  getAllSync: jest.fn().mockReturnValue([]),
  prepareSync: jest.fn().mockReturnValue(mockStatement),
};

const mockOpenDatabaseSync = jest.fn().mockReturnValue(mockExpoDb);

// Mock expo-sqlite before importing client
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: mockOpenDatabaseSync,
}));

describe('Database Client', () => {
  // Import after mock setup
  const {
    db,
    DATABASE_NAME,
    DatabaseInitError,
    initializeDatabase,
    isDatabaseInitialized,
    resetDatabaseState,
  } = require('../client');
  const { openDatabaseSync } = require('expo-sqlite');

  beforeEach(() => {
    jest.clearAllMocks();
    resetDatabaseState();
  });

  describe('initializeDatabase', () => {
    it('should initialize database successfully', async () => {
      await initializeDatabase();
      expect(isDatabaseInitialized()).toBe(true);
    });

    it('should call openDatabaseSync with correct database name', async () => {
      await initializeDatabase();
      expect(openDatabaseSync).toHaveBeenCalledWith(
        'app.db',
        expect.any(Object)
      );
    });

    it('should enable change listener for live queries', async () => {
      await initializeDatabase();
      expect(openDatabaseSync).toHaveBeenCalledWith(
        'app.db',
        expect.objectContaining({ enableChangeListener: true })
      );
    });

    it('should not reinitialize if already initialized', async () => {
      await initializeDatabase();
      await initializeDatabase();
      // Should only be called once
      expect(openDatabaseSync).toHaveBeenCalledTimes(1);
    });

    it('should throw DatabaseInitError if openDatabaseSync fails', async () => {
      resetDatabaseState();
      mockOpenDatabaseSync.mockImplementationOnce(() => {
        throw new Error('Failed to open');
      });

      await expect(initializeDatabase()).rejects.toThrow(DatabaseInitError);
    });
  });

  describe('db instance', () => {
    it('should throw error if accessed before initialization', () => {
      expect(() => db.select).toThrow(DatabaseInitError);
      expect(() => db.select).toThrow(
        'Database not initialized. Call initializeDatabase() first.'
      );
    });

    it('should be a Drizzle ORM instance with query methods after initialization', async () => {
      await initializeDatabase();
      // Drizzle instance should have select, insert, update, delete methods
      expect(typeof db.select).toBe('function');
      expect(typeof db.insert).toBe('function');
      expect(typeof db.update).toBe('function');
      expect(typeof db.delete).toBe('function');
    });
  });

  describe('isDatabaseInitialized', () => {
    it('should return false before initialization', () => {
      expect(isDatabaseInitialized()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await initializeDatabase();
      expect(isDatabaseInitialized()).toBe(true);
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
