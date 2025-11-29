# Implementation Plan

## 1. SDK基盤の構築

- [x] 1.1 (P) RevenueCat SDK初期化とAPIキー管理を実装
  - プラットフォーム別（iOS/Android）のAPIキー検証機能を追加
  - 環境変数 `EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE` と `EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE` から読み込み
  - APIキー未設定時に明確なエラーメッセージを表示するバリデーションを実装
  - 開発モードでDEBUGレベルのログを有効化
  - SDK初期化関数を `features/subscription/core/sdk.ts` に配置
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 12.1, 12.2_

- [x] 1.2 (P) ドメイン型定義を作成
  - `Subscription` エンティティ（isActive, tier, expiresAt, productId）を定義
  - `UsageLimits` Value Object（maxItems, maxExports, hasAds）を定義
  - `SubscriptionPackage` 型（identifier, title, priceString, price, currencyCode, introPrice）を定義
  - `FeatureLevel` 型（'basic' | 'premium'）を定義
  - `SubscriptionError` のエラーコードとメッセージ構造を定義
  - `Result<T, E>` 型（success/error パターン）を定義
  - すべての型を `features/subscription/core/types.ts` に配置
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 1.3 app/_layout.tsx にSDK初期化を統合
  - 既存の `initializeApp()` 関数内で RevenueCat SDK 初期化を並列実行
  - データベース・ストア rehydration と同時に RevenueCat を設定
  - 初期化エラー時も free tier モードでアプリ起動を継続
  - タイムアウト管理（既存の `INIT_TIMEOUT_MS` を適用）
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 1.4, 7.1_

## 2. Repository Layerの実装

- [x] 2.1 (P) Subscription Repositoryを実装
  - RevenueCat SDK の `Purchases.getCustomerInfo()` を呼び出して状態を取得
  - `CustomerInfo` をドメインエンティティ `Subscription` に変換する `toSubscription()` 関数を実装
  - `entitlements.active["premium"]` の有無で tier を判定
  - エラーを `SubscriptionError` にマッピングする `toSubscriptionError()` 関数を実装
  - `PURCHASE_CANCELLED_ERROR_CODE` (1) を `PURCHASE_CANCELLED` に変換
  - ネットワークエラーを `NETWORK_ERROR` として `retryable: true` フラグを設定
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 2.3, 10.1, 10.2, 10.3_

- [x] 2.2 (P) 購入・復元フローのRepository実装
  - `purchasePackage(packageId)` メソッドを実装し、RevenueCat の `Purchases.purchasePackage()` を呼び出し
  - 購入成功時に更新された `CustomerInfo` を取得し、`Subscription` に変換して返却
  - `restorePurchases()` メソッドを実装し、RevenueCat の `Purchases.restorePurchases()` を呼び出し
  - 復元成功時にアクティブなサブスクリプションがあれば `Subscription` を返却、なければ `null`
  - エラー発生時に適切な `SubscriptionError` を返却
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 4.1, 5.1, 6.1_

## 3. Application Service Layerの実装

- [x] 3.1 (P) Subscription Serviceを実装
  - サブスクリプション状態に基づいた `UsageLimits` 計算ロジックを実装
  - Free tier: `maxItems: 10, maxExports: 1, hasAds: true`
  - Premium tier: `maxItems: Infinity, maxExports: Infinity, hasAds: false`
  - Feature Gating ロジック `canAccessFeature(level)` を実装
  - 'basic' レベルは常にアクセス許可、'premium' レベルは `tier === 'premium'` の場合のみ許可
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 2.2, 3.3, 3.4, 8.1, 8.2, 8.4_

- [x] 3.2 (P) 購入・復元のService層ロジックを実装
  - Repository から取得した `Result` を評価し、成功時にサブスクリプション状態を更新
  - エラー時に適切なエラーハンドリング（キャンセル、ネットワークエラー、システムエラー）
  - `PRODUCT_ALREADY_PURCHASED` エラー時に自動的に `restorePurchases()` を実行
  - 期限切れサブスクリプションを検出し、自動的に free tier にフォールバック
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 5.2, 5.3, 5.4, 6.2, 6.3, 7.5_

