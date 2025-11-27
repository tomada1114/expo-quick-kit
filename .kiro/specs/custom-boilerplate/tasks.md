# Implementation Plan

## Task Overview

本実装計画は、Expo SDK 54ボイラープレートの構築に必要なタスクを定義します。タスクは論理的な単位でグループ化され、並列実行可能なタスクには`(P)`マーカーが付与されています。

---

## Task 1. 開発環境セットアップ（ESLint/Prettier/Jest）

- [x] 1.1 (P) ESLintとPrettier設定の構築
  - Prettierパッケージをインストールし、`.prettierrc`設定ファイルを作成する
  - `.prettierignore`でビルド成果物（build/, dist/）とnode_modulesを除外する
  - ESLint Flat Config形式で`eslint.config.js`を設定し、Prettier連携（eslint-config-prettier）を有効化する
  - `pnpm lint`実行時にエラーがない状態を確認する
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.2 (P) Jestテスト環境の構築
  - Jest、jest-expo、React Native Testing Library、jest-native、@types/jestをインストールする
  - `jest.config.js`でjest-expoプリセット、`@/`パスエイリアス解決、カバレッジ設定を構成する
  - `jest.setup.js`でexpo-sqlite、AsyncStorageのモックを設定し、テスト環境を初期化する
  - expo-sqlite、expo関連モジュールのトランスフォーム設定を追加する
  - `tsconfig.json`の`exclude`から`__tests__`を削除する（@types/jestインストール後、型エラーが解消されるため）
  - `pnpm test`でテストが実行できることを確認する
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

---

## Task 2. フォルダ構造とパスエイリアス

- [x] 2.1 フォルダ構造の作成
  - `features/`ディレクトリを作成し、機能別モジュール管理の基盤を整備する
  - `components/`と`components/ui/`ディレクトリを整理し、共通UIコンポーネント用の構造を作成する
  - `hooks/`ディレクトリで共通フック管理の場所を確保する
  - `store/`と`store/slices/`ディレクトリでZustandストアの構造を準備する
  - `database/`ディレクトリでSQLite + Drizzle関連ファイルの場所を確保する
  - `lib/`ディレクトリでユーティリティ管理の場所を作成する
  - `types/`ディレクトリで共通型定義の場所を作成する
  - 各ディレクトリに`.gitkeep`またはindex.tsを配置してGit追跡を確保する
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 2.2 パスエイリアスの検証
  - `tsconfig.json`で`@/*`がプロジェクトルートにマッピングされていることを確認する
  - 新規作成したディレクトリ（database, store, lib, types, features）からの`@/`インポートが正しく型解決されることを検証する
  - _Requirements: 3.1, 3.2, 3.3_

---

## Task 3. データベース層（SQLite + Drizzle）

- [ ] 3.1 Drizzle ORM基盤の構築
  - drizzle-orm、drizzle-kit、expo-sqliteをインストールする
  - `database/client.ts`でDrizzleクライアントを初期化し、enableChangeListenerを有効化する
  - `database/schema.ts`でサンプルテーブル（items）のスキーマを定義し、型推論をエクスポートする
  - `drizzle.config.ts`でマイグレーション設定を定義する
  - DB初期化とマイグレーション実行のヘルパー関数を実装する
  - 型安全なクエリビルダーが利用できることを検証する
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

---

## Task 4. 状態管理層（Zustand + TanStack Query）

- [ ] 4.1 (P) Zustand状態管理の構築
  - zustandとzustand/middlewareをインストールする
  - `store/types.ts`でAppState型（isOnboarded, isPremium, userPreferences）を定義する
  - `store/slices/app-slice.ts`でスライスパターンに基づいた状態管理を実装する
  - `store/index.ts`でcreate()によるストア作成とpersistミドルウェアを設定する
  - `useStore`フックが型安全な状態アクセスを提供することを確認する
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 4.2 (P) TanStack Query設定
  - @tanstack/react-queryをインストールする
  - `lib/query-client.ts`でQueryClientインスタンスを作成し、staleTime、gcTime、retry設定を定義する
  - キャッシュ管理のデフォルト設定（refetchOnWindowFocus, refetchOnReconnect）を構成する
  - _Requirements: 7.1, 7.2, 7.3_

---

## Task 5. デザインシステムとテーマ

- [ ] 5.1 iOS System Colors準拠のテーマ構築
  - `constants/theme.ts`を拡張し、expo-design-system Skillに準拠したカラー構造を実装する
  - Primary Colors（Blue/Green/Orange選択可能）、Background Colors（base/secondary/tertiary）、Text Colors（primary/secondary/tertiary/inverse）を定義する
  - Semantic Colors（success/warning/error/info）とInteractive Elements（separator/fill/fillSecondary）を定義する
  - Light ModeとDark Mode両方の色定義を含め、Dark Modeでは+10%明度調整を適用する
  - Spacing定数（8pt Grid準拠）とTypography定義を追加する
  - Indigo系、グラデーション、ネオン系、パステル系の色を使用しないことを確認する
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.10_

---

## Task 6. 共通UIコンポーネント

- [ ] 6.1 UIコンポーネントの実装
  - `components/ui/button.tsx`でprimary/secondary/ghost/destructiveバリアントのボタンを実装する（タッチターゲット44pt以上確保）
  - `components/ui/card.tsx`でテーマ対応のカードコンテナを実装する（background.secondary使用）
  - `components/ui/spacer.tsx`で8pt Grid準拠のスペーシングコンポーネントを実装する
  - `components/ui/loading-overlay.tsx`でフルスクリーンローディング表示を実装する（semantic.info使用）
  - 各コンポーネントがデザインシステムのカラー定義を使用することを確認する
  - `components/index.ts`で全コンポーネントをバレルエクスポートする
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 14.9_

