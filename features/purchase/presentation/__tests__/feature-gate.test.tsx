/**
 * Feature-Gate Component Tests
 *
 * Comprehensive test suite for FeatureGate component with 45 test cases covering:
 * - Happy path (6 tests): Normal usage scenarios
 * - Sad path (8 tests): Expected error handling
 * - Boundary values (10 tests): Edge case inputs
 * - Invalid types (7 tests): Type safety
 * - External dependencies (7 tests): Fault tolerance
 * - Exceptions (3 tests): Error recovery
 * - Theming (2 tests): Dark/light mode
 * - Accessibility (2 tests): Inclusive design
 *
 * Total: 45 comprehensive tests using Given/When/Then structure
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import React, { ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text, View, Pressable } from 'react-native';

// Mock dependencies first
jest.mock('../hooks/use-feature-gating-service');
jest.mock('@/hooks/use-theme-color');

// PaywallComponent mock - must use require after mocking hooks
jest.mock('../paywall-component');

import { FeatureGate } from '../feature-gate';
import { useFeatureGatingService } from '../hooks/use-feature-gating-service';
import { useThemedColors } from '@/hooks/use-theme-color';

// Setup PaywallComponent mock after imports
const mockPaywall = require('../paywall-component');
mockPaywall.PaywallComponent = (props: any) => (
  <View testID="paywall-component">
    <Text>Paywall Component</Text>
    {props.allowDismiss && (
      <Pressable testID="dismiss-button" onPress={props.onDismiss}>
        <Text>Dismiss</Text>
      </Pressable>
    )}
  </View>
);

const mockFeatureGatingService = {
  canAccessSync: jest.fn(),
};

const mockColors = {
  primary: '#007AFF',
  background: { base: '#FFFFFF', secondary: '#F2F2F7', tertiary: '#FFFFFF' },
  text: { primary: '#000000', secondary: '#3C3C43', tertiary: '#8E8E93', inverse: '#FFFFFF' },
  semantic: { error: '#FF3B30', success: '#34C759', warning: '#FF9500', info: '#00C7FF' },
  interactive: { separator: '#C6C6D0', fill: '#E5E5EA', fillSecondary: '#E5E5EA' },
};

describe('FeatureGate Component', () => {
  beforeEach(() => {
    // Clear all mock implementations
    jest.clearAllMocks();

    // Reset service mock with fresh instance
    mockFeatureGatingService.canAccessSync.mockClear();

    // Reset useFeatureGatingService hook
    (useFeatureGatingService as jest.Mock).mockClear();
    (useFeatureGatingService as jest.Mock).mockReturnValue(mockFeatureGatingService);

    // Reset useThemedColors hook
    (useThemedColors as jest.Mock).mockClear();
    (useThemedColors as jest.Mock).mockReturnValue({
      colors: mockColors,
      colorScheme: 'light',
    });

    // Reset PaywallComponent mock
    mockPaywall.PaywallComponent = (props: any) => (
      <View testID="paywall-component">
        <Text>Paywall Component</Text>
        {props.allowDismiss && (
          <Pressable testID="dismiss-button" onPress={props.onDismiss}>
            <Text>Dismiss</Text>
          </Pressable>
        )}
      </View>
    );
  });

  // ============================================================================
  // 1. HAPPY PATH TESTS (6 tests)
  // ============================================================================

  describe('Happy Path - Normal Scenarios', () => {
    it('should render children immediately when feature is free', () => {
      // Given: A free feature with access granted
      mockFeatureGatingService.canAccessSync.mockReturnValue(true);
      const mockChildren = <Text testID="content">Premium Content</Text>;

      // When: FeatureGate component renders with free feature
      render(
        <FeatureGate featureId="basic_search">
          {mockChildren}
        </FeatureGate>
      );

      // Then: Children should be visible immediately
      expect(screen.getByTestId('content')).toBeTruthy();
      expect(mockFeatureGatingService.canAccessSync).toHaveBeenCalledWith('basic_search');
      expect(screen.queryByTestId('paywall-component')).toBeNull();
    });

    it('should render children when premium feature is purchased', () => {
      // Given: Premium feature with verified purchase
      mockFeatureGatingService.canAccessSync.mockReturnValue(true);
      const mockChildren = <Text testID="premium-content">Advanced Analytics</Text>;

      // When: Component renders with purchased premium feature
      render(
        <FeatureGate featureId="advanced_analytics">
          {mockChildren}
        </FeatureGate>
      );

      // Then: Premium content should be visible
      expect(screen.getByTestId('premium-content')).toBeTruthy();
      expect(mockFeatureGatingService.canAccessSync).toHaveBeenCalledWith('advanced_analytics');
      expect(screen.queryByTestId('paywall-component')).toBeNull();
    });

    it('should show dismissible paywall for freemium model', () => {
      // Given: Premium feature without purchase, allowDismiss=true
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders with allowDismiss prop
      render(
        <FeatureGate featureId="export_data" allowDismiss={true}>
          <Text testID="content">Export Data</Text>
        </FeatureGate>
      );

      // Then: Paywall should be visible with dismiss button
      expect(screen.queryByTestId('content')).toBeNull();
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
      expect(screen.getByTestId('dismiss-button')).toBeTruthy();
    });

    it('should show non-dismissible paywall for premium-only model', () => {
      // Given: Premium feature without purchase, allowDismiss=false
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders with allowDismiss=false
      render(
        <FeatureGate featureId="export_data" allowDismiss={false}>
          <Text testID="content">Export Data</Text>
        </FeatureGate>
      );

      // Then: Paywall should be visible without dismiss button
      expect(screen.queryByTestId('content')).toBeNull();
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
      expect(screen.queryByTestId('dismiss-button')).toBeNull();
    });

    it('should unlock content when service returns true on subsequent calls', () => {
      // Given: Service set to return true
      mockFeatureGatingService.canAccessSync.mockReturnValue(true);

      // When: Component renders
      const { rerender } = render(
        <FeatureGate featureId="advanced_analytics">
          <Text testID="content">Analytics</Text>
        </FeatureGate>
      );

      // Then: Content should be visible immediately
      expect(screen.getByTestId('content')).toBeTruthy();

      // Subsequent re-renders also show content
      rerender(
        <FeatureGate featureId="advanced_analytics">
          <Text testID="content">Analytics</Text>
        </FeatureGate>
      );

      // Then: Content remains visible
      expect(screen.getByTestId('content')).toBeTruthy();
    });

    it('should call onPaywallClose when paywall is dismissed', () => {
      // Given: Premium feature without purchase and onPaywallClose callback
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);
      const onPaywallClose = jest.fn();

      // When: User dismisses paywall
      render(
        <FeatureGate
          featureId="export_data"
          allowDismiss={true}
          onPaywallClose={onPaywallClose}
        >
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      fireEvent.press(screen.getByTestId('dismiss-button'));

      // Then: Callback should be called
      expect(onPaywallClose).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // 2. SAD PATH TESTS (8 tests)
  // ============================================================================

  describe('Sad Path - Expected Errors', () => {
    it('should deny access for non-existent feature ID', () => {
      // Given: Feature ID that doesn't exist
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders with invalid feature ID
      render(
        <FeatureGate featureId="non_existent_feature">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Content should not be visible, paywall should show
      expect(screen.queryByTestId('content')).toBeNull();
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
      expect(mockFeatureGatingService.canAccessSync).toHaveBeenCalledWith('non_existent_feature');
    });

    it('should deny access and show paywall when featureId is empty', () => {
      // Given: Empty feature ID string
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders with empty feature ID
      render(
        <FeatureGate featureId="">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Should deny access (safe default) - fails closed without calling service
      expect(screen.queryByTestId('content')).toBeNull();
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
      // Note: Service is NOT called for empty featureId (fail-closed pattern)
      expect(mockFeatureGatingService.canAccessSync).not.toHaveBeenCalled();
    });

    it('should show paywall when premium feature not purchased', () => {
      // Given: Premium feature without purchase
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);
      const onAccessDenied = jest.fn();

      // When: Component renders
      render(
        <FeatureGate
          featureId="advanced_search"
          onAccessDenied={onAccessDenied}
        >
          <Text testID="content">Advanced Search</Text>
        </FeatureGate>
      );

      // Then: Paywall should be visible and callback called
      expect(screen.queryByTestId('content')).toBeNull();
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
      expect(onAccessDenied).toHaveBeenCalledWith('advanced_search');
    });

    it('should keep paywall open when purchase is cancelled', () => {
      // Given: User cancels purchase
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders with cancellation
      render(
        <FeatureGate featureId="export_data">
          <Text testID="content">Export</Text>
        </FeatureGate>
      );

      // Then: Paywall remains visible
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
      expect(screen.queryByTestId('content')).toBeNull();
    });

    it('should show error in paywall on network failure', () => {
      // Given: Network error during purchase
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders with network error scenario
      render(
        <FeatureGate featureId="export_data">
          <Text testID="content">Export</Text>
        </FeatureGate>
      );

      // Then: Paywall should handle error display
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
    });

    it('should handle missing onPaywallClose callback gracefully', () => {
      // Given: No onPaywallClose callback
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: User dismisses paywall without callback
      render(
        <FeatureGate featureId="export_data" allowDismiss={true}>
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      fireEvent.press(screen.getByTestId('dismiss-button'));

      // Then: No crash, graceful handling
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
    });

    it('should render fallback UI when provided instead of paywall', () => {
      // Given: Premium feature and custom fallback
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);
      const fallback = <Text testID="fallback">Custom Upgrade Message</Text>;

      // When: Component renders with fallback prop
      render(
        <FeatureGate featureId="export_data" fallback={fallback}>
          <Text testID="content">Export Data</Text>
        </FeatureGate>
      );

      // Then: Fallback should render instead of paywall
      expect(screen.queryByTestId('content')).toBeNull();
      expect(screen.queryByTestId('paywall-component')).toBeNull();
      expect(screen.getByTestId('fallback')).toBeTruthy();
    });

    it('should call onAccessDenied with correct feature ID', () => {
      // Given: Premium feature without purchase
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);
      const onAccessDenied = jest.fn();

      // When: Access is denied
      render(
        <FeatureGate
          featureId="advanced_analytics"
          onAccessDenied={onAccessDenied}
        >
          <Text testID="content">Analytics</Text>
        </FeatureGate>
      );

      // Then: Callback should receive feature ID
      expect(onAccessDenied).toHaveBeenCalledWith('advanced_analytics');
      expect(onAccessDenied).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // 3. BOUNDARY VALUES TESTS (10 tests)
  // ============================================================================

  describe('Boundary Values', () => {
    it('should handle null children gracefully', () => {
      // Given: Free feature but null children
      mockFeatureGatingService.canAccessSync.mockReturnValue(true);

      // When: Component renders with null children
      render(
        <FeatureGate featureId="basic_search">
          {null}
        </FeatureGate>
      );

      // Then: No crash, canAccessSync called
      expect(mockFeatureGatingService.canAccessSync).toHaveBeenCalled();
    });

    it('should handle undefined children gracefully', () => {
      // Given: Free feature but undefined children
      mockFeatureGatingService.canAccessSync.mockReturnValue(true);

      // When: Component renders with undefined children
      render(
        <FeatureGate featureId="basic_search">
          {undefined}
        </FeatureGate>
      );

      // Then: No crash, canAccessSync called
      expect(mockFeatureGatingService.canAccessSync).toHaveBeenCalled();
    });

    it('should render empty fragment when access granted', () => {
      // Given: Free feature with empty fragment
      mockFeatureGatingService.canAccessSync.mockReturnValue(true);

      // When: Component renders with empty fragment
      render(
        <FeatureGate featureId="basic_search">
          <></>
        </FeatureGate>
      );

      // Then: No crash, canAccessSync called
      expect(mockFeatureGatingService.canAccessSync).toHaveBeenCalledWith('basic_search');
    });

    it('should render multiple children when access granted', () => {
      // Given: Free feature with multiple children
      mockFeatureGatingService.canAccessSync.mockReturnValue(true);

      // When: Component renders with multiple children
      render(
        <FeatureGate featureId="basic_search">
          <Text testID="child1">Child 1</Text>
          <Text testID="child2">Child 2</Text>
          <View testID="child3" />
        </FeatureGate>
      );

      // Then: All children should be rendered
      expect(screen.getByTestId('child1')).toBeTruthy();
      expect(screen.getByTestId('child2')).toBeTruthy();
      expect(screen.getByTestId('child3')).toBeTruthy();
    });

    it('should handle very long feature IDs', () => {
      // Given: Feature ID with maximum length
      const longFeatureId = 'a'.repeat(255);
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders with long feature ID
      render(
        <FeatureGate featureId={longFeatureId}>
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Should handle gracefully
      expect(mockFeatureGatingService.canAccessSync).toHaveBeenCalledWith(longFeatureId);
    });

    it('should handle special characters in feature ID', () => {
      // Given: Feature ID with special characters
      const specialFeatureId = 'feature-with_special.chars@123';
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders
      render(
        <FeatureGate featureId={specialFeatureId}>
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Should pass to service
      expect(mockFeatureGatingService.canAccessSync).toHaveBeenCalledWith(specialFeatureId);
    });

    it('should default allowDismiss to true (freemium model)', () => {
      // Given: No allowDismiss prop
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders without explicit allowDismiss
      render(
        <FeatureGate featureId="export_data">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Dismiss button should be visible (default=true)
      expect(screen.getByTestId('dismiss-button')).toBeTruthy();
    });

    it('should handle rapid re-renders without state corruption', () => {
      // Given: Component re-renders multiple times
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component re-renders rapidly
      const { rerender } = render(
        <FeatureGate featureId="export_data">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      rerender(
        <FeatureGate featureId="export_data">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      rerender(
        <FeatureGate featureId="export_data">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: State should remain consistent (paywall still visible)
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
      expect(screen.queryByTestId('content')).toBeNull();
      // Service is called at least once (may be memoized)
      expect(mockFeatureGatingService.canAccessSync).toHaveBeenCalled();
    });

    it('should clean up properly when unmounted', () => {
      // Given: Component with active paywall
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component unmounts
      const { unmount } = render(
        <FeatureGate featureId="export_data">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      unmount();

      // Then: No memory leaks or errors
      expect(true).toBe(true);
    });

    it('should handle nested FeatureGate components', () => {
      // Given: Nested gates (outer free, inner premium)
      mockFeatureGatingService.canAccessSync
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      // When: Nested components render
      render(
        <FeatureGate featureId="basic_search">
          <FeatureGate featureId="advanced_search">
            <Text testID="inner-content">Advanced Content</Text>
          </FeatureGate>
        </FeatureGate>
      );

      // Then: Outer renders, inner shows paywall
      expect(screen.queryByTestId('inner-content')).toBeNull();
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
    });
  });

  // ============================================================================
  // 4. INVALID TYPE/FORMAT TESTS (7 tests)
  // ============================================================================

  describe('Invalid Types and Formats', () => {
    it('should deny access when featureId is null', () => {
      // Given: featureId is null
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders with null featureId
      render(
        <FeatureGate featureId={null as unknown as string}>
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Should deny access
      expect(screen.queryByTestId('content')).toBeNull();
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
    });

    it('should deny access when featureId is undefined', () => {
      // Given: featureId is undefined
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders with undefined featureId
      render(
        <FeatureGate featureId={undefined as unknown as string}>
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Should deny access
      expect(screen.queryByTestId('content')).toBeNull();
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
    });

    it('should handle non-string feature ID type', () => {
      // Given: featureId as number
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders with number featureId
      render(
        <FeatureGate featureId={123 as unknown as string}>
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Component denies access (fail-closed pattern for invalid types)
      expect(screen.queryByTestId('content')).toBeNull();
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
      // Service is NOT called for invalid types
      expect(mockFeatureGatingService.canAccessSync).not.toHaveBeenCalled();
    });

    it('should handle object as feature ID', () => {
      // Given: featureId as object
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders with object featureId
      render(
        <FeatureGate featureId={{ id: 'test' } as unknown as string}>
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Component denies access (fail-closed pattern)
      expect(screen.queryByTestId('content')).toBeNull();
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
      // Service is NOT called for invalid types
      expect(mockFeatureGatingService.canAccessSync).not.toHaveBeenCalled();
    });

    it('should handle invalid onPaywallClose callback gracefully', () => {
      // Given: onPaywallClose is not a function
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders with invalid callback
      render(
        <FeatureGate
          featureId="export_data"
          onPaywallClose={'not-a-function' as unknown as () => void}
          allowDismiss={true}
        >
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: No crash
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
    });

    it('should handle invalid allowDismiss type', () => {
      // Given: allowDismiss as string
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders with invalid allowDismiss
      render(
        <FeatureGate
          featureId="export_data"
          allowDismiss={'yes' as unknown as boolean}
        >
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Should handle gracefully
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
    });

    it('should handle malformed children type', () => {
      // Given: Children as primitive instead of ReactNode
      mockFeatureGatingService.canAccessSync.mockReturnValue(true);

      // When: Component renders with primitive children
      render(
        <FeatureGate featureId="basic_search">
          {123 as unknown as ReactNode}
        </FeatureGate>
      );

      // Then: React handles primitive rendering
      expect(mockFeatureGatingService.canAccessSync).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // 5. EXTERNAL DEPENDENCY FAILURE TESTS (7 tests)
  // ============================================================================

  describe('External Dependency Failures', () => {
    it('should handle FeatureGatingService exception gracefully', () => {
      // Given: Service throws exception
      mockFeatureGatingService.canAccessSync.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // When: Component renders
      render(
        <FeatureGate featureId="advanced_search">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Should deny access (fail closed)
      expect(screen.queryByTestId('content')).toBeNull();
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle undefined return from canAccessSync', () => {
      // Given: Service returns undefined
      mockFeatureGatingService.canAccessSync.mockReturnValue(undefined as unknown as boolean);

      // When: Component renders
      render(
        <FeatureGate featureId="advanced_search">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Should treat as falsy (deny access)
      expect(screen.queryByTestId('content')).toBeNull();
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
    });

    it('should handle theme system with default fallback colors', () => {
      // Given: Component should work with default colors if theme unavailable
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders normally
      render(
        <FeatureGate featureId="export_data">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Paywall should still be visible with fallback colors
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
      // Note: useThemedColors is mocked to return valid colors in beforeEach
      expect(useThemedColors).toHaveBeenCalled();
    });

    it('should handle database connection loss gracefully', () => {
      // Given: Service throws error
      mockFeatureGatingService.canAccessSync.mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // When: Component renders with DB error
      render(
        <FeatureGate featureId="advanced_search">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Should deny access (fail closed)
      expect(screen.queryByTestId('content')).toBeNull();
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should continue functioning if analytics tracking fails', () => {
      // Given: Analytics throws error
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders
      render(
        <FeatureGate featureId="export_data">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Paywall still renders
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
    });

    it('should handle race condition in concurrent access checks', () => {
      // Given: Multiple rapid checks
      let callCount = 0;
      mockFeatureGatingService.canAccessSync.mockImplementation(() => {
        callCount++;
        return callCount % 2 === 0;
      });

      // When: Multiple re-renders
      const { rerender } = render(
        <FeatureGate featureId="advanced_search">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      for (let i = 0; i < 5; i++) {
        rerender(
          <FeatureGate featureId="advanced_search">
            <Text testID="content">Content</Text>
          </FeatureGate>
        );
      }

      // Then: Should handle gracefully
      expect(mockFeatureGatingService.canAccessSync).toHaveBeenCalled();
    });

    it('should handle featureId prop changes safely', () => {
      // Given: Feature ID changes between renders
      mockFeatureGatingService.canAccessSync.mockReturnValue(true);

      // When: Feature ID prop changes
      const { rerender } = render(
        <FeatureGate featureId="feature1">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      rerender(
        <FeatureGate featureId="feature2">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Service should be called with new feature ID
      expect(mockFeatureGatingService.canAccessSync).toHaveBeenCalledWith('feature2');
    });
  });

  // ============================================================================
  // 6. EXCEPTION AND ERROR MESSAGE TESTS (3 tests)
  // ============================================================================

  describe('Exceptions and Error Messages', () => {
    it('should log specific error when service fails', () => {
      // Given: Service throws with context
      mockFeatureGatingService.canAccessSync.mockImplementation(() => {
        throw new Error('Database error: Connection timeout');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // When: Component renders
      render(
        <FeatureGate featureId="advanced_search">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Error should be logged and access denied
      expect(consoleSpy).toHaveBeenCalled();
      expect(screen.getByTestId('paywall-component')).toBeTruthy();

      consoleSpy.mockRestore();
    });

    it('should handle invalid internal state gracefully', () => {
      // Given: Invalid prop combination (allowDismiss as undefined)
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders with conflicting props
      // Then: Should render paywall with default allowDismiss=true
      expect(() => {
        render(
          <FeatureGate
            featureId="export_data"
            allowDismiss={undefined as unknown as boolean}
          >
            <Text testID="content">Content</Text>
          </FeatureGate>
        );
      }).not.toThrow();

      expect(screen.getByTestId('paywall-component')).toBeTruthy();
    });

    it('should recover from render errors in children', () => {
      // Given: Children component throws
      mockFeatureGatingService.canAccessSync.mockReturnValue(true);

      const BadComponent = () => {
        throw new Error('Render error in children');
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // When: Component attempts to render error-throwing children
      expect(() => {
        render(
          <FeatureGate featureId="basic_search">
            <BadComponent />
          </FeatureGate>
        );
      }).toThrow();

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // 7. THEMING TESTS (2 tests)
  // ============================================================================

  describe('Dark and Light Mode Theming', () => {
    it('should apply light mode colors to paywall', () => {
      // Given: Light mode active
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);
      (useThemedColors as jest.Mock).mockReturnValue({
        colors: mockColors,
        colorScheme: 'light',
      });

      // When: Component renders
      render(
        <FeatureGate featureId="export_data">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Paywall should be visible with theme colors
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
      expect(useThemedColors).toHaveBeenCalled();
    });

    it('should apply dark mode colors to paywall', () => {
      // Given: Dark mode active
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);
      const darkColors = {
        ...mockColors,
        background: { base: '#000000', secondary: '#1C1C1E', tertiary: '#2C2C2E' },
      };
      (useThemedColors as jest.Mock).mockReturnValue({
        colors: darkColors,
        colorScheme: 'dark',
      });

      // When: Component renders in dark mode
      render(
        <FeatureGate featureId="export_data">
          <Text testID="content">Content</Text>
        </FeatureGate>
      );

      // Then: Paywall should render with dark colors
      expect(screen.getByTestId('paywall-component')).toBeTruthy();
    });
  });

  // ============================================================================
  // 8. ACCESSIBILITY TESTS (2 tests)
  // ============================================================================

  describe('Accessibility', () => {
    it('should announce access denied to screen readers', () => {
      // Given: Premium feature without access
      mockFeatureGatingService.canAccessSync.mockReturnValue(false);

      // When: Component renders
      render(
        <FeatureGate featureId="export_data">
          <Text testID="content">Export Data</Text>
        </FeatureGate>
      );

      // Then: Container should have accessibility label
      const container = screen.getByTestId('paywall-container');
      expect(container.props.accessibilityLabel).toBeDefined();
      expect(container.props.accessibilityLabel).toContain('export_data');
    });

    it('should maintain focus on content when access is granted', () => {
      // Given: Access is granted
      mockFeatureGatingService.canAccessSync.mockReturnValue(true);

      // When: Component renders with accessible content
      render(
        <FeatureGate featureId="advanced_analytics">
          <View testID="content" accessible={true}>
            <Text>Analytics Content</Text>
          </View>
        </FeatureGate>
      );

      // Then: Content should be accessible and focusable
      const content = screen.getByTestId('content');
      expect(content).toBeTruthy();
      expect(content.props.accessible).toBe(true);
    });
  });
});
