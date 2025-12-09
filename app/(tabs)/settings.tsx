/**
 * Settings Screen
 *
 * Settings screen with subscription management functionality.
 * Includes "Restore Purchases" button for iOS App Store guideline compliance.
 *
 * Requirements:
 * - 6.4: iOS App Store Guidelines compliance (restore button required)
 * - 6.5: Loading indicator during restore
 * - Display success/error messages for restore operations
 */

import { router, type Href } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacer } from '@/components/ui/spacer';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import type { SubscriptionErrorCode } from '@/features/subscription/core/types';
import { useSubscription } from '@/features/subscription/hooks';
import { useThemedColors } from '@/hooks/use-theme-color';

/**
 * Error messages for different error codes
 */
const ERROR_MESSAGES: Record<SubscriptionErrorCode, string> = {
  PURCHASE_CANCELLED: '', // Silent handling - no message shown
  PURCHASE_NOT_ALLOWED:
    'Purchases are not allowed on this device. Please check your settings.',
  PURCHASE_INVALID: 'Invalid purchase. Please try again.',
  PRODUCT_ALREADY_PURCHASED: 'This product has already been purchased.',
  NETWORK_ERROR:
    'A network error occurred. Please check your connection and try again.',
  STORE_PROBLEM_ERROR:
    'The store service is temporarily unavailable. Please try again later.',
  CONFIGURATION_ERROR:
    'A configuration error occurred. Please contact support.',
  INVALID_CREDENTIALS_ERROR: 'Authentication failed. Please try again.',
  UNEXPECTED_BACKEND_RESPONSE_ERROR:
    'A server error occurred. Please try again later.',
  RECEIPT_ALREADY_IN_USE_ERROR:
    'This purchase is already associated with another account.',
  NO_ACTIVE_SUBSCRIPTION: '', // Handled separately as info, not error
  UNKNOWN_ERROR: 'An error occurred. Please try again.',
};

