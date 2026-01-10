/**
 * AuthorizationService - Access Control for Purchase History
 *
 * Task 15.2: Implements access control to prevent cross-user access to purchase history.
 * This service ensures that users can only access their own purchase records and prevents
 * unauthorized access to other users' purchase history.
 *
 * Requirements:
 * - Prevent cross-user access to purchase history (Req 9.4)
 * - Enforce user isolation for delete operations
 * - Return structured errors for failed authorization attempts
 * - Use Result pattern for exception-free error handling
 *
 * @module features/purchase/application/authorization-service
 */

import type { Result } from '../core/types';

/**
 * Authorization error type
 * Discriminated union for different authorization failure scenarios
 */
export type AuthorizationError =
  | {
      /** User is not authenticated/logged in */
      code: 'NOT_AUTHENTICATED';
      message: string;
      retryable: false;
    }
  | {
      /** Invalid input parameters (empty IDs, etc.) */
      code: 'INVALID_INPUT';
      message: string;
      retryable: false;
    }
  | {
      /** User lacks permission for the operation */
      code: 'PERMISSION_DENIED';
      message: string;
      retryable: false;
    };

/**
 * Current user context
 * Contains minimal user identification information
 */
export interface CurrentUser {
  id: string;
  email?: string;
}

/**
 * Current user provider function
 * Called to get the current authenticated user
 */
export type CurrentUserProvider = () => CurrentUser | null;

/**
 * AuthorizationService interface
 * Defines methods for checking authorization of purchase-related operations
 */
export interface AuthorizationService {
  /**
   * Checks if the current user can access purchase history for a given user
   *
   * Authorization Rule:
   * - Current user can only access their own purchase history
   * - Different users are denied access (prevents cross-user history access)
   * - Unauthenticated users are denied access
   *
   * @param targetUserId - User ID whose purchase history is being accessed
   * @returns Result with boolean value (true = access allowed, false = access denied)
   *          or AuthorizationError if operation cannot be completed
   *
   * Given/When/Then:
   * - GIVEN: Current user and target user ID
   * - WHEN: canAccessPurchaseHistory is called
   * - THEN: Returns true only if current user ID == target user ID
   */
  canAccessPurchaseHistory(
    targetUserId: string
  ): Promise<Result<boolean, AuthorizationError>>;

  /**
   * Checks if the current user can delete a purchase record
   *
   * Authorization Rule:
   * - Users can only delete their own purchase records
   * - Cross-user deletion attempts are denied
   *
   * @param targetUserId - User ID who owns the purchase
   * @param transactionId - Transaction ID of the purchase to delete
   * @returns Result with boolean value (true = deletion allowed, false = denied)
   *          or AuthorizationError if operation cannot be completed
   *
   * Given/When/Then:
   * - GIVEN: Current user, target user ID, and transaction ID
   * - WHEN: canDeletePurchase is called
   * - THEN: Returns true only if current user ID == target user ID
   */
  canDeletePurchase(
    targetUserId: string,
    transactionId: string
  ): Promise<Result<boolean, AuthorizationError>>;

  /**
   * Sets the current user provider (for testing)
   * Allows tests to inject mock user contexts
   */
  setCurrentUserProvider?(provider: CurrentUserProvider): void;
}

/**
 * Creates an AuthorizationService instance
 *
 * Configurable implementation that supports custom user provider
 * (useful for integrating with different authentication systems)
 *
 * @param userProvider - Function that returns current user or null if not authenticated
 * @returns AuthorizationService instance
 *
 * Example usage:
 * ```typescript
 * const authService = createAuthorizationService(() => {
 *   return store.currentUser || null; // Get from auth state store
 * });
 *
 * // Check if current user can access alice's purchase history
 * const result = await authService.canAccessPurchaseHistory('alice-id');
 * if (result.ok) {
 *   if (result.value) {
 *     // Access granted - show purchase history
 *   } else {
 *     // Access denied - show permission error
 *   }
 * } else {
 *   // Error occurred - handle error
 * }
 * ```
 */
export function createAuthorizationService(
  userProvider: CurrentUserProvider
): AuthorizationService {
  let currentUserProvider = userProvider;

  return {
    async canAccessPurchaseHistory(targetUserId: string) {
      const currentUser = currentUserProvider();

      // Check: User must be authenticated
      if (!currentUser) {
        return {
          ok: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message:
              'User is not authenticated. Please log in to access purchase history.',
            retryable: false,
          },
        };
      }

      // Validate: Target user ID must not be empty
      if (!targetUserId || targetUserId.trim() === '') {
        return {
          ok: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Target user ID cannot be empty',
            retryable: false,
          },
        };
      }

      // Authorization: Users can only access their own history
      const hasAccess = currentUser.id === targetUserId;

      return {
        ok: true,
        value: hasAccess,
      };
    },

    async canDeletePurchase(targetUserId: string, transactionId: string) {
      const currentUser = currentUserProvider();

      // Check: User must be authenticated
      if (!currentUser) {
        return {
          ok: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message:
              'User is not authenticated. Please log in to delete purchase records.',
            retryable: false,
          },
        };
      }

      // Validate: Target user ID must not be empty
      if (!targetUserId || targetUserId.trim() === '') {
        return {
          ok: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Target user ID cannot be empty',
            retryable: false,
          },
        };
      }

      // Validate: Transaction ID must not be empty
      if (!transactionId || transactionId.trim() === '') {
        return {
          ok: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Transaction ID cannot be empty',
            retryable: false,
          },
        };
      }

      // Authorization: Users can only delete their own purchases
      const canDelete = currentUser.id === targetUserId;

      return {
        ok: true,
        value: canDelete,
      };
    },

    setCurrentUserProvider(provider: CurrentUserProvider) {
      currentUserProvider = provider;
    },
  };
}

/**
 * Singleton instance of AuthorizationService
 *
 * Note: In a real application, this would be initialized with the actual
 * authentication provider from your auth library/store (e.g., Supabase, Firebase, etc.)
 *
 * For now, it's initialized with a stub that returns null
 * Integration with actual auth system is deferred to application initialization
 */
export const authorizationService = createAuthorizationService(() => null);
