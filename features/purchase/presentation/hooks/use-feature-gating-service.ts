/**
 * useFeatureGatingService hook
 *
 * Hook wrapper for FeatureGatingService singleton
 */

import { featureGatingService } from '../../application/feature-gating-service';

export function useFeatureGatingService() {
  return featureGatingService;
}
