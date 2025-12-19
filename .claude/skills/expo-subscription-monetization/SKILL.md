---
name: expo-subscription-monetization
description: Implement subscription monetization in Expo apps using RevenueCat with Clean Architecture patterns. Use PROACTIVELY when building subscription features, setting up RevenueCat, implementing feature gates, adding tiered pricing, or working with in-app purchases. Examples: <example>Context: User asks about monetization user: 'Add subscription to my app' assistant: 'I will use expo-subscription-monetization skill' <commentary>Triggered by subscription/monetization request</commentary></example>
---

# Expo Subscription Monetization with RevenueCat

A skill for implementing subscription billing in Expo/React Native apps using RevenueCat. Provides complete implementation templates based on Clean Architecture and DDD patterns.

## When to Use This Skill

- Adding subscription billing to Expo/React Native apps
- Learning how to integrate RevenueCat SDK
- Implementing monthly/yearly subscription plans
- Implementing feature gating
- Setting up usage limits for Free/Premium tiers
- Implementing purchase and restore flows
- Learning how to test subscriptions

## Architecture Overview

```
subscription/
├── core/               # Core functionality
│   ├── types.ts        # Type definitions (Subscription, UsageLimits, etc.)
│   ├── config.ts       # Business logic config (FREE/PREMIUM limits)
│   ├── sdk.ts          # RevenueCat SDK initialization
│   ├── repository.ts   # SDK wrapper (CustomerInfo → Subscription conversion)
│   └── service.ts      # Application service
├── providers/          # React Context
│   └── RevenueCatProvider.tsx
├── hooks/              # React Hooks
│   ├── useRevenueCat.ts    # Low-level access
│   └── useSubscription.ts  # Main API
├── components/         # UI
│   └── Paywall.tsx
└── mocks/              # For testing
    └── react-native-purchases.ts
```

## Quick Start

### 1. Install Dependencies

```bash
pnpm add react-native-purchases react-native-purchases-ui
npx expo install expo-dev-client  # Required for Expo
```

### 2. Set Environment Variables

```bash
# .env.local
EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE=appl_xxxxxxxxxxxxxxxxx
EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE=goog_xxxxxxxxxxxxxxxxx
```

### 3. Add Provider

```tsx
// app/_layout.tsx
import { RevenueCatProvider } from '@/providers/RevenueCatProvider';

export default function RootLayout() {
  return (
    <RevenueCatProvider>
      <Stack />
    </RevenueCatProvider>
  );
}
```

### 4. Use in Components

```tsx
import { useSubscription } from '@/hooks/useSubscription';

function MyComponent() {
  const { isPremium, usageLimits, purchasePackage, packages } =
    useSubscription();

  if (!isPremium && items.length >= usageLimits.maxItems) {
    return <UpgradePrompt />;
  }
  // ...
}
```

## Core Concepts

### Subscription Entity

```typescript
interface Subscription {
  isActive: boolean;
  tier: 'free' | 'premium';
}
```

### Usage Limits (Customize for Your App)

```typescript
interface UsageLimits {
  maxItems: number; // e.g., maximum number of items
  maxExports: number; // e.g., monthly export limit
  hasAds: boolean; // ad display flag
}

// Free tier
const FREE_TIER_LIMITS: UsageLimits = {
  maxItems: 10,
  maxExports: 1,
  hasAds: true,
};

// Premium tier
const PREMIUM_TIER_LIMITS: UsageLimits = {
  maxItems: Infinity,
  maxExports: Infinity,
  hasAds: false,
};
```

### useSubscription Hook API

```typescript
const {
  // Status
  isPremium, // boolean: is premium user
  isFree, // boolean: is free user
  usageLimits, // UsageLimits: current limits
  subscription, // Subscription: detailed info

  // Loading
  loading, // boolean: initial loading
  purchaseLoading, // boolean: purchase in progress
  restoreLoading, // boolean: restore in progress

  // Error
  error, // string | null

  // Actions
  purchasePackage, // (id: string) => Promise<PurchaseResult>
  restorePurchases, // () => Promise<RestoreResult>
  canAccessFeature, // (level: FeatureLevel) => boolean

  // Packages
  packages, // SubscriptionPackage[]
} = useSubscription();
```

## Common Patterns

### Feature Gating

```tsx
function PremiumFeature() {
  const { isPremium } = useSubscription();

  if (!isPremium) {
    return <UpgradePrompt />;
  }

  return <ActualContent />;
}
```

### Usage Limit Check

```tsx
function ItemList() {
  const { usageLimits, isPremium } = useSubscription();
  const [items, setItems] = useState([]);

  const canAddItem = isPremium || items.length < usageLimits.maxItems;

  const handleAdd = () => {
    if (!canAddItem) {
      Alert.alert(
        'Upgrade Required',
        `Free plan: max ${usageLimits.maxItems} items`
      );
      return;
    }
    // Add item...
  };
}
```

### Ad Control

```tsx
function AdBanner() {
  const { usageLimits } = useSubscription();

  if (!usageLimits.hasAds) return null;

  return <GoogleAdBanner />;
}
```

### Purchase Flow

