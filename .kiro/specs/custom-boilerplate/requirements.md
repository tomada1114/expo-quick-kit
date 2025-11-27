# Requirements Document

## Introduction
本ドキュメントは、Expo SDK 54をベースとした自作ボイラープレートの要件を定義します。TEMPLATE_ARCHITECTURE.mdに記載された設計方針に基づき、RevenueCatを除いた基盤構築・開発環境・コア機能・UI/UX基盤を対象とします。

（追記：デザインシステムの実装は、`expo-design-system` Claude Skillを参照してください。）

## Background & Motivation

### なぜ自作ボイラープレートが必要か
1. **開発開始時間の短縮**: 新規プロジェクトのたびに同じセットアップを繰り返すのは非効率。検証済みの構成をすぐに使い始めたい
2. **技術選定の一貫性**: Zustand、Drizzle、TanStack Queryなど、自分が使い慣れた技術スタックを標準化したい
3. **ベストプラクティスの蓄積**: ESLint/Prettier設定、フォルダ構造、テスト環境など、過去のプロジェクトで学んだ知見を再利用可能な形で残したい
4. **学習コストの削減**: 新しいプロジェクトでも同じパターンで開発できるため、コンテキストスイッチのコストが下がる

### 期待する成果
- `ppnpm create expo-app`後、数分でプロダクション品質の開発環境が整う
- 型安全なDB操作、状態管理、テーマシステムがすぐに使える
- サンプル機能を参考に、一貫したコード構造で機能を追加できる

### スコープの境界
- **含む**: 基盤構築、開発環境、コア機能（DB・状態管理・テーマ）、UI/UX基盤、サンプル機能
- **含まない**: RevenueCat（別Specで実装）、認証機能、API連携の具体実装

## Reference Documents
| ドキュメント | 説明 | 備考 |
|-------------|------|------|
| `TEMPLATE_ARCHITECTURE.md` | ボイラープレート構築ガイド | Phase 1-6の実装手順、技術スタック選定理由を記載 |
| `CLAUDE.md` | プロジェクト固有の指示 | 既存のフォルダ構造、命名規則（kebab-case）を記載 |

### 除外事項
- **RevenueCat関連**: Phase 5（収益化準備）は別Specとして実装予定のため、本Specの対象外

## Project Description (Input)
自作ボイラープレート構築(RevenueCat除く)

TEMPLATE_ARCHITECTURE.mdに書いてある内容を参考にして、自作ボイラープレートを構築してください。
ただし、RevenueCatに関する部分は別なSpecとして実装するので、このSpecでは実装しないでください。

## Requirements

### Requirement 1: 基盤構築 - ESLint + Prettier設定
**Objective:** As a 開発者, I want コード品質を統一されたルールで管理したい, so that チーム開発時のコードスタイル差異を最小化できる

#### Acceptance Criteria
1. When Prettierがインストールされる, the ボイラープレート shall `.prettierrc`設定ファイルを作成する
2. When ESLint設定が適用される, the ボイラープレート shall Flat Config形式の`eslint.config.js`でPrettierと連携する
3. The ボイラープレート shall `.prettierignore`でビルド成果物とnode_modulesを除外する
4. When `ppnpm lint`が実行される, the ボイラープレート shall ESLintエラーがない状態を保つ

### Requirement 2: 開発環境 - フォルダ構造
**Objective:** As a 開発者, I want 一貫したフォルダ構造で開発したい, so that コードの配置場所が明確になり保守性が向上する

#### Acceptance Criteria
1. The ボイラープレート shall `features/`ディレクトリで機能別モジュールを管理する
2. The ボイラープレート shall `components/`ディレクトリで共通UIコンポーネントを管理する
3. The ボイラープレート shall `hooks/`ディレクトリで共通フックを管理する
4. The ボイラープレート shall `store/`ディレクトリでZustandストアを管理する
5. The ボイラープレート shall `database/`ディレクトリでSQLite + Drizzle関連を管理する
6. The ボイラープレート shall `lib/`ディレクトリでユーティリティを管理する
7. The ボイラープレート shall `types/`ディレクトリで共通型定義を管理する