---

## Task 7. ナビゲーションとアプリ起動フロー

- [ ] 7.1 RootLayoutとプロバイダー統合
  - `app/_layout.tsx`を拡張し、データベース初期化、Zustandストア初期化、QueryClientProvider統合を実装する
  - SplashScreenで初期化中のUXを改善し、タイムアウト（5秒）を設定する
  - 初期化エラー時のエラー画面とリトライ機能を実装する
  - DB初期化とストアハイドレーションを並列実行して起動時間を短縮する
  - _Requirements: 5.1, 6.1, 7.1, 10.1_

- [ ] 7.2 タブナビゲーションの整備
  - `app/(tabs)/_layout.tsx`でボトムタブバーを設定し、テーマ対応のアクティブティント色を適用する
  - タブ切り替え時の画面遷移が正しく動作することを確認する
  - `app/modal.tsx`のモーダル画面が正常に動作することを確認する
  - _Requirements: 10.2, 10.3, 10.4_

---

## Task 8. サンプル機能実装

- [ ] 8.1 features/\_example/サンプル機能の作成
  - `features/_example/`ディレクトリに機能別モジュールのリファレンス実装を作成する
  - `components/`、`hooks/`、`services/`のサブディレクトリ構造を示す
  - `services/repository.ts`でDrizzle ORMを使用したDB操作パターン（CRUD）を実装する
  - カスタムフック（useItemList等）でTanStack Queryとの連携パターンを示す
  - `__tests__/`にリポジトリのユニットテスト（happy/sad/edge cases）を実装する
  - サンプルテストが成功することを確認する
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

---

## Task 9. 不要ファイル削除とスクリプト整備

- [ ] 9.1 (P) 不要ファイルの削除とクリーンアップ
  - `app/(tabs)/explore.tsx`を削除する
  - 不要なサンプルコンポーネント（hello-wave.tsx等のExpoテンプレートデフォルト）を削除する
  - `app/(tabs)/index.tsx`をボイラープレート独自のホーム画面に置き換える
  - タブナビゲーションから削除したexploreタブの参照を除去する
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 9.2 (P) package.jsonスクリプトの追加
  - `test`、`test:watch`、`test:coverage`スクリプトを追加する
  - `lint`、`lint:fix`スクリプトを追加する
  - `format`スクリプト（Prettier実行）を追加する
  - `typecheck`スクリプト（tsc --noEmit）を追加する
  - `db:generate`、`db:studio`スクリプト（Drizzle Kit操作）を追加する
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

---

## Task 10. 最終検証と品質保証

- [ ] 10.1 統合テストと動作確認
  - `pnpm start`でアプリが正常に起動することを確認する
  - `pnpm test`で全テストが成功することを確認する
  - `pnpm lint`でリントエラーがないことを確認する
  - `pnpm typecheck`で型エラーがないことを確認する
  - SQLiteへの読み書き（サンプル機能経由）が動作することを確認する
  - Zustand状態更新（isOnboarded等）が画面に反映されることを確認する
  - expo-routerのタブナビゲーション、モーダル遷移が動作することを確認する
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

---

## Requirements Coverage Matrix

| Requirement        | Task(s)  | Description           |
| ------------------ | -------- | --------------------- |
| 1.1, 1.2, 1.3, 1.4 | 1.1      | ESLint + Prettier設定 |
| 2.1-2.7            | 2.1      | フォルダ構造          |
| 3.1-3.3            | 2.2      | パスエイリアス        |
| 4.1-4.4            | 1.2      | テスト環境            |
| 5.1-5.4            | 3.1, 7.1 | SQLite + Drizzle      |
| 6.1-6.4            | 4.1, 7.1 | Zustand               |
| 7.1-7.3            | 4.2, 7.1 | TanStack Query        |
| 8.1-8.4            | 5.1      | テーマシステム        |
| 9.1-9.5            | 6.1      | 共通コンポーネント    |
| 10.1-10.4          | 7.1, 7.2 | ナビゲーション        |
| 11.1-11.5          | 9.2      | pnpmスクリプト        |
| 12.1-12.4          | 8.1      | サンプル機能          |
| 13.1-13.3          | 9.1      | 不要ファイル削除      |
| 14.1-14.10         | 5.1, 6.1 | デザインシステム      |
| 15.1-15.7          | 10.1     | 最終チェック          |

## Parallel Execution Guide

以下のタスクは相互依存がなく、並列実行可能です：

**Phase 1（並列）:**

- 1.1 ESLint/Prettier設定
- 1.2 Jest設定

**Phase 2（順次）:**

- 2.1 フォルダ構造 → 2.2 パスエイリアス検証

**Phase 3（並列）:**

- 3.1 Drizzle基盤
- 4.1 Zustand
- 4.2 TanStack Query
- 5.1 テーマ構築

**Phase 4（順次、Phase 3完了後）:**

- 6.1 UIコンポーネント（テーマに依存）
- 7.1 RootLayout（DB, Store, Queryに依存）
- 7.2 タブナビゲーション

**Phase 5（並列、Phase 4完了後）:**

- 8.1 サンプル機能
- 9.1 不要ファイル削除
- 9.2 スクリプト整備

**Phase 6（最後）:**

- 10.1 最終検証
