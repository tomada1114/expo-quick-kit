/**
 * SubscriptionDemo Component
 *
 * Comprehensive example demonstrating subscription features:
 * - Purchase flow (selecting and purchasing packages)
 * - Restore flow (restoring previous purchases)
 * - Feature gating (checking premium access)
 * - Usage limits (displaying free/premium limits)
 *
 * Usage:
 *   <SubscriptionDemo />
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  type ViewStyle,
} from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemedColors } from '@/hooks/use-theme-color';
import { useSubscription } from '@/features/subscription';

export interface SubscriptionDemoProps {
  testID?: string;
}

/**
 * Example 1: Display current subscription status
 */
function SubscriptionStatus() {
  const { colors } = useThemedColors();
  const { subscription, isPremium, isFree, loading } = useSubscription();

  if (loading) {
    return (
      <Card style={styles.card}>
        <Text style={[Typography.body, { color: colors.text.secondary }]}>
          サブスクリプション情報を読み込み中...
        </Text>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card style={styles.card}>
        <Text style={[Typography.body, { color: colors.text.secondary }]}>
          サブスクリプション情報を取得できません
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.statusRow}>
        <Text style={[Typography.subheadline, { color: colors.text.primary }]}>
          現在のプラン
        </Text>
        <Text
          style={[
            Typography.body,
            {
              color: isPremium
                ? colors.semantic.success
                : colors.text.secondary,
            },
          ]}
        >
          {isPremium ? 'プレミアム' : '無料'}
        </Text>
      </View>

      {subscription.isActive && (
        <View style={[styles.statusRow, { marginTop: Spacing.sm }]}>
          <Text
            style={[Typography.subheadline, { color: colors.text.primary }]}
          >
            有効期限
          </Text>
          <Text style={[Typography.body, { color: colors.text.secondary }]}>
            {subscription.expiresAt
              ? new Date(subscription.expiresAt).toLocaleDateString('ja-JP')
              : '無期限'}
          </Text>
        </View>
      )}

      {subscription.productId && (
        <View style={[styles.statusRow, { marginTop: Spacing.sm }]}>
          <Text
            style={[Typography.subheadline, { color: colors.text.primary }]}
          >
            プロダクトID
          </Text>
          <Text style={[Typography.caption1, { color: colors.text.tertiary }]}>
            {subscription.productId}
          </Text>
        </View>
      )}
    </Card>
  );
}

/**
 * Example 2: Display usage limits
 */
function UsageLimitsDisplay() {
  const { colors } = useThemedColors();
  const { usageLimits, isPremium } = useSubscription();

  return (
    <Card style={styles.card}>
      <Text
        style={[
          Typography.headline,
          { color: colors.text.primary, marginBottom: Spacing.md },
        ]}
      >
        利用制限
      </Text>

      <View style={styles.limitRow}>
        <Text style={[Typography.body, { color: colors.text.primary }]}>
          最大アイテム数
        </Text>
        <Text
          style={[Typography.subheadline, { color: colors.semantic.success }]}
        >
          {usageLimits.maxItems === Infinity ? '無制限' : usageLimits.maxItems}
        </Text>
      </View>

      <View style={[styles.limitRow, { marginTop: Spacing.sm }]}>
        <Text style={[Typography.body, { color: colors.text.primary }]}>
          最大エクスポート数
        </Text>
        <Text
          style={[Typography.subheadline, { color: colors.semantic.success }]}
        >
          {usageLimits.maxExports === Infinity
            ? '無制限'
            : usageLimits.maxExports}
        </Text>
      </View>

      <View style={[styles.limitRow, { marginTop: Spacing.sm }]}>
        <Text style={[Typography.body, { color: colors.text.primary }]}>
          広告表示
        </Text>
        <Text
          style={[
            Typography.subheadline,
            {
              color: usageLimits.hasAds
                ? colors.semantic.warning
                : colors.semantic.success,
            },
          ]}
        >
          {usageLimits.hasAds ? 'あり' : 'なし'}
        </Text>
      </View>

      {!isPremium && (
        <View
          style={[
            styles.limitRow,
            { marginTop: Spacing.md, paddingTop: Spacing.md },
            { borderTopColor: colors.interactive.separator, borderTopWidth: 1 },
          ]}
        >
          <Text
            style={[
              Typography.caption1,
              { color: colors.text.tertiary, fontStyle: 'italic' },
            ]}
          >
            プレミアムプランにアップグレードして無制限アクセスを獲得してください
          </Text>
        </View>
      )}
    </Card>
  );
}

/**
 * Example 3: Feature gating demonstration
 */
