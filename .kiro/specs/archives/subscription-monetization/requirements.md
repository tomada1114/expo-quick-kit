# Requirements Document

## Project Description (Input)

TODO3.md ならびに TEMPLATE_ARCHITECTURE.md さらにClaude Skills の `expo-subscription-monetization` を参照しながら、このリポジトリ(ボイラープレート)としてRevenueCatによるサブスクリプション(月額・年額)を爆速で開発する環境を整える

## Introduction

本仕様は、expo-quick-kit ボイラープレートにRevenueCatを使用したサブスクリプション収益化機能を統合するものです。Clean ArchitectureとDDD原則に基づいた実装により、月額・年額プランの購入、機能制限(Feature Gating)、復元フローを提供します。このボイラープレートを使用する開発者が、サブスクリプション機能をすぐに利用できる状態を目指します。

## Requirements

### Requirement 1: RevenueCat SDK統合

**Objective:** As a developer, I want RevenueCat SDK to be properly integrated into the boilerplate, so that subscription functionality can work on both iOS and Android platforms.

#### Acceptance Criteria

1. When アプリが起動される, the Subscription SDK shall RevenueCatを初期化し、プラットフォームに応じた適切なAPIキーで設定する
2. When SDKの初期化が実行される, the Subscription SDK shall 開発モードでDEBUGレベルのログを有効化する
3. When APIキーが環境変数に存在しない, then the Subscription SDK shall 明確なエラーメッセージを表示し、初期化を失敗させる
4. The Subscription SDK shall expo-dev-clientを使用した開発ビルド環境で動作する
5. The Subscription SDK shall `features/subscription/core/sdk.ts` に初期化ロジックを実装する

### Requirement 2: サブスクリプションアーキテクチャ

**Objective:** As a developer, I want a Clean Architecture-based subscription implementation, so that the codebase is maintainable, testable, and follows DDD principles.

#### Acceptance Criteria

1. The Subscription Module shall 以下のレイヤー構造を持つ: core(types, config, sdk, repository, service), providers, hooks, components, mocks
2. When ドメインロジックが実装される, the Subscription Service shall 外部SDKの詳細に依存せず、純粋なビジネスロジックのみを含む
3. When RevenueCatのCustomerInfoが取得される, the Repository shall これをドメインエンティティ(Subscription)に変換する
4. The Subscription Module shall Zustand、TanStack Query、Drizzle ORMなど既存のプロジェクト技術スタックと統合する
5. The Subscription Module shall `features/subscription/` ディレクトリに配置される

### Requirement 3: サブスクリプションエンティティと型定義

**Objective:** As a developer, I want well-defined TypeScript types and domain entities, so that subscription state is type-safe and clearly understood.

#### Acceptance Criteria

1. The Subscription Type shall `isActive: boolean` と `tier: 'free' | 'premium'` を持つ
2. The UsageLimits Type shall `maxItems: number`, `maxExports: number`, `hasAds: boolean` を持つ
3. When 無料ティアが適用される, the Subscription Service shall maxItems: 10, maxExports: 1, hasAds: true を返す
4. When プレミアムティアが適用される, the Subscription Service shall maxItems: Infinity, maxExports: Infinity, hasAds: false を返す
5. The Subscription Module shall SubscriptionPackage, FeatureLevel, SubscriptionErrorなどの型を `core/types.ts` に定義する

### Requirement 4: 月額・年額プラン設定

**Objective:** As a user, I want to choose between monthly and annual subscription plans, so that I can select the billing cycle that suits my needs.

#### Acceptance Criteria

1. The Subscription System shall RevenueCatのOfferingsから月額プラン(`$rc_monthly`)と年額プラン(`$rc_annual`)を取得する
2. When 利用可能なパッケージが読み込まれる, the Subscription Service shall 各プランの識別子、タイトル、価格、通貨コードを含むSubscriptionPackageの配列を返す
3. When 年額プランが表示される, the Paywall UI shall 月額プランと比較した割引率(例: 16.6% off)を計算して表示する
4. If RevenueCatのOfferingsが利用できない, then the Subscription Service shall 空の配列を返し、エラーをログに記録する
5. The Subscription Service shall 導入価格(introductory price)が設定されている場合、その情報を含める

### Requirement 5: 購入フロー

**Objective:** As a user, I want to purchase a subscription plan smoothly, so that I can access premium features.

#### Acceptance Criteria

