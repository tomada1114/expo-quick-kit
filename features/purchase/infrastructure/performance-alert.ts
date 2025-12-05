/**
 * Performance Alert Service
 *
 * Task 10.4: Performance monitoring and threshold-based alerting
 *
 * Monitors critical purchase operations and generates alerts when performance
 * thresholds are exceeded:
 * - Product list fetch: 2 seconds (2000ms)
 * - Paywall display: 500ms
 * - Restore purchases: 15 seconds (15000ms)
 *
 * Features:
 * - Real-time threshold monitoring
 * - Consecutive violation tracking
 * - Performance statistics and metrics
 * - Alert filtering and retrieval
 * - JSON export for support and analytics
 *
 * @module features/purchase/infrastructure/performance-alert
 */

/**
 * Operation type for performance monitoring
 */
type OperationType = 'PRODUCT_LIST_FETCH' | 'PAYWALL_DISPLAY' | 'RESTORE_PURCHASES';

/**
 * Performance alert record
 */
interface PerformanceAlertRecord {
  operationType: OperationType;
  duration: number;
  threshold: number;
  exceededBy: number;
  timestamp: Date;
}

/**
 * Performance statistics
 */
interface PerformanceStatistics {
  totalOperations: number;
  totalViolations: number;
  violationRate: number;
  byOperationType: Record<
    OperationType,
    {
      total: number;
      violations: number;
      violationRate: number;
      averageDuration: number;
    }
  >;
}

/**
 * Operation type thresholds (in milliseconds)
 */
const THRESHOLDS: Record<OperationType, number> = {
  PRODUCT_LIST_FETCH: 2000,
  PAYWALL_DISPLAY: 500,
  RESTORE_PURCHASES: 15000,
};

/**
 * PerformanceAlert class for monitoring operation performance
 *
 * Singleton pattern - use performanceAlert instance exported below
 */
class PerformanceAlertService {
  private alerts: PerformanceAlertRecord[] = [];
  private consecutiveViolations: Record<OperationType, number> = {
    PRODUCT_LIST_FETCH: 0,
    PAYWALL_DISPLAY: 0,
    RESTORE_PURCHASES: 0,
  };
  private operationMetrics: Record<
    OperationType,
    { count: number; violations: number; totalDuration: number }
  > = {
    PRODUCT_LIST_FETCH: { count: 0, violations: 0, totalDuration: 0 },
    PAYWALL_DISPLAY: { count: 0, violations: 0, totalDuration: 0 },
    RESTORE_PURCHASES: { count: 0, violations: 0, totalDuration: 0 },
  };

  /**
   * Monitor operation performance and generate alert if threshold exceeded
   *
   * @param operationType - Type of operation being monitored
   * @param duration - Operation duration in milliseconds
   * @returns Alert record if threshold exceeded, null otherwise
   * @throws Error if operation type is invalid or duration is invalid
   */
  monitor(operationType: OperationType, duration: number): PerformanceAlertRecord | null {
    // Validate inputs
    this.validateOperationType(operationType);
    this.validateDuration(duration);

    // Update metrics
    this.operationMetrics[operationType].count += 1;
    this.operationMetrics[operationType].totalDuration += duration;

    const threshold = THRESHOLDS[operationType];

    // Check if threshold exceeded
    if (duration > threshold) {
      // Threshold exceeded - generate alert
      const alert: PerformanceAlertRecord = {
        operationType,
        duration,
        threshold,
        exceededBy: duration - threshold,
        timestamp: new Date(),
      };

      // Store alert
      this.alerts.push(alert);

      // Update violation tracking
      this.operationMetrics[operationType].violations += 1;
      this.consecutiveViolations[operationType] += 1;

      // Log warning
      console.warn('Performance threshold exceeded', alert);

      return alert;
    }

    // Operation within threshold - reset consecutive violation counter
    this.consecutiveViolations[operationType] = 0;
    return null;
  }

  /**
   * Get all stored alerts
   *
   * @returns Array of all performance alerts
   */
  getAlerts(): PerformanceAlertRecord[] {
    return [...this.alerts];
  }

  /**
   * Get alerts filtered by operation type
   *
   * @param operationType - Operation type to filter by
   * @returns Filtered array of alerts
   */
  getAlertsByType(operationType: OperationType): PerformanceAlertRecord[] {
    return this.alerts.filter((a) => a.operationType === operationType);
  }

