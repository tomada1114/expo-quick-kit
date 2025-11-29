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

import { router, Href } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Alert } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacer } from '@/components/ui/spacer';
import { Spacing, Typography } from '@/constants/theme';
import { useSubscription } from '@/features/subscription/hooks';
import { useThemedColors } from '@/hooks/use-theme-color';

/**
 * Error messages for different error codes (Japanese)
 */
const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR:
    'ネットワークエラーが発生しました。接続を確認して再度お試しください。',
  STORE_PROBLEM_ERROR:
    'ストアサービスが一時的に利用できません。しばらくしてから再度お試しください。',
  CONFIGURATION_ERROR:
    'アプリの設定エラーが発生しました。サポートにお問い合わせください。',
  INVALID_CREDENTIALS_ERROR: '認証に失敗しました。再度お試しください。',
  RECEIPT_ALREADY_IN_USE_ERROR: 'この購入は別のアカウントで使用されています。',
  UNKNOWN_ERROR: 'エラーが発生しました。再度お試しください。',
};

export default function SettingsScreen() {
  const { colors } = useThemedColors();
  const {
    isPremium,
    subscription,
    loading: subscriptionLoading,
    restorePurchases,
  } = useSubscription();

  const [isRestoring, setIsRestoring] = useState(false);

  // Combined loading state
  const loading = subscriptionLoading || isRestoring;

  /**
   * Handle restore purchases button press
   * Implements iOS App Store guideline requirement for restore functionality
   */
  const handleRestorePurchases = useCallback(async () => {
    if (loading) {
      return; // Prevent duplicate calls
    }

    setIsRestoring(true);

    try {
      await restorePurchases();

      // Check if subscription was restored (will need to refetch state)
      // Show success message
      Alert.alert('Success', '購入を復元しました', [{ text: 'OK' }]);
    } catch (error) {
      const errorCode =
        error instanceof Error ? error.message : 'UNKNOWN_ERROR';

      // Handle user cancellation silently
      if (errorCode === 'PURCHASE_CANCELLED') {
        setIsRestoring(false);
        return;
      }

      // Handle no active subscription as info, not error
      if (errorCode === 'NO_ACTIVE_SUBSCRIPTION') {
        Alert.alert('Info', '復元可能な購入がありません', [{ text: 'OK' }]);
        setIsRestoring(false);
        return;
      }

      // Show error message for other errors
      const message = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN_ERROR;
      Alert.alert('Error', message, [{ text: 'OK' }]);
    } finally {
      setIsRestoring(false);
    }
  }, [loading, restorePurchases]);

  /**
   * Handle upgrade to premium button press
   */
  const handleUpgrade = useCallback(() => {
    router.push('/paywall' as Href);
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.base }]}
      contentContainerStyle={styles.contentContainer}
      testID="settings-screen-container"
    >
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Settings</ThemedText>
      </ThemedView>

      <Spacer size="lg" />

      {/* Subscription Status Section */}
      <Card style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Subscription</ThemedText>
        <Spacer size="sm" />

        <View style={styles.statusRow}>
          <ThemedText style={styles.statusLabel}>Current Plan:</ThemedText>
          <ThemedText
            style={[
              styles.statusValue,
              isPremium
                ? { color: colors.semantic.success }
                : { color: colors.text.secondary },
            ]}
          >
            {isPremium ? 'Premium' : 'Free'}
          </ThemedText>
        </View>

        {subscription?.expiresAt && (
          <>
            <Spacer size="xs" />
            <View style={styles.statusRow}>
              <ThemedText style={styles.statusLabel}>Expires:</ThemedText>
              <ThemedText style={styles.statusValue}>
                {subscription.expiresAt.toLocaleDateString()}
              </ThemedText>
            </View>
          </>
        )}

        <Spacer size="md" />

        {!isPremium && (
          <>
            <Button
              testID="upgrade-premium-button"
              variant="primary"
              onPress={handleUpgrade}
            >
              Upgrade to Premium
            </Button>
            <Spacer size="sm" />
          </>
        )}

        {/* Restore Purchases Button - iOS App Store Compliance */}
        <Button
          testID="restore-purchases-button"
          variant="secondary"
          onPress={handleRestorePurchases}
          loading={loading}
          disabled={loading}
        >
          Restore Purchases
        </Button>
      </Card>

      <Spacer size="lg" />

      {/* App Info Section */}
      <Card style={styles.section}>
        <ThemedText style={styles.sectionTitle}>About</ThemedText>
        <Spacer size="sm" />

        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Version:</ThemedText>
          <ThemedText style={styles.infoValue}>1.0.0</ThemedText>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    ...Typography.largeTitle,
    fontWeight: '700',
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headline,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  statusLabel: {
    ...Typography.body,
  },
  statusValue: {
    ...Typography.body,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...Typography.body,
  },
  infoValue: {
    ...Typography.body,
    fontWeight: '500',
  },
});
