import type { Result } from '../core/types';

/**
 * Performance metrics for a single purchase flow stage.
 */
interface StageMetric {
  startTime: number;
  endTime: number;
  delta: number;
}

/**
 * Performance metrics for the complete purchase flow.
 */
export interface PerformanceMetrics {
  productFetch?: StageMetric;
  dialogDisplay?: StageMetric;
  paymentProcessing?: StageMetric;
  verification?: StageMetric;
  totalTime?: number;
  recordedAt: Date;
  isComplete: boolean;
  completedStages: string[];
}

/**
 * Performance monitoring error.
 */
export interface PerformanceError {
  code: string;
  message: string;
}

/**
 * PerformanceMonitor measures processing times across different stages
 * of the purchase flow using high-resolution monotonic timer.
 *
 * Stages tracked:
 * - Product fetch: Product metadata retrieval from platform APIs
 * - Dialog display: Native purchase dialog presentation
 * - Payment processing: Payment API execution and transaction receipt
 * - Verification: Receipt signature verification
 */
export class PerformanceMonitor {
  private timestamps: Map<string, number> = new Map();

  /**
   * Record start of product fetch stage.
   */
  startProductFetch(): Result<void, PerformanceError> {
    return this.recordStartTime('productFetch_start');
  }

  /**
   * Record end of product fetch stage.
   */
  endProductFetch(): Result<void, PerformanceError> {
    return this.recordEndTime('productFetch_start', 'productFetch_end');
  }

  /**
   * Record start of dialog display stage.
   */
  startDialogDisplay(): Result<void, PerformanceError> {
    return this.recordStartTime('dialogDisplay_start');
  }

  /**
   * Record end of dialog display stage.
   */
  endDialogDisplay(): Result<void, PerformanceError> {
    return this.recordEndTime('dialogDisplay_start', 'dialogDisplay_end');
  }

  /**
   * Record start of payment processing stage.
   */
  startPaymentProcessing(): Result<void, PerformanceError> {
    return this.recordStartTime('paymentProcessing_start');
  }

  /**
   * Record end of payment processing stage.
   */
  endPaymentProcessing(): Result<void, PerformanceError> {
    return this.recordEndTime('paymentProcessing_start', 'paymentProcessing_end');
  }

  /**
   * Record start of verification stage.
   */
  startVerification(): Result<void, PerformanceError> {
    return this.recordStartTime('verification_start');
  }

  /**
   * Record end of verification stage.
   */
  endVerification(): Result<void, PerformanceError> {
    return this.recordEndTime('verification_start', 'verification_end');
  }

  /**
   * Get performance metrics for the current flow.
   */
  getMetrics(): Result<PerformanceMetrics, PerformanceError> {
    try {
      const metrics: PerformanceMetrics = {
        recordedAt: new Date(),
        isComplete: false,
        completedStages: [],
      };

      // Process each stage
      const stages = [
        { key: 'productFetch', startKey: 'productFetch_start', endKey: 'productFetch_end' },
        { key: 'dialogDisplay', startKey: 'dialogDisplay_start', endKey: 'dialogDisplay_end' },
        { key: 'paymentProcessing', startKey: 'paymentProcessing_start', endKey: 'paymentProcessing_end' },
        { key: 'verification', startKey: 'verification_start', endKey: 'verification_end' },
      ];

      let totalTime = 0;

      for (const stage of stages) {
        const startTime = this.timestamps.get(stage.startKey);
        const endTime = this.timestamps.get(stage.endKey);

        if (startTime !== undefined && endTime !== undefined) {
          // Validate timestamps
          if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
            return { success: false, error: {
              code: 'INVALID_TIMESTAMP',
              message: `Invalid timestamp for stage ${stage.key}`,
            }};
          }

          const delta = endTime - startTime;
          (metrics[stage.key as keyof PerformanceMetrics] as StageMetric) = {
            startTime,
            endTime,
            delta,
          };
          metrics.completedStages.push(stage.key);
          totalTime += delta;
        }
      }

      // Set isComplete only if all 4 stages are recorded
      metrics.isComplete = metrics.completedStages.length === 4;

      // Set totalTime only if any stages were recorded
      if (metrics.completedStages.length > 0) {
        metrics.totalTime = totalTime;
      }

      return { success: true, data: metrics };
    } catch (error) {
      return { success: false, error: {
        code: 'STATE_CORRUPTED',
        message: 'Performance monitor state is corrupted',
      }};
    }
  }

  /**
   * Reset all timestamps to start a new flow.
   */
  reset(): Result<void, PerformanceError> {
    try {
      this.timestamps.clear();
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: {
        code: 'RESET_FAILED',
        message: 'Failed to reset performance monitor',
      }};
    }
  }

  /**
   * Record a start time for a stage.
   */
  private recordStartTime(key: string): Result<void, PerformanceError> {
    try {
      const timestamp = performance.now();

      if (!Number.isFinite(timestamp)) {
        return { success: false, error: {
          code: 'INVALID_TIMESTAMP',
          message: `Invalid start timestamp for stage ${key}`,
        }};
      }

      this.timestamps.set(key, timestamp);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: {
        code: 'START_RECORDING_FAILED',
        message: `Failed to record start time for stage ${key}`,
      }};
    }
  }

  /**
   * Record an end time for a stage.
   */
  private recordEndTime(startKey: string, endKey: string): Result<void, PerformanceError> {
    try {
      // Check if start timestamp exists
      if (!this.timestamps.has(startKey)) {
        return { success: false, error: {
          code: 'MISSING_START_TIMESTAMP',
          message: `Cannot record end: start timestamp not found for ${startKey}`,
        }};
      }

      const timestamp = performance.now();

      if (!Number.isFinite(timestamp)) {
        return { success: false, error: {
          code: 'INVALID_TIMESTAMP',
          message: `Invalid end timestamp for stage ${endKey}`,
        }};
      }

      this.timestamps.set(endKey, timestamp);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: {
        code: 'END_RECORDING_FAILED',
        message: `Failed to record end time for stage ${endKey}`,
      }};
    }
  }
}
