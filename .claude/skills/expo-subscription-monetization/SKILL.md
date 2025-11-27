---
name: expo-subscription-monetization
description: Implement monthly and annual subscription monetization in Expo apps using RevenueCat with Clean Architecture and Domain-Driven Design patterns. Use this skill when building subscription features, setting up RevenueCat products, implementing feature gates, or adding tiered pricing to React Native/Expo applications. Covers product setup, architecture implementation, feature gating, testing strategies, and troubleshooting.
---

# Expo Subscription Monetization with RevenueCat

RevenueCat + Expo/React Native でサブスクリプション課金を実装するためのスキル。Clean Architecture と DDD パターンに基づいた完全な実装テンプレートを提供。

## When to Use This Skill

- Expo/React Native アプリにサブスクリプション課金を追加したい
- RevenueCat SDK の統合方法を知りたい
- 月額/年額プランの実装パターンが必要
- 機能制限（Feature Gating）を実装したい
- Free/Premium ティアの利用制限を設定したい
- 購入フロー・復元フローを実装したい
- サブスクリプションのテスト方法を知りたい

## Architecture Overview

```
subscription/
├── core/               # コア機能
│   ├── types.ts        # 型定義（Subscription, UsageLimits, etc.）
│   ├── config.ts       # ビジネスロジック設定（FREE/PREMIUM制限）
│   ├── sdk.ts          # RevenueCat SDK 初期化
│   ├── repository.ts   # SDK ラッパー（CustomerInfo → Subscription変換）
│   └── service.ts      # アプリケーションサービス
├── providers/          # React Context
│   └── RevenueCatProvider.tsx
├── hooks/              # React Hooks
│   ├── useRevenueCat.ts    # 低レベルアクセス
│   └── useSubscription.ts  # メインAPI
├── components/         # UI
│   └── Paywall.tsx
└── mocks/              # テスト用
    └── react-native-purchases.ts
```

## Quick Start

### 1. Install Dependencies

```bash
pnpm add react-native-purchases react-native-purchases-ui
npx expo install expo-dev-client  # Expo の場合
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
  const { isPremium, usageLimits, purchasePackage, packages } = useSubscription();

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
  maxItems: number;      // 例: 最大アイテム数
  maxExports: number;    // 例: 月間エクスポート数
  hasAds: boolean;       // 広告表示フラグ
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
  isPremium,           // boolean: プレミアムユーザーか
  isFree,              // boolean: 無料ユーザーか
  usageLimits,         // UsageLimits: 現在の制限
  subscription,        // Subscription: 詳細情報

  // Loading
  loading,             // boolean: 初期ロード中
  purchaseLoading,     // boolean: 購入処理中
  restoreLoading,      // boolean: 復元処理中

  // Error
  error,               // string | null

  // Actions
  purchasePackage,     // (id: string) => Promise<PurchaseResult>
  restorePurchases,    // () => Promise<RestoreResult>
  canAccessFeature,    // (level: FeatureLevel) => boolean

  // Packages
  packages,            // SubscriptionPackage[]
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
      Alert.alert('Upgrade Required', `Free plan: max ${usageLimits.maxItems} items`);
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
  const { packages, purchasePackage, purchaseLoading, error } = useSubscription();

  const handlePurchase = async (packageId: string) => {
    const result = await purchasePackage(packageId);
    if (result.success) {
      Alert.alert('Success', 'Welcome to Premium!');
      navigation.goBack();
    }
  };

  return (
    <View>
      {packages.map(pkg => (
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

アプリの機能に合わせて `types.ts` を変更:

```typescript
// AI アプリの例
interface UsageLimits {
  maxRequestsPerDay: number;
  maxTokensPerRequest: number;
  hasAds: boolean;
  hasPriorityProcessing: boolean;
}

// プロジェクト管理アプリの例
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

3つ以上のプランがある場合:

```typescript
// types.ts
interface Subscription {
  isActive: boolean;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
}

// config.ts
const TIER_LIMITS: Record<Subscription['tier'], UsageLimits> = {
  free: { maxProjects: 1, /* ... */ },
  basic: { maxProjects: 5, /* ... */ },
  pro: { maxProjects: 20, /* ... */ },
  enterprise: { maxProjects: Infinity, /* ... */ },
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
- `.env.local` に `EXPO_PUBLIC_REVENUE_CAT_API_KEY_*` を設定
- Metro を再起動: `npx expo start --clear`

### "No current offering available"
- RevenueCat Dashboard で Offerings を設定
- Products を Entitlements に紐付け
- Sandbox テスターでテスト

### iOS Simulator で購入できない
- 実機でテスト、または StoreKit Configuration File を使用
- Sandbox テスターアカウントを設定

## Template Files

実装テンプレートは `templates/` ディレクトリを参照:

- [templates/types.ts](templates/types.ts) - 型定義
- [templates/config.ts](templates/config.ts) - 設定
- [templates/sdk.ts](templates/sdk.ts) - SDK初期化
- [templates/repository.ts](templates/repository.ts) - リポジトリ
- [templates/service.ts](templates/service.ts) - サービス
- [templates/RevenueCatProvider.tsx](templates/RevenueCatProvider.tsx) - Provider
- [templates/useRevenueCat.ts](templates/useRevenueCat.ts) - Hook (低レベル)
- [templates/useSubscription.ts](templates/useSubscription.ts) - Hook (メイン)
- [templates/Paywall.tsx](templates/Paywall.tsx) - Paywall UI
- [templates/mocks.ts](templates/mocks.ts) - テストモック

詳細は [references/](references/) ディレクトリを参照:
- `references/revenuecat-setup.md` - RevenueCat ダッシュボード設定
- `references/architecture-patterns.md` - Clean Architecture パターン
- `references/feature-gating.md` - 機能制限パターン

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
