/**
 * Currency Formatter Utility
 *
 * Formats prices with currency codes following standard conventions.
 * Handles USD, JPY, EUR, and other common currencies.
 */

/**
 * Format price with currency code
 *
 * @param price - Price in decimal (e.g., 9.99)
 * @param currencyCode - ISO 4217 currency code (e.g., "USD", "JPY", "EUR")
 * @returns Formatted price string (e.g., "$9.99", "¥1,200")
 */
export function formatCurrency(price: number, currencyCode: string): string {
  // Handle zero price
  if (price === 0) {
    return 'Free';
  }

  // Handle invalid price
  if (price < 0) {
    return `Invalid Price`;
  }

  // Define currency symbols and decimal places
  const currencyConfig: Record<string, { symbol: string; decimals: number }> = {
    USD: { symbol: '$', decimals: 2 },
    EUR: { symbol: '€', decimals: 2 },
    GBP: { symbol: '£', decimals: 2 },
    JPY: { symbol: '¥', decimals: 0 },
    CNY: { symbol: '¥', decimals: 2 },
    INR: { symbol: '₹', decimals: 2 },
    KRW: { symbol: '₩', decimals: 0 },
    AUD: { symbol: 'A$', decimals: 2 },
    CAD: { symbol: 'C$', decimals: 2 },
    CHF: { symbol: 'Fr', decimals: 2 },
    SEK: { symbol: 'kr', decimals: 2 },
    NOK: { symbol: 'kr', decimals: 2 },
    DKK: { symbol: 'kr', decimals: 2 },
    NZD: { symbol: 'NZ$', decimals: 2 },
    ZAR: { symbol: 'R', decimals: 2 },
    SGD: { symbol: 'S$', decimals: 2 },
    HKD: { symbol: 'HK$', decimals: 2 },
    MXN: { symbol: '$', decimals: 2 },
    BRL: { symbol: 'R$', decimals: 2 },
  };

  const config = currencyConfig[currencyCode];

  if (!config) {
    // Fallback for unsupported currency
    return `${price.toFixed(2)} ${currencyCode}`;
  }

  const { symbol, decimals } = config;

  // Format number with thousands separator and proper decimal places
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const formattedPrice = formatter.format(price);

  return `${symbol}${formattedPrice}`;
}