function FeatureGatingExample() {
  const { colors } = useThemedColors();
  const { canAccessFeature, isPremium } = useSubscription();

  const features = [
    { level: 'basic' as const, label: '基本機能' },
    { level: 'premium' as const, label: 'プレミアム機能' },
  ];

  return (
    <Card style={styles.card}>
      <Text
        style={[
          Typography.headline,
          { color: colors.text.primary, marginBottom: Spacing.md },
        ]}
      >
        機能制限チェック
      </Text>

      {features.map((feature, index) => {
        const canAccess = canAccessFeature(feature.level);

        return (
          <View
            key={feature.level}
            style={[
              styles.featureRow,
              index !== 0 && { marginTop: Spacing.md },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[Typography.body, { color: colors.text.primary }]}>
                {feature.label}
              </Text>
              <Text
                style={[
                  Typography.caption1,
                  { color: colors.text.tertiary, marginTop: Spacing.xs },
                ]}
              >
                {feature.level === 'basic'
                  ? '無料プランでもアクセス可能'
                  : 'プレミアムプランのみ'}
              </Text>
            </View>

            <Text
              style={[
                Typography.subheadline,
                {
                  color: canAccess
                    ? colors.semantic.success
                    : colors.semantic.error,
                },
              ]}
            >
              {canAccess ? 'アクセス可' : 'ロック中'}
            </Text>
          </View>
        );
      })}
    </Card>
  );
}

/**
 * Example 4: Purchase and restore actions
 */
function PurchaseAndRestoreActions() {
  const { colors } = useThemedColors();
  const { purchasePackage, restorePurchases, loading } = useSubscription();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null
  );

  const handlePurchase = useCallback(
    async (packageId: string) => {
      try {
        setSelectedPackageId(packageId);
        await purchasePackage(packageId);
        Alert.alert('成功', '購入処理が完了しました');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '購入に失敗しました';
        Alert.alert('エラー', message);
      } finally {
        setSelectedPackageId(null);
      }
    },
    [purchasePackage]
  );

  const handleRestore = useCallback(async () => {
    try {
      await restorePurchases();
      Alert.alert('成功', '購入を復元しました');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '復元に失敗しました';
      Alert.alert('エラー', message);
    }
  }, [restorePurchases]);

  return (
    <Card style={styles.card}>
      <Text
        style={[
          Typography.headline,
          { color: colors.text.primary, marginBottom: Spacing.md },
        ]}
      >
        購入と復元
      </Text>

      <Button
        onPress={() => handlePurchase('$rc_monthly')}
        disabled={loading}
        style={[styles.button, { marginBottom: Spacing.sm }]}
      >
        {selectedPackageId === '$rc_monthly' && loading
          ? '購入中...'
          : '月額プランを購入'}
      </Button>

      <Button
        onPress={() => handlePurchase('$rc_annual')}
        disabled={loading}
        style={[styles.button, { marginBottom: Spacing.sm }]}
      >
        {selectedPackageId === '$rc_annual' && loading
          ? '購入中...'
          : '年額プランを購入'}
      </Button>

      <Button onPress={handleRestore} disabled={loading} variant="secondary">
        {loading ? '復元中...' : '購入を復元'}
      </Button>
    </Card>
  );
}

/**
 * Main Demo Component
 */
export function SubscriptionDemo({ testID }: SubscriptionDemoProps) {
  const { colors } = useThemedColors();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.base }]}
      contentContainerStyle={styles.contentContainer}
      testID={testID}
    >
      <View style={styles.header}>
        <Text
          style={[
            Typography.largeTitle,
            { color: colors.text.primary, marginBottom: Spacing.md },
          ]}
        >
          サブスクリプション機能デモ
        </Text>
        <Text style={[Typography.body, { color: colors.text.secondary }]}>
          サブスクリプション機能の使用例を確認できます
        </Text>
      </View>

      <View style={styles.section}>
        <Text
          style={[
            Typography.title2,
            { color: colors.text.primary, marginBottom: Spacing.md },
          ]}
        >
          1. サブスクリプション状態
        </Text>
        <SubscriptionStatus />
      </View>

      <View style={styles.section}>
        <Text
          style={[
            Typography.title2,
            { color: colors.text.primary, marginBottom: Spacing.md },
          ]}
        >
          2. 利用制限
        </Text>
        <UsageLimitsDisplay />
      </View>

      <View style={styles.section}>
        <Text
          style={[
            Typography.title2,
            { color: colors.text.primary, marginBottom: Spacing.md },
          ]}
        >
          3. 機能制限
        </Text>
        <FeatureGatingExample />
      </View>

      <View style={styles.section}>
        <Text
          style={[
            Typography.title2,
            { color: colors.text.primary, marginBottom: Spacing.md },
          ]}
        >
          4. 購入と復元アクション
        </Text>
        <PurchaseAndRestoreActions />
      </View>

      <View style={styles.footer}>
        <Text
          style={[
            Typography.caption1,
            { color: colors.text.tertiary, textAlign: 'center' },
          ]}
        >
          詳細はfeatures/subscription/README.mdを参照してください
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  card: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    width: '100%',
  },
  footer: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
});
