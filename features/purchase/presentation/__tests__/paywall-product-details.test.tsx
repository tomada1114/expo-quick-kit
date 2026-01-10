/**
 * PaywallComponent Product Details Display Tests (Task 12.2)
 *
 * Comprehensive TDD tests for displaying purchase option details:
 * - Product name, price with currency, description
 * - Unlocked features list
 * - Selection highlighting
 *
 * Test Coverage: Happy/Sad/Edge/Unhappy paths with 28+ test cases
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PaywallComponent } from '../components/paywall';
import { usePurchaseStore } from '../../infrastructure/purchase-store';
import { featureGatingService } from '../../application/feature-gating-service';
import { Product, FeatureDefinition } from '../../core/types';

// ============================================================
// Mocks
// ============================================================

jest.mock('../../infrastructure/purchase-store');
jest.mock('../../application/feature-gating-service');
jest.mock('@/hooks/use-theme-color', () => ({
  useThemedColors: jest.fn(() => ({
    colors: {
      primary: '#007AFF',
      background: {
        base: '#FFFFFF',
        secondary: '#F2F2F7',
        tertiary: '#FFFFFF',
      },
      text: {
        primary: '#000000',
        secondary: '#3C3C43',
        tertiary: '#8E8E93',
        inverse: '#FFFFFF',
      },
      semantic: {
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30',
        info: '#007AFF',
      },
      interactive: {
        separator: '#E5E5EA',
        fill: '#C7C7CC',
        fillSecondary: '#E8E8ED',
      },
      tint: '#007AFF',
      icon: '#686868',
      tabIconDefault: '#686868',
      tabIconSelected: '#007AFF',
    },
    colorScheme: 'light',
  })),
}));
jest.mock('../../infrastructure/currency-formatter', () => ({
  formatCurrency: jest.fn((price, currencyCode) => {
    if (price === 0) return 'Free';
    if (price < 0) return 'Invalid Price';

    const symbols: Record<string, string> = {
      USD: '$',
      JPY: '¥',
      EUR: '€',
    };
    const symbol = symbols[currencyCode] || currencyCode;

    const decimals = currencyCode === 'JPY' ? 0 : 2;
    const formatted = price.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return `${symbol}${formatted}`;
  }),
}));

// ============================================================
// Test Data Fixtures
// ============================================================

const mockProducts: Product[] = [
  {
    id: 'premium_unlock',
    title: 'Premium Unlock',
    description: 'Unlock all premium features',
    price: 9.99,
    priceString: '$9.99',
    currencyCode: 'USD',
  },
  {
    id: 'data_export',
    title: 'Data Export',
    description: 'Export your data in multiple formats',
    price: 4.99,
    priceString: '$4.99',
    currencyCode: 'USD',
  },
];

const mockFeatures: FeatureDefinition[] = [
  {
    id: 'advanced_search',
    level: 'premium',
    name: 'Advanced Search',
    description: 'Search with filters',
    requiredProductId: 'premium_unlock',
  },
  {
    id: 'advanced_analytics',
    level: 'premium',
    name: 'Advanced Analytics',
    description: 'Detailed analytics',
    requiredProductId: 'premium_unlock',
  },
  {
    id: 'csv_export',
    level: 'premium',
    name: 'CSV Export',
    description: 'Export to CSV',
    requiredProductId: 'data_export',
  },
];

// ============================================================
// Helper Functions
// ============================================================

function setupMocks(selectedProductId?: string) {
  (usePurchaseStore as jest.Mock).mockReturnValue({
    selectedProductId,
    setSelectedProductId: jest.fn(),
    isLoading: false,
    setLoading: jest.fn(),
    error: undefined,
    setError: jest.fn(),
    reset: jest.fn(),
  });

  (
    featureGatingService.getUnlockedFeaturesByProduct as jest.Mock
  ).mockImplementation((productId) => {
    return mockFeatures.filter((f) => f.requiredProductId === productId);
  });
}

// ============================================================
// Happy Path: Product Details Display
// ============================================================

describe('PaywallComponent - Happy Path: Product Details Display (Task 12.2)', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should display product name correctly', () => {
    // Given: Product with title "Premium Unlock"
    // When: PaywallComponent renders with products
    render(
      <PaywallComponent featureId="advanced_search" products={mockProducts} />
    );

    // Then: Product title should be displayed
    expect(screen.getByText('Premium Unlock')).toBeTruthy();
    expect(screen.getByText('Data Export')).toBeTruthy();
  });

  it('should display formatted price with USD currency', () => {
    // Given: Product with price 9.99 and currencyCode "USD"
    // When: PaywallComponent renders
    render(
      <PaywallComponent featureId="advanced_search" products={mockProducts} />
    );

    // Then: Should display "$9.99" formatted price
    expect(screen.getByText('$9.99')).toBeTruthy();
  });

  it('should display formatted price with JPY currency', () => {
    // Given: Product with price 1200 and currencyCode "JPY"
    const jpyProduct: Product = {
      id: 'premium_jpy',
      title: 'Premium Pack',
      description: 'Premium features',
      price: 1200,
      priceString: '¥1,200',
      currencyCode: 'JPY',
    };

    // When: PaywallComponent renders
    render(
      <PaywallComponent featureId="advanced_search" products={[jpyProduct]} />
    );

    // Then: Should display "¥1,200" formatted price
    expect(screen.getByText('¥1,200')).toBeTruthy();
  });

  it('should display formatted price with EUR currency', () => {
    // Given: Product with price 8.50 and currencyCode "EUR"
    const eurProduct: Product = {
      id: 'premium_eur',
      title: 'Premium Pack',
      description: 'Premium features',
      price: 8.5,
      priceString: '€8.50',
      currencyCode: 'EUR',
    };

    // When: PaywallComponent renders
    render(
      <PaywallComponent featureId="advanced_search" products={[eurProduct]} />
    );

    // Then: Should display "€8.50" formatted price
    expect(screen.getByText('€8.50')).toBeTruthy();
  });

  it('should display product description', () => {
    // Given: Product with description "Unlock all premium features"
    // When: PaywallComponent renders
    render(
      <PaywallComponent featureId="advanced_search" products={mockProducts} />
    );

    // Then: Description text should be visible
    expect(screen.getByText('Unlock all premium features')).toBeTruthy();
    expect(
      screen.getByText('Export your data in multiple formats')
    ).toBeTruthy();
  });

  it('should display unlocked features list for selected product', () => {
    // Given: Product "premium_unlock" unlocks ["advanced_search", "advanced_analytics"]
    // When: PaywallComponent renders with product
    render(
      <PaywallComponent featureId="advanced_search" products={mockProducts} />
    );

    // Then: Should display list of feature names
    expect(screen.getByText('Advanced Search')).toBeTruthy();
    expect(screen.getByText('Advanced Analytics')).toBeTruthy();
  });

  it('should display multiple products as separate cards', () => {
    // Given: Multiple products available
    // When: PaywallComponent renders
    render(
      <PaywallComponent featureId="advanced_search" products={mockProducts} />
    );

    // Then: All products should be displayed
    expect(screen.getByText('Premium Unlock')).toBeTruthy();
    expect(screen.getByText('Data Export')).toBeTruthy();
    expect(screen.getByText('$9.99')).toBeTruthy();
    expect(screen.getByText('$4.99')).toBeTruthy();
  });

  it('should display correct features for each product', () => {
    // Given: Different products unlock different features
    // When: PaywallComponent renders
    render(
      <PaywallComponent featureId="advanced_search" products={mockProducts} />
    );

    // Then: "data_export" product should show "CSV Export" feature
    // and "premium_unlock" should show "Advanced Search", "Advanced Analytics"
    const features = screen.getAllByText(/advanced|csv/i);
    expect(features.length).toBeGreaterThan(0);
  });
});

// ============================================================
// Happy Path: Selection Highlighting
// ============================================================

describe('PaywallComponent - Happy Path: Selection Highlighting (Task 12.2)', () => {
  it('should highlight selected product visually', () => {
    // Given: Product "premium_unlock" is selected
    setupMocks('premium_unlock');

    // When: PaywallComponent renders
    const { getByTestId } = render(
      <PaywallComponent featureId="advanced_search" products={mockProducts} />
    );

    // Then: Selected product card should have visual highlight
    const selectedCard = getByTestId('product-card-premium_unlock');
    expect(selectedCard.props.style).toEqual(
      expect.objectContaining({
        borderColor: expect.any(String),
        // or backgroundColor change, depending on implementation
      })
    );
  });

  it('should update highlight when selection changes', () => {
    // Given: Product "premium_unlock" initially selected
    setupMocks('premium_unlock');

    const { getByTestId, rerender } = render(
      <PaywallComponent featureId="advanced_search" products={mockProducts} />
    );

    // When: User taps on "data_export" product card
    const dataExportCard = getByTestId('product-card-data_export');
    fireEvent.press(dataExportCard);

    // Simulate selection update
    setupMocks('data_export');

    // Then: Highlight should move from "premium_unlock" to "data_export"
    rerender(
      <PaywallComponent featureId="advanced_search" products={mockProducts} />
    );

    const updatedSelectedCard = getByTestId('product-card-data_export');
    expect(updatedSelectedCard.props.style).toEqual(
      expect.objectContaining({
        borderColor: expect.any(String),
      })
    );
  });

  it('should not highlight any product when none is selected', () => {
    // Given: No product selected
    setupMocks(undefined);

    // When: PaywallComponent renders
    const { getByTestId } = render(
      <PaywallComponent featureId="advanced_search" products={mockProducts} />
    );

    // Then: All product cards should have default styling (no selection badge)
    const cards = ['premium_unlock', 'data_export'];
    cards.forEach((cardId) => {
      const badgeTestId = `selection-badge-${cardId}`;
      expect(screen.queryByTestId(badgeTestId)).toBeNull();
    });
  });
});

// ============================================================
// Sad Path: Empty/Missing Data
// ============================================================

describe('PaywallComponent - Sad Path: Empty/Missing Data (Task 12.2)', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should handle empty features list gracefully', () => {
    // Given: Product with no unlocked features
    const productNoFeatures: Product = {
      id: 'basic_pack',
      title: 'Basic Pack',
      description: 'Basic features',
      price: 2.99,
      priceString: '$2.99',
      currencyCode: 'USD',
    };

    (
      featureGatingService.getUnlockedFeaturesByProduct as jest.Mock
    ).mockReturnValue([]);

    // When: PaywallComponent renders
    const { getByTestId } = render(
      <PaywallComponent
        featureId="advanced_search"
        products={[productNoFeatures]}
      />
    );

    // Then: Should not crash, features section should be hidden or empty
    expect(getByTestId('product-card-basic_pack')).toBeTruthy();
  });

  it('should handle missing product description', () => {
    // Given: Product with empty description
    const productNoDesc: Product = {
      id: 'minimal',
      title: 'Minimal Pack',
      description: '',
      price: 1.99,
      priceString: '$1.99',
      currencyCode: 'USD',
    };

    // When: PaywallComponent renders
    render(
      <PaywallComponent
        featureId="advanced_search"
        products={[productNoDesc]}
      />
    );

    // Then: Should display product without crashing
    expect(screen.getByText('Minimal Pack')).toBeTruthy();
  });

  it('should handle missing product title', () => {
    // Given: Product with empty title
    const productNoTitle: Product = {
      id: 'no_title_product',
      title: '',
      description: 'Product description',
      price: 3.99,
      priceString: '$3.99',
      currencyCode: 'USD',
    };

    // When: PaywallComponent renders
    render(
      <PaywallComponent
        featureId="advanced_search"
        products={[productNoTitle]}
      />
    );

    // Then: Should display fallback (product ID or placeholder)
    expect(screen.getByText('no_title_product')).toBeTruthy();
  });

  it('should handle empty products array', () => {
    // Given: Empty products array
    // When: PaywallComponent renders
    render(<PaywallComponent featureId="advanced_search" products={[]} />);

    // Then: Should display empty state message
    expect(screen.getByText('No purchase options available')).toBeTruthy();
  });

  it('should filter out null/undefined product entries', () => {
    // Given: Product array with null/undefined entries
    const productsWithNull = [
      mockProducts[0],
      null as any,
      mockProducts[1],
      undefined as any,
    ];

    // When: PaywallComponent renders
    render(
      <PaywallComponent
        featureId="advanced_search"
        products={productsWithNull}
      />
    );

    // Then: Should display only valid products
    expect(screen.getByText('Premium Unlock')).toBeTruthy();
    expect(screen.getByText('Data Export')).toBeTruthy();
  });
});

// ============================================================
// Edge Cases: Boundary Values
// ============================================================

describe('PaywallComponent - Edge Cases: Boundary Values (Task 12.2)', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should handle very long product name gracefully', () => {
    // Given: Product title with 150 characters
    const longTitle =
      'Premium Unlock - Features Include Advanced Search, Analytics, Data Export, and More Advanced Features for Professional Users';
    const productLongName: Product = {
      id: 'long_title',
      title: longTitle,
      description: 'Premium features',
      price: 9.99,
      priceString: '$9.99',
      currencyCode: 'USD',
    };

    // When: PaywallComponent renders
    const { getByTestId } = render(
      <PaywallComponent
        featureId="advanced_search"
        products={[productLongName]}
      />
    );

    // Then: Should display/truncate without overflow
    expect(getByTestId('product-card-long_title')).toBeTruthy();
  });

  it('should handle very long product description gracefully', () => {
    // Given: Product description with 800 characters
    const longDesc = 'A'.repeat(800);
    const productLongDesc: Product = {
      id: 'long_desc',
      title: 'Premium',
      description: longDesc,
      price: 9.99,
      priceString: '$9.99',
      currencyCode: 'USD',
    };

    // When: PaywallComponent renders
    const { getByTestId } = render(
      <PaywallComponent
        featureId="advanced_search"
        products={[productLongDesc]}
      />
    );

    // Then: Should display without overflow
    expect(getByTestId('product-card-long_desc')).toBeTruthy();
  });

  it('should handle zero price (free product)', () => {
    // Given: Product with price = 0.00
    const freeProduct: Product = {
      id: 'free_trial',
      title: 'Free Trial',
      description: 'Free trial version',
      price: 0,
      priceString: 'Free',
      currencyCode: 'USD',
    };

    // When: PaywallComponent renders
    render(
      <PaywallComponent featureId="advanced_search" products={[freeProduct]} />
    );

    // Then: Should display "Free" instead of "$0.00"
    expect(screen.getByText('Free')).toBeTruthy();
  });

  it('should handle very large price', () => {
    // Given: Product with price = 999,999.99
    const expensiveProduct: Product = {
      id: 'expensive',
      title: 'Enterprise Package',
      description: 'Full enterprise features',
      price: 999999.99,
      priceString: '$999,999.99',
      currencyCode: 'USD',
    };

    // When: PaywallComponent renders
    render(
      <PaywallComponent
        featureId="advanced_search"
        products={[expensiveProduct]}
      />
    );

    // Then: Should format correctly with thousands separators
    expect(screen.getByText('$999,999.99')).toBeTruthy();
  });

  it('should handle very small price (0.01)', () => {
    // Given: Product with price = 0.01
    const tinyPrice: Product = {
      id: 'tiny_price',
      title: 'Penny Pack',
      description: 'Minimal features',
      price: 0.01,
      priceString: '$0.01',
      currencyCode: 'USD',
    };

    // When: PaywallComponent renders
    render(
      <PaywallComponent featureId="advanced_search" products={[tinyPrice]} />
    );

    // Then: Should display "$0.01" without rounding
    expect(screen.getByText('$0.01')).toBeTruthy();
  });

  it('should handle single feature in list', () => {
    // Given: Product unlocks only 1 feature
    const singleFeatureProduct: Product = {
      id: 'single_feature',
      title: 'Single Feature Pack',
      description: 'One feature unlock',
      price: 2.99,
      priceString: '$2.99',
      currencyCode: 'USD',
    };

    (
      featureGatingService.getUnlockedFeaturesByProduct as jest.Mock
    ).mockImplementation((productId) => {
      if (productId === 'single_feature') {
        return [mockFeatures[0]];
      }
      return [];
    });

    // When: PaywallComponent renders
    render(
      <PaywallComponent
        featureId="advanced_search"
        products={[singleFeatureProduct]}
      />
    );

    // Then: Should display single feature name
    expect(screen.getByText('Advanced Search')).toBeTruthy();
  });

  it('should handle many features (10+)', () => {
    // Given: Product unlocks 15 features
    const manyFeatures: FeatureDefinition[] = Array.from(
      { length: 15 },
      (_, i) => ({
        id: `feature_${i}`,
        level: 'premium',
        name: `Feature ${i}`,
        description: `Feature description ${i}`,
        requiredProductId: 'premium_unlock',
      })
    );

    (
      featureGatingService.getUnlockedFeaturesByProduct as jest.Mock
    ).mockReturnValue(manyFeatures);

    // When: PaywallComponent renders
    const { getByTestId } = render(
      <PaywallComponent featureId="advanced_search" products={mockProducts} />
    );

    // Then: Should display all features
    expect(getByTestId('features-list-premium_unlock')).toBeTruthy();
  });
});

// ============================================================
// Edge Cases: Currency Formatting
// ============================================================

describe('PaywallComponent - Edge Cases: Currency Formatting (Task 12.2)', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should handle unsupported currency code', () => {
    // Given: Product with unsupported currencyCode "XYZ"
    const unknownCurrency: Product = {
      id: 'unknown_curr',
      title: 'Mystery Pack',
      description: 'Unknown currency',
      price: 9.99,
      priceString: '9.99 XYZ',
      currencyCode: 'XYZ',
    };

    // When: PaywallComponent renders
    render(
      <PaywallComponent
        featureId="advanced_search"
        products={[unknownCurrency]}
      />
    );

    // Then: Should display fallback format (XYZ + price)
    expect(screen.getByText('XYZ9.99')).toBeTruthy();
  });

  it('should handle missing currency code', () => {
    // Given: Product with currencyCode = empty string
    const noCurrency: Product = {
      id: 'no_currency',
      title: 'Basic Pack',
      description: 'No currency',
      price: 5.99,
      priceString: '$5.99',
      currencyCode: '', // Empty string
    };

    // When: PaywallComponent renders
    render(
      <PaywallComponent featureId="advanced_search" products={[noCurrency]} />
    );

    // Then: Should display price with fallback
    expect(screen.getByText('5.99 ')).toBeTruthy();
  });

  it('should handle negative price (invalid)', () => {
    // Given: Product with negative price
    const negativePrice: Product = {
      id: 'negative_price',
      title: 'Invalid Pack',
      description: 'Invalid price',
      price: -9.99,
      priceString: '$-9.99',
      currencyCode: 'USD',
    };

    // When: PaywallComponent renders
    render(
      <PaywallComponent
        featureId="advanced_search"
        products={[negativePrice]}
      />
    );

    // Then: Should display invalid message
    expect(screen.getByText('Invalid Price')).toBeTruthy();
  });
});

// ============================================================
// Unhappy Path: Service Failures
// ============================================================

describe('PaywallComponent - Unhappy Path: Service Failures (Task 12.2)', () => {
  it('should handle FeatureGatingService error gracefully', () => {
    // Given: FeatureGatingService throws exception
    setupMocks();
    (
      featureGatingService.getUnlockedFeaturesByProduct as jest.Mock
    ).mockImplementation(() => {
      throw new Error('Service error');
    });

    // When: PaywallComponent renders
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <PaywallComponent featureId="advanced_search" products={mockProducts} />
    );

    // Then: Should display products without features and log error
    expect(screen.getByText('Premium Unlock')).toBeTruthy();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle FeatureGatingService returning undefined', () => {
    // Given: FeatureGatingService returns undefined
    setupMocks();
    (
      featureGatingService.getUnlockedFeaturesByProduct as jest.Mock
    ).mockReturnValue(undefined);

    // When: PaywallComponent renders
    render(
      <PaywallComponent featureId="advanced_search" products={mockProducts} />
    );

    // Then: Should treat as empty features array
    expect(screen.getByText('Premium Unlock')).toBeTruthy();
  });
});

// ============================================================
// Integration: Select Product Interaction
// ============================================================

describe('PaywallComponent - Integration: Product Selection (Task 12.2)', () => {
  it('should update selected product when product card is tapped', () => {
    // Given: PaywallComponent rendered with products and no initial selection
    setupMocks(undefined);

    const { getByTestId, rerender } = render(
      <PaywallComponent featureId="advanced_search" products={mockProducts} />
    );

    // When: User taps on product card
    const card = getByTestId('product-card-premium_unlock');
    fireEvent.press(card);

    // Then: Selection should be updated (mock changes to selectedProductId)
    // Simulate the store update
    setupMocks('premium_unlock');
    rerender(
      <PaywallComponent featureId="advanced_search" products={mockProducts} />
    );

    // Verify selection badge appears
    const selectionBadge = getByTestId('selection-badge-premium_unlock');
    expect(selectionBadge).toBeTruthy();
  });
});
