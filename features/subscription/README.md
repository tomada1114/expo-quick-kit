# Subscription Module (RevenueCat)

This module provides a complete subscription monetization system using RevenueCat, enabling monthly and annual subscription plans with feature gating and purchase restoration.

## Architecture Overview

The subscription system follows **Clean Architecture** with Domain-Driven Design principles:

```
┌─────────────────────────────────────────────────────────┐
│ Presentation Layer                                      │
│ - SubscriptionProvider (React Context)                 │
│ - useSubscription Hook                                 │
│ - Paywall Component (RevenueCat UI wrapper)            │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ Application Layer                                       │
│ - SubscriptionService (Business Logic)                 │
│ - Feature Gating & Usage Limits                        │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ Domain Layer                                            │
│ - Subscription Entity                                  │
│ - UsageLimits Value Object                             │
│ - Domain Types & Errors                                │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ Infrastructure Layer                                    │
│ - SubscriptionRepository (RevenueCat Integration)      │
│ - SDK Configuration                                    │
│ - Error Mapping                                        │
└──────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

- **Presentation**: React components and hooks exposing subscription state to UI
- **Application**: Business logic (Feature Gating, Usage Limits calculation)
- **Domain**: Pure business models and types (no external dependencies)
- **Infrastructure**: RevenueCat SDK integration and error mapping

## Project Structure

```
features/subscription/
├── core/
│   ├── types.ts          # Domain types (Subscription, UsageLimits, SubscriptionError, Result)
│   ├── sdk.ts            # RevenueCat SDK configuration
│   └── repository.ts     # Subscription Repository (RevenueCat API abstraction)
├── services/
│   └── subscription-service.ts  # Business logic and Feature Gating
├── providers/
│   └── subscription-provider.tsx  # React Context provider
├── hooks/
│   └── use-subscription.ts     # Hook for UI components
├── components/
│   └── paywall.tsx       # RevenueCat Paywall UI wrapper
├── __mocks__/
│   └── react-native-purchases.ts  # Jest mock for testing
└── README.md             # This file
```

## Quick Start

### 1. Setup Environment Variables

Create a `.env.local` file in the project root with your RevenueCat API keys:

```bash
# iOS
EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE=appl_YOUR_APPLE_API_KEY

# Android
EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE=goog_YOUR_GOOGLE_API_KEY
```

Get your API keys from the [RevenueCat Dashboard](https://app.revenuecat.com/):
1. Go to **Project Settings** → **API Keys**
2. Copy your platform-specific keys
3. Add them to `.env.local`

### 2. Configure RevenueCat Dashboard

#### Create Products
1. In RevenueCat Dashboard, go to **Products**
2. Create iOS App Store subscriptions:
   - Product ID: `monthly_plan`, Period: Monthly
   - Product ID: `annual_plan`, Period: Annual
3. Create Android Google Play subscriptions with matching IDs

#### Create Entitlement
1. Go to **Entitlements**
2. Create: `premium` (this represents premium tier access)

#### Create Offering
1. Go to **Offerings**
2. Create a "default" offering with packages:
   - `$rc_monthly` → monthly_plan
   - `$rc_annual` → annual_plan

#### Create Paywall (Optional)
1. Go to **Paywalls**
2. Create a paywall with your branding
3. Select offerings and customize the UI

### 3. Use in Your App

#### Access Subscription State

```typescript
import { useSubscription } from '@/features/subscription';

export function YourComponent() {
  const {
    isPremium,
    isFree,
    usageLimits,
    loading,
    error,
    purchasePackage,
    canAccessFeature,
  } = useSubscription();

  if (loading) return <Text>Loading subscription...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View>
      <Text>Status: {isPremium ? 'Premium' : 'Free'}</Text>
      <Text>Max items: {usageLimits.maxItems}</Text>
      <Text>Has ads: {usageLimits.hasAds}</Text>
    </View>
  );
}
```

#### Implement Feature Gating

```typescript
function PremiumFeature() {
  const { canAccessFeature } = useSubscription();

  if (!canAccessFeature('premium')) {
    return <Text>Upgrade to access this feature</Text>;
  }

  return <Text>This is a premium feature</Text>;
}
```

#### Show Paywall

```typescript
import { useRouter } from 'expo-router';

