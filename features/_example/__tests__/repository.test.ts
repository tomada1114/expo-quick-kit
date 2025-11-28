/**
 * ItemRepository Unit Tests
 *
 * Tests cover:
 * - Happy path: Normal CRUD operations
 * - Sad path: Not found, invalid data
 * - Edge cases: Empty arrays, unicode, boundary values
 */

import { db } from '@/database/client';
import { items } from '@/database/schema';
import { ItemRepository, itemRepository } from '../services/repository';

// Mock database
jest.mock('@/database/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('ItemRepository', () => {
  let repository: ItemRepository;

  beforeEach(() => {
    repository = new ItemRepository();
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all items sorted by createdAt DESC', async () => {
      // Arrange
      const mockItems = [
        {
          id: 2,
          title: 'Item 2',
          description: 'Desc 2',
          createdAt: new Date('2024-01-02'),
        },
        {
          id: 1,
          title: 'Item 1',
          description: 'Desc 1',
          createdAt: new Date('2024-01-01'),
        },
      ];
      const mockChain = {
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockItems),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockChain);

      // Act
      const result = await repository.getAll();

      // Assert
      expect(result).toEqual(mockItems);
      expect(db.select).toHaveBeenCalled();
    });

    it('should return empty array when no items exist', async () => {
      // Arrange
      const mockChain = {
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue([]),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockChain);

      // Act
      const result = await repository.getAll();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockChain = {
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockChain);

      // Act & Assert
      await expect(repository.getAll()).rejects.toThrow('Database error');
    });
  });

  describe('getById', () => {
    it('should return item by id', async () => {
      // Arrange
      const mockItem = {
        id: 1,
        title: 'Test Item',
        description: 'Test description',
        createdAt: new Date('2024-01-01'),
      };
      const mockChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockItem]),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockChain);

      // Act
      const result = await repository.getById(1);

      // Assert
      expect(result).toEqual(mockItem);
    });

    it('should return null when item not found', async () => {
      // Arrange
      const mockChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockChain);

      // Act
      const result = await repository.getById(999);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle id of zero', async () => {
      // Arrange
      const mockChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockChain);

      // Act
      const result = await repository.getById(0);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create item with valid input', async () => {
      // Arrange
      const input = { title: 'New Item', description: 'New description' };
      const createdItem = {
        id: 1,
        ...input,
        createdAt: new Date('2024-01-01'),
      };
      const mockChain = {
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdItem]),
        }),
      };
      (db.insert as jest.Mock).mockReturnValue(mockChain);

      // Act
      const result = await repository.create(input);

      // Assert
      expect(result).toEqual(createdItem);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should create item with title only (description optional)', async () => {
      // Arrange
      const input = { title: 'Title Only' };
      const createdItem = {
        id: 1,
        title: 'Title Only',
        description: null,
        createdAt: new Date('2024-01-01'),
      };
      const mockChain = {
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdItem]),
        }),
      };
      (db.insert as jest.Mock).mockReturnValue(mockChain);

      // Act
      const result = await repository.create(input);

      // Assert
      expect(result).toEqual(createdItem);
    });

    it('should handle unicode characters in title', async () => {
      // Arrange
      const input = { title: '日本語タイトル 🚀', description: 'Emoji 😀' };
      const createdItem = {
        id: 1,
        ...input,
        createdAt: new Date('2024-01-01'),
      };
      const mockChain = {
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdItem]),
        }),
      };
      (db.insert as jest.Mock).mockReturnValue(mockChain);

      // Act
      const result = await repository.create(input);

      // Assert
      expect(result.title).toBe('日本語タイトル 🚀');
      expect(result.description).toBe('Emoji 😀');
    });

    it('should handle very long strings', async () => {
      // Arrange
      const longTitle = 'A'.repeat(1000);
      const input = { title: longTitle };
      const createdItem = {
        id: 1,
        title: longTitle,
        description: null,
        createdAt: new Date('2024-01-01'),
      };
      const mockChain = {
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdItem]),
        }),
      };
      (db.insert as jest.Mock).mockReturnValue(mockChain);

      // Act
      const result = await repository.create(input);

      // Assert
      expect(result.title.length).toBe(1000);
    });
  });

  describe('update', () => {
    it('should update item with valid input', async () => {
      // Arrange
      const updatedItem = {
        id: 1,
        title: 'Updated Title',
        description: 'Updated description',
        createdAt: new Date('2024-01-01'),
      };
      const mockChain = {
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedItem]),
          }),
        }),
      };
      (db.update as jest.Mock).mockReturnValue(mockChain);

      // Act
      const result = await repository.update(1, { title: 'Updated Title' });

      // Assert
      expect(result).toEqual(updatedItem);
    });

    it('should return null when updating non-existent item', async () => {
      // Arrange
      const mockChain = {
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      };
      (db.update as jest.Mock).mockReturnValue(mockChain);

      // Act
      const result = await repository.update(999, { title: 'Updated' });

      // Assert
      expect(result).toBeNull();
    });

    it('should allow partial updates', async () => {
      // Arrange
      const updatedItem = {
        id: 1,
        title: 'Original',
        description: 'Updated desc only',
        createdAt: new Date('2024-01-01'),
      };
      const mockChain = {
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedItem]),
          }),
        }),
      };
      (db.update as jest.Mock).mockReturnValue(mockChain);

      // Act
      const result = await repository.update(1, {
        description: 'Updated desc only',
      });

      // Assert
      expect(result?.description).toBe('Updated desc only');
    });
  });

  describe('delete', () => {
    it('should delete existing item and return true', async () => {
      // Arrange
      const mockChain = {
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 1 }]),
        }),
      };
      (db.delete as jest.Mock).mockReturnValue(mockChain);

      // Act
      const result = await repository.delete(1);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when deleting non-existent item', async () => {
      // Arrange
      const mockChain = {
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      };
      (db.delete as jest.Mock).mockReturnValue(mockChain);

      // Act
      const result = await repository.delete(999);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton repository instance', () => {
      expect(itemRepository).toBeInstanceOf(ItemRepository);
    });
  });
});
