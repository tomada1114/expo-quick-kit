/**
 * PaywallComponent
 *
 * Presents purchase options to users when accessing premium features.
 * Displays products as cards with pricing, descriptions, and features.
 * Integrates with PurchaseService for purchase flow orchestration.
 * Supports dark/light mode with iOS System Colors (Apple HIG).
 *
 * @module features/purchase/presentation/paywall-component
 *
 * @example
 * ```tsx
 * <PaywallComponent
 *   featureId="premium_advanced_analytics"
 *   onPurchaseComplete={(purchase) => console.log('Purchased!', purchase)}
 *   onDismiss={() => router.back()}
 *   allowDismiss={true}
 * />
 * ```
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
  Pressable,
} from 'react-native';
import { useThemedColors } from '@/hooks/use-theme-color';
import { usePaywallStore } from '../store/paywall-store';

/**
 * Product information structure.
 */
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  priceString: string;
  currencyCode: string;
}

/**
 * Purchase entity structure.
 */
export interface Purchase {
  transactionId: string;
  productId: string;
  purchasedAt: Date;
  price: number;
  currencyCode: string;
  isVerified: boolean;
  isSynced: boolean;
  unlockedFeatures: string[];
}

/**
 * Error structure from PurchaseService.
 */
export interface PurchaseFlowError {
  code:
    | 'CANCELLED'
    | 'NETWORK_ERROR'
    | 'VERIFICATION_FAILED'
    | 'DB_ERROR'
    | 'UNKNOWN_ERROR';
  retryable: boolean;
}

/**
 * PaywallComponent props.
 */
export interface PaywallComponentProps {
  /** Feature ID to show purchase options for */
  featureId: string;
  /** Callback when purchase completes successfully */
  onPurchaseComplete?: (purchase: Purchase) => void;
  /** Callback when paywall is dismissed */
  onDismiss?: () => void;
  /** Whether user can dismiss paywall without purchasing */
  allowDismiss?: boolean;
}

/**
 * Feature definition from FeatureGatingService.
 */
interface FeatureDefinition {
  id: string;
  level: 'free' | 'premium';
  name: string;
  description: string;
  requiredProductId?: string;
}

/**
 * PaywallComponent - Premium feature purchase UI
 *
 * Displays available purchase options as cards with:
 * - Product name, price, description
 * - Unlocked features list
 * - Selection highlight
 * - Loading state during purchase
 * - Error handling with retry option
 * - Dark/light mode support (Apple HIG)
 *
 * @param props Component props
 * @returns JSX.Element
 */
