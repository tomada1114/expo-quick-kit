# TODO3: 収益化準備 - RevenueCat導入（優先度: 高）

TEMPLATE_ARCHITECTURE.md Phase 5 の全体実装。

## 概要

RevenueCatを使用したサブスクリプション機能の基盤構築。
詳細な実装パターンは `expo-subscription-monetization` Claude Skill を参照。

## タスク

### 1. ライブラリインストール

```bash
pnpm add react-native-purchases
pnpm expo install expo-dev-client
```

### 2. services/ ディレクトリ作成

```
services/
└── revenue-cat.ts    # RevenueCat初期化・API
```

### 3. RevenueCat初期化実装

**services/revenue-cat.ts**:

```typescript
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEYS = {
  ios: 'your_ios_api_key',      // RevenueCatダッシュボードから取得
  android: 'your_android_api_key',
};

export const initRevenueCat = async () => {
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;
  await Purchases.configure({ apiKey });
};

export const checkPremiumStatus = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch (e) {
    console.error('Error checking premium status:', e);
    return false;
  }
};
```

### 4. Paywall雛形作成

```
features/
└── paywall/
    ├── components/
    │   └── paywall-screen.tsx
    ├── hooks/
    │   └── use-paywall.ts
    └── index.ts
```

### 5. Zustand連携（任意）

`store/slices/app-slice.ts` の `isPremium` と連携させる。

## RevenueCatダッシュボード設定（手動）

1. https://app.revenuecat.com/ でプロジェクト作成
2. App Store Connect / Google Play Console と連携
3. Products（商品）を設定
4. Entitlements（権限）を設定
5. APIキーを取得して環境変数に設定

## 参考資料

- Claude Skill: `expo-subscription-monetization`
- RevenueCat公式ドキュメント: https://docs.revenuecat.com/

## 完了条件

- [ ] `react-native-purchases` がインストールされている
- [ ] `expo-dev-client` がインストールされている
- [ ] `services/revenue-cat.ts` が作成されている
- [ ] `features/paywall/` が作成されている
- [ ] iOS/Androidでビルドが通る
- [ ] `pnpm typecheck` が通る
- [ ] `pnpm test` が通る

## 注意事項

- RevenueCatはネイティブモジュールのため、Expo Go では動作しない
- `expo-dev-client` を使用した開発ビルドが必要
- APIキーは `.env` 等で管理し、リポジトリにコミットしないこと
