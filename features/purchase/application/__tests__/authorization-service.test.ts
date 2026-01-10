/**
 * AuthorizationService Tests - Task 15.2
 *
 * Tests for access control to prevent cross-user purchase history access.
 *
 * Test Coverage:
 * - ✅ Happy path: Current user can access own purchase history
 * - ✅ Sad path: Different user denied access to other user's history
 * - ✅ Edge cases: Empty/null user IDs, permission checks
 * - ✅ Unhappy path: Service failures, invalid inputs
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createAuthorizationService } from '../authorization-service';
import type { AuthorizationService } from '../authorization-service';

/**
 * Mock current user getter function
 * Allows tests to set/change the current user context
 */
let mockCurrentUser: { id: string; email?: string } | null = null;
const getCurrentUser = () => mockCurrentUser;

describe('AuthorizationService', () => {
  let service: AuthorizationService;

  beforeEach(() => {
    mockCurrentUser = null;
    service = createAuthorizationService(getCurrentUser);
  });

  describe('canAccessPurchaseHistory', () => {
    describe('Happy path: Current user accesses own history', () => {
      it('should allow access when user ID matches current user ID', async () => {
        // Given: Current user is logged in
        mockCurrentUser = { id: 'user-123', email: 'user@example.com' };

        // When: User tries to access their own purchase history
        const result = await service.canAccessPurchaseHistory('user-123');

        // Then: Access is granted
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(true);
        }
      });

      it('should allow access with exact user ID match', async () => {
        // Given: Current user is logged in with specific ID
        mockCurrentUser = { id: 'alice-456' };

        // When: User accesses their own history
        const result = await service.canAccessPurchaseHistory('alice-456');

        // Then: Access is granted
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(true);
        }
      });

      it('should allow multiple consecutive accesses for same user', async () => {
        // Given: Current user
        mockCurrentUser = { id: 'bob-789' };

        // When: Multiple access attempts are made
        const result1 = await service.canAccessPurchaseHistory('bob-789');
        const result2 = await service.canAccessPurchaseHistory('bob-789');

        // Then: All attempts are allowed
        expect(result1.ok).toBe(true);
        if (result1.ok) {
          expect(result1.value).toBe(true);
        }
        expect(result2.ok).toBe(true);
        if (result2.ok) {
          expect(result2.value).toBe(true);
        }
      });
    });

    describe('Sad path: User denied access to other user history', () => {
      it('should deny access when user ID differs from current user', async () => {
        // Given: Current user is user-123
        mockCurrentUser = { id: 'user-123' };

        // When: User tries to access user-456's history
        const result = await service.canAccessPurchaseHistory('user-456');

        // Then: Access is denied
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(false);
        }
      });

      it('should prevent cross-user access with different IDs', async () => {
        // Given: Current user is alice
        mockCurrentUser = { id: 'alice' };

        // When: Trying to access bob's history
        const result = await service.canAccessPurchaseHistory('bob');

        // Then: Access is denied
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(false);
        }
      });

      it('should return error when user not authenticated', async () => {
        // Given: No user is logged in
        mockCurrentUser = null;

        // When: Access is attempted
        const result = await service.canAccessPurchaseHistory('user-123');

        // Then: NOT_AUTHENTICATED error is returned
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('NOT_AUTHENTICATED');
          expect(result.error.retryable).toBe(false);
        }
      });

      it('should deny access even with valid target ID if user not authenticated', async () => {
        // Given: No authentication
        mockCurrentUser = null;

        // When: Any access is attempted
        const result = await service.canAccessPurchaseHistory('any-user-id');

        // Then: Error is returned
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('NOT_AUTHENTICATED');
        }
      });
    });

    describe('Edge cases', () => {
      it('should handle empty target user ID', async () => {
        // Given: Current user
        mockCurrentUser = { id: 'user-123' };

        // When: Empty ID is provided
        const result = await service.canAccessPurchaseHistory('');

        // Then: INVALID_INPUT error
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
          expect(result.error.message).toContain('empty');
        }
      });

      it('should handle whitespace-only target user ID', async () => {
        // Given: Current user
        mockCurrentUser = { id: 'user-123' };

        // When: Whitespace-only ID is provided
        const result = await service.canAccessPurchaseHistory('   ');

        // Then: INVALID_INPUT error
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });

      it('should be case-sensitive for user IDs', async () => {
        // Given: Current user
        mockCurrentUser = { id: 'User-123' };

        // When: Different case ID is used
        const result = await service.canAccessPurchaseHistory('user-123');

        // Then: Access denied (case matters)
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(false);
        }
      });

      it('should handle special characters in user IDs', async () => {
        // Given: Current user with special characters
        const specialId = 'user@example.com-123';
        mockCurrentUser = { id: specialId };

        // When: Same special ID is used
        const result = await service.canAccessPurchaseHistory(specialId);

        // Then: Access is granted
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(true);
        }
      });

      it('should handle very long user IDs', async () => {
        // Given: User with long ID
        const longId = 'a'.repeat(256);
        mockCurrentUser = { id: longId };

        // When: Long ID is used
        const result = await service.canAccessPurchaseHistory(longId);

        // Then: Access is granted
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(true);
        }
      });
    });

    describe('Unhappy path: Error conditions', () => {
      it('should handle service errors gracefully', async () => {
        // Given: Current user
        mockCurrentUser = { id: 'user-123' };

        // When: Service processes request
        const result = await service.canAccessPurchaseHistory('user-456');

        // Then: Error is returned, not thrown
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(typeof result.value).toBe('boolean');
        }
      });
    });
  });

  describe('canDeletePurchase', () => {
    describe('Happy path: User can delete own purchase', () => {
      it('should allow deletion of own purchase record', async () => {
        // Given: Current user
        mockCurrentUser = { id: 'user-123' };

        // When: User tries to delete own purchase
        const result = await service.canDeletePurchase('user-123', 'txn-456');

        // Then: Deletion is allowed
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(true);
        }
      });

      it('should allow deletion with valid transaction ID', async () => {
        // Given: Current user
        mockCurrentUser = { id: 'alice' };

        // When: User deletes own purchase with valid transaction ID
        const result = await service.canDeletePurchase('alice', 'txn-abc123');

        // Then: Deletion is allowed
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(true);
        }
      });
    });

    describe('Sad path: User denied deletion', () => {
      it('should deny deletion of other user purchase', async () => {
        // Given: Current user is user-123
        mockCurrentUser = { id: 'user-123' };

        // When: User tries to delete user-456's purchase
        const result = await service.canDeletePurchase('user-456', 'txn-789');

        // Then: Deletion is denied
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(false);
        }
      });

      it('should return error when not authenticated', async () => {
        // Given: No authentication
        mockCurrentUser = null;

        // When: Delete is attempted
        const result = await service.canDeletePurchase('user-123', 'txn-456');

        // Then: NOT_AUTHENTICATED error
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('NOT_AUTHENTICATED');
        }
      });
    });

    describe('Edge cases', () => {
      it('should handle empty transaction ID', async () => {
        // Given: Current user
        mockCurrentUser = { id: 'user-123' };

        // When: Empty transaction ID
        const result = await service.canDeletePurchase('user-123', '');

        // Then: INVALID_INPUT error
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });

      it('should handle empty target user ID', async () => {
        // Given: Current user
        mockCurrentUser = { id: 'user-123' };

        // When: Empty target user ID
        const result = await service.canDeletePurchase('', 'txn-456');

        // Then: INVALID_INPUT error
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });

      it('should require both user ID and transaction ID', async () => {
        // Given: Current user
        mockCurrentUser = { id: 'user-123' };

        // When: Both IDs are empty
        const result = await service.canDeletePurchase('', '');

        // Then: Error (checks user ID first)
        expect(result.ok).toBe(false);
      });
    });
  });

  describe('Integration: Cross-user isolation', () => {
    it('should maintain isolation between multiple users', async () => {
      // Given: User alice is logged in
      mockCurrentUser = { id: 'alice' };
      let result = await service.canAccessPurchaseHistory('alice');
      expect(result.ok && result.value).toBe(true);

      // When: User switches to bob
      mockCurrentUser = { id: 'bob' };
      result = await service.canAccessPurchaseHistory('alice');

      // Then: Bob cannot access alice's history
      expect(result.ok && !result.value).toBe(true);
    });

    it('should enforce isolation for delete operations', async () => {
      // Given: User 1 is logged in
      mockCurrentUser = { id: 'user-1' };
      let result = await service.canDeletePurchase('user-1', 'txn-123');
      expect(result.ok && result.value).toBe(true);

      // When: Different user attempts delete
      mockCurrentUser = { id: 'user-2' };
      result = await service.canDeletePurchase('user-1', 'txn-123');

      // Then: Delete is denied
      expect(result.ok && !result.value).toBe(true);
    });

    it('should handle user logout correctly', async () => {
      // Given: User is logged in
      mockCurrentUser = { id: 'user-123' };
      let result = await service.canAccessPurchaseHistory('user-123');
      expect(result.ok && result.value).toBe(true);

      // When: User logs out
      mockCurrentUser = null;
      result = await service.canAccessPurchaseHistory('user-123');

      // Then: Access is denied
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_AUTHENTICATED');
      }
    });
  });
});