- [x] 3.3 (P) Zustandストアとの統合（オプション）
  - Subscription Service の `updateSubscriptionState()` で Zustand の `isPremium` フラグを同期
  - `useStore.getState().setPremium(subscription.tier === 'premium')` を呼び出し
  - 既存の `store/slices/app-slice.ts` と互換性を保つ
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 14.1, 14.2_

## 4. Presentation Layerの実装

- [ ] 4.1 Subscription Providerを実装
  - React Context で サブスクリプション状態（subscription, loading, error）を管理
  - 初回マウント時に Repository から `fetchCustomerInfo()` を呼び出し
  - 購入・復元アクション関数（purchasePackage, restorePurchases, refetchSubscription）を提供
  - 処理中は `loading: true` を設定し、重複リクエストを防止
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 7.1, 7.2_

- [ ] 4.2 (P) useSubscription Hookを実装
  - Subscription Context から状態とアクションを取得
  - 派生状態（isPremium, isFree, usageLimits）を `useMemo` で計算
  - Feature Gating 用の `canAccessFeature(level)` 関数を提供
  - Context 外で呼び出された場合にエラーを throw
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 7.3, 7.4, 5.5, 6.5_

- [ ] 4.3 app/_layout.tsx に Subscription Providerを統合
  - `<QueryClientProvider>` と同階層に `<SubscriptionProvider>` を配置
  - アプリ全体にサブスクリプション状態を提供
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 7.1_

## 5. Paywall UI の実装

- [ ] 5.1 (P) RevenueCat Paywall UIラッパーを実装
  - `react-native-purchases-ui` の `<RevenueCatUI.Paywall>` コンポーネントをラップ
  - 購入・復元・キャンセル・エラーの各イベントに対するコールバックを実装
  - `onPurchaseCompleted` / `onRestoreCompleted` で `refetchSubscription()` を呼び出し
  - `onDismiss` でナビゲーションを制御（前の画面に戻る）
  - 閉じるボタンを表示し、ユーザーが Paywall を簡単に終了できるようにする
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 5.2 (P) Paywallスクリーンを expo-router に追加
  - `app/paywall.tsx` として独立したルートに配置
  - iOS Design System のカラーとタイポグラフィを適用（`useThemedColors()` を使用）
  - RevenueCat Dashboard で設定された Offering を自動表示
  - 割引率計算ロジック（月額 vs 年額）を実装し、UI に表示
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 4.3, 14.4_

## 6. Settings 画面への復元ボタン統合

- [ ] 6.1 Settings 画面に「購入を復元」ボタンを追加
  - `useSubscription` Hook から `restorePurchases()` を取得
  - iOS App Store ガイドライン準拠のため、ボタンを必ず表示
  - 復元処理中はローディングインジケーターを表示
  - 復元成功時に「購入を復元しました」メッセージを表示
  - 復元可能な購入がない場合に「復元可能な購入がありません」メッセージを表示
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 6.4, 6.5_

## 7. テスト実装

- [ ] 7.1 (P) RevenueCat SDK モックを作成
  - `__mocks__/react-native-purchases.ts` に配置
  - `setupFreeUserMock()` 関数で無料ユーザーの状態を設定
  - `setupPremiumUserMock()` 関数でプレミアムユーザーの状態を設定
  - 購入フロー、復元フロー、エラーケース（PURCHASE_CANCELLED, NETWORK_ERROR）をシミュレート
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 7.2 (P) Subscription Service のユニットテストを実装
  - `getUsageLimits('free')` が正しい制限を返すことを検証
  - `getUsageLimits('premium')` が正しい制限を返すことを検証
  - `canAccessFeature('basic')` が常に `true` を返すことを検証
  - `canAccessFeature('premium')` が tier に基づいて正しく判定することを検証
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 3.3, 3.4, 8.1, 8.2_

