/**
 * useItemList Hook
 *
 * TanStack Query hook for fetching item list data
 * with automatic caching, refetching, and error handling.
 *
 * Usage:
 *   const { items, isLoading, error, refetch } = useItemList();
 *
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error message={error.message} />;
 *   return <ItemList items={items} />;
 */

import { useQuery } from '@tanstack/react-query';
import { itemKeys } from '../services/query-keys';
import { itemRepository } from '../services/repository';
import type { Item } from '../types';

/**
 * Return type for useItemList hook
 */
interface UseItemListResult {
  /** Array of items (empty array while loading or on error) */
  items: Item[];
  /** True while initial fetch is in progress */
  isLoading: boolean;
  /** Error object if fetch failed, null otherwise */
  error: Error | null;
  /** Function to manually refetch data */
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage item list data
 *
 * Features:
 * - Automatic caching and background refetch
 * - Error handling with typed error object
 * - Manual refetch capability
 *
 * @returns Object containing items, loading state, error, and refetch function
 */
export function useItemList(): UseItemListResult {
  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: itemKeys.lists(),
    queryFn: () => itemRepository.getAll(),
  });

  const refetch = async (): Promise<void> => {
    await queryRefetch();
  };

  return {
    items: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
