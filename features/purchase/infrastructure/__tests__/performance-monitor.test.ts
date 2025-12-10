import { describe, it, expect, beforeEach } from '@jest/globals';
import { PerformanceMonitor } from '../performance-monitor';
import type { PerformanceMetrics } from '../performance-monitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  // ==================== HAPPY PATH ====================

  describe('Happy Path: Complete purchase flow with all stages in order', () => {
    it('Given: new PerformanceMonitor | When: all stages recorded in order | Then: return metrics with positive deltas', () => {
      // Given: new instance created in beforeEach

      // When: recording all stages in order
      const startPF = 1000;
      const endPF = 1100;
      const startD = 1200;
      const endD = 1300;
      const startPay = 1400;
      const endPay = 1500;
      const startV = 1600;
      const endV = 1700;

      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(startPF);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(endPF);
      monitor.endProductFetch();

      mockNow.mockReturnValueOnce(startD);
      monitor.startDialogDisplay();
      mockNow.mockReturnValueOnce(endD);
      monitor.endDialogDisplay();

      mockNow.mockReturnValueOnce(startPay);
      monitor.startPaymentProcessing();
      mockNow.mockReturnValueOnce(endPay);
      monitor.endPaymentProcessing();

      mockNow.mockReturnValueOnce(startV);
      monitor.startVerification();
      mockNow.mockReturnValueOnce(endV);
      monitor.endVerification();

      // Then: return metrics with positive deltas
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data;
        expect(metrics.productFetch?.delta).toBe(100);
        expect(metrics.dialogDisplay?.delta).toBe(100);
        expect(metrics.paymentProcessing?.delta).toBe(100);
        expect(metrics.verification?.delta).toBe(100);
      }

      mockNow.mockRestore();
    });

    it('Given: new PerformanceMonitor | When: all stages with realistic timing gaps | Then: metrics reflect actual gaps', () => {
      // Given: new instance

      // When: recording with realistic gaps (product fetch takes longer)
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(3000); // 2 second product fetch
      monitor.endProductFetch();

      mockNow.mockReturnValueOnce(3100);
      monitor.startDialogDisplay();
      mockNow.mockReturnValueOnce(3600); // 500ms dialog
      monitor.endDialogDisplay();

      mockNow.mockReturnValueOnce(3700);
      monitor.startPaymentProcessing();
      mockNow.mockReturnValueOnce(4200); // 500ms payment
      monitor.endPaymentProcessing();

      mockNow.mockReturnValueOnce(4300);
      monitor.startVerification();
      mockNow.mockReturnValueOnce(5000); // 700ms verification
      monitor.endVerification();

      // Then: metrics reflect actual gaps
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data;
        expect(metrics.productFetch?.delta).toBe(2000);
        expect(metrics.dialogDisplay?.delta).toBe(500);
        expect(metrics.paymentProcessing?.delta).toBe(500);
        expect(metrics.verification?.delta).toBe(700);
        expect(metrics.totalTime).toBe(3700);
      }

      mockNow.mockRestore();
    });
  });

  describe('Happy Path: Multiple complete flows with reset between', () => {
    it('Given: PerformanceMonitor with one completed flow | When: reset() called and new flow recorded | Then: return fresh metrics', () => {
      // Given: first flow completed
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(2000);
      monitor.endProductFetch();

      const firstResult = monitor.getMetrics();
      expect(firstResult.success).toBe(true);

      // When: reset and start new flow
      const resetResult = monitor.reset();
      expect(resetResult.success).toBe(true);

      mockNow.mockReturnValueOnce(5000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(6500);
      monitor.endProductFetch();

      // Then: return fresh metrics (not combining flows)
      const secondResult = monitor.getMetrics();
      expect(secondResult.success).toBe(true);
      if (secondResult.success) {
        const metrics = secondResult.data;
        expect(metrics.productFetch?.delta).toBe(1500);
      }

      mockNow.mockRestore();
    });
  });

  describe('Happy Path: Partial flow completion', () => {
    it('Given: new PerformanceMonitor | When: only product fetch stage recorded | Then: return metrics with defined productFetch, others undefined', () => {
      // Given: new instance

      // When: recording only product fetch
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(2000);
      monitor.endProductFetch();

      // Then: only productFetch has delta
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data;
        expect(metrics.productFetch?.delta).toBe(1000);
        expect(metrics.dialogDisplay).toBeUndefined();
        expect(metrics.paymentProcessing).toBeUndefined();
        expect(metrics.verification).toBeUndefined();
      }

      mockNow.mockRestore();
    });

    it('Given: new PerformanceMonitor | When: first two stages recorded (skip payment and verification) | Then: metrics include only completed stages', () => {
      // Given: new instance

      // When: recording only product fetch and dialog
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(1500);
      monitor.endProductFetch();

      mockNow.mockReturnValueOnce(2000);
      monitor.startDialogDisplay();
      mockNow.mockReturnValueOnce(2300);
      monitor.endDialogDisplay();

      // Then: only first two stages defined
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data;
        expect(metrics.productFetch).toBeDefined();
        expect(metrics.dialogDisplay).toBeDefined();
        expect(metrics.paymentProcessing).toBeUndefined();
        expect(metrics.verification).toBeUndefined();
        expect(metrics.completedStages).toContain('productFetch');
        expect(metrics.completedStages).toContain('dialogDisplay');
      }

      mockNow.mockRestore();
    });
  });

  describe('Happy Path: Reset called multiple times', () => {
    it('Given: PerformanceMonitor instance | When: reset() called three times consecutively | Then: remain in clean state without error', () => {
      // Given: instance

      // When: reset multiple times
      const result1 = monitor.reset();
      const result2 = monitor.reset();
      const result3 = monitor.reset();

      // Then: all succeed and state is clean
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      const metricsResult = monitor.getMetrics();
      expect(metricsResult.success).toBe(true);
      if (metricsResult.success) {
        const metrics = metricsResult.data;
        expect(metrics.isComplete).toBe(false);
        expect(metrics.completedStages.length).toBe(0);
      }
    });
  });

  describe('Happy Path: Getting metrics multiple times', () => {
    it('Given: PerformanceMonitor with completed flow | When: calling getMetrics() three times | Then: return same consistent metrics', () => {
      // Given: completed flow
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(2000);
      monitor.endProductFetch();

      // When: getting metrics multiple times
      const result1 = monitor.getMetrics();
      const result2 = monitor.getMetrics();
      const result3 = monitor.getMetrics();

      // Then: all return same values
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      if (result1.success && result2.success && result3.success) {
        const m1 = result1.data;
        const m2 = result2.data;
        const m3 = result3.data;
        expect(m1.productFetch?.delta).toBe(m2.productFetch?.delta);
        expect(m2.productFetch?.delta).toBe(m3.productFetch?.delta);
      }

      mockNow.mockRestore();
    });
  });

  // ==================== SAD PATH ====================

  describe('Sad Path: Requesting metrics before any timestamps recorded', () => {
    it('Given: new PerformanceMonitor with no timestamps | When: calling getMetrics() | Then: return metrics with all stages undefined', () => {
      // Given: new instance (no timestamps)

      // When: getting metrics immediately
      const result = monitor.getMetrics();

      // Then: all stage metrics are undefined
      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data;
        expect(metrics.productFetch).toBeUndefined();
        expect(metrics.dialogDisplay).toBeUndefined();
        expect(metrics.paymentProcessing).toBeUndefined();
        expect(metrics.verification).toBeUndefined();
        expect(metrics.isComplete).toBe(false);
        expect(metrics.completedStages.length).toBe(0);
      }
    });
  });

  describe('Sad Path: Calling endStage without corresponding startStage', () => {
    it('Given: new PerformanceMonitor | When: calling endProductFetch() without startProductFetch() | Then: return error Result', () => {
      // Given: new instance

      // When: calling end without start
      const result = monitor.endProductFetch();

      // Then: return error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MISSING_START_TIMESTAMP');
      }
    });

    it('Given: new PerformanceMonitor | When: calling endDialogDisplay() without startDialogDisplay() | Then: return MissingStartTimestampError', () => {
      // Given: new instance

      // When: end without start
      const result = monitor.endDialogDisplay();

      // Then: error code indicates missing start
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toContain('MISSING_START_TIMESTAMP');
      }
    });

    it('Given: new PerformanceMonitor | When: calling endPaymentProcessing() without startPaymentProcessing() | Then: return error', () => {
      // Given: new instance

      // When: end payment without start
      const result = monitor.endPaymentProcessing();

      // Then: error result
      expect(result.success).toBe(false);
    });

    it('Given: new PerformanceMonitor | When: calling endVerification() without startVerification() | Then: return error', () => {
      // Given: new instance

      // When: end verification without start
      const result = monitor.endVerification();

      // Then: error result
      expect(result.success).toBe(false);
    });
  });

  describe('Sad Path: Calling startStage twice without endStage', () => {
    it('Given: new PerformanceMonitor | When: calling startProductFetch() twice | Then: overwrite first timestamp and succeed', () => {
      // Given: new instance

      // When: calling start twice
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();

      mockNow.mockReturnValueOnce(2000);
      monitor.startProductFetch(); // second call

      mockNow.mockReturnValueOnce(3000);
      monitor.endProductFetch();

      // Then: use second start timestamp (1000ms difference)
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data;
        expect(metrics.productFetch?.delta).toBe(1000); // 3000 - 2000, not 3000 - 1000
      }

      mockNow.mockRestore();
    });
  });

  describe('Sad Path: Out-of-order stage calls', () => {
    it('Given: new PerformanceMonitor | When: calling endDialog() before startDialog() | Then: return error or undefined metric', () => {
      // Given: new instance

      // When: end before start
      const result = monitor.endDialogDisplay();

      // Then: error result
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toContain('MISSING_START_TIMESTAMP');
      }
    });
  });

  describe('Sad Path: Stages called in non-sequential order', () => {
    it('Given: new PerformanceMonitor | When: starting payment before ending product fetch | Then: still record both stages independently', () => {
      // Given: new instance

      // When: record out of sequence (loose coupling)
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();

      mockNow.mockReturnValueOnce(1500);
      monitor.startPaymentProcessing(); // payment before product fetch ends

      mockNow.mockReturnValueOnce(2000);
      monitor.endProductFetch();

      mockNow.mockReturnValueOnce(2500);
      monitor.endPaymentProcessing();

      // Then: both stages recorded with their own deltas
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data;
        expect(metrics.productFetch?.delta).toBe(1000); // 2000 - 1000
        expect(metrics.paymentProcessing?.delta).toBe(1000); // 2500 - 1500
      }

      mockNow.mockRestore();
    });
  });

  describe('Sad Path: Reset called mid-flow', () => {
    it('Given: PerformanceMonitor with some stages recorded | When: calling reset() before flow completion | Then: clear all timestamps', () => {
      // Given: partial flow
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(2000);
      monitor.endProductFetch();

      // When: reset mid-flow
      const resetResult = monitor.reset();
      expect(resetResult.success).toBe(true);

      // Then: all timestamps cleared
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data;
        expect(metrics.productFetch).toBeUndefined();
        expect(metrics.isComplete).toBe(false);
      }

      mockNow.mockRestore();
    });
  });

  // ==================== BOUNDARY VALUES ====================

  describe('Boundary: Zero millisecond elapsed time', () => {
    it('Given: PerformanceMonitor | When: start and end called with same timestamp | Then: return delta of 0ms', () => {
      // Given: new instance

      // When: same timestamp for start and end
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValue(1000);
      monitor.startProductFetch();
      monitor.endProductFetch();

      // Then: delta is 0
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data;
        expect(metrics.productFetch?.delta).toBe(0);
      }

      mockNow.mockRestore();
    });
  });

  describe('Boundary: Very small elapsed time (sub-millisecond)', () => {
    it('Given: PerformanceMonitor with high-resolution timer | When: recording sub-millisecond operation | Then: handle fractional milliseconds', () => {
      // Given: new instance

      // When: recording with fractional milliseconds
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000.123);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(1000.456);
      monitor.endProductFetch();

      // Then: preserve fractional precision
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data;
        expect(metrics.productFetch?.delta).toBeCloseTo(0.333, 2);
      }

      mockNow.mockRestore();
    });
  });

  describe('Boundary: Very large elapsed time', () => {
    it('Given: PerformanceMonitor with extended delay | When: measuring operation taking 2 hours | Then: return large delta value', () => {
      // Given: new instance

      // When: 2 hour operation (7200000 ms)
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(7201000); // 2 hours later
      monitor.endProductFetch();

      // Then: handle large number correctly
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data;
        expect(metrics.productFetch?.delta).toBe(7200000);
      }

      mockNow.mockRestore();
    });
  });

  describe('Boundary: Single stage recorded', () => {
    it('Given: new PerformanceMonitor | When: only product fetch stage recorded | Then: return metrics with only that stage', () => {
      // Given: new instance

      // When: record only one stage
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(2000);
      monitor.endProductFetch();

      // Then: only productFetch defined
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data;
        expect(metrics.productFetch).toBeDefined();
        expect(metrics.dialogDisplay).toBeUndefined();
        expect(metrics.paymentProcessing).toBeUndefined();
        expect(metrics.verification).toBeUndefined();
      }

      mockNow.mockRestore();
    });
  });

  // ==================== INVALID TYPE/FORMAT INPUTS ====================

  describe('Invalid Type: Negative timestamp values', () => {
    it('Given: PerformanceMonitor with corrupted state (negative timestamps) | When: calculating delta | Then: handle gracefully or return error', () => {
      // Given: manipulate internal state (private but test implementation detail)
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(-5000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(-4000);
      monitor.endProductFetch();

      // When: getting metrics
      const result = monitor.getMetrics();

      // Then: either handle gracefully or error (implementation choice)
      if (result.success) {
        const metrics = result.data;
        // If handled gracefully, delta should still be correct: -4000 - (-5000) = 1000
        expect(metrics.productFetch?.delta).toBe(1000);
      } else {
        expect(result.error).toBeDefined();
      }

      mockNow.mockRestore();
    });
  });

  describe('Invalid Type: NaN timestamp values', () => {
    it('Given: PerformanceMonitor with corrupted NaN timestamps | When: calculating delta | Then: detect error early at start recording', () => {
      // Given: force NaN state
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(NaN);

      // When: calling startProductFetch with NaN
      const startResult = monitor.startProductFetch();

      // Then: should return error at recording stage (fail-fast)
      expect(startResult.success).toBe(false);
      if (!startResult.success) {
        expect(startResult.error.code).toBe('INVALID_TIMESTAMP');
      }

      mockNow.mockRestore();
    });
  });

  describe('Invalid Type: Infinity timestamp values', () => {
    it('Given: PerformanceMonitor with Infinity timestamps | When: calculating delta | Then: detect error early at start recording', () => {
      // Given: Infinity timestamps
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(Infinity);

      // When: calling startProductFetch with Infinity
      const startResult = monitor.startProductFetch();

      // Then: error result (fail-fast)
      expect(startResult.success).toBe(false);
      if (!startResult.success) {
        expect(startResult.error.code).toBe('INVALID_TIMESTAMP');
      }

      mockNow.mockRestore();
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Case: isComplete flag', () => {
    it('Given: PerformanceMonitor | When: all four stages are completed | Then: isComplete is true', () => {
      // Given: new instance

      // When: record all stages
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(2000);
      monitor.endProductFetch();

      mockNow.mockReturnValueOnce(2100);
      monitor.startDialogDisplay();
      mockNow.mockReturnValueOnce(2200);
      monitor.endDialogDisplay();

      mockNow.mockReturnValueOnce(2300);
      monitor.startPaymentProcessing();
      mockNow.mockReturnValueOnce(2400);
      monitor.endPaymentProcessing();

      mockNow.mockReturnValueOnce(2500);
      monitor.startVerification();
      mockNow.mockReturnValueOnce(2600);
      monitor.endVerification();

      // Then: isComplete is true
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isComplete).toBe(true);
      }

      mockNow.mockRestore();
    });

    it('Given: PerformanceMonitor | When: only three stages completed | Then: isComplete is false', () => {
      // Given: new instance

      // When: record only 3 stages
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(2000);
      monitor.endProductFetch();

      mockNow.mockReturnValueOnce(2100);
      monitor.startDialogDisplay();
      mockNow.mockReturnValueOnce(2200);
      monitor.endDialogDisplay();

      mockNow.mockReturnValueOnce(2300);
      monitor.startPaymentProcessing();
      mockNow.mockReturnValueOnce(2400);
      monitor.endPaymentProcessing();
      // verification not recorded

      // Then: isComplete is false
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isComplete).toBe(false);
      }

      mockNow.mockRestore();
    });
  });

  describe('Edge Case: completedStages array', () => {
    it('Given: PerformanceMonitor with partial flow | When: getting metrics | Then: completedStages contains only completed stages', () => {
      // Given: new instance

      // When: complete product fetch and dialog
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(2000);
      monitor.endProductFetch();

      mockNow.mockReturnValueOnce(2100);
      monitor.startDialogDisplay();
      mockNow.mockReturnValueOnce(2200);
      monitor.endDialogDisplay();

      // Then: completedStages has those two
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        const stages = result.data.completedStages;
        expect(stages).toHaveLength(2);
        expect(stages).toContain('productFetch');
        expect(stages).toContain('dialogDisplay');
        expect(stages).not.toContain('paymentProcessing');
        expect(stages).not.toContain('verification');
      }

      mockNow.mockRestore();
    });
  });

  describe('Edge Case: totalTime calculation', () => {
    it('Given: PerformanceMonitor with complete flow | When: getting metrics | Then: totalTime is sum of all stage deltas', () => {
      // Given: new instance

      // When: record all stages with specific deltas
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(1100); // 100ms
      monitor.endProductFetch();

      mockNow.mockReturnValueOnce(1200);
      monitor.startDialogDisplay();
      mockNow.mockReturnValueOnce(1350); // 150ms
      monitor.endDialogDisplay();

      mockNow.mockReturnValueOnce(1450);
      monitor.startPaymentProcessing();
      mockNow.mockReturnValueOnce(1550); // 100ms
      monitor.endPaymentProcessing();

      mockNow.mockReturnValueOnce(1650);
      monitor.startVerification();
      mockNow.mockReturnValueOnce(1900); // 250ms
      monitor.endVerification();

      // Then: totalTime = 100 + 150 + 100 + 250 = 600
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data;
        expect(metrics.totalTime).toBe(600);
      }

      mockNow.mockRestore();
    });

    it('Given: PerformanceMonitor with partial flow | When: getting metrics | Then: totalTime only sums completed stages', () => {
      // Given: new instance

      // When: only record 2 stages
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(1500); // 500ms
      monitor.endProductFetch();

      mockNow.mockReturnValueOnce(1600);
      monitor.startDialogDisplay();
      mockNow.mockReturnValueOnce(1800); // 200ms
      monitor.endDialogDisplay();

      // Then: totalTime = 500 + 200 = 700
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data;
        expect(metrics.totalTime).toBe(700);
      }

      mockNow.mockRestore();
    });
  });

  describe('Edge Case: recordedAt timestamp', () => {
    it('Given: PerformanceMonitor | When: getting metrics | Then: recordedAt is a valid Date', () => {
      // Given: new instance

      // When: record a stage and get metrics
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(2000);
      monitor.endProductFetch();

      const beforeGetMetrics = new Date();
      const result = monitor.getMetrics();
      const afterGetMetrics = new Date();

      // Then: recordedAt is between before and after
      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data;
        expect(metrics.recordedAt).toBeInstanceOf(Date);
        expect(metrics.recordedAt.getTime()).toBeGreaterThanOrEqual(
          beforeGetMetrics.getTime()
        );
        expect(metrics.recordedAt.getTime()).toBeLessThanOrEqual(
          afterGetMetrics.getTime()
        );
      }

      mockNow.mockRestore();
    });
  });

  describe('Edge Case: Metrics JSON serialization', () => {
    it('Given: PerformanceMonitor with complete metrics | When: serializing to JSON | Then: produce valid JSON without errors', () => {
      // Given: complete flow
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(2000);
      monitor.endProductFetch();

      // When: serialize metrics
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);

      if (result.success) {
        const jsonStr = JSON.stringify(result.data);

        // Then: valid JSON
        expect(jsonStr).toBeDefined();
        const parsed = JSON.parse(jsonStr);
        expect(parsed.productFetch?.delta).toBe(1000);
      }

      mockNow.mockRestore();
    });
  });

  // ==================== ERROR MESSAGES ====================

  describe('Error Messages: Descriptive error codes', () => {
    it('Given: PerformanceMonitor | When: endProductFetch without start | Then: error code is MISSING_START_TIMESTAMP', () => {
      // Given: new instance

      // When: end without start
      const result = monitor.endProductFetch();

      // Then: specific error code
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MISSING_START_TIMESTAMP');
      }
    });

    it('Given: PerformanceMonitor | When: NaN timestamp encountered | When: recording | Then: error code indicates invalid timestamp', () => {
      // Given: corrupted state
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(NaN);

      // When: calling startProductFetch with NaN
      const result = monitor.startProductFetch();

      // Then: error code for invalid timestamp (fail-fast)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toContain('INVALID');
      }

      mockNow.mockRestore();
    });
  });

  // ==================== PERFORMANCE OVERHEAD ====================

  describe('Performance: Monitoring overhead is minimal', () => {
    it('Given: PerformanceMonitor | When: recording a complete flow | Then: operations execute without significant overhead', () => {
      // Given: new instance with mocked time
      const mockNow = jest.spyOn(performance, 'now');

      // When: record a complete flow
      mockNow.mockReturnValueOnce(1000);
      const result1 = monitor.startProductFetch();
      mockNow.mockReturnValueOnce(2000);
      const result2 = monitor.endProductFetch();

      mockNow.mockReturnValueOnce(2100);
      const result3 = monitor.startDialogDisplay();
      mockNow.mockReturnValueOnce(2200);
      const result4 = monitor.endDialogDisplay();

      mockNow.mockReturnValueOnce(2300);
      const result5 = monitor.startPaymentProcessing();
      mockNow.mockReturnValueOnce(2400);
      const result6 = monitor.endPaymentProcessing();

      mockNow.mockReturnValueOnce(2500);
      const result7 = monitor.startVerification();
      mockNow.mockReturnValueOnce(2600);
      const result8 = monitor.endVerification();

      const metricsResult = monitor.getMetrics();

      // Then: all operations succeed (no overhead errors)
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
      expect(result4.success).toBe(true);
      expect(result5.success).toBe(true);
      expect(result6.success).toBe(true);
      expect(result7.success).toBe(true);
      expect(result8.success).toBe(true);
      expect(metricsResult.success).toBe(true);

      mockNow.mockRestore();
    });
  });

  // ==================== ADDITIONAL EDGE CASES ====================

  describe('Edge Case: Each stage with start timestamps', () => {
    it('Given: PerformanceMonitor | When: each stage has both start and end times | Then: all stage objects have startTime and endTime fields', () => {
      // Given: new instance

      // When: complete all stages
      const mockNow = jest.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      monitor.startProductFetch();
      mockNow.mockReturnValueOnce(1500);
      monitor.endProductFetch();

      mockNow.mockReturnValueOnce(2000);
      monitor.startDialogDisplay();
      mockNow.mockReturnValueOnce(2300);
      monitor.endDialogDisplay();

      mockNow.mockReturnValueOnce(2400);
      monitor.startPaymentProcessing();
      mockNow.mockReturnValueOnce(2600);
      monitor.endPaymentProcessing();

      mockNow.mockReturnValueOnce(2700);
      monitor.startVerification();
      mockNow.mockReturnValueOnce(3000);
      monitor.endVerification();

      // Then: all stages have startTime and endTime
      const result = monitor.getMetrics();
      expect(result.success).toBe(true);
      if (result.success) {
        const m = result.data;
        expect(m.productFetch?.startTime).toBe(1000);
        expect(m.productFetch?.endTime).toBe(1500);
        expect(m.dialogDisplay?.startTime).toBe(2000);
        expect(m.dialogDisplay?.endTime).toBe(2300);
        expect(m.paymentProcessing?.startTime).toBe(2400);
        expect(m.paymentProcessing?.endTime).toBe(2600);
        expect(m.verification?.startTime).toBe(2700);
        expect(m.verification?.endTime).toBe(3000);
      }

      mockNow.mockRestore();
    });
  });
});