export function PaywallComponent({
  featureId,
  onPurchaseComplete,
  onDismiss,
  allowDismiss = true,
}: PaywallComponentProps): React.JSX.Element {
  const { colors } = useThemedColors();
  const { selectedProductId, setSelectedProductId, resetSelection } =
    usePaywallStore();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [unlockedFeatures, setUnlockedFeatures] = useState<
    Map<string, FeatureDefinition[]>
  >(new Map());
  const [error, setError] = useState<PurchaseFlowError | null>(null);

  // Load products and features on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // TODO: In real implementation, fetch products from PurchaseService
        // For now, use mock data
        const mockProducts: Product[] = [
          {
            id: 'premium_unlock',
            title: 'Premium Features',
            description: 'Unlock all premium features for unlimited access',
            price: 9.99,
            priceString: '$9.99',
            currencyCode: 'USD',
          },
          {
            id: 'pro_unlock',
            title: 'Pro Features',
            description: 'Access professional tools and advanced analytics',
            price: 19.99,
            priceString: '$19.99',
            currencyCode: 'USD',
          },
        ];

        setProducts(mockProducts);

        // TODO: Load unlocked features for each product from FeatureGatingService
        // For now, use mock data
        const mockFeatures = new Map<string, FeatureDefinition[]>();
        mockFeatures.set('premium_unlock', [
          {
            id: 'feature1',
            name: 'Feature 1',
            level: 'premium',
            description: 'Premium feature',
          },
          {
            id: 'feature2',
            name: 'Feature 2',
            level: 'premium',
            description: 'Premium feature',
          },
        ]);

        setUnlockedFeatures(mockFeatures);
      } catch (e) {
        // Handle loading errors silently and show empty state
        console.error('Failed to load products:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [featureId]);

  /**
   * Handle product purchase.
   * Validates selection, shows loading state, calls PurchaseService,
   * and triggers callbacks.
   */
  const handlePurchase = useCallback(async () => {
    if (!selectedProductId) {
      Alert.alert('Error', 'Please select a product');
      return;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      // TODO: Call PurchaseService.purchaseProduct(selectedProductId)
      // For now, simulate the call
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      await delay(2000);

      // Simulate successful purchase
      const mockPurchase: Purchase = {
        transactionId: `txn_${Date.now()}`,
        productId: selectedProductId,
        purchasedAt: new Date(),
        price: products.find((p) => p.id === selectedProductId)?.price ?? 0,
        currencyCode: 'USD',
        isVerified: true,
        isSynced: true,
        unlockedFeatures:
          unlockedFeatures.get(selectedProductId)?.map((f) => f.id) ?? [],
      };

      onPurchaseComplete?.(mockPurchase);
      resetSelection();
    } catch (err) {
      // Handle purchase errors
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError({
        code: 'UNKNOWN_ERROR',
        retryable: false,
      });
      console.error('Purchase failed:', errorMsg);
    } finally {
      setIsPurchasing(false);
    }
  }, [
    selectedProductId,
    products,
    unlockedFeatures,
    onPurchaseComplete,
    resetSelection,
  ]);

  /**
   * Handle paywall dismissal.
   */
  const handleDismiss = useCallback(() => {
    resetSelection();
    onDismiss?.();
  }, [onDismiss, resetSelection]);

  /**
   * Handle retry after error.
   */
  const handleRetry = useCallback(() => {
    setError(null);
    handlePurchase();
  }, [handlePurchase]);

  // Loading state
  if (isLoading) {
    return (
      <View
        testID="paywall-loading"
        style={[styles.container, { backgroundColor: colors.background.base }]}
      >
        <ActivityIndicator
          testID="loading-indicator"
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <View
        testID="paywall-empty"
        style={[styles.container, { backgroundColor: colors.background.base }]}
      >
        <Text
          testID="empty-message"
          style={[styles.emptyText, { color: colors.text.primary }]}
        >
          No purchase options available
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View
        testID="paywall-error"
        style={[styles.container, { backgroundColor: colors.background.base }]}
      >
        <Text
          testID="error-message"
          style={[styles.errorText, { color: colors.semantic.error }]}
        >
          Error: {error.code}
        </Text>
        {error.retryable && (
          <Pressable testID="retry-button" onPress={handleRetry}>
            <Text style={[styles.buttonText, { color: colors.primary }]}>
              Retry
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View
      testID="paywall-component"
      style={[styles.container, { backgroundColor: colors.background.base }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Product cards */}
        {products.map((product) => (
          <Pressable
            key={product.id}
            testID={`product-card-${product.id}`}
            onPress={() => setSelectedProductId(product.id)}
            style={[
              styles.productCard,
              {
                backgroundColor: colors.background.secondary,
                borderColor:
                  selectedProductId === product.id
                    ? colors.primary
                    : colors.interactive.separator,
              },
            ]}
          >
            {/* Selection indicator */}
            {selectedProductId === product.id && (
              <View
                testID={`selection-indicator-${product.id}`}
                style={[
                  styles.selectionIndicator,
                  { backgroundColor: colors.primary },
                ]}
              />
            )}

            {/* Product info */}
            <Text
              testID={`product-title-${product.id}`}
              style={[styles.productTitle, { color: colors.text.primary }]}
            >
              {product.title}
            </Text>

            <Text
              testID={`product-price-${product.id}`}
              style={[styles.productPrice, { color: colors.semantic.success }]}
            >
              {product.priceString}
            </Text>

            <Text
              testID={`product-description-${product.id}`}
              style={[
                styles.productDescription,
                { color: colors.text.secondary },
              ]}
            >
              {product.description}
            </Text>

            {/* Unlocked features */}
            {unlockedFeatures.has(product.id) &&
              unlockedFeatures.get(product.id)!.length > 0 && (
                <View
                  testID={`features-list-${product.id}`}
                  style={styles.featuresList}
                >
                  <Text
                    style={[
                      styles.featuresLabel,
                      { color: colors.text.tertiary },
                    ]}
                  >
                    Includes:
                  </Text>
                  {unlockedFeatures.get(product.id)!.map((feature) => (
                    <Text
                      key={feature.id}
                      testID={`feature-${feature.id}`}
                      style={[
                        styles.featureItem,
                        { color: colors.text.secondary },
                      ]}
                    >
                      • {feature.name}
                    </Text>
                  ))}
                </View>
              )}
          </Pressable>
        ))}
      </ScrollView>

      {/* Purchase button */}
      {selectedProductId && (
        <Pressable
          testID="purchase-button"
          onPress={handlePurchase}
          disabled={isPurchasing}
          style={[
            styles.purchaseButton,
            {
              backgroundColor: colors.primary,
              opacity: isPurchasing ? 0.5 : 1,
            },
          ]}
        >
          {isPurchasing ? (
            <ActivityIndicator
              testID="purchase-loading"
              color={colors.text.inverse}
            />
          ) : (
            <Text
              style={[
                styles.purchaseButtonText,
                { color: colors.text.inverse },
              ]}
            >
              Purchase
            </Text>
          )}
        </Pressable>
      )}

      {/* Dismiss button */}
      {allowDismiss && (
        <Pressable
          testID="dismiss-button"
          onPress={handleDismiss}
          style={styles.dismissButton}
        >
          <Text style={[styles.dismissButtonText, { color: colors.primary }]}>
            Dismiss
          </Text>
        </Pressable>
      )}

      {/* Loading overlay during purchase */}
      {isPurchasing && (
        <View
          testID="purchase-overlay"
          style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
        >
          <View
            style={[
              styles.loadingBox,
              { backgroundColor: colors.background.base },
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text.primary }]}>
              Processing purchase...
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
    paddingBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  productCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    position: 'relative',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  featuresList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  featuresLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  featureItem: {
    fontSize: 13,
    marginBottom: 4,
  },
  purchaseButton: {
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
});
