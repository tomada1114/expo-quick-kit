/**
 * Rate Limiter - Verification Retry Rate Limiting
 *
 * Limits automatic retry attempts for receipt verification failures.
 * When max retries exceeded, manual intervention is required.
 *
 * Prevents:
 * - Excessive verification retry loops
 * - Resource exhaustion from repeated failures
 * - Requires support team review for problematic transactions
 *
 * Task 15.1: RateLimiter - verification retry rate limiting
 * Requirements: 9.6
 *
 * @module features/purchase/infrastructure/rate-limiter
 */

/**
 * Retry status information
 */
export interface RetryStatus {
  /** Number of retry failures recorded */
  retryCount: number;

  /** Whether transaction is at or above rate limit */
  isLimited: boolean;

  /** Whether manual intervention is required */
  requiresManualIntervention: boolean;

  /** Last failure timestamp */
  lastFailureAt?: Date;

  /** Reset timestamp if applicable */
  resetAt?: Date;
}

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  /** Maximum number of retry failures before rate limit kicks in */
  maxRetries?: number;

  /** Duration in milliseconds before retry count auto-resets */
  resetDurationMs?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<RateLimiterConfig> = {
  maxRetries: 3,
  resetDurationMs: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Rate Limiter Service
 *
 * Tracks and limits retry attempts for receipt verification failures.
 * Prevents excessive retry loops by requiring manual intervention
 * when limits are exceeded.
 *
 * Responsibilities:
 * - Track retry failures per transaction
 * - Enforce rate limits on automatic retries
 * - Detect when manual intervention is needed
 * - Support manual clearance of retry records
 */
export class RateLimiter {
  private config: Required<RateLimiterConfig>;
  private retryMap: Map<
    string,
    {
      count: number;
      lastFailureAt: Date;
      resetAt?: Date;
    }
  >;

  /**
   * Constructor - Initialize RateLimiter with optional configuration
   *
   * @param config - Optional configuration overrides
   *
   * @example
   * ```ts
   * const limiter = new RateLimiter({
   *   maxRetries: 5,
   *   resetDurationMs: 60 * 60 * 1000 // 1 hour
   * });
   * ```
   */
  constructor(config?: RateLimiterConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
    this.retryMap = new Map();
  }

  /**
   * Check if a transaction can be retried
   *
   * Returns true if retry is allowed (below rate limit).
   * Returns false if rate limit exceeded or invalid input.
   *
   * Process:
   * 1. Validate transactionId
   * 2. Check if reset duration has passed → clear if needed
   * 3. Compare current count against maxRetries
   * 4. Return whether retry is allowed
   *
   * Given/When/Then:
   * - Given: Transaction with 2 failures, maxRetries=3
   * - When: canRetry is called
   * - Then: Returns true
   *
   * - Given: Transaction with 4 failures, maxRetries=3
   * - When: canRetry is called
   * - Then: Returns false
   *
   * @param transactionId - Transaction identifier
   * @returns Whether automatic retry is allowed
   */
  async canRetry(transactionId: string): Promise<boolean> {
    // Validate input
    if (!transactionId || typeof transactionId !== 'string') {
      return false;
    }

    // Check and clear if reset duration has passed
    this.checkAndClearIfExpired(transactionId);

    // Get current retry count
    const record = this.retryMap.get(transactionId);
    const count = record?.count ?? 0;

    // Allow retry if below limit
    return count <= this.config.maxRetries;
  }

  /**
   * Record a retry failure for a transaction
   *
   * Increments retry count and updates last failure timestamp.
   * If reset duration has passed, resets counter first.
   *
   * Process:
   * 1. Validate transactionId
   * 2. Check if reset duration has passed → clear if needed
   * 3. Increment retry count
   * 4. Update last failure timestamp
   *
   * Given/When/Then:
   * - Given: Transaction with no prior failures
   * - When: recordRetryFailure is called
   * - Then: Retry count becomes 1
   *
   * - Given: Transaction with prior failures
   * - When: recordRetryFailure is called
   * - Then: Retry count increments
   *
   * @param transactionId - Transaction identifier
   *
   * @example
   * ```ts
   * await limiter.recordRetryFailure('txn_001');
   * const count = await limiter.getRetryCount('txn_001');
   * console.log(count); // 1
   * ```
   */
  async recordRetryFailure(transactionId: string): Promise<void> {
    // Validate input
    if (!transactionId || typeof transactionId !== 'string') {
      return;
    }

    // Check and clear if reset duration has passed
    this.checkAndClearIfExpired(transactionId);

    // Get existing record or create new one
    const existing = this.retryMap.get(transactionId);

    if (existing) {
      // Increment count
      existing.count += 1;
      existing.lastFailureAt = new Date();
    } else {
      // Create new record
      this.retryMap.set(transactionId, {
        count: 1,
        lastFailureAt: new Date(),
        resetAt: new Date(Date.now() + this.config.resetDurationMs),
      });
    }
  }

  /**
   * Get current retry count for a transaction
   *
   * Returns 0 if transaction has no retry history.
   *
   * @param transactionId - Transaction identifier
   * @returns Current retry failure count
   *
   * @example
   * ```ts
   * const count = await limiter.getRetryCount('txn_001');
   * console.log(`Failed ${count} times`);
   * ```
   */
  async getRetryCount(transactionId: string): Promise<number> {
    // Validate input
    if (!transactionId || typeof transactionId !== 'string') {
      return 0;
    }

    // Check and clear if reset duration has passed
    this.checkAndClearIfExpired(transactionId);

    const record = this.retryMap.get(transactionId);
    return record?.count ?? 0;
  }

  /**
   * Get detailed retry status for a transaction
   *
   * Returns complete status information including:
   * - Retry count
   * - Rate limit status
   * - Manual intervention requirement
   * - Timestamps
   *
   * @param transactionId - Transaction identifier
   * @returns Detailed retry status
   *
   * @example
   * ```ts
   * const status = await limiter.getRetryStatus('txn_001');
   * if (status.requiresManualIntervention) {
   *   console.log('Manual review needed');
   * }
   * ```
   */
  async getRetryStatus(transactionId: string): Promise<RetryStatus> {
    // Validate input
    if (!transactionId || typeof transactionId !== 'string') {
      return {
        retryCount: 0,
        isLimited: false,
        requiresManualIntervention: false,
      };
    }

    // Check and clear if reset duration has passed
    this.checkAndClearIfExpired(transactionId);

    const record = this.retryMap.get(transactionId);
    const count = record?.count ?? 0;
    const isLimited = count > this.config.maxRetries;

    return {
      retryCount: count,
      isLimited,
      requiresManualIntervention: isLimited,
      lastFailureAt: record?.lastFailureAt,
      resetAt: record?.resetAt,
    };
  }

  /**
   * Clear retry record for a transaction (manual intervention)
   *
   * Removes retry history to allow automatic retries to resume.
   * Typically called by support team after manual verification.
   *
   * Process:
   * 1. Validate transactionId
   * 2. Delete retry record from map
   *
   * Given/When/Then:
   * - Given: Transaction with 2 retry failures
   * - When: clearRetryRecord is called
   * - Then: Retry count becomes 0
   *
   * @param transactionId - Transaction identifier
   *
   * @example
   * ```ts
   * // After manual review and clearance
   * await limiter.clearRetryRecord('txn_001');
   * const count = await limiter.getRetryCount('txn_001');
   * console.log(count); // 0
   * ```
   */
  async clearRetryRecord(transactionId: string): Promise<void> {
    // Validate input
    if (!transactionId || typeof transactionId !== 'string') {
      return;
    }

    // Remove record
    this.retryMap.delete(transactionId);
  }

  /**
   * Get all transactions currently at rate limit
   *
   * Returns list of transaction IDs requiring manual intervention.
   *
   * Process:
   * 1. Iterate through all records
   * 2. Clear expired records
   * 3. Collect transactions above limit
   *
   * @returns Array of limited transaction IDs
   *
   * @example
   * ```ts
   * const limited = await limiter.getLimitedTransactions();
   * for (const txnId of limited) {
   *   console.log(`Manual review needed for: ${txnId}`);
   * }
   * ```
   */
  async getLimitedTransactions(): Promise<string[]> {
    const limited: string[] = [];

    // Check all transactions
    for (const [txnId, record] of this.retryMap.entries()) {
      // Check if record has expired
      if (record.resetAt && new Date() > record.resetAt) {
        this.retryMap.delete(txnId);
      } else if (record.count > this.config.maxRetries) {
        // Still limited
        limited.push(txnId);
      }
    }

    return limited;
  }

  /**
   * Get statistics about rate limiting
   *
   * Returns aggregate statistics about all tracked transactions.
   *
   * @returns Statistics object with counts and metrics
   *
   * @example
   * ```ts
   * const stats = await limiter.getStatistics();
   * console.log(`${stats.limitedCount} transactions require manual intervention`);
   * ```
   */
  async getStatistics(): Promise<{
    totalTrackedTransactions: number;
    limitedCount: number;
    averageRetryCount: number;
    maxRetryCount: number;
  }> {
    // Clean up expired records first
    const now = new Date();
    for (const [txnId, record] of this.retryMap.entries()) {
      if (record.resetAt && now > record.resetAt) {
        this.retryMap.delete(txnId);
      }
    }

    // Calculate statistics
    let limitedCount = 0;
    let totalRetries = 0;
    let maxRetryCount = 0;

    for (const record of this.retryMap.values()) {
      totalRetries += record.count;
      if (record.count > maxRetryCount) {
        maxRetryCount = record.count;
      }
      if (record.count > this.config.maxRetries) {
        limitedCount += 1;
      }
    }

    const totalTransactions = this.retryMap.size;
    const averageRetryCount =
      totalTransactions > 0 ? totalRetries / totalTransactions : 0;

    return {
      totalTrackedTransactions: totalTransactions,
      limitedCount,
      averageRetryCount,
      maxRetryCount,
    };
  }

  /**
   * Check if reset duration has passed and clear if needed
   *
   * Internal utility method for automatic cleanup.
   *
   * @param transactionId - Transaction identifier
   *
   * @internal
   */
  private checkAndClearIfExpired(transactionId: string): void {
    const record = this.retryMap.get(transactionId);

    if (!record) {
      return;
    }

    // Check if reset duration has passed
    if (record.resetAt && new Date() > record.resetAt) {
      // Auto-clear expired record
      this.retryMap.delete(transactionId);
    }
  }
}
