/**
 * PurchaseDetailsModal
 *
 * Displays detailed information about a completed purchase in a modal dialog.
 * Shows product name, price, purchase date, transaction ID, and unlocked features.
 * Applies Apple HIG design with iOS System Colors and dark mode support.
 *
 * @module features/purchase/presentation/purchase-details-modal
 */

import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Purchase } from '@/features/purchase/core/types';
import { useThemedColors } from '@/hooks/use-theme-color';
import { formatCurrency } from '@/features/purchase/infrastructure/currency-formatter';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

/**
 * Props for PurchaseDetailsModal
 */
export interface PurchaseDetailsModalProps {
  /** Whether the modal is visible */
  visible: boolean;

  /** Purchase object to display (can be null/undefined if not visible) */
  purchase: Purchase | null | undefined;

  /** Callback when modal should close */
  onClose: () => void;

  /** Task 13.3: Whether to show receipt verification information (optional, default true) */
  showReceiptInfo?: boolean;

  /** Color scheme override for testing */
  colorScheme?: 'light' | 'dark';
}

/**
 * Formats a date to a readable string.
 * @param date - Date to format
 * @returns Formatted date string (e.g., "December 4, 2025 3:30 PM")
 */
function formatPurchaseDate(date: Date): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Unknown';
  }
  try {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown';
  }
}

/**
 * PurchaseDetailsModal Component
 *
 * Displays purchase details in a modal with:
 * - Product name (from product ID if name not available)
 * - Price with currency formatting
 * - Purchase date and time
 * - Transaction ID for reference
 * - Unlocked features list
 * - Close button
 *
 * Styling follows Apple HIG with themed colors and proper spacing.
 */