### Requirement 3: 開発環境 - パスエイリアス設定
**Objective:** As a 開発者, I want `@/`プレフィックスでインポートしたい, so that 相対パスの複雑さを解消できる

#### Acceptance Criteria
1. The ボイラープレート shall `tsconfig.json`で`@/*`をプロジェクトルートにマッピングする
2. When `@/constants/theme`がインポートされる, the TypeScript shall 正しく型解決する
3. When `@/hooks/use-color-scheme`がインポートされる, the TypeScript shall 正しく型解決する

### Requirement 4: 開発環境 - テスト環境構築
**Objective:** As a 開発者, I want Jest + React Native Testing Libraryでテストしたい, so that コンポーネントとロジックの品質を担保できる

#### Acceptance Criteria
1. When `ppnpm test`が実行される, the ボイラープレート shall Jestでテストを実行する
2. The ボイラープレート shall `jest.config.js`でexpo-sqliteとexpo関連モジュールのトランスフォームを設定する
3. The ボイラープレート shall `jest.setup.js`でテスト環境の初期化を行う
4. The ボイラープレート shall `@/`パスエイリアスをJestで解決できるよう設定する

### Requirement 5: コア機能 - SQLite + Drizzle設定
**Objective:** As a 開発者, I want 型安全なローカルDBを使いたい, so that データ永続化を安全に行える

#### Acceptance Criteria
1. The ボイラープレート shall `database/client.ts`でDrizzle ORMのDB接続を初期化する
2. The ボイラープレート shall `database/schema.ts`でテーブルスキーマを定義する
3. When DBクエリが実行される, the Drizzle ORM shall 型安全なクエリビルダーを提供する
4. The ボイラープレート shall `drizzle.config.ts`でマイグレーション設定を定義する

### Requirement 6: コア機能 - Zustand状態管理
**Objective:** As a 開発者, I want シンプルなグローバル状態管理を使いたい, so that Reduxより学習コストを抑えられる

#### Acceptance Criteria
1. The ボイラープレート shall `store/index.ts`でZustandストアを作成する
2. The ボイラープレート shall `store/slices/`でスライスパターンを採用する
3. When `useStore`が呼び出される, the ストア shall 型安全な状態アクセスを提供する
4. The ボイラープレート shall `app-slice.ts`でisOnboarded, isPremiumなどの基本状態を管理する

### Requirement 7: コア機能 - TanStack Query設定
**Objective:** As a 開発者, I want 非同期状態管理にTanStack Queryを使いたい, so that キャッシュとリフェッチを自動化できる

#### Acceptance Criteria
1. The ボイラープレート shall `app/_layout.tsx`でQueryClientProviderをセットアップする
2. When APIリクエストが実行される, the TanStack Query shall キャッシュを管理する
3. The ボイラープレート shall QueryClientのデフォルト設定を定義する

### Requirement 8: コア機能 - テーマシステム拡張
**Objective:** As a 開発者, I want 統一されたテーマ定数を使いたい, so that UI一貫性を保てる

#### Acceptance Criteria
1. The ボイラープレート shall `constants/theme.ts`でColors, Fonts, Spacing, Typographyを定義する
2. The ボイラープレート shall ライトモードとダークモードの両方の色定義を含む
3. When `useColorScheme`が呼び出される, the フック shall 現在のカラースキームを返す
4. The ボイラープレート shall `expo-design-system` Claude Skillで定義されたiOS System Colors準拠のカラー構造を採用する

### Requirement 9: UI/UX基盤 - 共通コンポーネント
**Objective:** As a 開発者, I want 再利用可能なUIコンポーネントを使いたい, so that 開発速度を向上できる

#### Acceptance Criteria
1. The ボイラープレート shall `components/ui/button.tsx`でプライマリ/セカンダリボタンを提供する
2. The ボイラープレート shall `components/ui/card.tsx`でカード型コンテナを提供する
3. The ボイラープレート shall `components/ui/spacer.tsx`でスペーシングコンポーネントを提供する
4. The ボイラープレート shall `components/ui/loading-overlay.tsx`でローディング表示を提供する
5. The ボイラープレート shall `components/index.ts`でコンポーネントをまとめてエクスポートする

### Requirement 10: UI/UX基盤 - ナビゲーション構造
**Objective:** As a 開発者, I want expo-routerでファイルベースルーティングを使いたい, so that ルート定義を直感的に行える