export default function SettingsScreen() {
  const { colors } = useThemedColors();
  const { top } = useSafeAreaInsets();
  const { isPremium, subscription, restorePurchases, refetchSubscription } =
    useSubscription();

  const [isRestoring, setIsRestoring] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));

  // Animate premium badge on mount
  React.useEffect(() => {
    if (isPremium) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 8,
      }).start();
    }
  }, [isPremium, scaleAnim]);

  /**
   * Handle restore purchases button press
   * Implements iOS App Store guideline requirement for restore functionality
   */
  const handleRestorePurchases = useCallback(async () => {
    if (isRestoring) {
      return; // Prevent duplicate calls
    }

    setIsRestoring(true);

    try {
      await restorePurchases();

      // Refetch subscription state to get updated premium status
      await refetchSubscription();

      // Show success message - restorePurchases throws if no active subscription found
      Alert.alert('Success', 'Your purchases have been restored.', [
        { text: 'OK' },
      ]);
    } catch (error) {
      // Extract error code from error object (supports both Error.message and typed errors)
      const errorCode: SubscriptionErrorCode =
        error instanceof Error &&
        Object.keys(ERROR_MESSAGES).includes(error.message)
          ? (error.message as SubscriptionErrorCode)
          : 'UNKNOWN_ERROR';

      // Handle user cancellation silently
      if (errorCode === 'PURCHASE_CANCELLED') {
        setIsRestoring(false);
        return;
      }

      // Handle no active subscription as info, not error
      if (errorCode === 'NO_ACTIVE_SUBSCRIPTION') {
        Alert.alert('Info', 'No purchases available to restore.', [
          { text: 'OK' },
        ]);
        setIsRestoring(false);
        return;
      }

      // Show error message for other errors
      const message = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN_ERROR;
      Alert.alert('Error', message, [{ text: 'OK' }]);
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring, restorePurchases, refetchSubscription]);

  /**
   * Handle upgrade to premium button press
   */
  const handleUpgrade = useCallback(() => {
    // Note: Type assertion needed because expo-router typed routes may not be regenerated
    router.push('/paywall' as Href);
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.base }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: top + Spacing.lg },
      ]}
      testID="settings-screen-container"
      showsVerticalScrollIndicator={false}
    >
      {/* Header - Minimalist design */}
      <View style={styles.headerWrapper}>
        <ThemedText style={styles.title}>Settings</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.text.secondary }]}>
          Manage your account
        </ThemedText>
      </View>

      <Spacer size="xl" />

      {/* Subscription Status Section - Refined Card with Premium Badge */}
      <View
        style={[
          styles.premiumCard,
          {
            backgroundColor: isPremium
              ? colors.semantic.info
              : colors.background.secondary,
            opacity: isPremium ? 0.08 : 1,
            borderWidth: isPremium ? 1.5 : 0,
            borderColor: isPremium ? colors.primary : 'transparent',
          },
        ]}
      >
        {/* Premium Badge - Animated */}
        {isPremium && (
          <Animated.View
            style={[
              styles.premiumBadge,
              {
                backgroundColor: colors.primary,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <ThemedText style={styles.badgeText}>✓ Premium</ThemedText>
          </Animated.View>
        )}

        {/* Plan Title */}
        <ThemedText style={[styles.planTitle, { color: colors.text.primary }]}>
          {isPremium ? "You're Premium" : 'Free Plan'}
        </ThemedText>

        {/* Expiry info */}
        {subscription?.expiresAt && (
          <ThemedText
            style={[styles.expiryText, { color: colors.text.secondary }]}
          >
            Expires {subscription.expiresAt.toLocaleDateString()}
          </ThemedText>
        )}

        {!isPremium && (
          <ThemedText
            style={[styles.freeText, { color: colors.text.secondary }]}
          >
            Unlock all features with Premium
          </ThemedText>
        )}

        <Spacer size="md" />

        {/* CTA Button */}
        {!isPremium ? (
          <Button
            testID="upgrade-premium-button"
            variant="primary"
            onPress={handleUpgrade}
            style={styles.primaryButton}
          >
            Upgrade to Premium
          </Button>
        ) : (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: colors.primary, opacity: 0.15 },
            ]}
          >
            <ThemedText style={[styles.statusText, { color: colors.primary }]}>
              Active Subscription
            </ThemedText>
          </View>
        )}
      </View>

      <Spacer size="xl" />

      {/* Actions Section */}
      <View style={styles.sectionContainer}>
        <ThemedText
          style={[styles.sectionLabel, { color: colors.text.tertiary }]}
        >
          ACTIONS
        </ThemedText>

        <Spacer size="sm" />

        {/* Restore Purchases Button */}
        <Button
          testID="restore-purchases-button"
          variant="secondary"
          onPress={handleRestorePurchases}
          loading={isRestoring}
          disabled={isRestoring}
          style={styles.secondaryButton}
        >
          {isRestoring ? 'Restoring...' : 'Restore Purchases'}
        </Button>
      </View>

      <Spacer size="xl" />

      {/* About Section */}
      <View style={styles.sectionContainer}>
        <ThemedText
          style={[styles.sectionLabel, { color: colors.text.tertiary }]}
        >
          ABOUT
        </ThemedText>

        <Spacer size="sm" />

        <View
          style={[
            styles.infoItem,
            { borderBottomColor: colors.interactive.separator },
          ]}
        >
          <ThemedText
            style={[styles.infoLabel, { color: colors.text.secondary }]}
          >
            Version
          </ThemedText>
          <ThemedText
            style={[styles.infoValue, { color: colors.text.primary }]}
          >
            1.0.0
          </ThemedText>
        </View>
      </View>

      <Spacer size="2xl" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },

  // ===== Header Section =====
  headerWrapper: {
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.largeTitle,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.subheadline,
    marginTop: Spacing.sm,
  },

  // ===== Premium Card Section =====
  premiumCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
    overflow: 'hidden' as const,
  },

  premiumBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  badgeText: {
    ...Typography.caption1,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  planTitle: {
    ...Typography.title2,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  expiryText: {
    ...Typography.subheadline,
    marginBottom: Spacing.sm,
  },
  freeText: {
    ...Typography.subheadline,
    marginBottom: Spacing.sm,
  },

  primaryButton: {
    marginTop: Spacing.sm,
  },
  secondaryButton: {
    width: '100%',
  },

  statusBadge: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  statusText: {
    ...Typography.body,
    fontWeight: '600',
  },

  // ===== Section Container =====
  sectionContainer: {
    paddingHorizontal: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.caption1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ===== Info Item =====
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  infoLabel: {
    ...Typography.body,
    fontWeight: '500',
  },
  infoValue: {
    ...Typography.body,
    fontWeight: '400',
  },
});
