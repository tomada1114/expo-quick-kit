## 自作ボイラープレート構築ガイド

記載されている実装や設計は例です。実際のプロジェクトでは適宜変更してください。

### 全体像

```
Phase 1: 基盤構築（Day 1-2）
  └─ Expoプロジェクト作成、TypeScript、ESLint、Prettier

Phase 2: 開発環境（Day 2-3）
  └─ フォルダ構造、パスエイリアス、テスト環境

Phase 3: コア機能（Day 3-5）
  └─ SQLite + Drizzle、Zustand、テーマシステム

Phase 4: UI/UX基盤（Day 5-6）
  └─ 共通コンポーネント、ナビゲーション

Phase 5: 収益化準備（Day 6-7）
  └─ RevenueCat、Paywall雛形

Phase 6: 仕上げ（Day 7）
  └─ ドキュメント、サンプル機能、動作確認
```

---

## Phase 1: 基盤構築

### 1.1 プロジェクト作成

```bash
# Expo公式テンプレート（タブナビゲーション付き）
pnpm create expo-app@latest expo-boilerplate --template tabs

cd expo-boilerplate
```

### 1.2 不要ファイル削除

```bash
# デフォルトのサンプルコードを整理
rm -rf app/(tabs)/explore.tsx
rm -rf components/external-link.tsx
rm -rf components/haptic-tab.tsx
rm -rf components/hello-wave.tsx
rm -rf components/parallax-scroll-view.tsx
rm -rf components/ui/collapsible.tsx
```

### 1.3 ESLint + Prettier 設定

Expo SDK 54以降はESLint Flat Config形式を使用。基本設定は既に`eslint.config.js`として含まれている。

```bash
# Prettier追加
pnpm add -D prettier eslint-plugin-prettier eslint-config-prettier
```

**作成ファイル:**

| ファイル           | 目的                       |
| ------------------ | -------------------------- |
| `eslint.config.js` | ESLint Flat Config（既存） |
| `.prettierrc`      | Prettier設定               |
| `.prettierignore`  | Prettier除外               |

**.prettierrc:**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**eslint.config.js の拡張例:**

```javascript
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'node_modules/*'],
  },
  {
    rules: {
      // カスタムルール
    },
  },
]);
```

---

## Phase 2: 開発環境

### 2.1 フォルダ構造作成

```
expo-boilerplate/
├── app/                      # expo-router（画面定義）
│   ├── (tabs)/               # タブナビゲーション
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── _layout.tsx           # ルートレイアウト
│   ├── modal.tsx             # モーダル画面
│   └── +not-found.tsx
│
├── features/                 # 機能別モジュール
│   └── _example/             # サンプル機能（後で削除可）
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── repository.ts
│
├── components/               # 共通UIコンポーネント
│   ├── ui/                   # 基本UI部品
│   │   └── icon-symbol.tsx
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   └── index.ts
│
├── hooks/                    # 共通フック
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
│
├── constants/                # 定数・テーマ
│   └── theme.ts              # Colors, Fonts
│
├── lib/                      # ユーティリティ
│   └── date.ts
│
├── types/                    # 共通型定義
│   └── index.ts
│
├── store/                    # Zustand ストア
│   ├── index.ts
│   └── slices/
│       └── app-slice.ts
│
├── database/                 # SQLite + Drizzle
│   ├── client.ts             # DB接続
│   ├── schema.ts             # スキーマ定義
│   └── migrations/           # マイグレーション
│
├── services/                 # 外部サービス連携
│   └── revenue-cat.ts
│
└── assets/                   # 画像・フォント等
    └── images/
```

### 2.2 パスエイリアス設定

**tsconfig.json:**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

**使用例:**

```typescript
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
```

### 2.3 テスト環境構築

```bash
# インストール
pnpm add -D jest jest-expo @testing-library/react-native @types/jest
```

