/**
 * RevenueCat Template - Provider
 *
 * React Context Provider for RevenueCat SDK.
 * Handles SDK initialization, customer info updates, and error handling.
 */

import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import { ensureRevenueCatConfigured } from './sdk';
import { SubscriptionError, SubscriptionErrorCode } from './types';

/**
 * RevenueCat Context value
 */
export interface RevenueCatContextValue {
  /** Current customer info from RevenueCat */
  customerInfo: CustomerInfo | null;
  /** True while SDK is initializing */
  loading: boolean;
  /** True when SDK is configured and ready */
  configured: boolean;
  /** Error if initialization failed */
  error: SubscriptionError | null;
  /** True if retry is available (e.g., network error) */
  retryAvailable: boolean;
  /** Retry initialization */
  retry: () => Promise<void>;
}

export const RevenueCatContext = createContext<RevenueCatContextValue | undefined>(undefined);

/**
 * Type guard for Error
 */
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard for RevenueCat errors
 */
function isRevenueCatError(error: unknown): error is { code: string; message?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

/**
 * Maps RevenueCat errors to SubscriptionError
 */
function mapRevenueCatError(error: unknown): SubscriptionError {
  if (isRevenueCatError(error)) {
    switch (error.code) {
      case 'NETWORK_ERROR':
      case 'NETWORK_TIMEOUT':
        return new SubscriptionError(
          error.message ?? 'Network error',
          SubscriptionErrorCode.NETWORK_ERROR,
          isError(error) ? error : undefined,
        );
      case 'CONFIGURATION_ERROR':
      case 'INVALID_API_KEY':
        return new SubscriptionError(
          error.message ?? 'Configuration error',
          SubscriptionErrorCode.CONFIGURATION_ERROR,
          isError(error) ? error : undefined,
        );
      default:
        return new SubscriptionError(
          error.message ?? 'Unknown RevenueCat error',
          SubscriptionErrorCode.UNKNOWN_ERROR,
          isError(error) ? error : undefined,
        );
    }
  }

  if (error instanceof Error) {
    return new SubscriptionError(error.message, SubscriptionErrorCode.UNKNOWN_ERROR, error);
  }

  return new SubscriptionError('Unknown error', SubscriptionErrorCode.UNKNOWN_ERROR);
}

/**
 * RevenueCat Provider Component
 *
 * Wrap your app with this provider to enable RevenueCat functionality.
 *
 * Usage:
 *   <RevenueCatProvider>
 *     <App />
 *   </RevenueCatProvider>
 */
export const RevenueCatProvider = ({ children }: PropsWithChildren) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SubscriptionError | null>(null);
  const [retryAvailable, setRetryAvailable] = useState(false);
  const isRetrying = useRef(false);

  const init = useCallback(async () => {
    const abortController = new AbortController();
    const { signal } = abortController;

    const listener = (info: CustomerInfo) => {
      if (!signal.aborted) {
        setCustomerInfo(info);
      }
    };

    let removeListener: (() => void) | undefined;

    try {
      setLoading(true);
      setError(null);
      setRetryAvailable(false);

      await ensureRevenueCatConfigured();
      if (signal.aborted) return;

      const listenerResult = Purchases.addCustomerInfoUpdateListener(listener);
      removeListener = typeof listenerResult === 'function' ? listenerResult : undefined;
      const currentInfo = await Purchases.getCustomerInfo();

      if (signal.aborted) return;

      setCustomerInfo(currentInfo);
      setLoading(false);
    } catch (err) {
      if (signal.aborted) return;

      const mappedError = mapRevenueCatError(err);
      setError(mappedError);

      if (mappedError.code === SubscriptionErrorCode.NETWORK_ERROR) {
        // Network error: retry available
        console.warn(
          `[RevenueCatProvider] Initialization failed: ${mappedError.message}`,
          { code: mappedError.code, retryable: true },
          err,
        );
        setRetryAvailable(true);
      } else if (mappedError.code === SubscriptionErrorCode.CONFIGURATION_ERROR) {
        // Configuration error: fatal, operate as free tier
        console.error(
          `[RevenueCatProvider] Initialization failed: ${mappedError.message}`,
          { code: mappedError.code, fallbackToFree: true },
          err,
        );
      } else {
        // Other errors: log and operate as free tier
        console.error(
          `[RevenueCatProvider] Initialization failed: ${mappedError.message}`,
          { code: mappedError.code, fallbackToFree: true },
          err,
        );
      }

      setCustomerInfo(null);
      setLoading(false);
    }

    return () => {
      abortController.abort();
      if (removeListener) {
        removeListener();
      }
    };
  }, []);

  const retry = useCallback(async () => {
    if (isRetrying.current) {
      return;
    }
    isRetrying.current = true;
    try {
      await init();
    } finally {
      isRetrying.current = false;
    }
  }, [init]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void init().then((cleanupFn) => {
      if (!cancelled) {
        cleanup = cleanupFn;
      } else {
        cleanupFn?.();
      }
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [init]);

  return (
    <RevenueCatContext.Provider
      value={{
        customerInfo,
        loading,
        configured: customerInfo !== null,
        error,
        retryAvailable,
        retry,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
};