#### Acceptance Criteria
1. The ボイラープレート shall `app/_layout.tsx`でRootLayoutを定義する
2. The ボイラープレート shall `app/(tabs)/`でタブナビゲーションを構成する
3. The ボイラープレート shall `app/modal.tsx`でモーダル画面を定義する
4. When ユーザーがタブを切り替える, the ナビゲーション shall 正しく画面遷移する

### Requirement 11: 仕上げ - package.jsonスクリプト
**Objective:** As a 開発者, I want 統一されたpnpmスクリプトを使いたい, so that 開発作業を効率化できる

#### Acceptance Criteria
1. The ボイラープレート shall `test`, `test:watch`, `test:coverage`スクリプトを提供する
2. The ボイラープレート shall `lint`, `lint:fix`スクリプトを提供する
3. The ボイラープレート shall `format`スクリプトでPrettierを実行する
4. The ボイラープレート shall `typecheck`スクリプトで型チェックを実行する
5. The ボイラープレート shall `db:generate`, `db:studio`スクリプトでDrizzleを操作する

### Requirement 12: 仕上げ - サンプル機能
**Objective:** As a 開発者, I want 動作確認用のサンプル機能を参照したい, so that 実装パターンを理解できる

#### Acceptance Criteria
1. The ボイラープレート shall `features/_example/`にサンプル機能を含む
2. The サンプル機能 shall `components/`, `hooks/`, `services/`の構造を示す
3. The サンプル機能 shall `repository.ts`でDB操作パターンを示す
4. When サンプルテストが実行される, the テスト shall 成功する

### Requirement 13: 仕上げ - 不要ファイル削除
**Objective:** As a 開発者, I want デフォルトのサンプルコードを削除したい, so that ボイラープレートをクリーンに保てる

#### Acceptance Criteria
1. When ボイラープレートがセットアップされる, the ボイラープレート shall `app/(tabs)/explore.tsx`を削除する
2. When ボイラープレートがセットアップされる, the ボイラープレート shall 不要なサンプルコンポーネントを削除する
3. The ボイラープレート shall Expoテンプレートのデフォルト画面を独自実装に置き換える

### Requirement 14: UI/UX基盤 - デザインシステム遵守
**Objective:** As a 開発者, I want Apple Human Interface Guidelinesに準拠したデザインシステムを使いたい, so that 一貫性のあるiOSネイティブな見た目を実現できる

#### Acceptance Criteria
1. The ボイラープレート shall `constants/theme.ts`でiOS System Colors準拠のカラーパレットを定義する
2. The ボイラープレート shall Primary Colors（Blue/Green/Orange）から1色を選択できる構造を持つ
3. The ボイラープレート shall Background Colors（base/secondary/tertiary）の3段階を定義する
4. The ボイラープレート shall Text Colors（primary/secondary/tertiary/inverse）の4段階を定義する
5. The ボイラープレート shall Semantic Colors（success/warning/error/info）を定義する
6. The ボイラープレート shall Light ModeとDark Modeの両方の色定義を含む
7. When Dark Modeが有効な時, the カラーシステム shall iOS標準の+10%明度調整を適用する
8. The ボイラープレート shall Interactive Elements（separator/fill/fillSecondary）を定義する
9. The 共通UIコンポーネント shall デザインシステムのカラー定義を使用する
10. The ボイラープレート shall Indigo系、グラデーション、ネオン系、パステル系の色を使用しない

### Requirement 15: 品質保証 - 最終チェックリスト
**Objective:** As a 開発者, I want ボイラープレートの動作を確認したい, so that 問題なく使い始められる

#### Acceptance Criteria
1. When `ppnpm start`が実行される, the アプリ shall 正常に起動する
2. When `ppnpm test`が実行される, the テスト shall 成功する
3. When `ppnpm lint`が実行される, the リント shall エラーなしで通過する
4. When `ppnpm typecheck`が実行される, the 型チェック shall エラーなしで通過する
5. The ボイラープレート shall SQLiteへの読み書きが動作する
6. The ボイラープレート shall Zustand状態更新が動作する
7. The ボイラープレート shall expo-routerのナビゲーションが動作する
