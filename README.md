# expo-quick-kit

**Expo SDK 54 ボイラープレート** — React Native アプリ開発の出発点

iOS/Android/Web に対応した、タブナビゲーション、Drizzle ORM、状態管理、サブスクリプション機能など、実践的な機能が組み込まれたテンプレート。

## 何ができるか

- ✅ マルチプラットフォーム対応（iOS/Android/Web）
- ✅ タブナビゲーション と ファイルベースルーティング
- ✅ ローカルデータベース（SQLite + Drizzle ORM）
- ✅ サブスクリプション・インアプリ購入（RevenueCat）
- ✅ プッシュ通知
- ✅ iOS システムカラー対応テーム（Dark Mode 対応）
- ✅ TypeScript + React 19 + React Compiler

## クイックスタート

### 必須環境

- Node.js >= 20.x
- pnpm >= 9.x（パッケージマネージャー）
- Expo CLI（自動インストール）

iOS/Android 開発の詳細は [docs/SETUP.md](./docs/SETUP.md) を参照。

### セットアップ

```bash
# 1. 依存パッケージをインストール
pnpm install

# 2. 環境変数を設定
cp .env.example .env.local

# 3. 開発サーバーを起動
pnpm start

# iOS シミュレータで開く
pnpm ios

# Android エミュレータで開く
pnpm android
```

詳しいセットアップ手順は [docs/SETUP.md](./docs/SETUP.md) を参照。

## 開発コマンド

```bash
# 開発
pnpm start              # Expo dev server
pnpm ios                # iOS シミュレータ
pnpm android            # Android エミュレータ
pnpm web                # Web ブラウザ

# コード品質
pnpm lint:fix           # ESLint + 自動修正
pnpm format             # Prettier フォーマット
pnpm typecheck          # TypeScript チェック
pnpm check              # 全チェック実行

# テスト・データベース
pnpm test               # Jest テスト
pnpm db:generate        # Drizzle マイグレーション
```

## アーキテクチャ

```
app/                    # 画面（expo-router）
features/               # 機能モジュール
components/             # UI コンポーネント
database/               # SQLite スキーマ
store/                  # 状態管理（Zustand）
lib/                    # ユーティリティ
constants/              # テーマ・定数
services/               # 外部 API ラッパー
```

**特徴**:
- Clean Architecture パターン
- 機能ファーストの構成（ドメイン単位）
- Path alias `@/*` でシンプルなインポート

詳細は [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) を参照。

## 技術スタック

| 用途 | ライブラリ |
|------|-----------|
| ルーティング | expo-router（ファイルベース） |
| 状態管理 | Zustand |
| データ取得 | TanStack Query |
| ローカルDB | Drizzle ORM + expo-sqlite |
| バリデーション | Zod |
| テーマ | iOS システムカラー（HIG 準拠） |
| テスト | Jest |
| サブスク | RevenueCat |

## プロジェクト初期化

このテンプレートから新しいプロジェクトを始める場合：

1. **GitHub テンプレートとして使用**: リポジトリ上の "Use this template" ボタンをクリック
2. **プロジェクト設定を更新**:
   - `package.json` の `name`
   - `app.config.ts` の `name`、`slug`、Bundle ID など
3. **git 履歴をリセット** （クローンした場合）:
   ```bash
   rm -rf .git
   git init
   ```

詳細手順は [docs/SETUP.md](./docs/SETUP.md) の「Getting Started」を参照。

## ドキュメント

- [SETUP.md](./docs/SETUP.md) — セットアップ手順、初期化、トラブルシューティング
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) — フォルダ構成、レイヤー設計
- [CONVENTIONS.md](./docs/CONVENTIONS.md) — コーディング規約
- [TESTING.md](./docs/TESTING.md) — テスト方針
- [REVENUECAT_SETUP.md](./docs/REVENUECAT_SETUP.md) — サブスクリプション統合
