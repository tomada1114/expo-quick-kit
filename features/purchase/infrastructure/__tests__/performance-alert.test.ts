/**
 * Performance Alert Tests
 *
 * Task 10.4: Performance monitoring and threshold-based alerting
 *
 * Tests performance monitoring functionality including:
 * - Threshold monitoring for product list, paywall display, and restore operations
 * - Alert generation when thresholds exceeded
 * - Consecutive violation tracking
 * - Performance statistics and reporting
 * - Boundary value validation
 * - Error handling for invalid inputs
 *
 * @module features/purchase/infrastructure/__tests__/performance-alert
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { performanceAlert } from '../performance-alert';

describe('PerformanceAlert - Task 10.4: Performance Monitoring and Threshold Alerts', () => {
  beforeEach(() => {
    performanceAlert.clearAlerts();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================================
  // HAPPY PATH: Operations Within Thresholds (No Alerts)
  // ============================================================================

  describe('monitor() - Happy Path: Operations within thresholds', () => {
    it('should not generate alert when product list fetch is under 2 seconds', () => {
      // Given: Product list fetch operation with 1500ms duration
      const operationType = 'PRODUCT_LIST_FETCH';
      const duration = 1500;

      // When: Monitoring the operation
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should return null (no alert)
      expect(alert).toBeNull();
    });

    it('should not generate alert when paywall display is under 500ms', () => {
      // Given: Paywall display operation with 350ms duration
      const operationType = 'PAYWALL_DISPLAY';
      const duration = 350;

      // When: Monitoring the operation
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should return null (no alert)
      expect(alert).toBeNull();
    });

    it('should not generate alert when restore completes under 15 seconds', () => {
      // Given: Restore operation with 12000ms duration
      const operationType = 'RESTORE_PURCHASES';
      const duration = 12000;

      // When: Monitoring the operation
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should return null (no alert)
      expect(alert).toBeNull();
    });

    it('should return empty alerts when all operations are within thresholds', () => {
      // Given: Multiple operations all within thresholds
      performanceAlert.monitor('PRODUCT_LIST_FETCH', 1000);
      performanceAlert.monitor('PAYWALL_DISPLAY', 200);
      performanceAlert.monitor('RESTORE_PURCHASES', 10000);

      // When: Getting all alerts
      const alerts = performanceAlert.getAlerts();

      // Then: Should be empty
      expect(alerts).toEqual([]);
    });

    it('should not increment consecutive violation count when operation succeeds', () => {
      // Given: Successful operation (within threshold)
      performanceAlert.monitor('PAYWALL_DISPLAY', 300);

      // When: Getting consecutive violation count
      const count =
        performanceAlert.getConsecutiveViolations('PAYWALL_DISPLAY');

      // Then: Should be 0
      expect(count).toBe(0);
    });
  });

  // ============================================================================
  // SAD PATH: Threshold Exceeded (Expected Violations)
  // ============================================================================

  describe('monitor() - Sad Path: Threshold violations', () => {
    it('should generate alert when product list fetch exceeds 2 seconds', () => {
      // Given: Product list fetch taking 2500ms
      const operationType = 'PRODUCT_LIST_FETCH';
      const duration = 2500;

      // When: Monitoring the operation
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should generate alert with correct details
      expect(alert).toBeDefined();
      expect(alert!.operationType).toBe('PRODUCT_LIST_FETCH');
      expect(alert!.duration).toBe(2500);
      expect(alert!.threshold).toBe(2000);
      expect(alert!.timestamp).toBeInstanceOf(Date);
      expect(alert!.exceededBy).toBe(500);
    });

    it('should generate alert when paywall display exceeds 500ms', () => {
      // Given: Paywall display taking 750ms
      const operationType = 'PAYWALL_DISPLAY';
      const duration = 750;

      // When: Monitoring the operation
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should generate alert
      expect(alert).toBeDefined();
      expect(alert!.operationType).toBe('PAYWALL_DISPLAY');
      expect(alert!.duration).toBe(750);
      expect(alert!.threshold).toBe(500);
      expect(alert!.exceededBy).toBe(250);
    });

    it('should generate alert when restore purchases exceeds 15 seconds', () => {
      // Given: Restore taking 18000ms
      const operationType = 'RESTORE_PURCHASES';
      const duration = 18000;

      // When: Monitoring the operation
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should generate alert
      expect(alert).toBeDefined();
      expect(alert!.operationType).toBe('RESTORE_PURCHASES');
      expect(alert!.duration).toBe(18000);
      expect(alert!.threshold).toBe(15000);
      expect(alert!.exceededBy).toBe(3000);
    });

    it('should store alert and make it retrievable', () => {
      // Given: Operation exceeds threshold
      performanceAlert.monitor('PAYWALL_DISPLAY', 800);

      // When: Getting alerts
      const alerts = performanceAlert.getAlerts();

      // Then: Should contain the alert
      expect(alerts.length).toBe(1);
      expect(alerts[0].operationType).toBe('PAYWALL_DISPLAY');
    });

    it('should track consecutive violations for same operation type', () => {
      // Given: Product list fetch fails threshold three times in a row
      performanceAlert.monitor('PRODUCT_LIST_FETCH', 2500);
      performanceAlert.monitor('PRODUCT_LIST_FETCH', 3000);
      performanceAlert.monitor('PRODUCT_LIST_FETCH', 2800);

      // When: Getting consecutive violation count
      const count =
        performanceAlert.getConsecutiveViolations('PRODUCT_LIST_FETCH');

      // Then: Should be 3
      expect(count).toBe(3);
    });

    it('should reset consecutive violation count after successful operation', () => {
      // Given: Two violations followed by success
      performanceAlert.monitor('PAYWALL_DISPLAY', 600);
      performanceAlert.monitor('PAYWALL_DISPLAY', 700);
      performanceAlert.monitor('PAYWALL_DISPLAY', 300); // Success

      // When: Getting consecutive count
      const count =
        performanceAlert.getConsecutiveViolations('PAYWALL_DISPLAY');

      // Then: Should be 0
      expect(count).toBe(0);
    });

    it('should log warning to console when threshold exceeded', () => {
      // Given: Console warn is spied
      const warnSpy = jest.spyOn(console, 'warn');

      // When: Operation exceeds threshold
      performanceAlert.monitor('PRODUCT_LIST_FETCH', 2500);

      // Then: Should log warning
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance threshold exceeded'),
        expect.objectContaining({
          operationType: 'PRODUCT_LIST_FETCH',
          duration: 2500,
          threshold: 2000,
        })
      );
    });

    it('should include timestamp in alert', () => {
      // Given: Operation exceeds threshold
      const beforeTime = Date.now();

      // When: Monitoring the operation
      const alert = performanceAlert.monitor('PAYWALL_DISPLAY', 800);

      const afterTime = Date.now();

      // Then: Should have timestamp within the right range
      expect(alert).toBeDefined();
      expect(alert!.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime);
      expect(alert!.timestamp.getTime()).toBeLessThanOrEqual(afterTime);
    });
  });

  // ============================================================================
  // BOUNDARY VALUES: Exact Thresholds and Adjacent Values
  // ============================================================================

  describe('monitor() - Boundary Values: Exact thresholds', () => {
    it('should NOT generate alert when product list duration equals threshold (2000ms)', () => {
      // Given: Product list fetch taking exactly 2000ms
      const operationType = 'PRODUCT_LIST_FETCH';
      const duration = 2000;

      // When: Monitoring the operation
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should NOT alert (threshold is inclusive)
      expect(alert).toBeNull();
    });

    it('should not generate alert at 1999ms (just under 2000ms threshold)', () => {
      // Given: Duration 1ms under threshold
      const operationType = 'PRODUCT_LIST_FETCH';
      const duration = 1999;

      // When: Monitoring the operation
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should not alert
      expect(alert).toBeNull();
    });

    it('should generate alert at 2001ms (just over 2000ms threshold)', () => {
      // Given: Duration 1ms over threshold
      const operationType = 'PRODUCT_LIST_FETCH';
      const duration = 2001;

      // When: Monitoring the operation
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should generate alert with 1ms exceeded
      expect(alert).toBeDefined();
      expect(alert!.exceededBy).toBe(1);
    });

    it('should not generate alert at exactly 500ms threshold (paywall)', () => {
      // Given: Paywall display at exact threshold
      const operationType = 'PAYWALL_DISPLAY';
      const duration = 500;

      // When: Monitoring the operation
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should not alert
      expect(alert).toBeNull();
    });

    it('should not generate alert at 499ms (paywall threshold)', () => {
      // Given: Duration 1ms under threshold
      const operationType = 'PAYWALL_DISPLAY';
      const duration = 499;

      // When: Monitoring
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should not alert
      expect(alert).toBeNull();
    });

    it('should generate alert at 501ms (paywall threshold)', () => {
      // Given: Duration 1ms over threshold
      const operationType = 'PAYWALL_DISPLAY';
      const duration = 501;

      // When: Monitoring
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should alert
      expect(alert).toBeDefined();
      expect(alert!.exceededBy).toBe(1);
    });

    it('should not generate alert at exactly 15000ms threshold (restore)', () => {
      // Given: Restore at exact threshold
      const operationType = 'RESTORE_PURCHASES';
      const duration = 15000;

      // When: Monitoring
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should not alert
      expect(alert).toBeNull();
    });

    it('should not generate alert at 14999ms (restore threshold)', () => {
      // Given: Duration 1ms under threshold
      const operationType = 'RESTORE_PURCHASES';
      const duration = 14999;

      // When: Monitoring
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should not alert
      expect(alert).toBeNull();
    });

    it('should generate alert at 15001ms (restore threshold)', () => {
      // Given: Duration 1ms over threshold
      const operationType = 'RESTORE_PURCHASES';
      const duration = 15001;

      // When: Monitoring
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should alert
      expect(alert).toBeDefined();
      expect(alert!.exceededBy).toBe(1);
    });
  });

  // ============================================================================
  // EDGE CASES: Invalid Inputs and Special Values
  // ============================================================================

  describe('monitor() - Edge Cases: Invalid inputs', () => {
    it('should handle zero duration gracefully (within threshold)', () => {
      // Given: Operation with 0ms duration
      const operationType = 'PAYWALL_DISPLAY';
      const duration = 0;

      // When: Monitoring
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should not alert (within threshold)
      expect(alert).toBeNull();
    });

    it('should throw error for negative duration', () => {
      // Given: Negative duration (invalid timing)
      const operationType = 'PRODUCT_LIST_FETCH';
      const duration = -1000;

      // When/Then: Should throw error
      expect(() => performanceAlert.monitor(operationType, duration)).toThrow(
        'Invalid duration: must be non-negative'
      );
    });

    it('should handle very large duration values', () => {
      // Given: Extremely long operation (60 seconds)
      const operationType = 'RESTORE_PURCHASES';
      const duration = 60000;

      // When: Monitoring
      const alert = performanceAlert.monitor(operationType, duration);

      // Then: Should generate alert with large exceededBy value
      expect(alert).toBeDefined();
      expect(alert!.exceededBy).toBe(45000);
    });

    it('should throw error for unknown operation type', () => {
      // Given: Invalid operation type
      const operationType = 'INVALID_OPERATION' as any;
      const duration = 1000;

      // When/Then: Should throw error
      expect(() => performanceAlert.monitor(operationType, duration)).toThrow(
        'Unknown operation type: INVALID_OPERATION'
      );
    });

    it('should throw error for undefined operation type', () => {
      // Given: Undefined operation type
      const operationType = undefined as any;
      const duration = 1000;

      // When/Then: Should throw error
      expect(() => performanceAlert.monitor(operationType, duration)).toThrow(
        'Operation type is required'
      );
    });

    it('should throw error for null duration', () => {
      // Given: Null duration
      const operationType = 'PAYWALL_DISPLAY';
      const duration = null as any;

      // When/Then: Should throw error
      expect(() => performanceAlert.monitor(operationType, duration)).toThrow(
        'Duration is required'
      );
    });

    it('should throw error for undefined duration', () => {
      // Given: Undefined duration
      const operationType = 'PAYWALL_DISPLAY';
      const duration = undefined as any;

      // When/Then: Should throw error
      expect(() => performanceAlert.monitor(operationType, duration)).toThrow(
        'Duration is required'
      );
    });

    it('should throw error for NaN duration', () => {
      // Given: NaN duration
      const operationType = 'PRODUCT_LIST_FETCH';
      const duration = NaN;

      // When/Then: Should throw error
      expect(() => performanceAlert.monitor(operationType, duration)).toThrow(
        'Invalid duration: must be a valid number'
      );
    });

    it('should throw error for Infinity duration', () => {
      // Given: Infinity duration
      const operationType = 'RESTORE_PURCHASES';
      const duration = Infinity;

      // When/Then: Should throw error
      expect(() => performanceAlert.monitor(operationType, duration)).toThrow(
        'Invalid duration: must be finite'
      );
    });
  });

  // ============================================================================
  // ALERT MANAGEMENT AND MEMORY
  // ============================================================================

  describe('Alert Management - Storage and Retrieval', () => {
    it('should clear all stored alerts', () => {
      // Given: Multiple alerts generated
      performanceAlert.monitor('PAYWALL_DISPLAY', 800);
      performanceAlert.monitor('PRODUCT_LIST_FETCH', 3000);
      expect(performanceAlert.getAlerts().length).toBe(2);

      // When: Clearing alerts
      performanceAlert.clearAlerts();

      // Then: Should have no alerts
      expect(performanceAlert.getAlerts()).toEqual([]);
    });

    it('should reset consecutive violation counters when clearing', () => {
      // Given: Consecutive violations tracked
      performanceAlert.monitor('PAYWALL_DISPLAY', 600);
      performanceAlert.monitor('PAYWALL_DISPLAY', 700);
      expect(performanceAlert.getConsecutiveViolations('PAYWALL_DISPLAY')).toBe(
        2
      );

      // When: Clearing alerts
      performanceAlert.clearAlerts();

      // Then: Consecutive count should reset
      expect(performanceAlert.getConsecutiveViolations('PAYWALL_DISPLAY')).toBe(
        0
      );
    });

    it('should filter alerts by operation type', () => {
      // Given: Multiple alerts for different operations
      performanceAlert.monitor('PAYWALL_DISPLAY', 600);
      performanceAlert.monitor('PRODUCT_LIST_FETCH', 2500);
      performanceAlert.monitor('PAYWALL_DISPLAY', 700);

      // When: Getting alerts for specific type
      const paywallAlerts = performanceAlert.getAlertsByType('PAYWALL_DISPLAY');

      // Then: Should only return matching alerts
      expect(paywallAlerts.length).toBe(2);
      expect(
        paywallAlerts.every((a) => a.operationType === 'PAYWALL_DISPLAY')
      ).toBe(true);
    });

    it('should retrieve alerts since timestamp', async () => {
      // Given: Alerts at different times
      performanceAlert.monitor('PAYWALL_DISPLAY', 600);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const cutoffTime = new Date();
      await new Promise((resolve) => setTimeout(resolve, 50));

      performanceAlert.monitor('PRODUCT_LIST_FETCH', 2500);

      // When: Getting alerts since cutoff
      const recentAlerts = performanceAlert.getAlertsSince(cutoffTime);

      // Then: Should only return later alerts
      expect(recentAlerts.length).toBe(1);
      expect(recentAlerts[0].operationType).toBe('PRODUCT_LIST_FETCH');
    });
  });

  // ============================================================================
  // CONCURRENT OPERATIONS AND RACE CONDITIONS
  // ============================================================================

  describe('Concurrent Operations - Thread Safety', () => {
    it('should handle concurrent monitor calls correctly', async () => {
      // Given: Multiple operations monitored simultaneously
      const promises = [
        Promise.resolve(performanceAlert.monitor('PAYWALL_DISPLAY', 600)),
        Promise.resolve(performanceAlert.monitor('PRODUCT_LIST_FETCH', 2500)),
        Promise.resolve(performanceAlert.monitor('RESTORE_PURCHASES', 16000)),
      ];

      // When: All complete
      await Promise.all(promises);

      // Then: Should have all three alerts
      expect(performanceAlert.getAlerts().length).toBe(3);
    });

    it('should track consecutive violations per operation type correctly with interleaved operations', () => {
      // Given: Interleaved operations of different types
      performanceAlert.monitor('PAYWALL_DISPLAY', 600); // Violation
      performanceAlert.monitor('PRODUCT_LIST_FETCH', 2500); // Violation
      performanceAlert.monitor('PAYWALL_DISPLAY', 700); // Violation
      performanceAlert.monitor('PRODUCT_LIST_FETCH', 1500); // Success
      performanceAlert.monitor('PAYWALL_DISPLAY', 800); // Violation

      // When: Getting consecutive counts
      const paywallCount =
        performanceAlert.getConsecutiveViolations('PAYWALL_DISPLAY');
      const productCount =
        performanceAlert.getConsecutiveViolations('PRODUCT_LIST_FETCH');

      // Then: Paywall should have 3, Product should have 0 (reset by success)
      expect(paywallCount).toBe(3);
      expect(productCount).toBe(0);
    });
  });

  // ============================================================================
  // STATISTICS AND MONITORING
  // ============================================================================

  describe('Performance Statistics and Reporting', () => {
    it('should provide performance statistics', () => {
      // Given: Multiple operations monitored
      performanceAlert.monitor('PAYWALL_DISPLAY', 300); // Success
      performanceAlert.monitor('PAYWALL_DISPLAY', 600); // Violation
      performanceAlert.monitor('PRODUCT_LIST_FETCH', 1500); // Success
      performanceAlert.monitor('PRODUCT_LIST_FETCH', 2500); // Violation
      performanceAlert.monitor('RESTORE_PURCHASES', 18000); // Violation

      // When: Getting statistics
      const stats = performanceAlert.getStatistics();

      // Then: Should have correct counts
      expect(stats.totalOperations).toBe(5);
      expect(stats.totalViolations).toBe(3);
      expect(stats.violationRate).toBe(0.6); // 3/5
      expect(stats.byOperationType['PAYWALL_DISPLAY'].violations).toBe(1);
      expect(stats.byOperationType['PAYWALL_DISPLAY'].total).toBe(2);
      expect(stats.byOperationType['PRODUCT_LIST_FETCH'].violations).toBe(1);
      expect(stats.byOperationType['PRODUCT_LIST_FETCH'].total).toBe(2);
      expect(stats.byOperationType['RESTORE_PURCHASES'].violations).toBe(1);
      expect(stats.byOperationType['RESTORE_PURCHASES'].total).toBe(1);
    });

    it('should export alerts as valid JSON', () => {
      // Given: Multiple alerts generated
      performanceAlert.monitor('PAYWALL_DISPLAY', 600);
      performanceAlert.monitor('PRODUCT_LIST_FETCH', 2500);

      // When: Exporting as JSON
      const json = performanceAlert.exportAlertsAsJson();

      // Then: Should be valid parseable JSON
      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
      expect(parsed[0]).toHaveProperty('operationType');
      expect(parsed[0]).toHaveProperty('duration');
      expect(parsed[0]).toHaveProperty('threshold');
      expect(parsed[0]).toHaveProperty('exceededBy');
    });

    it('should calculate average duration per operation type', () => {
      // Given: Multiple operations of same type with different durations
      performanceAlert.monitor('PAYWALL_DISPLAY', 300); // Success
      performanceAlert.monitor('PAYWALL_DISPLAY', 400); // Success
      performanceAlert.monitor('PAYWALL_DISPLAY', 600); // Violation

      // When: Getting statistics
      const stats = performanceAlert.getStatistics();

      // Then: Should calculate correct average
      expect(stats.byOperationType['PAYWALL_DISPLAY'].averageDuration).toBe(
        (300 + 400 + 600) / 3
      );
    });
  });
});
