/**
 * useAnalyticsEngine hook
 *
 * Hook wrapper for AnalyticsEngine singleton
 */

import { analyticsEngine } from '../../infrastructure/analytics-engine';

export function useAnalyticsEngine() {
  return analyticsEngine;
}
