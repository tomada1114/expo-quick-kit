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
# .env.local を編集して、RevenueCat API キーを追加

# 3. 開発サーバーを起動
pnpm start

# iOS シミュレータで開く
pnpm ios

# iOS 実機で開く
pnpm ios --device

# Android エミュレータで開く
pnpm android
```

詳しいセットアップ手順は [docs/SETUP.md](./docs/SETUP.md) を参照。

## 開発コマンド

```bash
# 開発
pnpm start              # Expo dev server（シミュレータ向け）
pnpm dev                # 実機向け dev server（tunnel 経由）
pnpm ios                # iOS シミュレータでビルド＆起動
pnpm ios --device       # iOS 実機にビルド＆インストール
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

## 環境変数設定

このプロジェクトは **RevenueCat API キー** を環境変数で管理しています。ローカル開発と本番ビルドで異なる方法で設定します。

### ローカル開発（iOS 実機テスト）

1. **環境ファイルを作成**:
   ```bash
   cp .env.example .env.local
   ```

2. **`.env.local` に API キーを追加**:
   ```
   # .env.local
   EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE=appl_xxxxxx
   ```

   `appl_xxxxxx` は RevenueCat ダッシュボードから取得できます。

3. **実機で実行**:
   ```bash
   pnpm ios --device
   ```

   Expo CLI が自動的に `.env.local` を読み込み、環境変数をアプリに注入します。

### 本番ビルド（App Store 提出）

App Store に提出する際は、**EAS Secrets** を使用して API キーを安全に管理します。

1. **EAS Secret を作成**（初回のみ）:
   ```bash
   eas secret:create \
     --scope project \
     --name EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE \
     --value "appl_xxxxxx"
   ```

   `.env.local` から API キーをコピーして、上記コマンドで安全に EAS に登録します。

2. **設定を確認**:
   ```bash
   eas secret:list
   ```

3. **本番ビルド**:
   ```bash
   eas build --platform ios --profile production
   ```

   EAS Build は自動的に Secret から API キーを取得し、ビルドに注入します。

### セキュリティ

- ✅ **`.env.local` は Git に含まれません** （`.gitignore` で除外）
- ✅ **API キーが GitHub に上がることはありません**
- ✅ **本番ビルドは暗号化された EAS Secrets を使用**

## 開発ビルド（Development Build）

プッシュ通知、セキュアストレージ、サブスクリプション機能など、ネイティブモジュールが必要な機能を使う場合は、Expo Go ではなく **Development Build** をインストールする必要があります。

### シミュレータでの開発

```bash
# iOS (Xcodeが必要)
pnpm ios

# Android (Android Studio が必要)
pnpm android
```

### 実機での開発

```bash
# 1. 初回：実機にアプリをインストール
pnpm ios --device

# 2. 以降：開発サーバーを起動してQRコードをスキャン
pnpm dev
```

**接続方法**: ターミナルに表示される QR コードを iPhone カメラでスキャン → アプリが起動

### 実機接続のトラブルシューティング

実機で「No development servers found」エラーが出る場合：

| 症状 | 原因 | 対処 |
|------|------|------|
| QRコードで接続できない | LAN接続がブロックされている | `pnpm dev`（tunnel モード）を使用 |
| `ngrok tunnel took too long` | ngrok接続タイムアウト | 数回リトライ、または時間を置いて再試行 |
| `Connection reset by peer` | macOS Firewall | Firewall設定でnodeを許可 |

**調査メモ（2024-12）**:
- LAN モード（`pnpm start --dev-client`）は macOS Firewall や Metro の外部IP応答問題で不安定
- Tunnel モード（`pnpm dev`）が実機テストでは最も安定
- Firewall OFF でも `curl http://<LAN-IP>:8081/status` が `Empty reply from server` を返す場合あり（Metro側の問題）
- localhost 経由は正常動作するため、シミュレータでは問題なし

### リリース前：クラウドビルド（EAS Build）

アプリを App Store / Google Play に公開する際は、EAS Build を使用して本番ビルドを作成します：

```bash
eas login
eas build --platform ios
eas build --platform android
```

詳細は [docs/SETUP.md](./docs/SETUP.md) の「Development Build」を参照。

## サブスクリプション・課金システム

このテンプレートは **RevenueCat** を使用したサブスクリプション機能が統合されています。

### 機能

- 月額・年額プランのサポート
- Sandbox テスト環境での購入テスト
- プレミアム機能のロック・アンロック
- 購入の復元（Restore）

### セットアップ

1. RevenueCat アカウントを作成（無料）
2. App Store Connect でサブスクリプション商品を設定
3. `.env.local` に API キーを追加
4. Development Build で実機テスト

詳細手順は [docs/REVENUECAT_SETUP.md](./docs/REVENUECAT_SETUP.md) を参照。サンドボックス環境での完全なテスト手順が記載されています。

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
