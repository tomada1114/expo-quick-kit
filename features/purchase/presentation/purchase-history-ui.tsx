/**
 * PurchaseHistoryUI Component
 *
 * Displays user's purchase history as a scrollable list.
 * Shows all purchases with transaction ID, product name, price, and purchase date.
 * Includes verification and sync status indicators.
 * Provides error handling with retry capability.
 *
 * Requirement: 7.1 - PurchaseHistoryUI list component
 * - LocalDatabase から全購入を取得
 * - 各購入を list item で表示（商品名、金額、購入日時）
 *
 * @module features/purchase/presentation/purchase-history-ui
 *
 * @example
 * ```tsx
 * <PurchaseHistoryUI />
 * ```
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Platform,
  useColorScheme,
} from 'react-native';
import { useThemedColors } from '@/hooks/use-theme-color';
import { localDatabaseService } from '@/features/purchase/infrastructure/local-database-service';
import { PurchaseDetailsModal } from './purchase-details-modal';
import type { Result } from '@/features/purchase/core/types';

/**
 * Purchase record from database
 */
interface Purchase {
  transactionId: string;
  productId: string;
  purchasedAt: Date | number; // Can be Date object or Unix timestamp
  price: number;
  currencyCode: string;
  isVerified: boolean;
  isSynced: boolean;
  unlockedFeatures?: string[];
}

/**
 * Database error type
 */
interface DatabaseError {
  code: 'DB_ERROR' | 'INVALID_INPUT' | 'NOT_FOUND';
  message: string;
  retryable: boolean;
}

/**
 * Component state
 */
type LoadState = 'loading' | 'loaded' | 'error';

/**
 * PurchaseHistoryUI Component
 * Lists all purchases from LocalDatabase with formatted display
 */
