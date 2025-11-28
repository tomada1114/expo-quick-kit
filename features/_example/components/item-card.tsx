/**
 * ItemCard Component
 *
 * Feature-specific card component for displaying item information
 *
 * Usage:
 *   <ItemCard
 *     item={item}
 *     onPress={() => handleItemPress(item.id)}
 *   />
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useThemedColors } from '@/hooks/use-theme-color';
import type { Item } from '../types';

export interface ItemCardProps {
  /** Item data to display */
  item: Item;
  /** Press handler */
  onPress?: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ItemCard({ item, onPress, testID }: ItemCardProps) {
  const { colors } = useThemedColors();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}${item.description ? `, ${item.description}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Card variant="flat" style={styles.card}>
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              Typography.headline,
              { color: colors.text.primary },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {item.description && (
            <Text
              style={[
                styles.description,
                Typography.subheadline,
                { color: colors.text.secondary },
              ]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}
          <Text
            style={[
              styles.date,
              Typography.caption1,
              { color: colors.text.tertiary },
            ]}
          >
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: BorderRadius.lg,
  },
  card: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
  },
  content: {
    gap: Spacing.xs,
  },
  title: {
    marginBottom: 0,
  },
  description: {
    marginBottom: 0,
  },
  date: {
    marginTop: Spacing.xs,
  },
});
