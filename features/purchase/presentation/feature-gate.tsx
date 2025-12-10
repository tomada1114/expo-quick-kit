/**
 * FeatureGate Component
 *
 * Conditionally renders content or a paywall based on feature access control.
 * Uses FeatureGatingService.canAccessSync for synchronous feature access verification.
 *
 * Implements freemium model (dismissible paywall) and premium-only model (permanent paywall).
 * Supports custom fallback UI and callbacks for access denied/paywall close events.
 *
 * @module features/purchase/presentation/feature-gate
 *
 * @example
 * ```tsx
 * // Freemium model - user can dismiss paywall
 * <FeatureGate
 *   featureId="export_data"
 *   allowDismiss={true}
 *   onPaywallClose={() => router.back()}
 * >
 *   <ExportDataScreen />
 * </FeatureGate>
 *
 * // Premium-only model - paywall cannot be dismissed
 * <FeatureGate
 *   featureId="advanced_analytics"
 *   allowDismiss={false}
 * >
 *   <AdvancedAnalyticsScreen />
 * </FeatureGate>
 *
 * // With custom fallback UI
 * <FeatureGate
 *   featureId="export_data"
 *   fallback={<CustomUpgradePrompt />}
 * >
 *   <ExportDataScreen />
 * </FeatureGate>
 * ```
 */

import React, { ReactNode, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { PaywallComponent } from './paywall-component';
import { useFeatureGatingService } from './hooks/use-feature-gating-service';
import { useThemedColors } from '@/hooks/use-theme-color';

/**
 * Props for FeatureGate component
 */
export interface FeatureGateProps {
  /**
   * Feature ID to check access for
   * @type {string}
   */
  featureId: string;

  /**
   * Content to show when access is granted
   * @type {ReactNode}
   */
  children: ReactNode;

  /**
   * Whether the paywall can be dismissed (freemium model)
   * @type {boolean}
   * @default true
   */
  allowDismiss?: boolean;

  /**
   * Fallback UI to show instead of PaywallComponent when access is denied
   * If provided, PaywallComponent will not be rendered
   * @type {ReactNode}
   * @default undefined
   */
  fallback?: ReactNode;

  /**
   * Callback when paywall is dismissed
   * @type {() => void}
   * @default undefined
   */
  onPaywallClose?: () => void;

  /**
   * Callback when access is denied
   * Called with the feature ID that was denied
   * @type {(featureId: string) => void}
   * @default undefined
   */
  onAccessDenied?: (featureId: string) => void;
}

/**
 * FeatureGate Component
 *
 * Wraps content and conditionally renders paywall based on feature access control.
 * Uses synchronous access check for immediate UI rendering.
 *
 * **Access Decision**:
 * - If `featureId` is falsy (empty, null, undefined): Deny access
 * - If FeatureGatingService.canAccessSync() throws: Deny access (fail closed)
 * - If FeatureGatingService.canAccessSync() returns true: Grant access
 * - If FeatureGatingService.canAccessSync() returns false: Deny access
 *
 * **Rendering**:
 * - Access granted: Render children
 * - Access denied + fallback provided: Render fallback
 * - Access denied + no fallback: Render PaywallComponent (dismissible or permanent)
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  featureId,
  children,
  allowDismiss = true,
  fallback,
  onPaywallClose,
  onAccessDenied,
}) => {
  const featureGatingService = useFeatureGatingService();
  const { colors } = useThemedColors();

  /**
   * Determine if user has access to this feature
   * Uses memoization to avoid re-checking unless featureId changes
   */
  const hasAccess = useMemo(() => {
    // Fail closed: deny access if featureId is invalid
    if (!featureId || typeof featureId !== 'string') {
      return false;
    }

    try {
      // Call service to check access synchronously
      const result = featureGatingService.canAccessSync(featureId);

      // Handle undefined/null returns (fail closed)
      return result === true;
    } catch (error) {
      // Log error for debugging
      console.error('[FeatureGate] Error checking feature access:', error);

      // Fail closed on any exception
      return false;
    }
  }, [featureId, featureGatingService]);

  /**
   * Handle paywall dismissal
   * Calls onPaywallClose callback if provided
   */
  const handlePaywallClose = useCallback(() => {
    if (typeof onPaywallClose === 'function') {
      onPaywallClose();
    }
  }, [onPaywallClose]);

  /**
   * Trigger access denied callback on render if access denied
   * This happens once per access denied state
   */
  React.useEffect(() => {
    if (!hasAccess && typeof onAccessDenied === 'function') {
      onAccessDenied(featureId);
    }
  }, [hasAccess, featureId, onAccessDenied]);

  // Access granted: render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // Access denied: render fallback if provided
  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  // Access denied: render paywall
  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.base }]}
      testID="paywall-container"
      accessibilityLabel={`Upgrade required to access ${featureId}`}
    >
      <PaywallComponent
        featureId={featureId}
        onDismiss={handlePaywallClose}
        allowDismiss={allowDismiss}
      />

      {/* Dismiss button is rendered by PaywallComponent when allowDismiss=true */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