**jest.config.js:**

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/index.ts',
    '!**/node_modules/**',
    '!**/.expo/**',
  ],
};
```

---

## Phase 3: コア機能

### 3.1 技術スタック インストール

```bash
# 状態管理
pnpm add zustand

# DB
pnpm expo install expo-sqlite
pnpm add drizzle-orm
pnpm add -D drizzle-kit

# 非同期状態管理
pnpm add @tanstack/react-query

# バリデーション
pnpm add zod

# ユーティリティ
pnpm add date-fns

# Expo追加機能
pnpm expo install expo-secure-store expo-notifications
```

### 3.2 SQLite + Drizzle 設定

**database/client.ts:**

```typescript
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expo = openDatabaseSync('app.db');
export const db = drizzle(expo, { schema });
```

**database/schema.ts:**

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// サンプルテーブル（後で置き換え）
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
});
```

### 3.3 Zustand 設定

**store/index.ts:**

```typescript
import { create } from 'zustand';
import { createAppSlice, AppSlice } from './slices/app-slice';

export type RootStore = AppSlice;

export const useStore = create<RootStore>()((...a) => ({
  ...createAppSlice(...a),
}));
```

**store/slices/app-slice.ts:**

```typescript
import { StateCreator } from 'zustand';

export interface AppSlice {
  isOnboarded: boolean;
  isPremium: boolean;
  setOnboarded: (value: boolean) => void;
  setPremium: (value: boolean) => void;
}

export const createAppSlice: StateCreator<AppSlice> = (set) => ({
  isOnboarded: false,
  isPremium: false,
  setOnboarded: (value) => set({ isOnboarded: value }),
  setPremium: (value) => set({ isPremium: value }),
});
```

### 3.4 テーマシステム

既存の `constants/theme.ts` を拡張:

**constants/theme.ts（拡張版）:**

```typescript
import { Platform, TextStyle } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // 追加
    surface: '#F2F2F7',
    border: '#E5E5EA',
    textSecondary: '#8E8E93',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // 追加
    surface: '#1C1C1E',
    border: '#38383A',
    textSecondary: '#8E8E93',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 41,
  } as TextStyle,
  title1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  } as TextStyle,
  title2: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  } as TextStyle,
  body: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
  } as TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  } as TextStyle,
} as const;
```

---

## Phase 4: UI/UX基盤

### 4.1 共通コンポーネント

**作成するコンポーネント:**

| コンポーネント                      | 用途                           |
| ----------------------------------- | ------------------------------ |
| `themed-text.tsx`                   | 統一されたテキスト表示（既存） |
| `themed-view.tsx`                   | テーマ対応コンテナ（既存）     |
| `components/ui/button.tsx`          | プライマリ/セカンダリボタン    |
| `components/ui/card.tsx`            | カード型コンテナ               |
| `components/ui/spacer.tsx`          | スペーシング                   |
| `components/ui/loading-overlay.tsx` | ローディング表示               |

### 4.2 ナビゲーション構造

**app/\_layout.tsx:**

