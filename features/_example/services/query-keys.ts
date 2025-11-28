/**
 * TanStack Query Keys for _example Feature
 *
 * Centralized query key management for consistent cache invalidation
 * and query organization. Follows the factory pattern.
 *
 * Usage:
 *   const { data } = useQuery({
 *     queryKey: itemKeys.lists(),
 *     queryFn: () => itemRepository.getAll()
 *   });
 *
 *   // Invalidate after mutation
 *   queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
 */

export const itemKeys = {
  /**
   * Root key for all item queries
   * Used for invalidating all item-related caches
   */
  all: ['items'] as const,

  /**
   * Key for list queries
   * @returns Query key for fetching item lists
   */
  lists: () => [...itemKeys.all, 'list'] as const,

  /**
   * Key for detail queries
   * @param id - Item ID
   * @returns Query key for fetching a specific item
   */
  detail: (id: number) => [...itemKeys.all, 'detail', id] as const,
};

/**
 * Type helper for query key inference
 */
export type ItemQueryKeys = typeof itemKeys;