```tsx
function UpgradeScreen() {
  const { packages, purchasePackage, purchaseLoading, error } =
    useSubscription();

  const handlePurchase = async (packageId: string) => {
    const result = await purchasePackage(packageId);
    if (result.success) {
      Alert.alert('Success', 'Welcome to Premium!');
      navigation.goBack();
    }
  };

  return (
    <View>
      {packages.map((pkg) => (
        <TouchableOpacity
          key={pkg.identifier}
          onPress={() => handlePurchase(pkg.identifier)}
          disabled={purchaseLoading}
        >
          <Text>{pkg.title}</Text>
          <Text>{pkg.priceString}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### Restore Purchases (App Store Required)

```tsx
function Settings() {
  const { restorePurchases, restoreLoading } = useSubscription();

  const handleRestore = async () => {
    const result = await restorePurchases();
    if (result.success && result.subscription?.isActive) {
      Alert.alert('Restored', 'Your purchases have been restored');
    } else {
      Alert.alert('Info', 'No purchases to restore');
    }
  };

  return (
    <Button
      title={restoreLoading ? 'Restoring...' : 'Restore Purchases'}
      onPress={handleRestore}
      disabled={restoreLoading}
    />
  );
}
```

## Customization Guide

### 1. Modify UsageLimits Type

Modify `types.ts` according to your app's features:

```typescript
// Example: AI app
interface UsageLimits {
  maxRequestsPerDay: number;
  maxTokensPerRequest: number;
  hasAds: boolean;
  hasPriorityProcessing: boolean;
}

// Example: Project management app
interface UsageLimits {
  maxProjects: number;
  maxTeamMembers: number;
  maxStorageMB: number;
  hasAds: boolean;
}
```

### 2. Update config.ts

```typescript
export const FREE_TIER_LIMITS: UsageLimits = {
  maxProjects: 3,
  maxTeamMembers: 1,
  maxStorageMB: 100,
  hasAds: true,
};

export const PREMIUM_TIER_LIMITS: UsageLimits = {
  maxProjects: Infinity,
  maxTeamMembers: Infinity,
  maxStorageMB: 10240,
  hasAds: false,
};
```

### 3. Multiple Tiers

For apps with 3 or more plans:

```typescript
// types.ts
interface Subscription {
  isActive: boolean;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
}

// config.ts
const TIER_LIMITS: Record<Subscription['tier'], UsageLimits> = {
  free: { maxProjects: 1 /* ... */ },
  basic: { maxProjects: 5 /* ... */ },
  pro: { maxProjects: 20 /* ... */ },
  enterprise: { maxProjects: Infinity /* ... */ },
};
```

## Testing

```typescript
import {
  setupFreeUserMock,
  setupPremiumUserMock,
  resetMocks,
} from '@/__mocks__/react-native-purchases';

describe('Subscription', () => {
  beforeEach(() => resetMocks());

  it('shows upgrade for free users', () => {
    setupFreeUserMock();
    // Test...
  });

  it('shows content for premium users', () => {
    setupPremiumUserMock();
    // Test...
  });
});
```

## Troubleshooting

### "RevenueCat API key is missing"

- Set `EXPO_PUBLIC_REVENUE_CAT_API_KEY_*` in `.env.local`
- Restart Metro: `npx expo start --clear`

### "No current offering available"

- Configure Offerings in RevenueCat Dashboard
- Link Products to Entitlements
- Test with Sandbox tester

### Cannot purchase on iOS Simulator

- Test on physical device, or use StoreKit Configuration File
- Set up Sandbox tester account

## Template Files

See `templates/` directory for implementation templates:

- [templates/types.ts](templates/types.ts) - Type definitions
- [templates/config.ts](templates/config.ts) - Configuration
- [templates/sdk.ts](templates/sdk.ts) - SDK initialization
- [templates/repository.ts](templates/repository.ts) - Repository
- [templates/service.ts](templates/service.ts) - Service
- [templates/RevenueCatProvider.tsx](templates/RevenueCatProvider.tsx) - Provider
- [templates/useRevenueCat.ts](templates/useRevenueCat.ts) - Hook (low-level)
- [templates/useSubscription.ts](templates/useSubscription.ts) - Hook (main)
- [templates/Paywall.tsx](templates/Paywall.tsx) - Paywall UI
- [templates/mocks.ts](templates/mocks.ts) - Test mocks

See [references/](references/) directory for detailed documentation:

- `references/revenuecat-setup.md` - RevenueCat Dashboard setup
- `references/architecture-patterns.md` - Clean Architecture patterns
- `references/feature-gating.md` - Feature gating patterns

## AI Assistant Instructions

When helping implement RevenueCat subscriptions:

1. **Always read templates first** - Load relevant template files before generating code
2. **Ask about app's usage limits** - Understand what features should be gated
3. **Recommend Clean Architecture** - Use the layered structure (types → config → repository → service → hooks)
4. **Include error handling** - Network errors, cancelled purchases, configuration errors
5. **Remind about App Store requirements** - Restore purchases button is mandatory
6. **Guide testing setup** - Provide mock utilities for unit tests

### Common Questions to Ask User

- What features should be premium-only?
- What usage limits should free users have?
- Do you need multiple subscription tiers (basic/pro/enterprise)?
- Is this for iOS, Android, or both?
