/**
 * DateDemo Component
 *
 * date-fnsのフォーマット関数のサンプル表示
 * format, formatDistanceToNow, formatRelativeDateの使用例を提供
 *
 * Apple HIG準拠のデザイン:
 * - 8pt Grid System
 * - iOS標準のテキスト階層
 * - 適切なセパレーター使用
 *
 * Usage:
 *   <DateDemo />
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useThemedColors } from '@/hooks/use-theme-color';
import {
  formatDate,
  formatDistanceToNow,
  formatRelativeDate,
} from '@/lib/date';

export interface DateDemoProps {
  testID?: string;
}

export function DateDemo({ testID }: DateDemoProps) {
  const { colors } = useThemedColors();
  const [now, setNow] = useState(() => new Date());

  const refreshNow = useCallback(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card variant="flat" testID={testID} style={styles.container}>
      <View style={styles.header}>
        <Text style={[Typography.headline, { color: colors.text.primary }]}>
          Date-fns Demo
        </Text>
        <Text
          style={[
            Typography.subheadline,
            styles.headerDescription,
            { color: colors.text.secondary },
          ]}
        >
          日本語ロケールでの日付フォーマット例
        </Text>
      </View>

      <Section
        title="formatDate"
        description="日付を任意のフォーマットに変換"
        colors={colors}
      >
        <FormatRow
          label="yyyy-MM-dd"
          value={formatDate(now, 'yyyy-MM-dd')}
          colors={colors}
          isFirst
        />
        <FormatRow
          label="yyyy年MM月dd日"
          value={formatDate(now, 'yyyy年MM月dd日')}
          colors={colors}
        />
        <FormatRow
          label="HH:mm:ss"
          value={formatDate(now, 'HH:mm:ss')}
          colors={colors}
        />
        <FormatRow
          label="EEEE"
          value={formatDate(now, 'EEEE')}
          colors={colors}
        />
        <FormatRow
          label="yyyy年MM月dd日(EEEE)"
          value={formatDate(now, 'yyyy年MM月dd日(EEEE)')}
          colors={colors}
          isLast
        />
      </Section>

      <Section
        title="formatDistanceToNow"
        description="相対時刻を日本語で表示"
        colors={colors}
      >
        <FormatRow
          label="1時間前"
          value={formatDistanceToNow(new Date(now.getTime() - 60 * 60 * 1000))}
          colors={colors}
          isFirst
        />
        <FormatRow
          label="3日前"
          value={formatDistanceToNow(
            new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
          )}
          colors={colors}
        />
        <FormatRow
          label="1週間後"
          value={formatDistanceToNow(
            new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          )}
          colors={colors}
        />
        <FormatRow
          label="1ヶ月前"
          value={formatDistanceToNow(
            new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          )}
          colors={colors}
          isLast
        />
      </Section>

      <Section
        title="formatRelativeDate"
        description="相対日付（今日・昨日・明日など）"
        colors={colors}
      >
        <FormatRow
          label="今日"
          value={formatRelativeDate(now)}
          colors={colors}
          isFirst
        />
        <FormatRow
          label="昨日"
          value={formatRelativeDate(
            new Date(now.getTime() - 24 * 60 * 60 * 1000)
          )}
          colors={colors}
        />
        <FormatRow
          label="明日"
          value={formatRelativeDate(
            new Date(now.getTime() + 24 * 60 * 60 * 1000)
          )}
          colors={colors}
        />
        <FormatRow
          label="先週"
          value={formatRelativeDate(
            new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          )}
          colors={colors}
          isLast
        />
      </Section>

      <View style={styles.footer}>
        <Button
          testID={testID ? `${testID}-refresh-button` : 'refresh-button'}
          title="今すぐ更新"
          variant="secondary"
          onPress={refreshNow}
        />
      </View>
    </Card>
  );
}

interface SectionProps {
  title: string;
  description: string;
  colors: ReturnType<typeof useThemedColors>['colors'];
  children: React.ReactNode;
}

function Section({ title, description, colors, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text
          style={[
            Typography.footnote,
            styles.sectionTitle,
            { color: colors.text.tertiary },
          ]}
        >
          {title}
        </Text>
        <Text style={[Typography.caption1, { color: colors.text.tertiary }]}>
          {description}
        </Text>
      </View>
      <View
        style={[
          styles.sectionContent,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

interface FormatRowProps {
  label: string;
  value: string;
  colors: ReturnType<typeof useThemedColors>['colors'];
  isFirst?: boolean;
  isLast?: boolean;
}

function FormatRow({ label, value, colors, isFirst, isLast }: FormatRowProps) {
  return (
    <View
      style={[
        styles.formatRow,
        isFirst && styles.formatRowFirst,
        isLast && styles.formatRowLast,
      ]}
    >
      <Text
        style={[styles.formatLabel, { color: colors.text.secondary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={[
          Typography.body,
          styles.formatValue,
          { color: colors.text.primary },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
      {!isLast && (
        <View
          style={[
            styles.separator,
            { backgroundColor: colors.interactive.separator },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg, // 24pt - セクション間のギャップ
  },
  header: {
    gap: Spacing.xs, // 4pt
  },
  headerDescription: {
    marginTop: Spacing.xs, // 4pt
  },
  section: {
    gap: Spacing.sm, // 8pt
  },
  sectionHeader: {
    paddingHorizontal: Spacing.xs, // 4pt - 軽いインデント
    gap: Spacing.xs, // 4pt
  },
  sectionTitle: {
    fontWeight: '600',
  },
  sectionContent: {
    borderRadius: BorderRadius.lg, // 12pt - iOS標準のグループ化
    overflow: 'hidden',
  },
  formatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44, // iOS最小タッチターゲット
    paddingHorizontal: Spacing.md, // 16pt
    paddingVertical: Spacing.sm, // 8pt
    position: 'relative',
  },
  formatRowFirst: {
    paddingTop: Spacing.sm + Spacing.xs, // 12pt - 最初の行は少し余白
  },
  formatRowLast: {
    paddingBottom: Spacing.sm + Spacing.xs, // 12pt - 最後の行は少し余白
  },
  formatLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  formatValue: {
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  separator: {
    position: 'absolute',
    left: Spacing.md, // 16pt - 左インデント
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
  footer: {
    marginTop: Spacing.xs, // 4pt
  },
});