const PurchaseHistoryUI: React.FC = () => {
  const { colors } = useThemedColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [error, setError] = useState<DatabaseError | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  /**
   * Load purchases from LocalDatabase
   */
  const loadPurchases = useCallback(async () => {
    try {
      setLoadState('loading');
      setError(null);

      const result = await localDatabaseService.getAllPurchases();

      if (!result.success) {
        setError(result.error);
        setLoadState('error');
        return;
      }

      if (!Array.isArray(result.data)) {
        setError({
          code: 'DB_ERROR',
          message: 'Invalid response from database',
          retryable: true,
        });
        setLoadState('error');
        return;
      }

      // Convert timestamp to Date if necessary
      const processedPurchases = result.data.map(purchase => {
        const purchasedAt =
          purchase.purchasedAt instanceof Date
            ? purchase.purchasedAt
            : new Date((purchase.purchasedAt as number) * 1000);

        return {
          ...purchase,
          purchasedAt,
        };
      });

      setPurchases(processedPurchases);
      setLoadState('loaded');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError({
        code: 'DB_ERROR',
        message: `Failed to load purchases: ${message}`,
        retryable: true,
      });
      setLoadState('error');
      console.error('[PurchaseHistoryUI] Failed to load purchases:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  /**
   * Load purchases on mount
   */
  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadPurchases();
  }, [loadPurchases]);

  /**
   * Handle retry button press
   */
  const handleRetry = useCallback(() => {
    loadPurchases();
  }, [loadPurchases]);

  /**
   * Handle purchase item press to show details
   */
  const handlePurchasePress = useCallback((purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setIsModalVisible(true);
  }, []);

  /**
   * Handle modal close
   */
  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
    setSelectedPurchase(null);
  }, []);

  /**
   * Format currency value
   */
  const formatCurrency = useCallback(
    (price: number, currencyCode: string): string => {
      try {
        const formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return formatter.format(price);
      } catch {
        // Fallback for unsupported currency codes
        return `${price.toFixed(2)} ${currencyCode}`;
      }
    },
    []
  );

  /**
   * Format purchase date
   */
  const formatDate = useCallback((date: Date): string => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return date.toLocaleString();
    }
  }, []);

  /**
   * Render single purchase list item
   */
  const renderPurchaseItem = useCallback(
    ({ item }: { item: Purchase }) => {
      const safeProductId = item.productId || 'Unknown Product';
      const safeTransactionId = item.transactionId || 'Unknown Transaction';
      const formattedPrice = formatCurrency(item.price, item.currencyCode);
      const formattedDate = formatDate(item.purchasedAt);

      return (
        <Pressable
          testID={`purchase-list-item-${item.transactionId}`}
          onPress={() => handlePurchasePress(item)}
          style={({ pressed }) => [
            styles.purchaseItem,
            {
              backgroundColor: isDark ? colors.background.secondary : colors.background.base,
              borderColor: colors.interactive.separator,
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          {/* Main info row */}
          <View style={styles.mainContent}>
            {/* Transaction ID and Product ID */}
            <View style={styles.headerRow}>
              <Text
                style={[styles.transactionId, { color: colors.text.primary }]}
                numberOfLines={1}>
                {safeTransactionId}
              </Text>
              <Text
                style={[styles.productId, { color: colors.text.secondary }]}
                numberOfLines={1}>
                {safeProductId}
              </Text>
            </View>

            {/* Price and Currency */}
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.text.primary }]}>
                {formattedPrice}
              </Text>
              <Text style={[styles.currency, { color: colors.text.tertiary }]}>
                {item.currencyCode}
              </Text>
            </View>

            {/* Purchase Date */}
            <Text style={[styles.date, { color: colors.text.tertiary }]}>
              {formattedDate}
            </Text>
          </View>

          {/* Status indicators */}
          <View style={styles.statusSection}>
            {/* Verification Status */}
            <View
              testID={`verification-status-${item.transactionId}`}
              style={[
                styles.statusBadge,
                {
                  backgroundColor: item.isVerified
                    ? colors.semantic.success
                    : colors.semantic.warning,
                },
              ]}>
              <Text style={[styles.statusText, { color: colors.text.inverse }]}>
                {item.isVerified ? '✓' : '!'}
              </Text>
            </View>

            {/* Sync Status */}
            <View
              testID={`sync-status-${item.transactionId}`}
              style={[
                styles.statusBadge,
                {
                  backgroundColor: item.isSynced
                    ? colors.semantic.info
                    : colors.interactive.fillSecondary,
                },
              ]}>
              <Text style={[styles.statusText, { color: colors.text.inverse }]}>
                {item.isSynced ? '↓' : '↑'}
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [colors, isDark, formatCurrency, formatDate, handlePurchasePress]
  );

  /**
   * Render empty state
   */
  if (loadState === 'loaded' && purchases.length === 0) {
    return (
      <View
        testID="empty-state"
        style={[
          styles.container,
          { backgroundColor: colors.background.base },
        ]}>
        <View style={styles.emptyContent}>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No purchases
          </Text>
          <Text style={[styles.emptyMessage, { color: colors.text.secondary }]}>
            You haven't made any purchases yet.
          </Text>
        </View>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (loadState === 'error' && error) {
    return (
      <View
        testID="error-state"
        style={[
          styles.container,
          { backgroundColor: colors.background.base },
        ]}>
        <View style={styles.errorContent}>
          <Text style={[styles.errorTitle, { color: colors.semantic.error }]}>
            Error loading purchases
          </Text>
          <Text style={[styles.errorMessage, { color: colors.text.secondary }]}>
            {error.message}
          </Text>
          {error.retryable && (
            <Pressable
              testID="retry-button"
              style={[
                styles.retryButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleRetry}>
              <Text style={[styles.retryButtonText, { color: colors.text.inverse }]}>
                Try Again
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  /**
   * Render loading state
   */
  if (loadState === 'loading') {
    return (
      <View
        testID="loading-state"
        style={[
          styles.container,
          { backgroundColor: colors.background.base },
        ]}>
        <ActivityIndicator
          testID="loading-indicator"
          size="large"
          color={colors.primary}
          style={styles.loadingIndicator}
        />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Loading purchases...
        </Text>
      </View>
    );
  }

  /**
   * Render purchase list
   */
  return (
    <View style={[styles.container, { backgroundColor: colors.background.base }]}>
      <FlatList
        testID="purchase-list"
        data={purchases}
        keyExtractor={item => item.transactionId}
        renderItem={renderPurchaseItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        scrollIndicatorInsets={{ right: 1 }}
      />
      <PurchaseDetailsModal
        testID="purchase-details-modal"
        visible={isModalVisible}
        purchase={selectedPurchase}
        onClose={handleModalClose}
      />
    </View>
  );
};

/**
 * Stylesheet
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // List content
  listContent: {
    padding: 16,
    gap: 12,
  },

  // Purchase item
  purchaseItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },

  mainContent: {
    flex: 1,
    gap: 8,
  },

  headerRow: {
    gap: 8,
  },

  transactionId: {
    fontSize: 14,
    fontWeight: '600',
  },

  productId: {
    fontSize: 12,
  },

  priceRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'baseline',
  },

  price: {
    fontSize: 16,
    fontWeight: '700',
  },

  currency: {
    fontSize: 12,
  },

  date: {
    fontSize: 12,
  },

  // Status section
  statusSection: {
    flexDirection: 'row',
    gap: 8,
  },

  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty state
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },

  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Error state
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
  },

  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },

  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Loading state
  loadingIndicator: {
    marginTop: '30%',
  },

  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default PurchaseHistoryUI;
