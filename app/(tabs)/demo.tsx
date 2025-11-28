/**
 * Demo Screen
 * サンプル機能のデモンストレーション画面
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, View, Alert } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacer } from '@/components/ui/spacer';
import { Spacing, Typography } from '@/constants/theme';
import { ItemList } from '@/features/_example/components/item-list';
import { useItemList } from '@/features/_example/hooks/use-item-list';
import { itemKeys } from '@/features/_example/services/query-keys';
import { itemRepository } from '@/features/_example/services/repository';
import { useThemedColors } from '@/hooks/use-theme-color';
import { useStore } from '@/store';

export default function DemoScreen() {
  const { colors } = useThemedColors();
  const { items, isLoading, refetch } = useItemList();
  const queryClient = useQueryClient();

  // Mutation for adding items
  const addItem = useMutation({
    mutationFn: itemRepository.create,
    onSuccess: (data) => {
      console.log('Item created:', data);
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to create item:', error);
      Alert.alert('エラー', 'アイテムの追加に失敗しました');
    },
  });

  // Mutation for deleting items
  const deleteItem = useMutation({
    mutationFn: itemRepository.delete,
    onSuccess: () => {
      console.log('Item deleted');
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete item:', error);
      Alert.alert('エラー', 'アイテムの削除に失敗しました');
    },
  });

  // Zustand状態管理のデモ
  const isOnboarded = useStore((state) => state.isOnboarded);
  const isPremium = useStore((state) => state.isPremium);
  const toggleOnboarded = useStore((state) => state.setOnboarded);
  const togglePremium = useStore((state) => state.setPremium);

  const handleAddItem = useCallback(() => {
    const title = `Item ${items.length + 1}`;
    const description = `Created at ${new Date().toLocaleTimeString()}`;
    console.log('Adding item:', { title, description });
    addItem.mutate({ title, description });
  }, [items.length, addItem]);

  const handleItemPress = useCallback(
    (id: number) => {
      Alert.alert(
        'アイテム削除',
        'このアイテムを削除しますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '削除',
            style: 'destructive',
            onPress: () => deleteItem.mutate(id),
          },
        ],
        { cancelable: true }
      );
    },
    [deleteItem]
  );

  const handleModalPress = useCallback(() => {
    router.push('/modal');
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Zustand状態管理デモ */}
      <Card style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Zustand 状態管理</ThemedText>
        <Spacer size="sm" />

        <View style={styles.stateRow}>
          <ThemedText style={styles.stateLabel}>Onboarded:</ThemedText>
          <ThemedText style={styles.stateValue}>
            {isOnboarded ? '✓ はい' : '✗ いいえ'}
          </ThemedText>
        </View>

        <View style={styles.stateRow}>
          <ThemedText style={styles.stateLabel}>Premium:</ThemedText>
          <ThemedText style={styles.stateValue}>
            {isPremium ? '✓ はい' : '✗ いいえ'}
          </ThemedText>
        </View>

        <Spacer size="md" />

        <View style={styles.buttonRow}>
          <Button
            onPress={() => toggleOnboarded(!isOnboarded)}
            variant="secondary"
            testID="toggle-onboarded"
            style={styles.halfButton}
          >
            Onboarded切替
          </Button>
          <Spacer size="sm" direction="horizontal" />
          <Button
            onPress={() => togglePremium(!isPremium)}
            variant="secondary"
            testID="toggle-premium"
            style={styles.halfButton}
          >
            Premium切替
          </Button>
        </View>
      </Card>

      <Spacer size="md" />

      {/* SQLite + TanStack Query デモ */}
      <Card style={styles.section}>
        <View style={styles.headerRow}>
          <ThemedText style={styles.sectionTitle}>
            SQLite データベース
          </ThemedText>
          <ThemedText style={styles.itemCount}>{items.length}件</ThemedText>
        </View>

        <Spacer size="sm" />

        <Button
          onPress={handleAddItem}
          variant="primary"
          loading={addItem.isPending}
          testID="add-item"
        >
          アイテム追加
        </Button>
      </Card>

      <Spacer size="md" />
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Spacer size="md" />

      {/* ナビゲーションデモ */}
      <Card style={styles.section}>
        <ThemedText style={styles.sectionTitle}>ナビゲーション</ThemedText>
        <Spacer size="sm" />
        <Button
          onPress={handleModalPress}
          variant="secondary"
          testID="open-modal"
        >
          モーダル画面を開く
        </Button>
      </Card>
    </View>
  );

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: colors.background.base }]}
    >
      <ItemList
        items={items}
        onItemPress={handleItemPress}
        onRefresh={refetch}
        refreshing={isLoading}
        testID="item-list"
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headline,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    ...Typography.subheadline,
  },
  stateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  stateLabel: {
    ...Typography.body,
  },
  stateValue: {
    ...Typography.body,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
  },
  halfButton: {
    flex: 1,
  },
});
