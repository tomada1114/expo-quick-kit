/**
 * QueryClient Configuration Tests
 *
 * Tests for TanStack Query QueryClient setup
 */

import { QueryClient } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

describe('QueryClient Configuration', () => {
  describe('queryClient instance', () => {
    it('should be a valid QueryClient instance', () => {
      expect(queryClient).toBeInstanceOf(QueryClient);
    });

    it('should have default query options configured', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries).toBeDefined();
    });

    it('should have staleTime set to 5 minutes (300000ms)', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.staleTime).toBe(1000 * 60 * 5);
    });

    it('should have gcTime set to 10 minutes (600000ms)', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.gcTime).toBe(1000 * 60 * 10);
    });

    it('should have retry set to 1', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.retry).toBe(1);
    });

    it('should have refetchOnWindowFocus enabled', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(true);
    });

    it('should have refetchOnReconnect enabled', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.refetchOnReconnect).toBe(true);
    });
  });

  describe('mutation default options', () => {
    it('should have retry set to 1 for mutations', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.mutations?.retry).toBe(1);
    });
  });
});
