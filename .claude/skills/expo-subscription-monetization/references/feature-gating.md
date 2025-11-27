# Feature Gating Implementation Patterns

## Overview

Feature gating restricts access to premium features based on subscription status. This document covers implementation patterns for UI-level and logic-level feature gates.

## Basic Feature Gate Pattern

### 1. Define Feature Levels

```typescript
// domain/subscription/services.ts
export type FeatureLevel = 'basic' | 'premium';

export class SubscriptionService {
  static canAccessFeature(subscription: Subscription, featureLevel: FeatureLevel): boolean {
    // Basic features are always available
    if (featureLevel === 'basic') {
      return true;
    }
    // Premium features require active premium subscription
    return subscription.isActive && subscription.tier === 'premium';
  }
}
```

### 2. Usage Limits Pattern

```typescript
// domain/subscription/value-objects.ts
export interface UsageLimits {
  maxItems: number;
  maxExports: number;
  hasAds: boolean;
}

// domain/subscription/services.ts
export class SubscriptionService {
  static getUsageLimits(subscription: Subscription): UsageLimits {
    if (!subscription.isActive || subscription.tier === 'free') {
      return {
        maxItems: 10,
        maxExports: 1,
        hasAds: true,
      };
    }

    return {
      maxItems: Infinity,
      maxExports: Infinity,
      hasAds: false,
    };
  }
}
```

## UI-Level Feature Gates

### 1. Disabled Button with Upgrade Prompt

```typescript
import { useSubscription } from '@/hooks/useSubscription';

function ExportButton() {
  const { canAccessFeature } = useSubscription();
  const canExport = canAccessFeature('premium');

  const handleExport = () => {
    if (!canExport) {
      // Show paywall
      setShowPaywall(true);
      return;
    }
    // Proceed with export
    performExport();
  };

  return (
    <Button
      onPress={handleExport}
      className={!canExport ? 'opacity-50' : ''}
    >
      <Text>{canExport ? 'Export' : 'Export (Premium)'}</Text>
    </Button>
  );
}
```

### 2. Feature Badge Pattern

```typescript
function FeatureItem({ level, labelKey }) {
  const { canAccessFeature } = useSubscription();
  const hasAccess = canAccessFeature(level);

  return (
    <View className="flex-row items-center justify-between">
      <Text>{i18n.t(labelKey)}</Text>
      {!hasAccess && (
        <View className="bg-primary-500 px-2 py-1 rounded">
          <Text className="text-white text-xs">Premium</Text>
        </View>
      )}
      {hasAccess && (
        <Icon name="check" color="green" />
      )}
    </View>
  );
}

// Usage
const featureItems = [
  { id: 'basic', level: 'basic', labelKey: 'features.basic' },
  { id: 'export', level: 'premium', labelKey: 'features.export' },
  { id: 'unlimited', level: 'premium', labelKey: 'features.unlimited' },
];

featureItems.map((item) => (
  <FeatureItem key={item.id} level={item.level} labelKey={item.labelKey} />
));
```

### 3. Usage Limit Display

```typescript
function UsageLimitDisplay() {
  const { usageLimits, isSubscribed } = useSubscription();

  const formatLimit = (value: number) =>
    value === Infinity ? 'Unlimited' : `${value}`;

  return (
    <View>
      <Text>Items: {formatLimit(usageLimits.maxItems)}</Text>
      <Text>Exports: {formatLimit(usageLimits.maxExports)}</Text>
      {usageLimits.hasAds && <Text>⚠️ Ads enabled</Text>}
    </View>
  );
}
```

## Logic-Level Feature Gates

### 1. Hard Block Pattern

```typescript
async function exportData() {
  const { canAccessFeature } = useSubscription();

  // Hard block - prevent execution
  if (!canAccessFeature('premium')) {
    throw new Error('Premium subscription required for export');
  }

  // Proceed with export logic
  await performExport();
}
```

### 2. Soft Limit Pattern

```typescript
async function addItem(item: Item) {
  const { usageLimits, subscription } = useSubscription();
  const currentCount = await getItemCount();

  // Soft limit - warn but allow
  if (currentCount >= usageLimits.maxItems) {
    if (subscription.tier === 'free') {
      // Show upgrade prompt
      Alert.alert(
        'Limit Reached',
        `Free plan limited to ${usageLimits.maxItems} items. Upgrade for unlimited items.`,
        [
          { text: 'Upgrade', onPress: () => showPaywall() },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }
  }

  // Proceed with adding item
  await saveItem(item);
}
```

### 3. Entitlement-Based Pattern

```typescript
async function enableFeature(featureId: string) {
  const { hasEntitlement } = useSubscription();

  // Check specific entitlement
  const hasProAccess = await hasEntitlement('pro');

  if (!hasProAccess) {
    throw new Error(`Feature ${featureId} requires 'pro' entitlement`);
  }

  // Enable feature logic
  await activateFeature(featureId);
}
```

## Advanced Patterns

### 1. Tiered Features

