/**
 * useItemList Hook Tests
 *
 * Tests cover:
 * - Happy path: Loading, success, refetch
 * - Error states: Query failures
 * - Edge cases: Empty data
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useItemList } from '../hooks/use-item-list';
import { itemRepository } from '../services/repository';

// Mock repository
jest.mock('../services/repository', () => ({
  itemRepository: {
    getAll: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useItemList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', async () => {
    // Arrange
    (itemRepository.getAll as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    // Act
    const { result } = renderHook(() => useItemList(), {
      wrapper: createWrapper(),
    });

    // Assert
    expect(result.current.isLoading).toBe(true);
    expect(result.current.items).toEqual([]);
  });

  it('should return items on successful fetch', async () => {
    // Arrange
    const mockItems = [
      { id: 1, title: 'Item 1', description: 'Desc 1', createdAt: new Date() },
      { id: 2, title: 'Item 2', description: 'Desc 2', createdAt: new Date() },
    ];
    (itemRepository.getAll as jest.Mock).mockResolvedValue(mockItems);

    // Act
    const { result } = renderHook(() => useItemList(), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.items).toEqual(mockItems);
    expect(result.current.error).toBeNull();
  });

  it('should return empty array when no items exist', async () => {
    // Arrange
    (itemRepository.getAll as jest.Mock).mockResolvedValue([]);

    // Act
    const { result } = renderHook(() => useItemList(), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.items).toEqual([]);
  });

  it('should handle fetch errors', async () => {
    // Arrange
    const error = new Error('Network error');
    (itemRepository.getAll as jest.Mock).mockRejectedValue(error);

    // Act
    const { result } = renderHook(() => useItemList(), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.error).toBeTruthy();
    expect(result.current.items).toEqual([]);
  });

  it('should provide refetch function', async () => {
    // Arrange
    const mockItems = [
      { id: 1, title: 'Item', description: null, createdAt: new Date() },
    ];
    (itemRepository.getAll as jest.Mock).mockResolvedValue(mockItems);

    // Act
    const { result } = renderHook(() => useItemList(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert
    expect(typeof result.current.refetch).toBe('function');
  });
});