export function PurchaseDetailsModal({
  visible,
  purchase,
  onClose,
  showReceiptInfo = true,
  colorScheme: overrideColorScheme,
}: PurchaseDetailsModalProps) {
  const { colors } = useThemedColors();

  // Memoize formatted data to avoid recalculation on every render
  const formattedData = useMemo(() => {
    if (!purchase) {
      return {
        purchaseDate: '',
        formattedPrice: '',
      };
    }

    return {
      purchaseDate: formatPurchaseDate(purchase.purchasedAt),
      formattedPrice: formatCurrency(purchase.price, purchase.currencyCode),
    };
  }, [purchase]);

  // Coerce isVerified and isSynced to boolean safely
  const isVerified = purchase ? Boolean(purchase.isVerified) : false;
  const isSynced = purchase ? Boolean(purchase.isSynced) : false;

  // Don't render if modal not visible or purchase not available
  if (!visible || !purchase) {
    return null;
  }

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      maxHeight: '90%',
      width: '90%',
      backgroundColor: colors.background.base,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    header: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.interactive.separator,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      ...Typography.headline,
      color: colors.text.primary,
      flex: 1,
    },
    closeButton: {
      padding: Spacing.sm,
      marginLeft: Spacing.sm,
    },
    closeButtonText: {
      fontSize: 24,
      color: colors.text.secondary,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    section: {
      marginBottom: Spacing.lg,
    },
    sectionLabel: {
      ...Typography.caption1,
      color: colors.text.secondary,
      marginBottom: Spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionValue: {
      ...Typography.body,
      color: colors.text.primary,
      marginBottom: Spacing.md,
    },
    priceSection: {
      backgroundColor: colors.background.secondary,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
    },
    priceLabel: {
      ...Typography.caption1,
      color: colors.text.secondary,
      marginBottom: Spacing.xs,
    },
    priceValue: {
      ...Typography.title1,
      color: colors.semantic.success,
      fontWeight: '600',
    },
    featuresList: {
      marginTop: Spacing.sm,
    },
    featureItem: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      backgroundColor: colors.background.secondary,
      borderRadius: BorderRadius.sm,
      marginBottom: Spacing.xs,
      borderLeftWidth: 3,
      borderLeftColor: colors.semantic.info,
    },
    featureText: {
      ...Typography.caption1,
      color: colors.text.primary,
    },
    emptyFeaturesText: {
      ...Typography.caption1,
      color: colors.text.secondary,
      fontStyle: 'italic',
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.background.secondary,
      marginBottom: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
    infoLabel: {
      ...Typography.caption1,
      color: colors.text.secondary,
      flex: 1,
    },
    infoValue: {
      ...Typography.caption2,
      color: colors.text.primary,
      flex: 1,
      textAlign: 'right',
    },
    // Task 13.3: Receipt Information Visualization
    receiptSection: {
      backgroundColor: colors.background.secondary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
      borderLeftWidth: 3,
      borderLeftColor: colors.semantic.info,
    },
    receiptStatusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    receiptStatusBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    receiptStatusBadgeText: {
      ...Typography.caption1,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      testID="purchase-details-modal"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Purchase Details
            </Text>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              testID="close-button"
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} bounces={false}>
            {/* Product Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Product</Text>
              <Text style={styles.sectionValue} numberOfLines={2}>
                {purchase.productId}
              </Text>
            </View>

            {/* Price Section (Highlighted) */}
            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>Amount</Text>
              <Text style={styles.priceValue}>
                {formattedData.formattedPrice}
              </Text>
            </View>

            {/* Purchase Date Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Purchase Date</Text>
              <Text style={styles.sectionValue}>{formattedData.purchaseDate}</Text>
            </View>

            {/* Transaction ID Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Transaction ID</Text>
              <Text
                style={styles.sectionValue}
                selectable={true}
                numberOfLines={2}
              >
                {purchase.transactionId}
              </Text>
            </View>

            {/* Receipt Information Section - Task 13.3 */}
            {showReceiptInfo && (
              <View
                style={styles.receiptSection}
                testID="receipt-info-section"
                accessible
                accessibilityLabel="Receipt information section"
              >
                <Text style={styles.sectionLabel}>Receipt Information</Text>

                {/* Verification Status */}
                <View
                  style={styles.receiptStatusRow}
                  testID="receipt-verification-status-container"
                >
                  <Text style={styles.infoLabel}>Verification Status</Text>
                  <View
                    style={[
                      styles.receiptStatusBadge,
                      {
                        backgroundColor: isVerified
                          ? colors.semantic.success
                          : colors.semantic.error,
                      },
                    ]}
                    testID="receipt-verification-status"
                    accessible
                    accessibilityLabel={`Receipt verification status: ${
                      isVerified ? 'verified' : 'not verified'
                    }`}
                  >
                    <Text style={styles.receiptStatusBadgeText}>
                      {isVerified ? '✓ Verified' : '✗ Not Verified'}
                    </Text>
                  </View>
                </View>

                {/* Sync Status */}
                <View
                  style={styles.receiptStatusRow}
                  testID="receipt-sync-status-container"
                >
                  <Text style={styles.infoLabel}>Sync Status</Text>
                  <View
                    style={[
                      styles.receiptStatusBadge,
                      {
                        backgroundColor: isSynced
                          ? colors.semantic.success
                          : colors.semantic.warning || '#FF9500',
                      },
                    ]}
                    testID="receipt-sync-status"
                    accessible
                    accessibilityLabel={`Sync status: ${
                      isSynced ? 'synchronized' : 'pending synchronization'
                    }`}
                  >
                    <Text style={styles.receiptStatusBadgeText}>
                      {isSynced ? '✓ Synced' : '○ Pending'}
                    </Text>
                  </View>
                </View>

                {/* Verification Timestamp */}
                {isVerified && purchase && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Verified At</Text>
                    <Text style={styles.infoValue}>
                      {purchase.purchasedAt
                        ? purchase.purchasedAt.toLocaleDateString('en-US')
                        : 'Unknown'}
                    </Text>
                  </View>
                )}

                {/* Sync Timestamp */}
                {isSynced && purchase && purchase.syncedAt && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Synced At</Text>
                    <Text style={styles.infoValue}>
                      {purchase.syncedAt.toLocaleDateString('en-US')}
                    </Text>
                  </View>
                )}

                {/* Pending Sync Notice */}
                {!isSynced && (
                  <Text
                    style={[
                      styles.sectionValue,
                      { color: colors.semantic.warning, fontSize: 12 },
                    ]}
                    accessibilityLabel="Pending synchronization notice"
                  >
                    ※ Pending sync or offline mode
                  </Text>
                )}
              </View>
            )}

            {/* Status Information (Legacy) */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Status</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Verified</Text>
                <Text style={styles.infoValue}>
                  {isVerified ? '✓' : '✗'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Synced</Text>
                <Text style={styles.infoValue}>
                  {isSynced ? '✓' : '✗'}
                </Text>
              </View>
            </View>

            {/* Unlocked Features Section */}
            {purchase.unlockedFeatures && purchase.unlockedFeatures.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Unlocked Features</Text>
                <View style={styles.featuresList}>
                  {purchase.unlockedFeatures.map((feature, index) => (
                    <View key={`${feature}-${index}`} style={styles.featureItem}>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Empty features placeholder */}
            {(!purchase.unlockedFeatures ||
              purchase.unlockedFeatures.length === 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Unlocked Features</Text>
                <Text style={styles.emptyFeaturesText}>
                  No features unlocked with this purchase
                </Text>
              </View>
            )}

            {/* Extra bottom padding for scroll */}
            <View style={{ height: Spacing.md }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
