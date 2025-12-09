/**
 * ItemList Component
 *
 * List component for displaying items using FlatList
 *
 * Usage:
 *   <ItemList
 *     items={items}
 *     onItemPress={(id) => handleItemPress(id)}
 *     onRefresh={handleRefresh}
 *   />
 */

import React, { useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useThemedColors } from '@/hooks/use-theme-color';
import type { Item } from '../types';
import { ItemCard } from './item-card';

export interface ItemListProps {
  /** Array of items to display */
  items: Item[];
  /** Handler for item press */
  onItemPress?: (id: number) => void;
  /** Handler for pull-to-refresh */
  onRefresh?: () => void;
  /** Refresh loading state */
  refreshing?: boolean;
  /** Test ID for testing */
  testID?: string;
  /** Header component */
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
  /** Footer component */
  ListFooterComponent?: React.ComponentType | React.ReactElement | null;
}

function EmptyState() {
  const { colors } = useThemedColors();

  return (
    <View style={styles.emptyContainer}>
      <Text
        style={[
          styles.emptyText,
          Typography.body,
          { color: colors.text.secondary },
        ]}
      >
        アイテムがありません
      </Text>
      <Text
        style={[
          styles.emptyHint,
          Typography.subheadline,
          { color: colors.text.tertiary },
        ]}
      >
        新しいアイテムを追加してください
      </Text>
    </View>
  );
}

export function ItemList({
  items,
  onItemPress,
  onRefresh,
  refreshing = false,
  testID,
  ListHeaderComponent,
  ListFooterComponent,
}: ItemListProps) {
  const { colors } = useThemedColors();

  const renderItem: ListRenderItem<Item> = useCallback(
    ({ item }) => (
      <ItemCard
        item={item}
        onPress={() => onItemPress?.(item.id)}
        testID={`item-card-${item.id}`}
      />
    ),
    [onItemPress]
  );

  const keyExtractor = useCallback((item: Item) => String(item.id), []);

  return (
    <FlatList
      style={styles.container}
      testID={testID}
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={[
        styles.listContent,
        items.length === 0 && styles.emptyListContent,
      ]}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={EmptyState}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      {...(onRefresh && {
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ),
      })}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: Spacing.sm,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptyHint: {
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
});
