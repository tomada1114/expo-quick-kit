/**
 * Error Monitoring Service - Real-time error rate tracking and anomaly detection
 *
 * Provides:
 * - Real-time error counting (per code, per platform)
 * - Error rate calculation with sliding time windows
 * - Anomaly detection when error rate exceeds threshold
 * - Alert mechanism for high error rate conditions
 * - Statistical analysis and historical error querying
 *
 * Task 10.5: ErrorMonitoring with error rate tracking and alerting
 *
 * @module features/purchase/infrastructure/error-monitoring
 */

import type { ErrorLogEntry } from './error-logger';

/**
 * Alert data sent to callbacks when anomaly is detected
 */
export interface AlertData {
  /** Current error rate (errors per second) */
  errorRate: number;

  /** Configured threshold for anomaly detection */
  threshold: number;

  /** Time window in seconds used for rate calculation */
  timeWindow: number;

  /** Total number of errors in the time window */
  totalErrors: number;

  /** Breakdown of errors by error code */
  errorsByCode: Record<string, number>;

  /** Breakdown of errors by platform */
  errorsByPlatform: Record<string, number>;

  /** Timestamp when anomaly was detected */
  timestamp: Date;
}

/**
 * Configuration for ErrorMonitoring service
 */
export interface ErrorMonitoringConfig {
  /** Error rate threshold in errors per second */
  threshold: number;

  /** Time window in seconds for rate calculation (default: 60) */
  windowSeconds?: number;

  /** Optional alert callbacks to invoke on anomaly detection */
  alertCallbacks?: Array<(alert: AlertData) => void>;
}

/**
 * ErrorMonitoring Service
 *
 * Tracks error rates in real-time and detects anomalies when error rate exceeds
 * configured threshold. Provides comprehensive error statistics and filtering
 * capabilities for monitoring and debugging.
 *
 * Process:
 * 1. Log errors with timestamps
 * 2. Calculate error rate within sliding time window
 * 3. Compare against threshold
 * 4. Trigger alert callbacks if anomaly detected
 * 5. Provide statistics and historical data for analysis
 */
export class ErrorMonitoring {
  private errors: ErrorLogEntry[] = [];

  private threshold: number;

  private windowSeconds: number;

  private alertCallbacks: Array<(alert: AlertData) => void> = [];

  private lastAnomalyDetected = false;

  /**
   * Initialize ErrorMonitoring with configuration
   *
   * Given/When/Then:
   * - Given: Configuration with threshold and time window
   * - When: Service is initialized
   * - Then: Service ready to track errors
   *
   * @param config - ErrorMonitoring configuration
   * @throws Error if threshold is negative or window is invalid
   */
  constructor(config: ErrorMonitoringConfig) {
    if (config.threshold < 0) {
      throw new Error('Threshold must be non-negative');
    }

    const window = config.windowSeconds ?? 60;
    if (window <= 0) {
      throw new Error('Time window must be positive');
    }

    this.threshold = config.threshold;
    this.windowSeconds = window;

    if (config.alertCallbacks) {
      this.alertCallbacks = [...config.alertCallbacks];
    }
  }

  /**
   * Log an error and check for anomaly
   *
   * Given/When/Then:
   * - Given: Error log entry
   * - When: logError is called
   * - Then: Error is recorded and anomaly check performed
   *
   * @param error - Error log entry to track
   */
  logError(error: ErrorLogEntry): void {
    // Normalize timestamp
    const timestamp = error.timestamp
      ? error.timestamp instanceof Date
        ? error.timestamp
        : new Date(error.timestamp)
      : new Date();

    // Reject future timestamps (use current time instead)
    if (timestamp > new Date()) {
      this.errors.push({
        ...error,
        timestamp: new Date(),
        timestampISO: new Date().toISOString(),
      });
    } else {
      this.errors.push({ ...error, timestamp });
    }

    // Check for anomaly after logging
    this.checkForAnomaly();
  }

  /**
   * Check if error rate exceeds threshold and trigger alerts
   *
   * Private method called after each error is logged.
   */
  private checkForAnomaly(): void {
    const rate = this.getErrorRate(this.windowSeconds);
    const isAnomaly = rate > this.threshold;

    // Only trigger alert on transition from normal to anomaly
    if (isAnomaly && !this.lastAnomalyDetected) {
      this.lastAnomalyDetected = true;
      this.triggerAlerts();
    } else if (!isAnomaly && this.lastAnomalyDetected) {
      this.lastAnomalyDetected = false;
    }
  }

  /**
   * Trigger all registered alert callbacks
   *
   * Given/When/Then:
   * - Given: Alert callbacks registered
   * - When: Anomaly is detected
   * - Then: All callbacks are invoked with alert data
   */
  private triggerAlerts(): void {
    const alertData = this.getCurrentStatistics();

    for (const callback of this.alertCallbacks) {
      try {
        callback(alertData);
      } catch (error) {
        // Catch and log callback failures to prevent cascade
        console.error('[ErrorMonitoring] Alert callback failed:', error);
      }
    }
  }

