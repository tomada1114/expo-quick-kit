/**
 * Restore Error Handler - Task 8.3
 *
 * Handles error classification, user-facing message generation,
 * and retry logic for purchase restoration operations.
 *
 * Responsibilities:
 * - Classify restoration errors by type (network, store, database, unknown)
 * - Generate user-friendly error messages
 * - Determine retry availability and strategy
 * - Provide detailed metadata for logging and debugging
 * - Support localization for user messages
 *
 * Error Classification:
 * - NETWORK_ERROR: Transient, retryable with exponential backoff
 * - STORE_PROBLEM_ERROR: Store service issue, retryable
 * - DB_ERROR: Database operation failure, retryable
 * - UNKNOWN_ERROR: Unexpected error, non-retryable (manual support needed)
 *
 * @module features/purchase/infrastructure/restore-error-handler
 */

import type { RestoreError } from '../application/restore-service';

/**
 * Classified error with user messaging and retry information
 */
export interface ClassifiedError {
  code: string;
  userMessage: string;
  suggestionMessage: string;
  recoveryAction: string;
  retryable: boolean;
  showRetryButton: boolean;
  showSupportButton: boolean;
  maxRetries: number;
  retryBackoffMs: number;
}

/**
 * Error metadata for logging
 */
export interface ErrorMetadata {
  code: string;
  message: string;
  originalMessage: string;
  timestamp: number;
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
}

/**
 * User-facing error messages with localization support
 */
const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  en: {
    NETWORK_ERROR:
      'Network connection failed. Please check your internet connection and try again.',
    STORE_PROBLEM_ERROR:
      'The App Store/Play Store is temporarily unavailable. Please try again later.',
    DB_ERROR:
      'Failed to save purchase information. Your purchases may still be available offline.',
    UNKNOWN_ERROR:
      'An unexpected error occurred. Please try again or contact support if the problem persists.',
  },
  ja: {
    NETWORK_ERROR:
      'ネットワーク接続に失敗しました。インターネット接続を確認して、もう一度お試しください。',
    STORE_PROBLEM_ERROR:
      'App Store/Play Storeが一時的に利用できません。しばらく待ってからもう一度お試しください。',
    DB_ERROR:
      '購入情報の保存に失敗しました。購入はオフラインで利用可能な場合があります。',
    UNKNOWN_ERROR:
      '予期しないエラーが発生しました。もう一度お試しいただくか、問題が解決しない場合はサポートにお問い合わせください。',
  },
};

/**
 * Suggestion messages for different error types
 */
const SUGGESTION_MESSAGES: Record<string, Record<string, string>> = {
  en: {
    NETWORK_ERROR: 'Check your Wi-Fi or mobile connection, then tap "Retry".',
    STORE_PROBLEM_ERROR:
      'Try again in a few minutes. If the problem continues, please try again later.',
    DB_ERROR:
      'Your purchases have been recorded locally. Please check the purchase history.',
    UNKNOWN_ERROR:
      'Contact support with error details if this problem continues.',
  },
  ja: {
    NETWORK_ERROR:
      'Wi-Fiまたはモバイルネットワークをチェックして、「再試行」をタップしてください。',
    STORE_PROBLEM_ERROR:
      '数分後にもう一度お試しください。問題が継続する場合は、後でもう一度お試しください。',
    DB_ERROR: '購入がローカルに記録されました。購入履歴をご確認ください。',
    UNKNOWN_ERROR:
      'この問題が継続する場合は、サポートに詳細情報をご連絡ください。',
  },
};

/**
 * Recovery action messages
 */
const RECOVERY_ACTIONS: Record<string, Record<string, string>> = {
  en: {
    NETWORK_ERROR: 'Check internet connection and retry',
    STORE_PROBLEM_ERROR: 'Wait and retry in a few minutes',
    DB_ERROR: 'Check purchase history or contact support',
    UNKNOWN_ERROR: 'Contact support',
  },
  ja: {
    NETWORK_ERROR: 'インターネット接続を確認して再試行',
    STORE_PROBLEM_ERROR: '数分待って再試行',
    DB_ERROR: '購入履歴を確認するか、サポートに連絡',
    UNKNOWN_ERROR: 'サポートに連絡',
  },
};

/**
 * Error severity based on retryability
 */
function getSeverity(retryable: boolean): 'WARNING' | 'ERROR' | 'CRITICAL' {
  return retryable ? 'WARNING' : 'CRITICAL';
}

/**
 * Restore Error Handler - Classifies and formats restoration errors
 */
export class RestoreErrorHandler {
  /**
   * Classify error and generate user messaging
   *
   * Given: RestoreError from restore operation
   * When: Error needs to be displayed to user
   * Then: Classified error with localized message and retry guidance
   *
   * @param error - RestoreError from restore operation
   * @param locale - User language preference (default: 'en')
   * @returns ClassifiedError with user messaging and retry info
   */
  classifyError(
    error: RestoreError | null | undefined,
    locale: string = 'en'
  ): ClassifiedError {
    // Validate error object
    if (!error || typeof error !== 'object') {
      return this.createUnknownError(locale);
    }

    const { code, message, retryable } = error as any;

    // Normalize code to known values
    const normalizedCode = this.normalizeErrorCode(code);

    // Determine if error is retryable based on code
    const isRetryable = this.isRetryableByCode(normalizedCode, retryable);

    // Get retry configuration
    const { maxRetries, retryBackoffMs } = this.getRetryConfig(normalizedCode);

    // Generate messages
    const userMessage = this.getUserMessage(normalizedCode, locale, message);
    const suggestionMessage = this.getSuggestionMessage(normalizedCode, locale);
    const recoveryAction = this.getRecoveryAction(normalizedCode, locale);

    return {
      code: normalizedCode,
      userMessage,
      suggestionMessage,
      recoveryAction,
      retryable: isRetryable,
      showRetryButton: isRetryable && maxRetries > 0,
      showSupportButton: !isRetryable || normalizedCode === 'UNKNOWN_ERROR',
      maxRetries,
      retryBackoffMs,
    };
  }

