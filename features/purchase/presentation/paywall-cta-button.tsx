import React, { useCallback, useState } from 'react';
import {
  Pressable,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useThemedColors } from '@/hooks/use-theme-color';
import { Spacing, Typography } from '@/constants/theme';
import { PurchaseService } from '@/features/purchase/application/purchase-service';
import { Purchase, PurchaseFlowError } from '@/features/purchase/core/types';

interface PaywallCTAButtonProps {
  /** Product ID to purchase */
  productId: string;

  /** Whether purchase is in progress */
  isLoading?: boolean;

  /** Callback when purchase succeeds */
  onPurchaseComplete?: (purchase: Purchase) => void;

  /** Callback when purchase fails or is cancelled */
  onError?: (error: Partial<PurchaseFlowError>) => void;

  /** Optional button label override */
  label?: string;

  /** Whether button is disabled */
  disabled?: boolean;
}

/**
 * CTA (Call To Action) button for purchasing a product from the paywall.
 *
 * Responsibilities:
 * - Display a prominent "購入" button
 * - Handle tap events and call PurchaseService.purchaseProduct()
 * - Show loading indicator during purchase
 * - Prevent concurrent purchase attempts
 * - Call appropriate callbacks (onPurchaseComplete, onError)
 * - Apply Apple HIG-compliant styling (dark/light mode)
 *
 * Requirements: 5.4 (CTA button implementation)
 */
export function PaywallCTAButton({
  productId,
  isLoading = false,
  onPurchaseComplete,
  onError,
  label = '購入',
  disabled = false,
}: PaywallCTAButtonProps) {
  const { colors } = useThemedColors();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Partial<PurchaseFlowError> | null>(null);

  // Prevent concurrent purchase attempts
  const isButtonDisabled = isProcessing || isLoading || disabled || !productId;

  const handlePressButton = useCallback(async () => {
    // Guard: validation
    if (!productId || isButtonDisabled) {
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Get PurchaseService instance
      const purchaseService = new PurchaseService();

      // Launch purchase flow
      const result = await purchaseService.purchaseProduct(productId);

      if (result.success) {
        // Success: call onPurchaseComplete callback
        const purchase = result.data;
        onPurchaseComplete?.(purchase);
      } else {
        // Failure: call onError callback
        const flowError = result.error;
        setError(flowError);
        onError?.(flowError);
      }
    } catch (exception) {
      // Unexpected error: create generic error object
      const unexpectedError: Partial<PurchaseFlowError> = {
        code: 'UNKNOWN_ERROR',
        retryable: false,
      };
      setError(unexpectedError);
      onError?.(unexpectedError);
    } finally {
      setIsProcessing(false);
    }
  }, [productId, isButtonDisabled, onPurchaseComplete, onError]);

  const styles = StyleSheet.create({
    button: {
      backgroundColor: colors.interactive.fill,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: 12,
      minHeight: 44, // iOS minimum touch target
      justifyContent: 'center',
      alignItems: 'center',
      opacity: isButtonDisabled ? 0.5 : 1,
    },
    buttonText: {
      color: colors.text.inverse,
      fontSize: Typography.body.fontSize,
      fontWeight: Typography.body.fontWeight,
      textAlign: 'center',
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View>
      <Pressable
        testID="paywall-cta-button"
        onPress={handlePressButton}
        disabled={isButtonDisabled}
        accessible
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityHint="Tap to purchase this product"
        style={({ pressed }) => [
          styles.button,
          pressed &&
            !isButtonDisabled && {
              opacity: 0.8,
            },
        ]}
      >
        {isProcessing || isLoading ? (
          <View testID="cta-loading-indicator" style={styles.loadingContainer}>
            <ActivityIndicator
              size="small"
              color={colors.text.inverse}
              testID="cta-activity-indicator"
            />
          </View>
        ) : (
          <Text style={styles.buttonText}>{label}</Text>
        )}
      </Pressable>

      {error && (
        <Text
          testID="cta-error-text"
          style={{
            color: colors.semantic.error,
            marginTop: Spacing.sm,
            fontSize: 12,
          }}
        >
          エラーが発生しました
        </Text>
      )}
    </View>
  );
}
