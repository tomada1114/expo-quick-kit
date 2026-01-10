/**
 * Purchase Feature - Presentation Layer
 *
 * Exports UI components for the purchase system:
 * - FeatureGate: Wrapper component for feature access control
 * - PaywallComponent: Main paywall UI for purchasing products
 * - PaywallCTAButton: CTA button for purchasing products
 * - RestoreButton: Restore Purchases button for one-time purchases
 */

export { FeatureGate } from './feature-gate';
export type { FeatureGateProps } from './feature-gate';
export { PaywallComponent } from './paywall';
export type { PaywallComponentProps } from './paywall';
export { PaywallCTAButton } from './paywall-cta-button';
export type { PaywallCTAButtonProps } from './paywall-cta-button';
export { RestoreButton } from './restore-button';
export type { RestoreButtonProps } from './restore-button';
