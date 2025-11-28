# Research & Design Decisions

## Summary

- **Feature**: `subscription-monetization`
- **Discovery Scope**: Complex Integration
- **Key Findings**:
  - RevenueCat SDK 8.9.2+ は React Native New Architecture と Expo SDK 54 に完全対応
  - react-native-purchases-ui は RevenueCat Dashboard で遠隔設定可能なペイウォール UI を提供
  - Clean Architecture + DDD パターンは既存のボイラープレート構造と高い親和性を持つ

## Research Log

### RevenueCat SDK バージョンと互換性調査

- **Context**: Expo SDK 54 と React Native 0.81 環境で RevenueCat が動作するか、New Architecture 対応状況を確認する必要があった
- **Sources Consulted**:
  - [RevenueCat React Native Documentation](https://www.revenuecat.com/docs/getting-started/installation/reactnative)
  - [RevenueCat Expo Installation Guide](https://www.revenuecat.com/docs/getting-started/installation/expo)
  - [RevenueCat Community: New Architecture Support](https://community.revenuecat.com/sdks-51/react-native-0-76-7-expo-52-revenuecat-paywall-react-native-purchases-ui-causes-app-to-crash-when-passing-fontfamily-options-5879)
  - [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- **Findings**:
  - **最小要件**: React Native 0.73.0, Android Kotlin 1.8.0, iOS deployment target 13.4, Android API 23
  - **New Architecture 対応**: RevenueCat SDK 8.9.2+ で New Architecture 対応済み。以前の fontFamily 関連クラッシュ (React Native 0.76.7 + Expo 52) は 8.9.2 で修正済み
  - **Expo 互換性**: expo-dev-client 必須。Expo Go では動作不可 (ネイティブモジュール依存)
  - **SDK 54 タイムライン**: SDK 54 は Legacy Architecture をサポートする最後のバージョン。SDK 55 以降は New Architecture のみ対応予定
- **Implications**:
  - RevenueCat SDK は現在の技術スタック (Expo SDK 54, React Native 0.81, New Architecture) と完全互換
  - 開発ビルド環境 (expo-dev-client) のセットアップが必須要件
  - 今後の SDK 更新で New Architecture 対応が継続される見込み

### RevenueCat Paywall UI (react-native-purchases-ui) 調査

- **Context**: カスタムペイウォール UI を実装せず、RevenueCat の組み込み UI を使用する方針を検証
- **Sources Consulted**:
  - [RevenueCat Paywall Display Documentation](https://www.revenuecat.com/docs/tools/paywalls/displaying-paywalls)
  - [react-native-purchases-ui npm package](https://www.npmjs.com/package/react-native-purchases-ui/v/9.2.1)
  - [RevenueCat Blog: How to add subscriptions to Expo app](https://www.revenuecat.com/blog/engineering/how-to-add-in-app-purchases-to-your-bolt-generated-expo-app/)
- **Findings**:
  - **表示方法**: 3つのアプローチ
    1. `RevenueCatUI.presentPaywall()`: モーダル表示 (Promise ベース)
    2. `RevenueCatUI.presentPaywallIfNeeded()`: Entitlement 未保有時のみ表示
    3. `<RevenueCatUI.Paywall>` コンポーネント: 手動レンダリング (柔軟性が高い)
  - **イベントハンドリング**: `onPurchaseCompleted`, `onRestoreCompleted`, `onPurchaseError`, `onDismiss` などのコールバックを提供
  - **遠隔設定**: RevenueCat Dashboard で UI デザインを変更可能 (コード変更・アプリ更新不要)
  - **ローディング状態**: SDK が自動管理 (手動実装不要)
- **Implications**:
  - `<RevenueCatUI.Paywall>` コンポーネントを使用し、expo-router のルート (`app/paywall.tsx`) として実装
  - カスタムイベント処理 (購入成功時の状態更新、ナビゲーション制御) を Paywall ラッパーコンポーネントで実装
  - iOS Design System のテーマカラーは RevenueCat Dashboard で設定可能 (カスタムフォント、カラーパレット対応)

### Clean Architecture + DDD パターン適用調査

- **Context**: サブスクリプション機能を既存のボイラープレート構造に統合する最適なアーキテクチャパターンを決定
- **Sources Consulted**:
  - [5 Clean Architecture Principles for Mobile Apps](https://www.zeepalm.com/blog/5-clean-architecture-principles-for-mobile-apps)
  - [Clean Domain-Driven Design](https://medium.com/unil-ci-software-engineering/clean-domain-driven-design-2236f5430a05)
  - [Understanding DDD and Clean Architecture](https://medium.com/bimar-teknoloji/understanding-clean-architecture-and-domain-driven-design-ddd-24e89caabc40)
- **Findings**:
  - **Clean Architecture の原則**: 依存性逆転、レイヤー分離 (Presentation → Application → Domain ← Infrastructure)
  - **DDD との組み合わせ**: Clean Architecture が技術的構造を提供し、DDD がドメインモデリングを担当
  - **モバイルアプリへの適用**: Domain Layer (エンティティ、Value Object) を中心に、Repository が外部 SDK を抽象化
  - **テスタビリティ**: ドメインロジックが外部依存から分離されるため、ユニットテストが容易
- **Implications**:
  - Subscription Module を以下の構造で実装:
    - **Domain**: `Subscription` Entity, `UsageLimits` Value Object (外部依存なし)
    - **Application**: `SubscriptionService` (ビジネスロジック、Feature Gating)
    - **Infrastructure**: `SubscriptionRepository` (RevenueCat SDK との通信、変換ロジック)
    - **Presentation**: `SubscriptionProvider` (React Context), `useSubscription` Hook
  - 既存のボイラープレート構造 (`features/` モジュール) と整合性が高い

### 環境変数と API キー管理

- **Context**: RevenueCat API キーを安全に管理し、開発・本番環境で異なるキーを使用する仕組みを確立
- **Sources Consulted**:
  - [RevenueCat API Keys Documentation](https://www.revenuecat.com/docs/getting-started/configuring-sdk)
  - [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- **Findings**:
  - **Public API Key vs Secret Key**: Public API Key はクライアント側に安全に埋め込み可能 (RevenueCat がサーバー側で検証)
  - **プラットフォーム別キー**: iOS と Android で異なる API キーを使用 (Hybrid SDK の要件)
  - **環境変数命名**: `EXPO_PUBLIC_` プレフィックスで Expo がビルド時にバンドル
- **Implications**:
  - `.env.local` に `EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE` と `EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE` を設定
  - `.gitignore` に `.env.local` を追加し、リポジトリにコミットしない
  - 本番環境では Expo Secrets (`eas secret:create`) で管理

### 既存ボイラープレート統合ポイント分析

- **Context**: 既存のアプリ初期化フロー、Zustand ストア、テーマシステムとの統合方法を確認
- **Sources Consulted**:
  - `app/_layout.tsx`: アプリ初期化フロー (データベース、ストア rehydration)
  - `store/slices/app-slice.ts`: `isPremium` フラグの既存実装
  - `constants/theme.ts`: iOS Design System のカラーパレット
- **Findings**:
  - **並列初期化**: `_layout.tsx` でデータベース、ストア rehydration、RevenueCat SDK 初期化を並列実行可能
  - **タイムアウト管理**: 既存の `INIT_TIMEOUT_MS` (5000ms) を適用し、RevenueCat 初期化の長時間ブロックを防止
  - **Zustand 統合**: `isPremium` フラグは既に定義済み。Subscription Service で `useStore.getState().setPremium()` を呼び出し同期
  - **テーマシステム**: `useThemedColors()` Hook で iOS Design System のカラーにアクセス可能
- **Implications**:
  - RevenueCat SDK 初期化を `_layout.tsx` の並列初期化ブロックに追加
  - Subscription Provider を `<QueryClientProvider>` と同階層に配置
  - Paywall UI で `useThemedColors()` を使用し、テーマカラーを適用

## Architecture Pattern Evaluation

| Option            | Description                                               | Strengths                                                    | Risks / Limitations                                          | Notes                                                        |
| ----------------- | --------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **Clean Architecture** | Onion Architecture: Domain → Application → Infrastructure → Presentation | - ドメインロジックが外部依存から完全分離<br>- テスタビリティが高い<br>- 既存のボイラープレート構造と整合性が高い | - レイヤー数が増えるため、小規模機能には過剰<br>- 開発者がアーキテクチャを理解する必要がある | 既存の `features/` モジュール構造と整合。DDD 原則を適用 |
| **Repository Pattern Only** | Repository で RevenueCat SDK を抽象化、Service Layer なし | - シンプルな実装<br>- 少ないファイル数                       | - ビジネスロジック (Feature Gating, UsageLimits) の配置が曖昧<br>- テストが困難 (Repository と UI の密結合) | 小規模プロジェクトには適しているが、ボイラープレートの目的 (再利用性、拡張性) に不適合 |
| **Direct SDK Integration** | RevenueCat SDK を UI コンポーネントから直接呼び出し      | - 最もシンプル<br>- 実装が迅速                               | - テスト不可能<br>- SDK 変更時の影響範囲が広い<br>- ビジネスロジックが UI に散在 | アンチパターン。ボイラープレートの品質基準に適合しない   |

**選択されたアプローチ**: Clean Architecture + Repository Pattern

## Design Decisions

### Decision: React Context vs TanStack Query for State Management

- **Context**: サブスクリプション状態を UI コンポーネントに配信する方法を決定
- **Alternatives Considered**:
  1. **React Context**: Provider でサブスクリプション状態を管理し、`useSubscription` Hook で配信
  2. **TanStack Query**: `useQuery` でサブスクリプション状態をキャッシュし、自動再フェッチ
  3. **Zustand のみ**: Zustand ストアにサブスクリプション状態を保存し、グローバルアクセス
- **Selected Approach**: React Context + オプションで TanStack Query
- **Rationale**:
  - React Context は軽量で、サブスクリプション状態のリアクティブな配信に最適
  - TanStack Query は既存のボイラープレートで採用されているため、キャッシュ戦略として追加可能 (オプション統合)
  - Zustand のみでは、状態配信のための `useEffect` が増え、コンポーネントコードが複雑化
- **Trade-offs**:
  - **Benefits**: Context は React の標準機能で学習コストが低い。TanStack Query のキャッシュ機能は高度な最適化に有用
  - **Compromises**: Context のみでは自動再フェッチ機能がないため、手動で `refetchSubscription()` を実装
- **Follow-up**: TanStack Query 統合は初期実装後にオプションとして追加し、パフォーマンス改善の必要性を評価

### Decision: RevenueCat Paywall UI vs Custom UI

- **Context**: ペイウォール画面の実装方法を決定
- **Alternatives Considered**:
  1. **RevenueCat 組み込み UI** (`react-native-purchases-ui`): Dashboard で遠隔設定可能
  2. **カスタム UI**: 独自の Paywall コンポーネントを実装し、RevenueCat SDK で購入処理のみ実行
- **Selected Approach**: RevenueCat 組み込み UI (`<RevenueCatUI.Paywall>`)
- **Rationale**:
  - RevenueCat Dashboard で UI をコード変更なしに更新可能 (A/B テストに有利)
  - ローディング状態、エラーハンドリングが SDK で自動管理される
  - iOS Design System のカラーとフォントを Dashboard で設定可能
  - カスタム UI は実装コストが高く、ボイラープレートの目的 (迅速な開発開始) に反する
- **Trade-offs**:
  - **Benefits**: 開発時間の短縮、遠隔設定による柔軟性、メンテナンスコストの削減
  - **Compromises**: UI カスタマイズの自由度が制限される (Dashboard の設定範囲内)
- **Follow-up**: 高度なカスタマイズが必要な場合、`<RevenueCatUI.Paywall>` をラップし、追加の UI 要素を実装可能

### Decision: Zustand Store の `isPremium` フラグ同期

- **Context**: 既存の `isPremium` フラグをサブスクリプション状態と同期するか決定
- **Alternatives Considered**:
  1. **同期する**: Subscription Service で `useStore.getState().setPremium()` を呼び出し
  2. **同期しない**: `isPremium` フラグを非推奨とし、`useSubscription().isPremium` のみ使用
- **Selected Approach**: 同期する (オプション統合)
- **Rationale**:
  - 既存のボイラープレートコードとの後方互換性を保つ
  - 既存の UI コンポーネントが `useStore().isPremium` を参照している可能性があるため、移行コストを削減
  - 同期ロジックは `updateSubscriptionState()` 内に集約され、メンテナンス容易性が高い
- **Trade-offs**:
  - **Benefits**: 既存コードとの互換性、段階的な移行が可能
  - **Compromises**: 状態の二重管理 (React Context と Zustand) により、一貫性の維持が必要
- **Follow-up**: ドキュメントに `useSubscription().isPremium` の使用を推奨し、`useStore().isPremium` は非推奨とする旨を記載

### Decision: Repository の Result 型パターン採用

- **Context**: エラーハンドリング方法を決定 (例外 vs Result 型)
- **Alternatives Considered**:
  1. **Result 型**: `Result<T, E>` で成功・失敗を明示的に返却
  2. **例外スロー**: `try-catch` でエラーハンドリング
- **Selected Approach**: Result 型パターン
- **Rationale**:
  - TypeScript の型システムを活用し、エラーハンドリングを強制
  - 例外は予期しないエラーに限定し、ビジネスロジックのエラーは Result 型で表現
  - 関数型プログラミングのベストプラクティスに準拠
- **Trade-offs**:
  - **Benefits**: 型安全性、エラーハンドリングの明示性
  - **Compromises**: 呼び出し側で `if (result.success)` のチェックが必要 (やや冗長)
- **Follow-up**: すべての Repository メソッドで Result 型を統一し、Service Layer でエラー処理を実装

## Risks & Mitigations

- **Risk 1: RevenueCat API レスポンスタイムが長い場合、アプリ起動時間が延びる**
  - **Mitigation**: `INIT_TIMEOUT_MS` (5000ms) でタイムアウトを設定し、初期化失敗時は free tier モードで起動継続
- **Risk 2: RevenueCat Dashboard で Offering が未設定の場合、Paywall が表示されない**
  - **Mitigation**: エラーハンドリングで「Offering が見つかりません」メッセージを表示し、ドキュメントに設定手順を詳述
- **Risk 3: RevenueCat の CustomerInfo スキーマ変更により、変換ロジックが破綻する**
  - **Mitigation**: 定期的な SDK バージョン更新と統合テストで検出。Repository の `toSubscription()` 関数に型ガードを実装
- **Risk 4: ユーザーが購入をキャンセルした際、エラーログが大量に記録される**
  - **Mitigation**: `PURCHASE_CANCELLED` エラーは条件付きロギングでエラーログから除外 (情報ログのみ)
- **Risk 5: New Architecture 移行時の互換性問題**
  - **Mitigation**: RevenueCat SDK 8.9.2+ が既に New Architecture 対応済み。今後の SDK 更新で継続サポート

## References

- [React Native | In-App Subscriptions Made Easy – RevenueCat](https://www.revenuecat.com/docs/getting-started/installation/reactnative)
- [Expo | In-App Subscriptions Made Easy – RevenueCat](https://www.revenuecat.com/docs/getting-started/installation/expo)
- [Configuring the SDK | RevenueCat](https://www.revenuecat.com/docs/getting-started/configuring-sdk)
- [Displaying Paywalls | RevenueCat](https://www.revenuecat.com/docs/tools/paywalls/displaying-paywalls)
- [react-native-purchases-ui - npm](https://www.npmjs.com/package/react-native-purchases-ui/v/9.2.1)
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- [5 Clean Architecture Principles for Mobile Apps](https://www.zeepalm.com/blog/5-clean-architecture-principles-for-mobile-apps)
- [Clean Domain-Driven Design](https://medium.com/unil-ci-software-engineering/clean-domain-driven-design-2236f5430a05)
- [Understanding DDD and Clean Architecture](https://medium.com/bimar-teknoloji/understanding-clean-architecture-and-domain-driven-design-ddd-24e89caabc40)