```typescript
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

const queryClient = new QueryClient();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

---

## Phase 5: 収益化準備

RevenueCatは、課金機能を提供するサービスです。
なお、すでにRevenueCatを導入しているプロジェクトのソースコードやドキュメントを `expo-subscription-monetization` という Claude Skill に格納しています。
こちらを参考にしてください。

### 5.1 RevenueCat インストール

```bash
pnpm add react-native-purchases
pnpm expo install expo-dev-client
```

### 5.2 RevenueCat 初期化

**services/revenue-cat.ts:**

```typescript
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEYS = {
  ios: 'your_ios_api_key',
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

### 5.3 Paywall 雛形

**features/paywall/paywall-screen.tsx** を作成（詳細は後で実装）

---

## Phase 6: 仕上げ

### 6.1 package.json scripts

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "expo lint",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write '**/*.{ts,tsx,js,jsx,json}'",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:studio": "drizzle-kit studio"
  }
}
```

### 6.2 ドキュメント

**作成するファイル:**

| ファイル               | 内容                   |
| ---------------------- | ---------------------- |
| `README.md`            | 概要、セットアップ手順 |
| `docs/ARCHITECTURE.md` | アーキテクチャ説明     |
| `docs/CONVENTIONS.md`  | コーディング規約       |
| `docs/TESTING.md`      | テスト方針             |

### 6.3 サンプル機能

動作確認用のシンプルな機能を1つ実装：

```
features/_example/
├── components/
│   └── counter.tsx
├── hooks/
│   └── use-counter.ts
├── services/
│   ├── counter.service.ts      # 純粋関数（テスト対象）
│   └── counter.service.test.ts # ユニットテスト
└── repository.ts               # DB操作
```

---

## 最終チェックリスト

### 必須確認項目

- [ ] `pnpm start` でアプリ起動
- [ ] `pnpm test` でテスト実行
- [ ] `pnpm lint` でリント通過
- [ ] `pnpm typecheck` で型チェック通過
- [ ] SQLiteへの読み書き動作確認
- [ ] Zustand状態更新の動作確認
- [ ] expo-routerのナビゲーション動作確認

### ファイル一覧（最終形）

```
expo-boilerplate/
├── app/
├── features/
├── components/
├── hooks/
├── constants/
├── lib/
├── types/
├── store/
├── database/
├── services/
├── assets/
├── __tests__/
├── eslint.config.js
├── .prettierrc
├── jest.config.js
├── jest.setup.js
├── tsconfig.json
├── drizzle.config.ts
├── app.json
├── package.json
└── README.md
```

---

## 技術スタック サマリー

| カテゴリ               | 採用技術                        | 理由                   | 状態 |
| ---------------------- | ------------------------------- | ---------------------- | ---- |
| フレームワーク         | Expo SDK 54                     | 公式、安定             | ✅ |
| 言語                   | TypeScript                      | 型安全                 | ✅ |
| パッケージマネージャー | pnpm                            | 高速、ディスク効率     | ✅ |
| ルーティング           | expo-router                     | ファイルベース         | ✅ |
| 状態管理               | Zustand                         | シンプル、学習コスト低 | ✅ |
| 非同期状態             | TanStack Query                  | キャッシュ管理         | ✅ |
| DB                     | expo-sqlite + Drizzle           | ローカル完結、型安全   | ✅ |
| スタイリング           | StyleSheet + テーマ定数         | テスト安全             | ✅ |
| バリデーション         | Zod                             | 型推論                 | ✅ |
| 日付処理               | date-fns                        | 軽量                   | ✅ |
| セキュアストレージ     | expo-secure-store               | 暗号化保存             | ✅ |
| プッシュ通知           | expo-notifications              | ローカル通知           | ✅ |
| 課金                   | RevenueCat                      | 業界標準               | 🔲 |
| テスト                 | Jest + RNTL                     | Expo公式推奨           | ✅ |
| リント                 | ESLint (Flat Config) + Prettier | 品質管理               | ✅ |

### ライブラリ統合詳細

新規追加されたライブラリの設定ファイルと使用方法：

| ライブラリ | 設定ファイル | ドキュメント |
| ---------- | ------------ | ------------ |
| Zod | `lib/validation.ts` | `lib/README.md` |
| date-fns | `lib/date.ts` | `lib/README.md` |
| expo-secure-store | `lib/secure-storage.ts` | `lib/README.md` |
| expo-notifications | `services/notifications.ts` | `lib/README.md` |

**サンプル実装**: `features/_example/components/` 配下に各ライブラリのデモコンポーネントを配置

- `validation-demo.tsx` - zodバリデーションデモ
- `date-demo.tsx` - date-fnsフォーマットデモ
- `secure-storage-demo.tsx` - セキュアストレージデモ
- `notification-demo.tsx` - プッシュ通知デモ