  /**
   * Get alerts since a specific timestamp
   *
   * @param since - Timestamp to filter from
   * @returns Alerts after the specified timestamp
   */
  getAlertsSince(since: Date): PerformanceAlertRecord[] {
    return this.alerts.filter((a) => a.timestamp >= since);
  }

  /**
   * Get number of consecutive violations for an operation type
   *
   * @param operationType - Operation type
   * @returns Number of consecutive threshold violations
   */
  getConsecutiveViolations(operationType: OperationType): number {
    this.validateOperationType(operationType);
    return this.consecutiveViolations[operationType];
  }

  /**
   * Get performance statistics
   *
   * @returns Aggregated performance statistics
   */
  getStatistics(): PerformanceStatistics {
    const totalOperations = Object.values(this.operationMetrics).reduce(
      (sum, m) => sum + m.count,
      0
    );
    const totalViolations = Object.values(this.operationMetrics).reduce(
      (sum, m) => sum + m.violations,
      0
    );

    const byOperationType: Record<
      OperationType,
      {
        total: number;
        violations: number;
        violationRate: number;
        averageDuration: number;
      }
    > = {
      PRODUCT_LIST_FETCH: this.calculateOpStats('PRODUCT_LIST_FETCH'),
      PAYWALL_DISPLAY: this.calculateOpStats('PAYWALL_DISPLAY'),
      RESTORE_PURCHASES: this.calculateOpStats('RESTORE_PURCHASES'),
    };

    return {
      totalOperations,
      totalViolations,
      violationRate: totalOperations > 0 ? totalViolations / totalOperations : 0,
      byOperationType,
    };
  }

  /**
   * Export alerts as JSON string
   *
   * @returns JSON string representation of all alerts
   */
  exportAlertsAsJson(): string {
    const exportData = this.alerts.map((alert) => ({
      operationType: alert.operationType,
      duration: alert.duration,
      threshold: alert.threshold,
      exceededBy: alert.exceededBy,
      timestamp: alert.timestamp.toISOString(),
    }));

    return JSON.stringify(exportData);
  }

  /**
   * Clear all stored alerts and reset counters
   */
  clearAlerts(): void {
    this.alerts = [];
    this.consecutiveViolations = {
      PRODUCT_LIST_FETCH: 0,
      PAYWALL_DISPLAY: 0,
      RESTORE_PURCHASES: 0,
    };
    this.operationMetrics = {
      PRODUCT_LIST_FETCH: { count: 0, violations: 0, totalDuration: 0 },
      PAYWALL_DISPLAY: { count: 0, violations: 0, totalDuration: 0 },
      RESTORE_PURCHASES: { count: 0, violations: 0, totalDuration: 0 },
    };
  }

  /**
   * Validate operation type
   *
   * @throws Error if operation type is invalid
   */
  private validateOperationType(operationType: OperationType): void {
    if (operationType === undefined || operationType === null) {
      throw new Error('Operation type is required');
    }

    if (!Object.prototype.hasOwnProperty.call(THRESHOLDS, operationType)) {
      throw new Error(`Unknown operation type: ${operationType}`);
    }
  }

  /**
   * Validate duration
   *
   * @throws Error if duration is invalid
   */
  private validateDuration(duration: number): void {
    if (duration === undefined || duration === null) {
      throw new Error('Duration is required');
    }

    if (!Number.isFinite(duration)) {
      if (Number.isNaN(duration)) {
        throw new Error('Invalid duration: must be a valid number');
      }
      throw new Error('Invalid duration: must be finite');
    }

    if (duration < 0) {
      throw new Error('Invalid duration: must be non-negative');
    }
  }

  /**
   * Calculate statistics for a specific operation type
   *
   * @param operationType - Operation type
   * @returns Statistics for the operation type
   */
  private calculateOpStats(
    operationType: OperationType
  ): {
    total: number;
    violations: number;
    violationRate: number;
    averageDuration: number;
  } {
    const metrics = this.operationMetrics[operationType];
    const total = metrics.count;
    const violations = metrics.violations;
    const violationRate = total > 0 ? violations / total : 0;
    const averageDuration = total > 0 ? metrics.totalDuration / total : 0;

    return {
      total,
      violations,
      violationRate,
      averageDuration,
    };
  }
}

/**
 * Singleton instance of PerformanceAlertService
 * Use this instance throughout the application for consistent performance monitoring
 */
export const performanceAlert = new PerformanceAlertService();

// Export types for use in other modules
export type { PerformanceAlertRecord, PerformanceStatistics, OperationType };