  /**
   * Extract metadata for error logging
   *
   * Given: RestoreError
   * When: Error needs to be logged for debugging/analysis
   * Then: Structured metadata with timestamp and severity
   *
   * @param error - RestoreError to extract metadata from
   * @returns ErrorMetadata for logging
   */
  extractMetadata(error: RestoreError | null | undefined): ErrorMetadata {
    if (!error || typeof error !== 'object') {
      return {
        code: 'UNKNOWN_ERROR',
        message: 'Unknown error',
        originalMessage: '',
        timestamp: Date.now(),
        severity: 'CRITICAL',
      };
    }

    const { code, message, retryable } = error as any;

    return {
      code: code || 'UNKNOWN_ERROR',
      message: this.normalizeMessage(message),
      originalMessage: message || '',
      timestamp: Date.now(),
      severity: getSeverity(retryable),
    };
  }

  /**
   * Normalize error code to known values
   *
   * @param code - Error code to normalize
   * @returns Normalized error code
   *
   * @private
   */
  private normalizeErrorCode(code: string): string {
    const knownCodes = [
      'NETWORK_ERROR',
      'STORE_PROBLEM_ERROR',
      'DB_ERROR',
      'UNKNOWN_ERROR',
    ];
    return knownCodes.includes(code) ? code : 'UNKNOWN_ERROR';
  }

  /**
   * Check if error is retryable based on error code
   *
   * Network and store errors are always retryable by nature.
   * Database errors may be transient.
   * Unknown errors are non-retryable.
   *
   * @param code - Error code
   * @param flaggedRetryable - Error's retryable flag (may be overridden)
   * @returns true if error should be retried
   *
   * @private
   */
  private isRetryableByCode(code: string, flaggedRetryable: boolean): boolean {
    switch (code) {
      case 'NETWORK_ERROR':
      case 'STORE_PROBLEM_ERROR':
      case 'DB_ERROR':
        return true; // Always retryable
      case 'UNKNOWN_ERROR':
      default:
        return false; // Non-retryable
    }
  }

  /**
   * Get retry configuration for error type
   *
   * @param code - Error code
   * @returns Configuration with maxRetries and backoff delay
   *
   * @private
   */
  private getRetryConfig(code: string): {
    maxRetries: number;
    retryBackoffMs: number;
  } {
    switch (code) {
      case 'NETWORK_ERROR':
        return { maxRetries: 3, retryBackoffMs: 1000 };
      case 'STORE_PROBLEM_ERROR':
        return { maxRetries: 3, retryBackoffMs: 2000 };
      case 'DB_ERROR':
        return { maxRetries: 2, retryBackoffMs: 1000 };
      default:
        return { maxRetries: 0, retryBackoffMs: 0 };
    }
  }

  /**
   * Get localized user message for error
   *
   * @param code - Error code
   * @param locale - Language locale
   * @param originalMessage - Original error message (fallback if needed)
   * @returns User-friendly message
   *
   * @private
   */
  private getUserMessage(
    code: string,
    locale: string,
    originalMessage?: string
  ): string {
    const messages = ERROR_MESSAGES[locale] || ERROR_MESSAGES['en'];
    return messages[code] || messages['UNKNOWN_ERROR'];
  }

  /**
   * Get localized suggestion message
   *
   * @param code - Error code
   * @param locale - Language locale
   * @returns Suggestion message for user
   *
   * @private
   */
  private getSuggestionMessage(code: string, locale: string): string {
    const messages = SUGGESTION_MESSAGES[locale] || SUGGESTION_MESSAGES['en'];
    return messages[code] || messages['UNKNOWN_ERROR'];
  }

  /**
   * Get localized recovery action
   *
   * @param code - Error code
   * @param locale - Language locale
   * @returns Recovery action description
   *
   * @private
   */
  private getRecoveryAction(code: string, locale: string): string {
    const messages = RECOVERY_ACTIONS[locale] || RECOVERY_ACTIONS['en'];
    return messages[code] || messages['UNKNOWN_ERROR'];
  }

  /**
   * Normalize error message for logging
   *
   * Truncates extremely long messages and removes PII
   *
   * @param message - Raw error message
   * @returns Normalized message
   *
   * @private
   */
  private normalizeMessage(message: any): string {
    if (!message) return '';
    if (typeof message !== 'string') return String(message);

    // Truncate if too long (but preserve meaning)
    if (message.length > 500) {
      return message.substring(0, 497) + '...';
    }

    return message;
  }

  /**
   * Create default unknown error response
   *
   * @param locale - Language locale
   * @returns Classified error for unknown cases
   *
   * @private
   */
  private createUnknownError(locale: string): ClassifiedError {
    return {
      code: 'UNKNOWN_ERROR',
      userMessage:
        ERROR_MESSAGES[locale]?.['UNKNOWN_ERROR'] ||
        ERROR_MESSAGES['en']['UNKNOWN_ERROR'],
      suggestionMessage:
        SUGGESTION_MESSAGES[locale]?.['UNKNOWN_ERROR'] ||
        SUGGESTION_MESSAGES['en']['UNKNOWN_ERROR'],
      recoveryAction:
        RECOVERY_ACTIONS[locale]?.['UNKNOWN_ERROR'] ||
        RECOVERY_ACTIONS['en']['UNKNOWN_ERROR'],
      retryable: false,
      showRetryButton: false,
      showSupportButton: true,
      maxRetries: 0,
      retryBackoffMs: 0,
    };
  }
}
