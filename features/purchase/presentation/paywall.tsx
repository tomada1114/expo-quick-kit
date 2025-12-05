/**
 * PaywallComponent
 *
 * A comprehensive paywall UI component for one-time purchase (freemium model) feature gating.
 *
 * Features:
 * - Displays available purchase options as cards
 * - Supports product selection and highlighting
 * - Configurable dismiss button (controlled by allowDismiss prop)
 * - Loading and error state management
 * - Dark mode / Light mode support (Apple HIG compliant)
 * - Callback integration for purchase completion and dismissal
 *
 * @module features/purchase/presentation/paywall
 *
 * @example
 * ```tsx
 * import { PaywallComponent } from '@/features/purchase/presentation/paywall';
 *
 * function PremiumFeatureScreen() {
 *   return (
 *     <PaywallComponent
 *       featureId="premium_feature"
 *       allowDismiss={true}
 *       onPurchaseComplete={() => handleSuccess()}
 *       onDismiss={() => navigation.goBack()}
 *     />
 *   );
 * }
 * ```
 */

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/themed-text';
import { useThemedColors } from '@/hooks/use-theme-color';
import { usePurchaseStore } from '@/features/purchase/infrastructure/purchase-ui-store';
import { purchaseService } from '@/features/purchase/application';
import { featureGatingService } from '@/features/purchase/application';
import type { Purchase } from '@/features/purchase/core/domain';

/**
 * Error state with retryable flag
 * Tracks both the error message and whether it can be retried
 */
interface ErrorState {
  message: string;
  retryable: boolean;
  code?: string;
}

/**
 * Props for PaywallComponent
 */
export interface PaywallComponentProps {
  /**
   * Feature ID that requires purchase to access.
   * Used to determine which products unlock this feature.
   */
  featureId: string;

  /**
   * Callback fired when a purchase completes successfully.
   * Called with the completed purchase object.
   */
  onPurchaseComplete?: (purchase: Purchase) => void;

  /**
   * Callback fired when the paywall is dismissed.
   * Called before navigation back.
   */
  onDismiss?: () => void;

  /**
   * Controls whether the dismiss button is visible.
   * In freemium model, set to true to allow users to close without purchasing.
   * In premium model, set to false to force purchase.
   * @default true
   */
  allowDismiss?: boolean;
}

/**
 * Product option for display in the paywall
 * Represents a purchasable offering
 */
interface ProductOption {
  id: string;
  name: string;
  description: string;
  price: number;
  priceString: string;
  currencyCode: string;
  features: string[];
}

/**
 * PaywallComponent - Presents purchase options for accessing premium features
 *
 * Renders a scrollable list of product options as cards, allowing users to:
 * 1. View product details (name, price, features)
 * 2. Select a product for purchase
 * 3. Complete the purchase through PurchaseService
 * 4. Dismiss the paywall (if allowDismiss is true)
 *
 * @param props - PaywallComponentProps
 * @returns JSX.Element
 */