  /**
   * Get current error rate for given time window
   *
   * Given/When/Then:
   * - Given: Time window in seconds
   * - When: getErrorRate is called
   * - Then: Returns errors per second in window
   *
   * @param windowSeconds - Time window in seconds (default: configured window)
   * @returns Error rate in errors per second
   * @throws Error if window is invalid
   */
  getErrorRate(windowSeconds: number = this.windowSeconds): number {
    if (windowSeconds <= 0) {
      throw new Error('Time window must be positive');
    }

    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const cutoffTime = now - windowMs;

    // Count errors in time window
    const errorsInWindow = this.errors.filter((e) => {
      const errorTime =
        e.timestamp instanceof Date
          ? e.timestamp.getTime()
          : new Date(e.timestamp).getTime();
      return errorTime > cutoffTime;
    });

    // Rate = errors / seconds
    return errorsInWindow.length / windowSeconds;
  }

  /**
   * Get comprehensive current statistics
   *
   * Given/When/Then:
   * - Given: Accumulated errors
   * - When: getCurrentStatistics is called
   * - Then: Returns complete statistics object
   *
   * @returns AlertData with current statistics
   */
  getCurrentStatistics(): AlertData {
    const now = Date.now();
    const windowMs = this.windowSeconds * 1000;
    const cutoffTime = now - windowMs;

    const errorsByCode: Record<string, number> = {};
    const errorsByPlatform: Record<string, number> = {};
    let totalErrors = 0;

    for (const error of this.errors) {
      const errorTime =
        error.timestamp instanceof Date
          ? error.timestamp.getTime()
          : new Date(error.timestamp).getTime();

      if (errorTime > cutoffTime) {
        totalErrors++;

        // Count by code
        errorsByCode[error.errorCode] =
          (errorsByCode[error.errorCode] ?? 0) + 1;

        // Count by platform (if available)
        if (error.platform) {
          errorsByPlatform[error.platform] =
            (errorsByPlatform[error.platform] ?? 0) + 1;
        }
      }
    }

    return {
      errorRate: this.getErrorRate(this.windowSeconds),
      threshold: this.threshold,
      timeWindow: this.windowSeconds,
      totalErrors,
      errorsByCode,
      errorsByPlatform,
      timestamp: new Date(),
    };
  }

  /**
   * Check if anomaly is currently detected
   *
   * @returns true if error rate exceeds threshold
   */
  isAnomalyDetected(): boolean {
    return this.getErrorRate(this.windowSeconds) > this.threshold;
  }

  /**
   * Get all errors logged since given time
   *
   * @param since - Start timestamp
   * @returns Array of error entries after the given time
   */
  getErrorsSince(since: Date): ErrorLogEntry[] {
    const sinceTime = since.getTime();
    return this.errors.filter((e) => {
      const errorTime =
        e.timestamp instanceof Date
          ? e.timestamp.getTime()
          : new Date(e.timestamp).getTime();
      return errorTime >= sinceTime;
    });
  }

  /**
   * Get errors filtered by error code
   *
   * @param code - Error code to filter by
   * @returns Array of matching error entries
   */
  getErrorsByCode(code: string): ErrorLogEntry[] {
    return this.errors.filter((e) => e.errorCode === code);
  }

  /**
   * Get errors filtered by platform
   *
   * @param platform - Platform to filter by
   * @returns Array of matching error entries
   */
  getErrorsByPlatform(
    platform: 'ios' | 'android' | 'revenueCat'
  ): ErrorLogEntry[] {
    return this.errors.filter((e) => e.platform === platform);
  }

  /**
   * Register alert callback
   *
   * @param callback - Function to invoke when anomaly detected
   */
  registerAlertCallback(callback: (alert: AlertData) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Unregister alert callback
   *
   * @param callback - Function to remove from callbacks
   */
  unregisterAlertCallback(callback: (alert: AlertData) => void): void {
    this.alertCallbacks = this.alertCallbacks.filter((cb) => cb !== callback);
  }

  /**
   * Update error rate threshold
   *
   * @param threshold - New threshold in errors per second
   * @throws Error if threshold is negative
   */
  updateThreshold(threshold: number): void {
    if (threshold < 0) {
      throw new Error('Threshold must be non-negative');
    }
    this.threshold = threshold;
  }

  /**
   * Reset all monitoring state
   *
   * Clears error history and resets anomaly detection state.
   */
  reset(): void {
    this.errors = [];
    this.lastAnomalyDetected = false;
  }

  /**
   * Export statistics as JSON
   *
   * @returns JSON string with current statistics
   */
  exportStatistics(): string {
    const stats = this.getCurrentStatistics();
    return JSON.stringify(stats, null, 2);
  }
}

/**
 * Global ErrorMonitoring instance with default configuration
 *
 * Usage:
 * ```typescript
 * import { errorMonitoring } from './error-monitoring';
 *
 * // Register alert callback
 * errorMonitoring.registerAlertCallback((alert) => {
 *   console.warn('Anomaly detected:', alert.errorRate, 'errors/second');
 *   // Send to analytics or support system
 * });
 *
 * // Log errors (called automatically by integration)
 * errorMonitoring.logError(errorLogEntry);
 * ```
 */
export const errorMonitoring = new ErrorMonitoring({
  threshold: 0.1, // 6 errors per minute
  windowSeconds: 60, // 1-minute sliding window
});