```typescript
// domain/subscription/services.ts
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export class SubscriptionService {
  static getTierLevel(tier: SubscriptionTier): number {
    const levels = { free: 0, basic: 1, pro: 2, enterprise: 3 };
    return levels[tier];
  }

  static canAccessTier(
    currentTier: SubscriptionTier,
    requiredTier: SubscriptionTier,
  ): boolean {
    return this.getTierLevel(currentTier) >= this.getTierLevel(requiredTier);
  }
}

// Usage
function AdvancedAnalytics() {
  const { subscription } = useSubscription();
  const canAccess = SubscriptionService.canAccessTier(subscription.tier, 'pro');

  if (!canAccess) {
    return <UpgradePrompt requiredTier="pro" />;
  }

  return <AnalyticsView />;
}
```

### 2. Time-Based Trial

```typescript
// domain/subscription/value-objects.ts
export interface TrialStatus {
  isInTrial: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number;
}

// domain/subscription/services.ts
export class SubscriptionService {
  static getTrialStatus(subscription: Subscription): TrialStatus {
    // Check if user has trial entitlement
    const trialEndsAt = subscription.trialEndsAt ?? null;

    if (!trialEndsAt) {
      return { isInTrial: false, trialEndsAt: null, daysRemaining: 0 };
    }

    const now = new Date();
    const isInTrial = now < trialEndsAt;
    const daysRemaining = Math.max(
      0,
      Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );

    return { isInTrial, trialEndsAt, daysRemaining };
  }
}

// UI Usage
function TrialBanner() {
  const { subscription } = useSubscription();
  const trial = SubscriptionService.getTrialStatus(subscription);

  if (!trial.isInTrial) {
    return null;
  }

  return (
    <View>
      <Text>Trial: {trial.daysRemaining} days remaining</Text>
      <Button onPress={showPaywall}>Upgrade Now</Button>
    </View>
  );
}
```

### 3. Feature Flags + Subscription

```typescript
// Combine feature flags with subscription checks
function FeatureWithFlag({ flagKey, requiredLevel }) {
  const { canAccessFeature } = useSubscription();
  const { isEnabled } = useFeatureFlags();

  // Check both feature flag AND subscription
  const canAccess = isEnabled(flagKey) && canAccessFeature(requiredLevel);

  if (!canAccess) {
    return null;
  }

  return <Feature />;
}
```

## Testing Feature Gates

### Unit Tests

```typescript
describe('SubscriptionService.canAccessFeature', () => {
  it('allows basic features for free users', () => {
    const freeSub = { isActive: false, tier: 'free' };
    expect(SubscriptionService.canAccessFeature(freeSub, 'basic')).toBe(true);
  });

  it('blocks premium features for free users', () => {
    const freeSub = { isActive: false, tier: 'free' };
    expect(SubscriptionService.canAccessFeature(freeSub, 'premium')).toBe(false);
  });

  it('allows premium features for premium users', () => {
    const premiumSub = { isActive: true, tier: 'premium' };
    expect(SubscriptionService.canAccessFeature(premiumSub, 'premium')).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('useSubscription hook', () => {
  it('provides correct feature access based on subscription', async () => {
    const { result } = renderHook(() => useSubscription(), {
      wrapper: createTestWrapper({ tier: 'premium' }),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.canAccessFeature('basic')).toBe(true);
    expect(result.current.canAccessFeature('premium')).toBe(true);
  });
});
```

## Common Pitfalls

### ❌ Don't Check Subscription Directly in UI

```typescript
// BAD - tight coupling to subscription structure
function ExportButton() {
  const { subscription } = useSubscription();
  const canExport = subscription?.tier === 'premium';
  // ...
}

// GOOD - use provided abstraction
function ExportButton() {
  const { canAccessFeature } = useSubscription();
  const canExport = canAccessFeature('premium');
  // ...
}
```

### ❌ Don't Duplicate Feature Logic

```typescript
// BAD - duplicated logic
function Component1() {
  const { subscription } = useSubscription();
  const canExport = subscription.isActive && subscription.tier === 'premium';
}

function Component2() {
  const { subscription } = useSubscription();
  const canExport = subscription.isActive && subscription.tier === 'premium';
}

// GOOD - centralized logic
// Both components use canAccessFeature('premium')
```

### ❌ Don't Forget Server-Side Validation

```typescript
// BAD - only client-side check
async function exportData() {
  if (!canAccessFeature('premium')) {
    throw new Error('Premium required');
  }
  await api.export(); // API doesn't verify subscription
}

// GOOD - both client and server checks
async function exportData() {
  // Client-side check for UX
  if (!canAccessFeature('premium')) {
    throw new Error('Premium required');
  }
  // Server verifies subscription via RevenueCat webhook
  await api.export(); // API validates subscription server-side
}
```

## Best Practices

1. **Centralize Feature Logic:** Keep all feature access logic in SubscriptionService
2. **Use Abstractions:** UI should use `canAccessFeature()`, not check subscription directly
3. **Fail Gracefully:** Show upgrade prompts instead of cryptic errors
4. **Test Edge Cases:** Expired subscriptions, network failures, entitlement changes
5. **Server-Side Validation:** Never trust client-side checks alone for monetized features
6. **Clear Messaging:** Tell users what they're missing and how to unlock it
7. **Progressive Disclosure:** Show locked features to encourage upgrades
