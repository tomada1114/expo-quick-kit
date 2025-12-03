# RevenueCat セットアップガイド

このガイドでは、このExpoテンプレートアプリにおいてRevenueCatを使用したサブスクリプション課金を導入する手順を、ゼロから実機での購入テストまで解説します。

**対象読者**: RevenueCatおよびApp Store Connectでのアプリ内課金（IAP）の実装が初めての開発者。

## 前提条件

  - Apple Developer Account（年間99ドル / iOS用）
  - Google Play Developer Account（初回のみ25ドル / Android用）
  - RevenueCat アカウント（開始は無料）
  - iOS実機端末（iPhoneなど）、またはテスト用のTestFlightアクセス権

## 全体の流れ

```
ステップ 1: RevenueCat ダッシュボード設定 (15分)
  ↓
ステップ 2: App Store Connect 設定 (20分)
  ↓
ステップ 3: ローカル環境の設定 (5分)
  ↓
ステップ 4: ビルドとテスト (30分)
```

-----

## ステップ 1: RevenueCat ダッシュボード設定

### 1.1 RevenueCat プロジェクトの作成

1.  [RevenueCat Dashboard](https://app.revenuecat.com/) にアクセスします。
2.  サインアップまたはログインします。
3.  **Create new project** をクリックします。
4.  プロジェクト名を入力します（例: "Expo Quick Kit"）。
5.  **Create** をクリックします。

### 1.2 iOSアプリの追加

1.  プロジェクト内で、左側のメニューから **Apps** セクションに移動します。
2.  **Add new app** をクリックします。
3.  **App Store** (iOS) を選択します。
4.  以下を入力します：
      - **App name**: `Expo Quick Kit`
      - **Bundle ID**: `com.tomada.expo-quick-kit` (※ `app.json` の設定と一致させる必要があります)
5.  **Save** をクリックします。

### 1.3 APIキーの取得

1.  **Project Settings** → **API Keys** に移動します。
2.  **Apple App Store** のキー（Public SDK Key）をコピーします。
3.  このキーを一時的にメモしておきます（後で `.env.local` に追加します）。

**APIキーの形式例**: `appl_aBcDeFgHiJkLmNoPqRsTuVwXyZ`

### 1.4 エンタイトルメント（Entitlement）の作成

1.  左側メニューの **Entitlements** タブに移動します。
2.  **New**（または + New Entitlement）をクリックします。
3.  以下を入力します：
      - **Identifier**: `premium`
      - **Description**: `Premium Access`
4.  **Add** をクリックして保存します。

**エンタイトルメントとは？**: ユーザーがサブスクリプションを購入した後に解除される「プレミアム」権限レベルのことです。

-----

## ステップ 2: App Store Connect 設定

**注意**: App Store ConnectのUIは頻繁に変更されます。以下の手順は最新のサイドバー構成に基づいています。

### 2.1 App Store Connectでアプリを作成

1.  [App Store Connect](https://appstoreconnect.apple.com/) にアクセスします。
2.  **My Apps** に移動し、**+** → **新規アプリ** を選択します。
3.  以下を入力します：
      - **プラットフォーム**: iOS
      - **名前**: `Expo Quick Kit`
      - **プライマリ言語**: 日本語（または英語）
      - **バンドルID**: `com.tomada.expo-quick-kit` を選択（先にApple DeveloperアカウントでIdentifierを作成しておく必要があります）
      - **SKU**: `expo-quick-kit-001`（内部管理用の一意なID）
4.  **作成** をクリックします。

### 2.2 サブスクリプション・グループの作成

1.  作成したアプリを開きます。
2.  左側のサイドバーを下にスクロールし、**収益化 (Monetization)** セクションにある **サブスクリプション (Subscriptions)** をクリックします。
3.  **サブスクリプション・グループ** セクションの **作成**（または + アイコン）をクリックします。
4.  以下を入力します：
      - **参照名**: `Premium Subscriptions`
5.  **作成** をクリックします。

### 2.3 月額プランの作成

1.  作成したサブスクリプション・グループ内で、**サブスクリプションを作成** をクリックします。
2.  以下を入力します：
      - **参照名**: `Monthly Premium`
      - **製品ID (Product ID)**: `monthly_plan` (※ RevenueCatの設定と一致させる必要があります)
3.  **作成** をクリックします。
4.  **サブスクリプション期間**で「1ヶ月」を選択します。
5.  **サブスクリプション価格**を設定します：
      - 通貨（例: 日本円/米ドル）を選択し、価格（例: 500円 / $4.99）を設定します。
6.  **App Storeのローカリゼーション**（表示名）を追加します：
      - **表示名**: `月額プレミアム`
      - **説明**: `すべてのプレミアム機能にアクセスできます（月額請求）。`
7.  **保存** をクリックします。

### 2.4 年額プランの作成

1.  ステップ 2.3 と同様の手順で以下を作成します：
      - **参照名**: `Annual Premium`
      - **製品ID**: `annual_plan`
      - **サブスクリプション期間**: 1年
      - **価格**: 例: 5000円 / $49.99
      - **表示名**: `年額プレミアム`
      - **説明**: `すべてのプレミアム機能にアクセスできます（年額請求）。`

### 2.5 審査への提出準備

1.  各サブスクリプション詳細ページの下部にある「審査に関する情報」を入力します：
      - **スクリーンショット**: Paywall（課金画面）のスクリーンショットをアップロードします（開発中の画面キャプチャで構いません）。
      - **審査メモ**: 「これはプレミアム機能のためのサブスクリプションです。」と記載。
2.  アプリ本体の審査提出時に、これらのサブスクリプションも一緒に提出する形になります。

**注意**: サブスクリプションが本番環境で動作するにはAppleの審査承認が必要ですが、Sandbox（テスト環境）では審査前でもすぐにテスト可能です。

-----

## ステップ 3: RevenueCat 設定 (連携)

### 3.1 App Store Connect と RevenueCat の接続

RevenueCatがレシート検証や更新通知を受け取るために連携が必要です。

1.  RevenueCatダッシュボードで、対象のiOSアプリ設定（**App Store Connect Integration**）を開きます。
2.  **App Store Connect API Key** の設定が推奨されています。
      - [App Store Connect](https://appstoreconnect.apple.com/) の「ユーザーとアクセス」→「統合」タブ →「App Store Connect API」からキーを生成します。
      - **Issuer ID**、**Key ID**、ダウンロードした **.p8ファイル** をRevenueCatに入力します。
3.  また、**App-Specific Shared Secret**（App用共有シークレット）も設定します。
      - App Store Connectのアプリページ → サイドバーの「アプリ情報」→「App用共有シークレット」で管理をクリックして生成・コピーし、RevenueCatに入力します。
4.  **Save changes** をクリックします。

### 3.2 商品（Products）の作成

1.  RevenueCatの **Products** タブに移動します。
2.  **+ New Product** をクリックします（または Import）。
3.  以下を作成します：
      - Identifier: `monthly_plan` (App Store Connectの製品IDと同じにする)
      - Identifier: `annual_plan`
4.  **Import from App Store** を使用すると、App Store Connectと連携していれば自動で取り込める場合もあります。

### 3.3 オファリング（Offering）の作成

1.  **Offerings** タブに移動します。
2.  **+ New Offering** をクリックします。
3.  以下を入力します：
      - **Identifier**: `default`
      - **Description**: `Default offering`
4.  **Save** をクリックします。
5.  作成したOfferingの中に **Packages** を追加します：
      - **Identifier**: `monthly` と入力 → Productで `monthly_plan` を選択 → **Add**
      - **Identifier**: `annual` と入力 → Productで `annual_plan` を選択 → **Add**

### 3.4 エンタイトルメントと商品の紐付け

1.  **Products** タブに戻ります。
2.  `monthly_plan` をクリックします。
3.  **Entitlements** セクションで、ステップ1.4で作成した `premium` を選択して紐付けます。
4.  **Save** をクリックします。
5.  `annual_plan` についても同様に行います。

-----

## ステップ 4: ローカル環境の設定

### 4.1 環境変数の更新

1.  プロジェクトルートの `.env.local` を開きます。
2.  テスト用のAPIキーを、ステップ 1.3 で取得した本番用のApple APIキーに置き換えます：

<!-- end list -->

```bash
EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE=appl_あなたのリアルAPIキー
EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE=test_xxxxxxxxxxxxxxxxxxxxx
```

### 4.2 インストールの確認

以下のコマンドを実行してセットアップを確認します。

```bash
# 依存関係のインストール確認
pnpm install

# 型チェック、Lint、テストの実行
pnpm check
```

すべてのチェックがパスすることを確認してください。

-----

## ステップ 5: ビルドとテスト

### 5.1 iOSシミュレーター用開発クライアントのビルド

**オプションA: ローカルビルド (Xcodeが必要/Macのみ)**

```bash
npx expo run:ios
```

これにより以下が実行されます：

  - ネイティブiOSプロジェクトの生成（Prebuild）
  - CocoaPodsのインストール
  - アプリのビルドとシミュレーターでの開発ビルド起動

**オプションB: EAS Build (クラウドビルド/Xcode不要)**

```bash
# EAS CLIのインストール（未実施の場合）
npm install -g eas-cli

# Expoへログイン
eas login

# EASの設定
eas build:configure

# 開発用クライアントのビルド
eas build --profile development --platform ios
```

ビルド完了後、ダッシュボードから `.app` ファイルをダウンロードしてシミュレーターにドラッグ＆ドロップするか、QRコード等からインストールします。

### 5.2 シミュレーターでのテスト

1.  シミュレーターでアプリを起動します。
2.  課金画面（Paywall）が表示される画面（例: 設定 → アップグレード）へ移動します。
3.  UIが正しく表示されるか確認します。
4.  **注意**: 通常のシミュレーター環境では、実際の購入処理（Apple ID認証を含む）は完了できません。購入フローの完全なテストには、次のステップの実機テストを推奨します。

### 5.3 TestFlightを通じた実機テスト

#### 5.3.1 Sandboxテスターアカウントの作成

1.  [App Store Connect](https://appstoreconnect.apple.com/) にアクセスします。
2.  **ユーザーとアクセス** → **Sandboxテスター** に移動します。
3.  **+** をクリックしてテスターを追加します。
4.  以下を入力します：
      - **メールアドレス**: 実際のApple IDとは異なる独自のメールアドレス（例: `test+sandbox1@yourdomain.com` などのエイリアス推奨）。
      - **パスワード**: 強力なパスワード。
      - **国/地域**: 日本（またはテストしたい地域）。
5.  **保存** をクリックします。

**重要**: このアカウントでiPhoneの「設定」アプリからiCloudにサインイン**しないでください**。アプリ内での購入時のみ使用します。

#### 5.3.2 TestFlight用ビルドの作成

**オプションA: EAS Build**

```bash
# TestFlight用の本番に近いビルドを作成
eas build --profile preview --platform ios

# TestFlightへ提出（自動アップロード）
eas submit --platform ios
```

**オプションB: Xcode Archive**

1.  Xcodeでプロジェクトを開きます（`ios/xxxx.xcworkspace`）。
2.  ビルド対象を **Any iOS Device (arm64)** に設定します。
3.  メニューの **Product** → **Archive** を選択します。
4.  アーカイブ完了後、**Distribute App** → **TestFlight & App Store** → **Upload** を選択します。

#### 5.3.3 TestFlightへの招待

1.  App Store Connectの **TestFlight** タブに移動します。
2.  **内部テスト** グループを作成（または既存を選択）します。
3.  自分自身（開発者アカウント）をテスターとして追加します。
4.  ビルドが処理完了したら、テスターに配布します。
5.  TestFlightからの招待メールを確認します。

#### 5.3.4 購入フローのテスト

1.  iPhoneに「TestFlight」アプリをインストールします。
2.  TestFlight経由であなたのアプリをインストールします。
3.  iPhoneで：
      - **設定** → **App Store** を開きます。
      - 下部の「サンドボックスアカウント」の項目を確認します（既存のものがあればサインアウト）。
      - **ここではまだサインインしません。**
4.  アプリを起動し、Paywall画面へ移動します。
5.  サブスクリプション（例: 月額プレミアム）をタップします。
6.  Apple IDを求められたら、作成した **Sandboxテスターアカウント** でサインインします。
7.  購入を完了します（Sandboxなので実際の請求は発生しません）。
8.  以下を確認します：
      - 購入が成功すること。
      - アプリが「プレミアム」状態になること。
      - プレミアム機能がアンロックされること。

#### 5.3.5 購入の復元（Restore）テスト

1.  アプリ内で **設定** 等にある **購入を復元** ボタンをタップします。
2.  プレミアム状態が正しく復元されることを確認します。

-----

## ステップ 6: 統合の検証

### 6.1 RevenueCat ダッシュボードでの確認

1.  **RevenueCat Dashboard** → **Customers** に移動します。
2.  Sandboxテスターを検索します（購入時に生成されたIDまたはメールアドレス）。
3.  以下を確認します：
      - アクティブなサブスクリプションが表示されているか。
      - エンタイトルメント `premium` がアクティブになっているか。
      - Sandboxでの購入イベント（Initial Purchase）が記録されているか。

### 6.2 コード統合の確認

このアプリは Zustand ストアとサブスクリプション状態を自動同期するように設計されています。以下のように確認できます：

```tsx
import { useStore } from '@/store';

function DebugSubscription() {
  const isPremium = useStore((state) => state.isPremium);
  console.log('Is Premium:', isPremium); // 購入後は true になるはず
}
```

-----

## 次のステップ

### 本番リリースのチェックリスト

ユーザーに公開する前に以下を確認してください：

1.  **App Store Connect**:

      - アプリを審査に提出する。
      - サブスクリプションアイテム自体も審査待ちから提出済みになっているか確認する。
      - プライバシーポリシーと利用規約のURLを設定する（必須）。

2.  **RevenueCat**:

      - Webhookの設定を確認する（サーバーサイドでの処理が必要な場合）。
      - 売上レポートの設定などを確認する。

3.  **テスト**:

      - 複数のデバイスでの表示確認。
      - 更新のテスト（Sandboxでは月次更新は数分で繰り返されます）。
      - 解約のテスト（iPhoneの設定 → App Store → Sandboxアカウントの管理から行えます）。

### 制限値のカスタマイズ

デフォルトの制限値は `features/subscription/core/service.ts` で定義されています：

```typescript
// 無料プラン (Free tier)
maxItems: 10
maxExports: 1
hasAds: true

// プレミアムプラン (Premium tier)
maxItems: Infinity
maxExports: Infinity
hasAds: false
```

アプリの機能に合わせてこれらの値を調整してください。

-----

## まとめ

完了した項目：

  - ✅ RevenueCat プロジェクトとエンタイトルメントの設定
  - ✅ App Store Connect でのサブスクリプション作成
  - ✅ RevenueCat Offering（商品パッケージ）の設定
  - ✅ ローカル環境のセットアップ
  - ✅ 開発ビルドの作成
  - ✅ TestFlight を使用した Sandbox 購入テスト

これでテンプレートの収益化準備は整いました。ユーザーがサブスクリプションを購入すると、アプリは自動的にステータスを判断し、プレミアム機能を解放します。