- [ ] 7.3 (P) Subscription Repository のユニットテストを実装
  - `toSubscription(CustomerInfo)` が正しくドメインエンティティに変換することを検証
  - `toSubscriptionError(PurchasesError)` がエラーコードを正しくマッピングすることを検証
  - `entitlements.active["premium"]` の有無で tier が正しく判定されることを検証
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 2.3, 10.1_

- [ ] 7.4 (P) useSubscription Hook のユニットテストを実装
  - 派生状態（isPremium, isFree）が subscription state に基づいて正しく計算されることを検証
  - Context 外で呼び出された場合にエラーが throw されることを検証
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 7.3, 7.4_

- [ ]* 7.5 統合テストを実装（オプション）
  - Mock SDK を使用し、購入フロー全体（`purchasePackage()` から状態更新まで）を検証
  - Mock SDK を使用し、復元フロー全体（`restorePurchases()` から状態更新まで）を検証
  - Subscription Provider が初回マウント時に `fetchCustomerInfo()` を呼び出すことを検証
  - Zustand ストア同期（サブスクリプション変更時に `isPremium` が更新される）を検証
  - ネットワークエラー時に `NETWORK_ERROR` が返され、再試行フラグが設定されることを検証
  - _要件: 5.1, 5.2, 6.1, 6.2, 7.1, 10.3, 14.2 のアクセプタンス基準を満たす基本機能は実装タスクでカバー済み。本タスクは追加の統合テストカバレッジを提供するが、MVP後に実施可能_

## 8. ドキュメンテーションとサンプルコード

- [ ] 8.1 (P) features/subscription/README.md を作成
  - アーキテクチャ概要（Clean Architecture, DDD レイヤー構造）を記載
  - 使用方法（`useSubscription` Hook の例、購入・復元フロー）を記載
  - UsageLimits のカスタマイズ例（AI アプリ、ファイルストレージアプリ、プロジェクト管理アプリ）を提供
  - RevenueCat Dashboard での製品設定手順をステップバイステップで説明
  - トラブルシューティングセクション（「購入できない」「復元できない」）を追加
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 13.1, 13.2, 13.3, 13.5_

- [ ] 8.2 (P) サンプルコードを追加
  - `features/_example/` または Demo 画面に基本的な使用例を配置
  - 購入フローの例（Paywall 表示、パッケージ選択、購入実行）
  - 復元フローの例（Settings 画面、復元ボタン）
  - Feature Gating の例（`canAccessFeature` でプレミアム機能を制限）
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 13.4_

- [ ] 8.3 (P) .env.local 設定手順を README.md に追加
  - 環境変数の設定方法（`EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE` と `GOOGLE`）を記載
  - RevenueCat Dashboard から API キーを取得する手順を説明
  - `.gitignore` に `.env.local` が含まれていることを確認
  - 本番環境では Expo Secrets または環境変数管理サービスを推奨
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 12.3, 12.4, 12.5_

## 9. 品質保証とビルド検証

- [ ] 9.1 型チェック・Lint・フォーマットを実行
  - `pnpm typecheck` を実行し、型エラーがないことを確認
  - `pnpm lint` を実行し、ESLint ルールに違反がないことを確認
  - `pnpm format` を実行し、Prettier フォーマットに準拠することを確認
  - すべてのエラーを修正
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 15.1, 15.2, 15.3_

- [ ] 9.2 テストを実行
  - `pnpm test` を実行し、すべてのユニットテストに合格することを確認
  - カバレッジレポートを確認し、重要なロジックがテストされていることを検証
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 15.4_

- [ ] 9.3 統合チェックを実行
  - `pnpm check` を実行し、すべての品質チェック（format + lint + typecheck + test）に合格することを確認
  - エラーが発生した場合、該当タスクに戻って修正
  - `pnpm check` を実行し、すべてのチェックにパスすることを確認。
  - _Requirements: 15.5_
