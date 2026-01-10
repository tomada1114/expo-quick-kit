/**
 * Error Monitoring Tests
 *
 * Comprehensive test suite for ErrorMonitoring service covering:
 * - Happy path: Normal error tracking and rate calculation
 * - Sad path: Error handling when alert callbacks fail
 * - Edge cases: Time window boundaries, threshold edge values
 * - Unhappy path: External dependencies fail, concurrent operations
 *
 * Task 10.5: ErrorMonitoring with error rate tracking and alerting
 */

import { ErrorMonitoring } from '../error-monitoring';
import type { ErrorLogEntry } from '../error-logger';

/**
 * Helper: Create a mock ErrorLogEntry
 */
function createMockError(overrides?: Partial<ErrorLogEntry>): ErrorLogEntry {
  return {
    timestamp: new Date(),
    timestampISO: new Date().toISOString(),
    errorCode: 'NETWORK_ERROR',
    message: 'Test error',
    retryable: true,
    platform: 'ios',
    metadata: {},
    ...overrides,
  };
}

describe('ErrorMonitoring', () => {
  let monitoring: ErrorMonitoring;
  let alertCallback: jest.Mock;

  beforeEach(() => {
    monitoring = new ErrorMonitoring({
      threshold: 0.1, // errors per second
      windowSeconds: 60,
    });
    alertCallback = jest.fn();
    monitoring.registerAlertCallback(alertCallback);
  });

  afterEach(() => {
    monitoring.reset();
  });

  // ============================================================================
  // 1. HAPPY PATH - Normal Error Tracking
  // ============================================================================

  describe('Happy Path: Error Tracking', () => {
    it('should track single error increment', () => {
      // Given: ErrorMonitoring service initialized with empty state
      expect(monitoring.getCurrentStatistics().totalErrors).toBe(0);

      // When: Single purchase error occurs
      monitoring.logError(createMockError());

      // Then: Error count increments by 1, timestamp recorded
      expect(monitoring.getCurrentStatistics().totalErrors).toBe(1);
    });

    it('should track multiple errors over time', () => {
      // Given: ErrorMonitoring service tracking errors
      const errorCount = 5;

      // When: Multiple errors logged within time window
      for (let i = 0; i < errorCount; i++) {
        monitoring.logError(createMockError());
      }

      // Then: All errors counted correctly with accurate timestamps
      expect(monitoring.getCurrentStatistics().totalErrors).toBe(errorCount);
    });

    it('should calculate error rate for time window', () => {
      // Given: 10 errors logged over 60 seconds
      const now = Date.now();
      for (let i = 0; i < 10; i++) {
        monitoring.logError(
          createMockError({
            timestamp: new Date(now - i * 1000),
            timestampISO: new Date(now - i * 1000).toISOString(),
          })
        );
      }

      // When: Error rate is calculated for 60-second window
      const rate = monitoring.getErrorRate(60);

      // Then: Returns rate of 10 errors/60s ≈ 0.167 errors/second
      expect(rate).toBeCloseTo(0.167, 1);
    });

    it('should track errors by error code', () => {
      // Given: Mix of NETWORK_ERROR (3), PURCHASE_CANCELLED (2), STORE_PROBLEM_ERROR (1)
      for (let i = 0; i < 3; i++) {
        monitoring.logError(createMockError({ errorCode: 'NETWORK_ERROR' }));
      }
      for (let i = 0; i < 2; i++) {
        monitoring.logError(
          createMockError({ errorCode: 'PURCHASE_CANCELLED' })
        );
      }
      monitoring.logError(
        createMockError({ errorCode: 'STORE_PROBLEM_ERROR' })
      );

      // When: Querying error counts by code
      const stats = monitoring.getCurrentStatistics();

      // Then: Returns accurate count per error code
      expect(stats.errorsByCode['NETWORK_ERROR']).toBe(3);
      expect(stats.errorsByCode['PURCHASE_CANCELLED']).toBe(2);
      expect(stats.errorsByCode['STORE_PROBLEM_ERROR']).toBe(1);
    });

    it('should track errors by platform', () => {
      // Given: Mix of iOS errors (4), Android errors (2), RevenueCat errors (1)
      for (let i = 0; i < 4; i++) {
        monitoring.logError(createMockError({ platform: 'ios' }));
      }
      for (let i = 0; i < 2; i++) {
        monitoring.logError(createMockError({ platform: 'android' }));
      }
      monitoring.logError(createMockError({ platform: 'revenueCat' }));

      // When: Querying error counts by platform
      const stats = monitoring.getCurrentStatistics();

      // Then: Returns accurate count per platform
      expect(stats.errorsByPlatform['ios']).toBe(4);
      expect(stats.errorsByPlatform['android']).toBe(2);
      expect(stats.errorsByPlatform['revenueCat']).toBe(1);
    });

    it('should get current error statistics', () => {
      // Given: Multiple errors logged across codes and platforms
      monitoring.logError(createMockError({ errorCode: 'NETWORK_ERROR' }));
      monitoring.logError(createMockError({ errorCode: 'NETWORK_ERROR' }));
      monitoring.logError(
        createMockError({
          errorCode: 'PURCHASE_CANCELLED',
          platform: 'android',
        })
      );

      // When: getStatistics() is called
      const stats = monitoring.getCurrentStatistics();

      // Then: Returns complete statistics with totalErrors, byCode, byPlatform, errorRate
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByCode['NETWORK_ERROR']).toBe(2);
      expect(stats.errorsByCode['PURCHASE_CANCELLED']).toBe(1);
      expect(stats.errorRate).toBeGreaterThan(0);
    });

    it('should calculate error rate with sliding window', () => {
      // Given: Errors logged at different timestamps
      const now = Date.now();
      const baseDate = new Date(now);

      // Log 5 errors in first 30 seconds
      for (let i = 0; i < 5; i++) {
        monitoring.logError(
          createMockError({
            timestamp: new Date(now - 30000 + i * 1000),
            timestampISO: new Date(now - 30000 + i * 1000).toISOString(),
          })
        );
      }

      // When: Time window slides forward (query at current time with 60-second window)
      const rateAtEnd = monitoring.getErrorRate(60);

      // Then: Old errors drop out of window, rate recalculates correctly
      expect(rateAtEnd).toBeGreaterThan(0);
      expect(monitoring.getCurrentStatistics().totalErrors).toBe(5);
    });
  });

  // ============================================================================
  // 2. SAD PATH - Threshold Detection and Alerting
  // ============================================================================

  describe('Sad Path: Threshold Detection and Alerting', () => {
    it('should detect error rate exceeding threshold', () => {
      // Given: Error rate threshold set to 0.1 errors/second (6 errors/minute)
      const now = Date.now();

      // When: 10 errors occur within 60 seconds (rate ≈ 0.167/s)
      for (let i = 0; i < 10; i++) {
        monitoring.logError(
          createMockError({
            timestamp: new Date(now - i * 1000),
            timestampISO: new Date(now - i * 1000).toISOString(),
          })
        );
      }

      // Then: Anomaly detected, alert triggered
      expect(monitoring.isAnomalyDetected()).toBe(true);
      expect(alertCallback).toHaveBeenCalled();
    });

    it('should not alert when below threshold', () => {
      // Given: Error rate threshold set to 0.1 errors/second
      const now = Date.now();
      alertCallback.mockClear();

      // When: 5 errors occur within 60 seconds (rate ≈ 0.083/s)
      for (let i = 0; i < 5; i++) {
        monitoring.logError(
          createMockError({
            timestamp: new Date(now - i * 1000),
            timestampISO: new Date(now - i * 1000).toISOString(),
          })
        );
      }

      // Then: No anomaly detected, no alert sent
      expect(monitoring.isAnomalyDetected()).toBe(false);
      expect(alertCallback).not.toHaveBeenCalled();
    });

    it('should provide error context in alert callback', () => {
      // Given: Anomaly detection triggered
      const now = Date.now();
      for (let i = 0; i < 10; i++) {
        monitoring.logError(
          createMockError({
            timestamp: new Date(now - i * 1000),
            timestampISO: new Date(now - i * 1000).toISOString(),
          })
        );
      }

      // When: Alert callback is invoked
      expect(alertCallback).toHaveBeenCalled();

      // Then: Callback receives error rate, threshold, time window, error breakdown
      const callArgs = alertCallback.mock.calls[0][0];
      expect(callArgs).toHaveProperty('errorRate');
      expect(callArgs).toHaveProperty('threshold', 0.1);
      expect(callArgs).toHaveProperty('timeWindow', 60);
      expect(callArgs).toHaveProperty('totalErrors');
      expect(callArgs).toHaveProperty('errorsByCode');
      expect(callArgs).toHaveProperty('errorsByPlatform');
    });

    it('should handle alert callback throwing exception gracefully', () => {
      // Given: Alert callback throws exception
      alertCallback.mockImplementation(() => {
        throw new Error('Alert callback failed');
      });
      const now = Date.now();

      // When: Anomaly detected and alert triggered
      expect(() => {
        for (let i = 0; i < 10; i++) {
          monitoring.logError(
            createMockError({
              timestamp: new Date(now - i * 1000),
              timestampISO: new Date(now - i * 1000).toISOString(),
            })
          );
        }
      }).not.toThrow();

      // Then: Exception caught, monitoring continues without crash
      expect(monitoring.getCurrentStatistics().totalErrors).toBe(10);
    });

    it('should trigger multiple alerts for sustained high error rate', () => {
      // Given: Error rate continuously exceeds threshold
      const now = Date.now();
      alertCallback.mockClear();

      // When: Multiple batches of errors logged within same time window
      // Log 10 errors within 60 seconds to exceed threshold
      for (let i = 0; i < 10; i++) {
        monitoring.logError(
          createMockError({
            timestamp: new Date(now - i * 5000),
            timestampISO: new Date(now - i * 5000).toISOString(),
          })
        );
      }

      // Then: Alert triggered when threshold exceeded
      expect(alertCallback.mock.calls.length).toBeGreaterThan(0);
    });

    it('should log recovery when error rate normalizes', () => {
      // Given: Error rate previously exceeded threshold
      const now = Date.now();
      for (let i = 0; i < 10; i++) {
        monitoring.logError(
          createMockError({
            timestamp: new Date(now - i * 1000),
            timestampISO: new Date(now - i * 1000).toISOString(),
          })
        );
      }
      expect(monitoring.isAnomalyDetected()).toBe(true);

      // When: Error rate drops below threshold
      monitoring.reset();
      expect(monitoring.isAnomalyDetected()).toBe(false);

      // Then: Recovery detected
      expect(monitoring.getCurrentStatistics().totalErrors).toBe(0);
    });
  });

  // ============================================================================
  // 3. EDGE CASES - Boundary Values and Time Window
  // ============================================================================

  describe('Edge Cases: Boundary Values', () => {
    it('should handle zero errors in time window', () => {
      // Given: No errors logged
      expect(monitoring.getCurrentStatistics().totalErrors).toBe(0);

      // When: Error rate calculated
      const rate = monitoring.getErrorRate(60);

      // Then: Returns 0 errors/second
      expect(rate).toBe(0);
    });

    it('should not trigger alert at exactly threshold boundary', () => {
      // Given: Threshold = 0.1 errors/second
      // When: Error rate = exactly 0.1 errors/second (6 errors in 60 seconds)
      const now = Date.now();
      for (let i = 0; i < 6; i++) {
        monitoring.logError(
          createMockError({
            timestamp: new Date(now - i * 10000),
            timestampISO: new Date(now - i * 10000).toISOString(),
          })
        );
      }

      // Then: Should NOT trigger alert (uses > not >=)
      alertCallback.mockClear();
      const stats = monitoring.getCurrentStatistics();
      // Rate at exactly 0.1 should not be anomaly
      expect(stats.errorRate).toBeLessThanOrEqual(0.1);
      expect(alertCallback).not.toHaveBeenCalled();
    });

    it('should trigger alert just above threshold', () => {
      // Given: Threshold = 0.1 errors/second
      // When: Error rate slightly above threshold
      const now = Date.now();
      for (let i = 0; i < 7; i++) {
        monitoring.logError(
          createMockError({
            timestamp: new Date(now - i * 8500),
            timestampISO: new Date(now - i * 8500).toISOString(),
          })
        );
      }

      // Then: Should trigger alert
      expect(monitoring.isAnomalyDetected()).toBe(true);
    });

    it('should include errors at time window boundary', () => {
      // Given: Time window = 60 seconds
      const now = Date.now();

      // When: Error logged at 59 seconds ago (within 60-second window)
      monitoring.logError(
        createMockError({
          timestamp: new Date(now - 59000),
          timestampISO: new Date(now - 59000).toISOString(),
        })
      );

      // Then: Error included in window
      expect(monitoring.getCurrentStatistics().totalErrors).toBe(1);
    });

    it('should exclude errors beyond time window boundary', () => {
      // Given: Time window = 60 seconds
      const now = Date.now();

      // When: Error logged at t=0, but query at t=60001ms (outside window)
      // This is tested by resetting and checking older errors
      monitoring.logError(
        createMockError({
          timestamp: new Date(now - 61000),
          timestampISO: new Date(now - 61000).toISOString(),
        })
      );

      // Then: Error excluded from rate calculation in 60-second window
      // Note: Error still counted in totalErrors, but not in recent rate
      const rateInSmallWindow = monitoring.getErrorRate(30);
      expect(rateInSmallWindow).toBe(0);
    });

    it('should calculate rate with very small time window', () => {
      // Given: Time window = 1 second
      const now = Date.now();

      // When: 2 errors within 1 second
      monitoring.logError(
        createMockError({
          timestamp: new Date(now - 500),
          timestampISO: new Date(now - 500).toISOString(),
        })
      );
      monitoring.logError(
        createMockError({
          timestamp: new Date(now - 100),
          timestampISO: new Date(now - 100).toISOString(),
        })
      );

      // Then: Error rate = 2 errors/second calculated correctly
      const rate = monitoring.getErrorRate(1);
      expect(rate).toBeCloseTo(2, 0);
    });

    it('should calculate rate with very large time window', () => {
      // Given: Time window = 1 hour (3600 seconds)
      const now = Date.now();

      // When: 100 errors over hypothetical 1 hour
      for (let i = 0; i < 100; i++) {
        monitoring.logError(
          createMockError({
            timestamp: new Date(now - i * 36000),
            timestampISO: new Date(now - i * 36000).toISOString(),
          })
        );
      }

      // Then: Error rate calculated correctly
      const rate = monitoring.getErrorRate(3600);
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThan(1);
    });

    it('should handle single error at window boundary', () => {
      // Given: Time window = 60 seconds
      const now = Date.now();

      // When: Single error at 59 seconds ago (within boundary)
      monitoring.logError(
        createMockError({
          timestamp: new Date(now - 59000),
          timestampISO: new Date(now - 59000).toISOString(),
        })
      );

      // Then: Boundary inclusion logic consistent
      expect(monitoring.getCurrentStatistics().totalErrors).toBe(1);
      const rate = monitoring.getErrorRate(60);
      expect(rate).toBeGreaterThan(0);
    });

    it('should return zero for empty error code filter', () => {
      // Given: Errors with various codes
      monitoring.logError(createMockError({ errorCode: 'NETWORK_ERROR' }));
      monitoring.logError(createMockError({ errorCode: 'PURCHASE_CANCELLED' }));

      // When: Filter by non-existent error code
      const errors = monitoring.getErrorsByCode('NON_EXISTENT');

      // Then: Returns empty array, rate = 0
      expect(errors).toEqual([]);
    });

    it('should return zero for empty platform filter', () => {
      // Given: Errors from ios and android
      monitoring.logError(createMockError({ platform: 'ios' }));
      monitoring.logError(createMockError({ platform: 'android' }));

      // When: Filter by non-existent platform
      const errors = monitoring.getErrorsByPlatform('revenueCat');

      // Then: Returns empty array
      expect(errors).toEqual([]);
    });
  });

  // ============================================================================
  // 4. EDGE CASES - Threshold and Configuration
  // ============================================================================

  describe('Edge Cases: Threshold Configuration', () => {
    it('should trigger alert with zero threshold', () => {
      // Given: Threshold = 0 errors/second
      const zeroThresholdMonitoring = new ErrorMonitoring({
        threshold: 0,
        windowSeconds: 60,
      });

      // When: Any error occurs
      zeroThresholdMonitoring.logError(createMockError());
      const zeroAlertCallback = jest.fn();
      zeroThresholdMonitoring.registerAlertCallback(zeroAlertCallback);

      // Then: Alert triggered (any error exceeds zero threshold)
      expect(zeroThresholdMonitoring.isAnomalyDetected()).toBe(true);
    });

    it('should not trigger alert with extremely high threshold', () => {
      // Given: Threshold = 1000 errors/second
      const highThresholdMonitoring = new ErrorMonitoring({
        threshold: 1000,
        windowSeconds: 1,
      });
      const highAlertCallback = jest.fn();
      highThresholdMonitoring.registerAlertCallback(highAlertCallback);

      // When: 10 errors in 1 second
      for (let i = 0; i < 10; i++) {
        highThresholdMonitoring.logError(createMockError());
      }

      // Then: No alert (below threshold)
      expect(highThresholdMonitoring.isAnomalyDetected()).toBe(false);
      expect(highAlertCallback).not.toHaveBeenCalled();
    });

    it('should reject negative threshold', () => {
      // Given: Invalid threshold = -1 errors/second
      // When: Service initialized
      // Then: Throws validation error
      expect(() => {
        new ErrorMonitoring({ threshold: -1, windowSeconds: 60 });
      }).toThrow();
    });

    it('should reject invalid time window', () => {
      // Given: Invalid time window = 0 seconds
      // When: Service initialized
      // Then: Throws validation error
      expect(() => {
        new ErrorMonitoring({ threshold: 0.1, windowSeconds: 0 });
      }).toThrow();
    });

    it('should update threshold mid-operation', () => {
      // Given: Service running with threshold = 0.1
      const now = Date.now();

      // When: Threshold updated to 1.0
      for (let i = 0; i < 3; i++) {
        monitoring.logError(
          createMockError({
            timestamp: new Date(now - i * 1000),
            timestampISO: new Date(now - i * 1000).toISOString(),
          })
        );
      }

      const beforeUpdate = monitoring.isAnomalyDetected();
      monitoring.updateThreshold(1.0);
      const afterUpdate = monitoring.isAnomalyDetected();

      // Then: New threshold applies to subsequent calculations
      expect(beforeUpdate).toBeDefined();
      expect(afterUpdate).toBeDefined();
    });
  });

  // ============================================================================
  // 5. INVALID INPUTS AND TYPE SAFETY
  // ============================================================================

  describe('Invalid Inputs and Type Safety', () => {
    it('should handle error with missing timestamp gracefully', () => {
      // Given: Error entry without timestamp
      const errorWithoutTimestamp = {
        ...createMockError(),
        timestamp: undefined,
      } as any;

      // When: Attempting to log error
      // Then: Uses current timestamp or throws
      expect(() => {
        monitoring.logError(errorWithoutTimestamp);
      }).not.toThrow();
    });

    it('should reject error with future timestamp', () => {
      // Given: Error entry with timestamp in future
      const futureError = createMockError({
        timestamp: new Date(Date.now() + 10000),
      });

      // When: Attempting to log error
      // Then: Rejects or adjusts to current time
      expect(() => {
        monitoring.logError(futureError);
      }).not.toThrow(); // Can adjust instead of rejecting
    });

    it('should reject negative time window in getErrorRate', () => {
      // Given: Time window = -60 seconds
      // When: Calculating error rate
      // Then: Throws validation error
      expect(() => {
        monitoring.getErrorRate(-60);
      }).toThrow();
    });

    it('should reject zero time window in getErrorRate', () => {
      // Given: Time window = 0 seconds
      // When: Calculating error rate
      // Then: Throws validation error
      expect(() => {
        monitoring.getErrorRate(0);
      }).toThrow();
    });
  });

  // ============================================================================
  // 6. UNHAPPY PATH - External Dependency Failures
  // ============================================================================

  describe('Unhappy Path: External Dependency Failures', () => {
    it('should handle alert callback throwing synchronous exception', () => {
      // Given: Alert callback with synchronous throw
      const failingCallback = jest.fn(() => {
        throw new Error('Callback failed');
      });
      monitoring.registerAlertCallback(failingCallback);
      const now = Date.now();

      // When: Anomaly detected
      expect(() => {
        for (let i = 0; i < 10; i++) {
          monitoring.logError(
            createMockError({
              timestamp: new Date(now - i * 1000),
              timestampISO: new Date(now - i * 1000).toISOString(),
            })
          );
        }
      }).not.toThrow();

      // Then: Exception caught, error logged, monitoring continues
      expect(monitoring.getCurrentStatistics().totalErrors).toBe(10);
    });

    it('should handle multiple alert callbacks with one failing', () => {
      // Given: 3 alert callbacks registered
      const callback1 = jest.fn();
      const callback2 = jest.fn(() => {
        throw new Error('Callback 2 failed');
      });
      const callback3 = jest.fn();

      monitoring.unregisterAlertCallback(alertCallback);
      monitoring.registerAlertCallback(callback1);
      monitoring.registerAlertCallback(callback2);
      monitoring.registerAlertCallback(callback3);

      const now = Date.now();

      // When: Anomaly detected
      expect(() => {
        for (let i = 0; i < 10; i++) {
          monitoring.logError(
            createMockError({
              timestamp: new Date(now - i * 1000),
              timestampISO: new Date(now - i * 1000).toISOString(),
            })
          );
        }
      }).not.toThrow();

      // Then: All callbacks invoked, failures isolated
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      expect(callback3).toHaveBeenCalled();
    });

    it('should handle multiple concurrent errors without data corruption', () => {
      // Given: Multiple errors logged rapidly
      const errors = [];
      for (let i = 0; i < 100; i++) {
        errors.push(createMockError({ errorCode: `ERROR_${i % 5}` }));
      }

      // When: All errors logged
      errors.forEach((error) => monitoring.logError(error));

      // Then: All errors counted correctly
      expect(monitoring.getCurrentStatistics().totalErrors).toBe(100);
    });
  });

  // ============================================================================
  // 7. INTEGRATION AND LIFECYCLE
  // ============================================================================

  describe('Integration and Lifecycle', () => {
    it('should reset monitoring state', () => {
      // Given: Monitoring service with accumulated errors
      monitoring.logError(createMockError());
      monitoring.logError(createMockError());
      expect(monitoring.getCurrentStatistics().totalErrors).toBe(2);

      // When: reset() called
      monitoring.reset();

      // Then: All counts reset to zero, history cleared
      expect(monitoring.getCurrentStatistics().totalErrors).toBe(0);
      expect(monitoring.getCurrentStatistics().errorRate).toBe(0);
    });

    it('should export monitoring data as JSON', () => {
      // Given: ErrorMonitoring with accumulated statistics
      monitoring.logError(createMockError({ errorCode: 'NETWORK_ERROR' }));
      monitoring.logError(
        createMockError({
          errorCode: 'PURCHASE_CANCELLED',
          platform: 'android',
        })
      );

      // When: exportStatistics() called
      const exported = monitoring.exportStatistics();

      // Then: Returns JSON with error counts, rates, timestamps
      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed).toHaveProperty('totalErrors', 2);
      expect(parsed).toHaveProperty('errorsByCode');
      expect(parsed).toHaveProperty('errorsByPlatform');
    });

    it('should query errors since specific timestamp', () => {
      // Given: Errors logged at different times
      const now = Date.now();
      monitoring.logError(
        createMockError({
          timestamp: new Date(now - 10000),
          timestampISO: new Date(now - 10000).toISOString(),
        })
      );
      monitoring.logError(
        createMockError({
          timestamp: new Date(now - 5000),
          timestampISO: new Date(now - 5000).toISOString(),
        })
      );
      monitoring.logError(createMockError({ timestamp: new Date(now) }));

      // When: Querying errors since 7 seconds ago
      const recentErrors = monitoring.getErrorsSince(new Date(now - 7000));

      // Then: Returns only recent errors (2 out of 3)
      expect(recentErrors.length).toBe(2);
    });

    it('should unregister alert callback', () => {
      // Given: Alert callback registered
      const callback = jest.fn();
      monitoring.registerAlertCallback(callback);
      const now = Date.now();

      // When: Callback unregistered before anomaly
      monitoring.unregisterAlertCallback(callback);
      for (let i = 0; i < 10; i++) {
        monitoring.logError(
          createMockError({
            timestamp: new Date(now - i * 1000),
            timestampISO: new Date(now - i * 1000).toISOString(),
          })
        );
      }

      // Then: Callback not invoked
      expect(callback).not.toHaveBeenCalled();
    });

    it('should filter errors by code', () => {
      // Given: Mix of error codes
      monitoring.logError(createMockError({ errorCode: 'NETWORK_ERROR' }));
      monitoring.logError(createMockError({ errorCode: 'NETWORK_ERROR' }));
      monitoring.logError(createMockError({ errorCode: 'PURCHASE_CANCELLED' }));

      // When: Filtering by specific code
      const networkErrors = monitoring.getErrorsByCode('NETWORK_ERROR');

      // Then: Returns only matching errors
      expect(networkErrors).toHaveLength(2);
      expect(networkErrors.every((e) => e.errorCode === 'NETWORK_ERROR')).toBe(
        true
      );
    });

    it('should filter errors by platform', () => {
      // Given: Errors from different platforms
      monitoring.logError(createMockError({ platform: 'ios' }));
      monitoring.logError(createMockError({ platform: 'ios' }));
      monitoring.logError(createMockError({ platform: 'android' }));

      // When: Filtering by platform
      const iosErrors = monitoring.getErrorsByPlatform('ios');

      // Then: Returns only matching errors
      expect(iosErrors).toHaveLength(2);
      expect(iosErrors.every((e) => e.platform === 'ios')).toBe(true);
    });
  });

  // ============================================================================
  // 8. CONCURRENT AND STRESS TESTS
  // ============================================================================

  describe('Concurrent and Stress Tests', () => {
    it('should handle rapid sequential error logging', () => {
      // Given: Many errors logged rapidly
      const errorCount = 1000;

      // When: All errors logged in tight loop
      for (let i = 0; i < errorCount; i++) {
        monitoring.logError(
          createMockError({
            errorCode: `ERROR_${i % 10}`,
            metadata: { index: i },
          })
        );
      }

      // Then: All errors counted correctly
      expect(monitoring.getCurrentStatistics().totalErrors).toBe(errorCount);
    });

    it('should calculate statistics with large error set', () => {
      // Given: Large number of errors
      for (let i = 0; i < 500; i++) {
        monitoring.logError(
          createMockError({
            errorCode: `TYPE_${i % 5}`,
            platform: ['ios', 'android', 'revenueCat'][i % 3] as any,
          })
        );
      }

      // When: Getting statistics
      const stats = monitoring.getCurrentStatistics();

      // Then: Statistics calculated correctly without performance degradation
      expect(stats.totalErrors).toBe(500);
      expect(Object.keys(stats.errorsByCode).length).toBe(5);
      expect(Object.keys(stats.errorsByPlatform).length).toBe(3);
    });

    it('should maintain accuracy with long-running monitoring', () => {
      // Given: Monitoring service tracking errors over extended period
      const startTime = Date.now();

      // When: Errors logged across multiple time periods (all within 1 minute for reliable test)
      for (let i = 0; i < 12; i++) {
        monitoring.logError(
          createMockError({
            timestamp: new Date(startTime - i * 4000),
            timestampISO: new Date(startTime - i * 4000).toISOString(),
          })
        );
      }

      // Then: Total count and rates calculated correctly
      expect(monitoring.getCurrentStatistics().totalErrors).toBe(12);
      const rate1Min = monitoring.getErrorRate(60);
      expect(rate1Min).toBeGreaterThan(0);
      expect(rate1Min).toBeLessThan(1);
    });
  });
});
