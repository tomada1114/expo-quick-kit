/**
 * TanStack Query Client Configuration
 *
 * Provides a pre-configured QueryClient instance for async state management
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient with optimized defaults for mobile applications
 *
 * Configuration:
 * - staleTime: 5 minutes - Data remains fresh for 5 minutes
 * - gcTime: 10 minutes - Unused data is garbage collected after 10 minutes
 * - retry: 1 - Single retry on failure (suitable for mobile networks)
 * - refetchOnWindowFocus: true - Refetch when app comes to foreground
 * - refetchOnReconnect: true - Refetch when network reconnects
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