1. When ユーザーがパッケージを選択して購入ボタンを押す, the Subscription Service shall 指定されたパッケージIDでRevenueCat購入APIを呼び出す
2. When 購入が成功する, the Subscription Service shall CustomerInfoを再取得し、サブスクリプション状態を更新する
3. If ユーザーが購入をキャンセルする, then the Subscription Service shall `PURCHASE_CANCELLED` エラーを返し、UIに適切なメッセージを表示する
4. If 購入中にネットワークエラーが発生する, then the Subscription Service shall `NETWORK_ERROR` エラーを返し、再試行を促す
5. While 購入処理が実行中である, the Paywall UI shall ローディング状態を表示し、重複購入を防ぐ

### Requirement 6: 購入復元フロー

**Objective:** As a user, I want to restore my previous purchases, so that I can access premium features on a new device or after reinstalling the app.

#### Acceptance Criteria

1. When ユーザーが「購入を復元」ボタンを押す, the Subscription Service shall RevenueCatの復元APIを呼び出す
2. When 復元が成功し、アクティブなサブスクリプションが見つかる, the Subscription Service shall サブスクリプション状態を更新し、成功メッセージを表示する
3. If 復元時にアクティブなサブスクリプションが見つからない, then the Subscription Service shall 「復元可能な購入がありません」というメッセージを表示する
4. The Settings Screen shall iOS App Storeのガイドラインに従い、「購入を復元」ボタンを必ず表示する
5. While 復元処理が実行中である, the UI shall ローディング状態を表示する

### Requirement 7: サブスクリプション状態管理

**Objective:** As a developer, I want subscription state to be managed reactively, so that the UI automatically reflects subscription changes.

#### Acceptance Criteria

1. When アプリが起動される, the RevenueCatProvider shall 現在のサブスクリプション状態をRevenueCatから取得する
2. When サブスクリプション状態が変更される, the Subscription Context shall すべての購読中のコンポーネントに変更を通知する
3. The useSubscription Hook shall `isPremium`, `isFree`, `usageLimits`, `subscription`, `loading`, `error` を返す
4. The useSubscription Hook shall `purchasePackage`, `restorePurchases`, `canAccessFeature` などのアクション関数を提供する
5. When サブスクリプションが期限切れになる, the Subscription Service shall 自動的に無料ティアにフォールバックする

### Requirement 8: 機能制限(Feature Gating)

**Objective:** As a developer, I want to restrict premium features to paid users, so that free users are encouraged to upgrade while still having access to basic functionality.

#### Acceptance Criteria

1. When 機能レベルが'basic'である, the Subscription Service shall すべてのユーザーにアクセスを許可する
2. When 機能レベルが'premium'であり、ユーザーが無料ティアである, the Subscription Service shall アクセスを拒否し、アップグレードプロンプトを表示する
3. When 無料ユーザーがアイテム数制限に達する, the UI shall 「無料プランは最大10アイテムまでです。アップグレードして無制限にアクセスしましょう」というメッセージを表示する
4. When プレミアムユーザーがアプリを使用する, the UI shall 広告を表示しない(usageLimits.hasAds: false)
5. The Feature Gating Logic shall UI層(`canAccessFeature`)とロジック層(Repository, Service)の両方で実装される

### Requirement 9: Paywall UI

**Objective:** As a user, I want an attractive and clear paywall screen, so that I understand the benefits of upgrading and can easily make a purchase.

#### Acceptance Criteria

1. The Paywall Screen shall RevenueCatの組み込みPaywall UI (`react-native-purchases-ui`) を使用する
2. The Paywall shall RevenueCat Dashboardで設定されたOffering(月額・年額プラン)を自動的に表示する
3. When 購入処理中である, the Paywall shall 自動的にローディング状態を管理し、重複購入を防ぐ
4. The Paywall shall 購入、復元、キャンセル、エラーの各イベントに対応したコールバックを提供する
5. The Paywall Screen shall `features/subscription/components/Paywall.tsx` にRevenueCat UIのラッパーとして実装される
6. The Paywall shall 閉じるボタンを表示し、ユーザーがPaywallを簡単に終了できるようにする

### Requirement 10: エラーハンドリングとロギング

**Objective:** As a developer, I want comprehensive error handling and logging, so that subscription issues can be quickly diagnosed and resolved.

#### Acceptance Criteria