export function PaywallComponent({
  featureId,
  onPurchaseComplete,
  onDismiss,
  allowDismiss = true,
}: PaywallComponentProps): React.JSX.Element {
  const router = useRouter();
  const { colors } = useThemedColors();
  const { selectedProductId, isLoading, setSelectedProductId, setLoading } =
    usePurchaseStore();

  const [error, setError] = useState<ErrorState | null>(null);

  /**
   * Get available products for this feature
   * Retrieves products that unlock the gated feature
   */
  const availableProducts = useMemo<ProductOption[]>(() => {
    try {
      const featureDefinition =
        featureGatingService.getFeatureDefinition(featureId);

      if (!featureDefinition.ok) {
        setError({
          message: 'Feature not found',
          retryable: false,
          code: 'FEATURE_NOT_FOUND',
        });
        return [];
      }

      const feature = featureDefinition.value;

      if (!feature.requiredProductId) {
        setError({
          message: 'No products available for this feature',
          retryable: false,
          code: 'NO_PRODUCTS_AVAILABLE',
        });
        return [];
      }

      // For now, return a single product per feature
      // In the future, this could support multiple products per feature
      return [
        {
          id: feature.requiredProductId,
          name: feature.name,
          description: feature.description,
          price: 9.99, // TODO: Get from product metadata service
          priceString: '$9.99',
          currencyCode: 'USD',
          features: [feature.id],
        },
      ];
    } catch (err) {
      setError({
        message: 'Error loading products',
        retryable: true,
        code: 'PRODUCT_LOADING_ERROR',
      });
      return [];
    }
  }, [featureId]);

  /**
   * Handle product selection
   * Toggles selection state for the product card
   */
  const handleSelectProduct = useCallback(
    (productId: string) => {
      setSelectedProductId(
        selectedProductId === productId ? undefined : productId
      );
      setError(null);
    },
    [selectedProductId, setSelectedProductId]
  );

  /**
   * Handle purchase action
   * Initiates the purchase flow for the selected product
   */
  const handlePurchase = useCallback(async () => {
    if (!selectedProductId) {
      setError({
        message: 'Please select a product',
        retryable: false,
        code: 'NO_PRODUCT_SELECTED',
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await purchaseService.purchaseProduct(selectedProductId);

      if (!result.ok) {
        // Map PurchaseFlowError to ErrorState with retryable flag
        const { error: flowError } = result;
        setError({
          message: flowError.message || 'Purchase failed. Please try again.',
          retryable: flowError.retryable ?? false,
          code: flowError.code,
        });
        return;
      }

      // Purchase successful
      onPurchaseComplete?.(result.value);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError({
        message: errorMessage,
        retryable: true, // Unexpected errors are generally retryable
        code: 'UNEXPECTED_ERROR',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedProductId, onPurchaseComplete, setLoading]);

  /**
   * Handle paywall dismissal
   * Calls onDismiss callback and navigates back
   */
  const handleDismiss = useCallback(() => {
    onDismiss?.();
    if (router.canGoBack()) {
      router.back();
    }
  }, [onDismiss, router]);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.base }]}
      testID="purchase-paywall-container"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isLoading}
        testID="paywall-scroll-view"
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Choose Your Plan
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.text.secondary }]}
          >
            Select a plan to unlock premium features
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: colors.semantic.error },
            ]}
            testID="paywall-error-container"
          >
            <Text
              style={[styles.errorText, { color: colors.text.inverse }]}
              testID="paywall-error-text"
            >
              {error.message || 'An error occurred'}
            </Text>
            {/* Retry Button (only for retryable errors) */}
            {error.retryable && (
              <Pressable
                onPress={handlePurchase}
                disabled={!selectedProductId || isLoading}
                style={[
                  styles.retryButton,
                  {
                    backgroundColor: colors.text.inverse,
                    marginTop: 8,
                  },
                ]}
                testID="paywall-error-retry-button"
              >
                <Text
                  style={[
                    styles.retryButtonText,
                    { color: colors.semantic.error },
                  ]}
                >
                  再試行
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Products List */}
        {availableProducts.length > 0 ? (
          <View style={styles.productsList} testID="paywall-options-list">
            {availableProducts.map((product) => (
              <Pressable
                key={product.id}
                onPress={() => handleSelectProduct(product.id)}
                disabled={isLoading}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.interactive.separator,
                    opacity: isLoading ? 0.5 : 1,
                  },
                  selectedProductId === product.id && {
                    borderColor: colors.semantic.success,
                    borderWidth: 2,
                  },
                ]}
                testID={`paywall-product-card`}
                accessibilityLabel={`${product.name} - ${product.priceString}`}
              >
                <View style={styles.productInfo}>
                  <Text
                    style={[styles.productName, { color: colors.text.primary }]}
                  >
                    {product.name}
                  </Text>
                  <Text
                    style={[
                      styles.productDescription,
                      { color: colors.text.secondary },
                    ]}
                  >
                    {product.description}
                  </Text>

                  {/* Features List */}
                  {product.features.length > 0 && (
                    <View style={styles.featuresList}>
                      {product.features.map((feature) => (
                        <View key={feature} style={styles.featureItem}>
                          <Text
                            style={[
                              styles.featureText,
                              { color: colors.text.secondary },
                            ]}
                          >
                            ✓ {feature}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Price */}
                <View style={styles.priceContainer}>
                  <Text
                    style={[styles.price, { color: colors.semantic.success }]}
                  >
                    {product.priceString}
                  </Text>
                  <Text
                    style={[styles.priceTerm, { color: colors.text.secondary }]}
                  >
                    one-time
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text
              style={[styles.emptyStateText, { color: colors.text.secondary }]}
            >
              No products available
            </Text>
          </View>
        )}

        {/* Purchase Button */}
        <Pressable
          onPress={handlePurchase}
          disabled={!selectedProductId || isLoading}
          style={[
            styles.purchaseButton,
            {
              backgroundColor:
                selectedProductId && !isLoading
                  ? colors.semantic.success
                  : colors.interactive.fillSecondary,
            },
          ]}
          testID="paywall-purchase-button"
        >
          {isLoading ? (
            <ActivityIndicator
              color={colors.text.inverse}
              size={Platform.OS === 'android' ? 'large' : 'small'}
            />
          ) : (
            <Text
              style={[
                styles.purchaseButtonText,
                { color: colors.text.inverse },
              ]}
            >
              購入する
            </Text>
          )}
        </Pressable>

        {/* Dismiss Button (Freemium Model) */}
        {allowDismiss && (
          <Pressable
            onPress={handleDismiss}
            disabled={isLoading}
            style={[
              styles.dismissButton,
              {
                borderColor: colors.interactive.separator,
                opacity: isLoading ? 0.5 : 1,
              },
            ]}
            testID="paywall-dismiss-button"
          >
            <Text
              style={[styles.dismissButtonText, { color: colors.text.primary }]}
            >
              Maybe Later
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 },
          ]}
          testID="paywall-loading-overlay"
        >
          <View
            style={[
              styles.loadingContainer,
              { backgroundColor: colors.background.base },
            ]}
          >
            <ActivityIndicator
              size="large"
              color={colors.semantic.success}
              testID="paywall-loading-indicator"
            />
            <Text
              style={[styles.loadingText, { color: colors.text.primary }]}
              testID="paywall-loading-message"
            >
              購入を処理中...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerContainer: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  productsList: {
    marginBottom: 24,
  },
  optionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  featuresList: {
    marginTop: 8,
  },
  featureItem: {
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceTerm: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  purchaseButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 56,
    justifyContent: 'center',
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  dismissButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  dismissButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  retryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 56,
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingContainer: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
});