function UpgradeButton() {
  const router = useRouter();

  return (
    <Button
      title="Upgrade to Premium"
      onPress={() => router.push('/paywall')}
    />
  );
}
```

#### Restore Purchases

```typescript
function SettingsScreen() {
  const { restorePurchases, loading } = useSubscription();

  return (
    <Button
      title="Restore Purchases"
      onPress={() => restorePurchases()}
      disabled={loading}
    />
  );
}
```

## Customization Guide

### Customize Usage Limits

Modify the `getUsageLimits()` function in `features/subscription/services/subscription-service.ts`:

#### Example 1: AI Application

```typescript
function getUsageLimits(tier: 'free' | 'premium'): UsageLimits {
  if (tier === 'free') {
    return {
      maxItems: 10,
      maxExports: 1,
      hasAds: true,
      maxTokens: 10000,  // Add custom field
      maxRequests: 50,
    };
  }

  return {
    maxItems: Infinity,
    maxExports: Infinity,
    hasAds: false,
    maxTokens: Infinity,
    maxRequests: Infinity,
  };
}
```

#### Example 2: File Storage Application

```typescript
function getUsageLimits(tier: 'free' | 'premium'): UsageLimits {
  if (tier === 'free') {
    return {
      maxItems: 10,
      maxExports: 1,
      hasAds: true,
      maxStorageGB: 5,
      maxFileSize: 100, // MB
    };
  }

  return {
    maxItems: Infinity,
    maxExports: Infinity,
    hasAds: false,
    maxStorageGB: 500,
    maxFileSize: 2000,
  };
}
```

#### Example 3: Project Management Application

```typescript
function getUsageLimits(tier: 'free' | 'premium'): UsageLimits {
  if (tier === 'free') {
    return {
      maxItems: 10,        // Projects
      maxExports: 1,
      hasAds: true,
      maxTeamMembers: 1,
      maxIntegrations: 0,
    };
  }

  return {
    maxItems: Infinity,
    maxExports: Infinity,
    hasAds: false,
    maxTeamMembers: Infinity,
    maxIntegrations: 10,
  };
}
```

**After customizing `UsageLimits` type**:

1. Update `features/subscription/core/types.ts` to add new fields
2. Update `features/subscription/services/subscription-service.ts` logic
3. Update `features/subscription/hooks/use-subscription.ts` return type
4. Run `pnpm check` to verify all types and tests

## API Reference

### useSubscription Hook

```typescript
const {
  // Derived State
  isPremium: boolean;           // Whether user has premium subscription
  isFree: boolean;              // Whether user is on free tier
  usageLimits: UsageLimits;     // Current tier limits

  // Raw State
  subscription: Subscription | null;
  loading: boolean;             // True during purchase/restore
  error: SubscriptionError | null;

  // Actions
  purchasePackage: (packageId: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  canAccessFeature: (level: 'basic' | 'premium') => boolean;
  refetchSubscription: () => Promise<void>;
} = useSubscription();
```

### Subscription Entity

```typescript
interface Subscription {
  isActive: boolean;           // Is subscription currently active?
  tier: 'free' | 'premium';    // Current tier
  expiresAt: Date | null;      // Expiration date (null for free/lifetime)
  productId: string | null;    // Product identifier from RevenueCat
}
```

### UsageLimits Value Object

```typescript
interface UsageLimits {
  maxItems: number;            // Max items user can create
  maxExports: number;          // Max export operations
  hasAds: boolean;             // Whether ads are shown
  // ... custom fields for your app
}
```

### SubscriptionError

```typescript
type SubscriptionError =
  | { code: 'PURCHASE_CANCELLED'; message: string; retryable: false }
  | { code: 'PURCHASE_NOT_ALLOWED'; message: string; retryable: false }
  | { code: 'PURCHASE_INVALID'; message: string; retryable: false }
  | { code: 'PRODUCT_ALREADY_PURCHASED'; message: string; retryable: false }
  | { code: 'NETWORK_ERROR'; message: string; retryable: true }
  | { code: 'CONFIGURATION_ERROR'; message: string; retryable: false }
  | { code: 'INVALID_CREDENTIALS_ERROR'; message: string; retryable: false }
  | { code: 'UNEXPECTED_BACKEND_RESPONSE_ERROR'; message: string; retryable: true }
  | { code: 'RECEIPT_ALREADY_IN_USE_ERROR'; message: string; retryable: false }
  | { code: 'NO_ACTIVE_SUBSCRIPTION'; message: string; retryable: false }
  | { code: 'UNKNOWN_ERROR'; message: string; retryable: false };
```

## Troubleshooting

### "API key is missing"

**Issue**: `CONFIGURATION_ERROR` or app won't initialize

**Solution**:
1. Check `.env.local` has both keys:
   - `EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE`
   - `EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE`
2. Restart dev server: `pnpm start`
3. Verify keys in [RevenueCat Dashboard](https://app.revenuecat.com/settings/api-keys)

### "Can't purchase"

**Issue**: `PURCHASE_INVALID` or `PRODUCT_ALREADY_PURCHASED` error

**Solution**:
1. Verify products exist in RevenueCat Dashboard → **Products**
2. Check Offering has products linked: **Offerings** → **default**
3. In RevenueCat Dashboard Paywalls, verify packages show available products
4. On iOS: Test with Sandbox Apple ID in Settings → App Store
5. On Android: Use a test Google account in Play Console → Testers

### "Can't restore purchases"

**Issue**: "No active purchases to restore" or error

**Solution**:
1. Ensure you've made a test purchase first
2. On iOS: Use same Apple ID in Settings → App Store
3. On Android: Use same Google account
4. Make sure subscription hasn't expired in RevenueCat Dashboard
5. Try purchase again from Paywall instead of restore

### "Paywall doesn't show"

**Issue**: Blank screen or no offering found

**Solution**:
1. Create an Offering in RevenueCat Dashboard:
   - **Offerings** → **Create Offering**
   - Name: "default"
   - Add packages: `$rc_monthly`, `$rc_annual`
2. Link products to packages
3. Deploy offering to production
4. Restart app
5. Check RevenueCat logs for errors

### "Types not found"

**Issue**: TypeScript errors about Subscription types

**Solution**:
1. Check imports: `import { useSubscription } from '@/features/subscription'`
2. Verify `features/subscription/` directory exists
3. Run `pnpm typecheck` to see detailed errors
4. Run `pnpm lint:fix` to auto-fix import issues

## Testing

### Unit Tests

Subscription Service tests verify usage limits and feature gating:

```bash
pnpm test subscription-service
```

Repository tests verify error mapping and CustomerInfo conversion:

```bash
pnpm test subscription-repository
```

Hook tests verify derived state calculation:

```bash
pnpm test use-subscription
```

### Integration Tests

Provider tests verify state management and API calls:

```bash
pnpm test subscription-provider
```

All tests use the mock RevenueCat SDK (`__mocks__/react-native-purchases.ts`).

## Testing with Real RevenueCat

To test with real purchases in development:

1. **iOS**: Create a Sandbox Apple ID in App Store Connect
2. **Android**: Add your Google account as a tester in Play Console
3. Use native development build: `pnpm dev:ios` or similar
4. Purchases will be processed through real App Store/Play Store

## Production Deployment

### Before Launch

1. **Set API Keys**:
   - Use Expo Secrets or environment variable service
   - Never commit `.env.local` to git

2. **Test Purchases**:
   - iOS: Use Sandbox testers
   - Android: Use Play Console test accounts

3. **Verify Offering**:
   - Products created in App Store Connect / Play Console
   - Entitlements configured in RevenueCat
   - Offering deployed to production

4. **Run Quality Checks**:
   ```bash
   pnpm check
   ```

### Monitoring

Track subscription metrics in [RevenueCat Dashboard](https://app.revenuecat.com/):
- **Charts**: Revenue, churn, trial conversion
- **Customers**: Individual subscription status
- **Integrations**: Connect to analytics (Segment, Amplitude)

## Advanced Topics

### Zustand Store Integration

The subscription module syncs with Zustand automatically:

```typescript
// After purchase/restore, this is updated
useStore.getState().isPremium = true;
```

Access from anywhere:

```typescript
const isPremium = useStore((state) => state.isPremium);
```

### Error Handling

Distinguish between retryable and non-retryable errors:

```typescript
const { error } = useSubscription();

if (error?.retryable) {
  // Show "Retry" button
} else {
  // Show permanent error message
}
```

### Customize Paywall Screen

Modify `features/subscription/components/paywall.tsx` to add custom branding:

```typescript
// Example: Custom header
<View style={styles.header}>
  <Text style={styles.title}>Upgrade to Premium</Text>
  <Text style={styles.subtitle}>Unlock all features</Text>
</View>

<RevenueCatUI.Paywall
  offering={offering}
  // ... event handlers
/>

// Example: Custom footer
<Button
  title="Maybe Later"
  onPress={() => router.back()}
/>
```

## Support Resources

- **RevenueCat Docs**: https://docs.revenuecat.com/
- **RevenueCat Dashboard**: https://app.revenuecat.com/
- **React Native Purchases SDK**: https://github.com/RevenueCat/react-native-purchases
- **Issue Tracker**: Report bugs in this repo or RevenueCat's GitHub

## Related Documentation

- `.kiro/specs/subscription-monetization/` - Technical specification
- `CLAUDE.md` - Project guidelines
- `expo-design-system` skill - UI component styling