1. When RevenueCat APIがエラーを返す, the Subscription Service shall エラーをドメインエラー(`SubscriptionError`)にマッピングする
2. When ユーザーが購入をキャンセルする, the System shall `PURCHASE_CANCELLED` エラーコードを返し、エラーログに記録しない
3. If ネットワークエラーが発生する, then the System shall `NETWORK_ERROR` エラーコードを返し、再試行可能であることを示す
4. If 設定エラー(APIキー不足など)が発生する, then the System shall `CONFIGURATION_ERROR` エラーコードを返し、開発者に詳細情報を提供する
5. While 開発モードである, the Subscription SDK shall すべてのRevenueCat APIコールをコンソールにログ出力する

### Requirement 11: テスト環境とモック

**Objective:** As a developer, I want mock implementations and test utilities, so that subscription features can be tested without real purchases.

#### Acceptance Criteria

1. The Mock Module shall `setupFreeUserMock()` と `setupPremiumUserMock()` 関数を提供する
2. When Jestテストが実行される, the Mock Module shall RevenueCat SDKをモックし、設定されたサブスクリプション状態を返す
3. The Mock Module shall 購入フロー、復元フロー、エラーケースをシミュレートする機能を提供する
4. The Test Utilities shall `__mocks__/react-native-purchases.ts` に配置される
5. When ユニットテストが実行される, the System shall 実際のRevenueCat APIを呼び出さず、すべてモックされたレスポンスを使用する

### Requirement 12: 環境変数とAPIキー管理

**Objective:** As a developer, I want secure API key management, so that RevenueCat credentials are not exposed in the codebase.

#### Acceptance Criteria

1. The Configuration Module shall `EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE` と `EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE` を環境変数から読み込む
2. When APIキーが設定されていない, the SDK Initialization shall 明確なエラーメッセージを表示する: "RevenueCat API key is missing for iOS/Android"
3. The Documentation shall `.env.local` にAPIキーを設定する手順を記載する
4. The `.env.local` ファイル shall `.gitignore` に含まれ、リポジトリにコミットされない
5. The Production Setup shall Expo Secretsまたは環境変数管理サービスを使用してAPIキーを安全に管理する

### Requirement 13: ドキュメントとサンプルコード

**Objective:** As a developer using this boilerplate, I want comprehensive documentation and examples, so that I can quickly understand and customize the subscription system.

#### Acceptance Criteria

1. The Documentation shall `features/subscription/README.md` にアーキテクチャ、使用方法、カスタマイズ方法を記載する
2. The Documentation shall UsageLimitsのカスタマイズ例(AI アプリ、ファイルストレージアプリ、プロジェクト管理アプリ)を提供する
3. The Documentation shall RevenueCatダッシュボードでの製品設定手順をステップバイステップで説明する
4. The Sample Code shall `features/_example/` に基本的な使用例(購入、復元、機能制限チェック)を含める
5. The README.md shall トラブルシューティングセクション(「購入できない」「復元できない」など)を含む

### Requirement 14: 既存システムとの統合

**Objective:** As a developer, I want the subscription system to integrate seamlessly with existing boilerplate features, so that the overall architecture remains consistent.

#### Acceptance Criteria

1. The Subscription Module shall Zustandの `store/slices/app-slice.ts` の `isPremium` フラグと連携する
2. When サブスクリプション状態が変更される, the Subscription Service shall Zustandストアを更新する(オプション)
3. The Subscription Module shall TanStack Queryを使用してサブスクリプション状態をキャッシュする(オプション)
4. The Subscription Module shall 既存のテーマシステム(iOS Design System)を使用してPaywall UIを構築する
5. The Subscription Module shall 既存のプロジェクト構造(`@/*` パスエイリアス、kebab-case命名規則)に従う

### Requirement 15: ビルドと型チェック

**Objective:** As a developer, I want the subscription module to pass all quality checks, so that it maintains the boilerplate's high code quality standards.

#### Acceptance Criteria

1. When `pnpm typecheck` が実行される, the Subscription Module shall 型エラーを発生させない
2. When `pnpm lint` が実行される, the Subscription Module shall ESLintルールに違反しない
3. When `pnpm format` が実行される, the Subscription Module shall Prettierフォーマットに準拠する
4. When `pnpm test` が実行される, the Subscription Module shall すべてのユニットテストとインテグレーションテストに合格する
5. When `pnpm check` が実行される, the Subscription Module shall すべての品質チェック(format + lint + typecheck + test)に合格する
