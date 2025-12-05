/**
 * PaywallComponent - Premium Feature Purchase UI (Tasks 12.1 & 12.2)
 *
 * Displays purchasable products and handles user selection.
 * Features:
 * - Task 12.1: Base structure with card layout and state management
 * - Task 12.2: Product details display (name, price, description, features)
 *
 * Requirements: 5.1, 5.2, 5.3
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ListRenderItem,
  FlatList,
} from 'react-native';
import { useThemedColors } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius } from '@/constants/theme';
import { usePurchaseStore } from '../../infrastructure/purchase-store';
import { featureGatingService } from '../../application/feature-gating-service';
import { formatCurrency } from '../../infrastructure/currency-formatter';
import { Product, FeatureDefinition, Purchase } from '../../core/types';

// ============================================================
// Types
// ============================================================

export interface PaywallComponentProps {
  /** Feature ID that triggered the paywall */
  featureId: string;

  /** List of products available for purchase */
  products: (Product | null | undefined)[];

  /** Callback when purchase is completed */
  onPurchaseComplete?: (purchase: Purchase) => void;

  /** Callback when user dismisses paywall */
  onDismiss?: () => void;

  /** Allow user to dismiss paywall without purchasing */
  allowDismiss?: boolean;

  /** Test identifier */
  testID?: string;
}

// ============================================================
// Component
// ============================================================

export const PaywallComponent: React.FC<PaywallComponentProps> = ({
  featureId,
  products,
  onPurchaseComplete,
  onDismiss,
  allowDismiss = true,
  testID = 'paywall-component',
}) => {
  const { colors } = useThemedColors();
  const { selectedProductId, setSelectedProductId, error, setError } = usePurchaseStore();

  // Task 12.1: Filter and memoize valid products
  const validProducts = useMemo(() => {
    return products.filter(
      (p): p is Product => p !== null && p !== undefined && Boolean(p.id)
    );
  }, [products]);

  // Task 12.2: Fetch features for each product
  const [productFeatures, setProductFeatures] = React.useState<
    Record<string, FeatureDefinition[]>
  >({});

  useEffect(() => {
    const features: Record<string, FeatureDefinition[]> = {};

    for (const product of validProducts) {
      try {
        const unlockedFeatures = featureGatingService.getUnlockedFeaturesByProduct(
          product.id
        );
        features[product.id] = Array.isArray(unlockedFeatures) ? unlockedFeatures : [];
      } catch (err) {
        console.error(
          `Failed to load features for product ${product.id}:`,
          err instanceof Error ? err.message : 'Unknown error'
        );
        features[product.id] = [];
      }
    }

    setProductFeatures(features);
  }, [validProducts]);

  // Task 12.1: Handle product selection
  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
  };

  // Task 12.1: Render empty state
  if (validProducts.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.base },
        ]}
        testID={testID}
      >
        <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
          No purchase options available
        </Text>
      </View>
    );
  }

  // Task 12.1 & 12.2: Render product cards
  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.base }]}
      testID={testID}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {validProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            features={productFeatures[product.id] || []}
            isSelected={selectedProductId === product.id}
            onSelect={handleSelectProduct}
            colors={colors}
            testID={`product-card-${product.id}`}
          />
        ))}
      </ScrollView>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.semantic.error }]}>
          <Text style={[styles.errorText, { color: colors.text.inverse }]}>{error}</Text>
        </View>
      )}

      {allowDismiss && (
        <TouchableOpacity
          style={[styles.dismissButton, { backgroundColor: colors.background.secondary }]}
          onPress={onDismiss}
          testID="paywall-dismiss-button"
        >
          <Text style={[styles.dismissButtonText, { color: colors.text.primary }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================================
// ProductCard Component (Task 12.2)
// ============================================================

interface ProductCardProps {
  product: Product;
  features: FeatureDefinition[];
  isSelected: boolean;
  onSelect: (productId: string) => void;
  colors: ReturnType<typeof useThemedColors>['colors'];
  testID?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  features,
  isSelected,
  onSelect,
  colors,
  testID,
}) => {
  const formattedPrice = formatCurrency(product.price, product.currencyCode);
  const displayTitle = product.title || product.id;

  const cardStyles = [
    styles.productCard,
    {
      backgroundColor: colors.background.secondary,
      borderColor: isSelected ? colors.primary : colors.interactive.separator,
      borderWidth: isSelected ? 2 : 1,
    },
  ];

  return (
    <TouchableOpacity
      style={cardStyles}
      onPress={() => onSelect(product.id)}
      activeOpacity={0.7}
      testID={testID}
    >
      {/* Product Name (Task 12.2) */}
      <Text style={[styles.productTitle, { color: colors.text.primary }]} numberOfLines={2}>
        {displayTitle}
      </Text>

      {/* Price and Currency (Task 12.2) */}
      <Text style={[styles.productPrice, { color: colors.primary }]}>
        {formattedPrice}
      </Text>

      {/* Description (Task 12.2) */}
      {product.description && (
        <Text
          style={[styles.productDescription, { color: colors.text.secondary }]}
          numberOfLines={3}
        >
          {product.description}
        </Text>
      )}

      {/* Unlocked Features List (Task 12.2) */}
      {features.length > 0 && (
        <View style={styles.featuresSection} testID={`features-list-${product.id}`}>
          <Text style={[styles.featuresSectionTitle, { color: colors.text.primary }]}>
            Unlocks:
          </Text>
          <FlatList
            data={features}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item: feature }) => (
              <FeatureListItem feature={feature} colors={colors} />
            )}
          />
        </View>
      )}

      {/* Selection Indicator (Task 12.2) */}
      {isSelected && (
        <View
          style={[styles.selectionBadge, { backgroundColor: colors.primary }]}
          testID={`selection-badge-${product.id}`}
        >
          <Text style={[styles.selectionBadgeText, { color: colors.text.inverse }]}>
            ✓ Selected
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ============================================================
// FeatureListItem Component (Task 12.2)
// ============================================================

interface FeatureListItemProps {
  feature: FeatureDefinition;
  colors: ReturnType<typeof useThemedColors>['colors'];
}

const FeatureListItem: React.FC<FeatureListItemProps> = ({ feature, colors }) => (
  <View style={styles.featureItem}>
    <Text style={[styles.featureBullet, { color: colors.text.secondary }]}>•</Text>
    <Text style={[styles.featureName, { color: colors.text.secondary }]}>
      {feature.name}
    </Text>
  </View>
);

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },

  scrollContent: {
    paddingVertical: Spacing.sm,
  },

  // Empty State
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },

  // Product Card (Task 12.1 & 12.2)
  productCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },

  // Task 12.2: Product Details
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },

  productPrice: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },

  productDescription: {
    fontSize: 14,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },

  // Task 12.2: Features Section
  featuresSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },

  featuresSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },

  featureItem: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    alignItems: 'flex-start',
  },

  featureBullet: {
    fontSize: 14,
    marginRight: Spacing.sm,
    fontWeight: '600',
  },

  featureName: {
    fontSize: 14,
    flex: 1,
  },

  // Task 12.2: Selection Highlight
  selectionBadge: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },

  selectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Error Banner
  errorBanner: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.sm,
  },

  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Dismiss Button (Task 12.1)
  dismissButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },

  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
