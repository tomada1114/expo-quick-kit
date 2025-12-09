# RevenueCat 統合テストガイド

このガイドでは、このリポジトリにおける RevenueCat サブスクリプション統合のテスト方法を解説します。**これはテスト目的専用であり**、本番リリース用ではありません。

**対象読者**: リリース前に RevenueCat の統合が正しく機能しているか確認したい開発者。

## 前提条件

- Apple Developer Account（年間 99ドル）
- RevenueCat アカウント（開始時は無料）
- Xcode がインストールされた Mac（アップデートが完了していること）
- 完全なテストを行うための iOS デバイス（iPhone/iPad）

## テスト環境の理解

### Sandbox（サンドボックス）環境とは？

**Sandbox** は、Apple が提供するアプリ内課金のテスト環境です。実際にお金を請求されることなく、本番同様の購入フローをシミュレーションできます。

主な特徴:
- **実際の請求なし**: すべての購入は無料です（支払いはシミュレーション）。
- **高速なサブスクリプション更新**: サブスクリプションは数分ごとに更新されます（本番では月単位など）。
- **Sandbox テスターアカウントが必要**: 通常の Apple ID とは異なる、テスト専用のアカウントが必要です。
- **更新は6回まで**: 各サブスクリプションは6回自動更新された後、自動的に停止します。

### テスト環境の比較

|環境|購入フロー|RevenueCat 統合|セットアップ難易度|ユースケース|
|---|---|---|---|---|
|**StoreKit Testing** (シミュレーター)|✅ ローカルシミュレーション|⚠️ 限定的|⭐ 簡単|UI/UX の確認のみ|
|**Sandbox** (実機)|✅ 完全なフロー|✅ 完全|⭐⭐ 普通|**統合テストに推奨**|
|**TestFlight**|✅ 完全なフロー|✅ 完全|⭐⭐⭐ 複雑|チームでのプレリリーステスト|

### なぜ実機 + Sandbox を使うのか？

RevenueCat の統合テストには、**実機と Sandbox アカウント**の組み合わせが最も信頼できるアプローチです：

1. **完全な購入フロー**: 実際の App Store 認証をシミュレートできます。
2. **完全な RevenueCat 統合**: すべての SDK 機能が正しく動作します。
3. **高速なイテレーション**: TestFlight へのビルドアップロードが不要です。
4. **リアルタイムデバッグ**: テスト中にログを確認し、デバッグできます。

## テストフローの概要

```
ステップ 1: Sandbox テスターアカウントの作成 (5分)
  ↓
ステップ 2: 開発用ビルドの準備 (Xcode アップデート待ちなど)
  ↓
ステップ 3: 実機へのインストール (10分)
  ↓
ステップ 4: 購入フローのテスト (15分)
  ↓
ステップ 5: RevenueCat 統合の検証 (5分)
```

---

## ステップ 1: Sandbox テスターアカウントの作成

### Sandbox テスターアカウントとは？

**Sandbox テスター**（正式名称「Sandbox Apple Account」）は、アプリ内課金のテスト専用に使用される特殊なアカウントです。これは通常の Apple ID **ではありません**。

**重要な違い**:
- ❌ iCloud にサインインできない
- ❌ 実際の App Store から購入できない
- ✅ アプリ内課金のテストにのみ使用可能
- ✅ 購入はすべて無料（シミュレーション）

### 作成方法

1. [App Store Connect](https://appstoreconnect.apple.com/) にアクセスします。
2. **ユーザーとアクセス (Users and Access)** → **Sandbox**（上部ナビゲーション）に移動します。
3. **テストアカウントの作成 (Create Test Accounts)**（または既存のテスターがいる場合は + ボタン）をクリックします。
4. フォームに入力します：
   - **名 (First Name)**: Test
   - **姓 (Last Name)**: User01
   - **Eメール**: 一意のメールアドレスを使用
   - **パスワード**: 強力なパスワード（覚えておく必要があります）
   - **国/地域**: テストする地域を選択（例: 日本、米国）

#### メールアドレスのヒント

**オプション 1: Eメールのサブアドレス（エイリアス）を使用する**（推奨）

お使いのメールプロバイダが `+` によるサブアドレスに対応している場合（Gmailなど）：
```
基本メールアドレス: john@example.com

Sandbox アカウント:
john+sandbox1@example.com
john+sandbox2@example.com
john+sandbox-jp@example.com
```

すべてのメールは基本アドレスに届きます。確認メールの受信に便利です。

**オプション 2: 捨てアド（使い捨てメール）サービスを使用する**

- Guerrilla Mail
- TempMail
- Mailinator
など

**重要**: すでに実際の Apple ID に紐付いているメールアドレスは使用しないでください。

### アカウントの制限

- 最大数: 1チームあたり 10,000 アカウント
- 各アカウントでテストできるのはサブスクリプション更新6回まで
- 繰り返しテストする場合は、新しいアカウントを作成するか、購入履歴を消去してください。

---

## ステップ 2: 開発用ビルドの準備

**開発用ビルド (Development Build)** にはネイティブコード（RevenueCat SDK など）が含まれており、テストのために実機にインストールできます。

### Xcode のアップデートを待つ

現在 Xcode のアップデート中の場合は、完了するのを待ってからビルドしてください。

### 実機向けにビルドする（Xcode アップデート後）

```bash
# iPhone/iPad を USB で接続してください

# 接続されたデバイス向けにビルドしてインストール
pnpm ios --device
```

このコマンドは以下を実行します：
1. ネイティブ iOS プロジェクトの生成（prebuild）
2. CocoaPods 依存関係のインストール
3. 開発用プロファイル（Development profile）でのアプリビルド
4. 接続されたデバイスへのインストール
5. Metro バンドラーの起動

### 代替案: EAS Build を使用する（ローカルビルドが失敗する場合）

```bash
# EAS CLI のインストール
npm install -g eas-cli

# Expo へのログイン
eas login

# 内部配布用にビルド
eas build --profile development --platform ios

# QRコードまたはダウンロードリンク経由でデバイスにインストール
```

**注**: EAS Build は Xcode を必要としませんが、完了までに時間がかかります。

---

## ステップ 3: デバイスへのインストールと設定

### 3.1 アプリのインストール

ビルドが完了すると、アプリは自動的に接続されたデバイスにインストールされます。

### 3.2 デバイスでの Sandbox アカウント設定

**重要**: 「設定」アプリの最上部にある Apple ID 設定で Sandbox アカウントにサインイン **しないでください**。購入フローの途中でサインインします。

iOS 14以降の手順:
1. iPhone の **設定 (Settings)** アプリを開きます。
2. 下にスクロールして **App Store** をタップします。
3. **Sandbox アカウント (Sandbox Account)** セクションを探します（一番下にあります）。
4. 現時点では **サインインしないまま** にしておきます。

テスト購入を行う際に、サインインを求められます。もし既に別のアカウントでサインインしている場合は、サインアウトしておいてください。

---

## ステップ 4: 購入フローのテスト

### 4.1 アプリの起動

1. デバイスでアプリを開きます。
2. サブスクリプション/ペイウォール画面に移動します。
   - 例: 設定 → プレミアムにアップグレード

### 4.2 購入の試行

1. サブスクリプションプラン（例：「月額プラン」）をタップします。
2. iOS の購入確認ダイアログが表示されます。
3. Apple ID の認証情報を求められます。
4. **Sandbox テスターアカウントでサインイン** します。
   - メール: `your+sandbox1@example.com`
   - パスワード: （設定した Sandbox アカウントのパスワード）

### 4.3 購入の完了

1. 購入を承認します。
2. iOS が `[Environment: Sandbox]` というバナーを表示します（テストモードであることの確認）。
3. 購入が即座に完了します（課金はされません）。
4. アプリでプレミアム機能がアンロックされるはずです。

### 4.4 確認すべきこと

**アプリ内**:
- プレミアムステータス表示が「有効 (Active)」に変わる
- プレミアム機能がアンロックされる
- 広告が非表示になる（設定されている場合）

**デバッグログ**（Metro コンソール内）:
```
[RevenueCat] Purchased product: monthly_plan
[RevenueCat] Active entitlement: premium
[Store] isPremium: true
```

### 4.5 「購入の復元 (Restore Purchases)」のテスト

1. アプリをアンインストールします。
2. アプリを再インストールします。
3. サブスクリプション画面に移動します。
4. **購入を復元 (Restore Purchases)** ボタンをタップします。
5. 同じ Sandbox アカウントでサインインします。
6. プレミアムステータスが復元されることを確認します。

---

## ステップ 5: RevenueCat 統合の検証

### 5.1 RevenueCat ダッシュボードの確認

1. [RevenueCat Dashboard](https://app.revenuecat.com/) にアクセスします。
2. **Customers** タブに移動します。
3. テストユーザーを検索します：
   - App User ID で検索
   - または最近の購入でフィルタリング

### 5.2 顧客データの検証

以下が表示されているはずです：
- ✅ Active subscription: `monthly_plan` または `annual_plan`
- ✅ Active entitlement: `premium`
- ✅ Environment badge: **Sandbox**
- ✅ Purchase event: "Initial Purchase"

### 5.3 サブスクリプション詳細の確認

顧客をクリックして詳細を確認します：
- Subscription status: Active
- Original purchase date（本来の購入日）
- Renewal date（更新日。Sandbox では数分後）
- Store: Apple App Store
- Product identifier: `monthly_plan`

### 5.4 自動更新のモニタリング

Sandbox 環境では、サブスクリプションの期間が短縮されます：

| 実際の期間 | Sandbox での期間 |
|---|---|
| 1週間 | 3分 |
| 1ヶ月 | 5分 |
| 2ヶ月 | 10分 |
| 3ヶ月 | 15分 |
| 6ヶ月 | 30分 |
| 1年 | 1時間 |

5分間待ってから確認します：
- RevenueCat ダッシュボードに "Renewal"（更新）イベントが表示される
- アプリがプレミアムステータスを維持している

**注**: Sandbox のサブスクリプションは6回自動更新された後、期限切れになります。

---

## よくある問題と解決策

### 問題 1: "iTunes Store に接続できません (Cannot connect to iTunes Store)"

**解決策**:
- デバイスがインターネットに接続されているか確認する。
- 「設定」>「App Store」で通常の Apple ID からサインアウトしているか確認する。
- もう一度 Sandbox アカウントで購入を試みる。

### 問題 2: "この Apple ID は App Store で使用されたことがありません"

**解決策**:
- これは新しい Sandbox アカウントでは正常な動作です。
- **レビュー (Review)** をタップし、利用規約に同意してください。
- その後、購入フローを完了させてください。

### 問題 3: 価格や製品名が間違っている

**原因**: Sandbox/StoreKit 環境ではメタデータの取得が不安定な場合があります。

**解決策**:
- Sandbox での価格表示の不一致は一旦無視してください。
- 購入フローとエンタイトルメント（権限）のアンロックのテストに集中してください。
- 正しい価格は本番リリースで確認します。

### 問題 4: 購入してもプレミアム機能がアンロックされない

**デバッグ手順**:
1. Metro コンソールのログで RevenueCat のエラーを確認する。
2. `.env.local` の API キーが正しいか確認する。
3. RevenueCat ダッシュボードで顧客データが反映されているか確認する。
4. App Store Connect、RevenueCat、コード間ですべての Product ID が一致しているか確認する。

### 問題 5: サブスクリプションがすぐに期限切れになる

**原因**: Sandbox サブスクリプションは6回更新すると自動的に停止します。

**解決策**:
- テスト用に新しい Sandbox アカウントを作成する。
- または、App Store Connect で購入履歴を消去する：
  - **ユーザーとアクセス** → **Sandbox**
  - テスターを選択 → **購入履歴の消去 (Clear Purchase History)**

---

## テスト後の次のステップ

### テストが成功した場合 ✅

RevenueCat の統合は正しく機能しています。以下に進めます：
1. 機能開発を続ける
2. 異なるサブスクリプションシナリオ（年額プランなど）をテストする
3. TestFlight 配布の準備（任意）
4. 最終的に App Store 審査へ提出

### テストが失敗した場合 ❌

1. Metro コンソールのエラーログを確認する
2. `docs/REVENUECAT_SETUP.md` のすべての設定手順を再確認する
3. API キーが正しいか確認する
4. Product ID がすべてのプラットフォームで一致しているか確認する
5. RevenueCat のドキュメントで一般的な問題を確認する

---

## StoreKit Testing (シミュレーター) - 参考

### シミュレーターテストを使用すべき場面

StoreKit Testing は以下の場合にのみ使用します：
- ✅ UI/UX の確認
- ✅ レイアウトの素早いチェック
- ✅ オフラインでの開発

**以下には依存しないでください（非推奨）**:
- ❌ RevenueCat 統合テスト
- ❌ 購入レシートの検証（サーバーサイド）
- ❌ サブスクリプションのライフサイクルテスト

### セットアップ方法 (任意)

1. Xcode で StoreKit Configuration ファイルを作成:
   - **File** → **New** → **File**
   - **StoreKit Configuration File** を選択
   - "Sync this file with an app in App Store Connect" を有効にする

2. スキームで有効化:
   - Xcode ツールバーのスキームをクリック
   - **Edit Scheme** → **Run** → **Options** タブ
   - 作成した StoreKit Configuration ファイルを選択

3. シミュレーターで実行:
   ```bash
   pnpm ios
   ```

**制限事項**:
- Xcode 経由で実行している場合のみ機能します。
- RevenueCat が購入イベントを受け取らない場合があります（設定によります）。
- メタデータ（価格、説明）が正しくない場合があります。

---

## TestFlight テスト - 使用すべき場面

### TestFlight の用途

- 🎯 **チームテスト**: 複数のテスターに配布
- 🎯 **プレリリース検証**: 本番に近い環境でのテスト
- 🎯 **外部ベータテスト**: ユーザーからのフィードバック収集

### TestFlight を使用すべきでない場面

- ❌ **初期の統合テスト**: 遅すぎます（ビルドのアップロードと処理待ち時間）
- ❌ **迅速な開発イテレーション**: 「実機 + Sandbox」を使用してください

### クイック TestFlight セットアップ (必要な場合)

```bash
# TestFlight 用にビルド
eas build --profile preview --platform ios

# TestFlight へ提出
eas submit --platform ios
```

その後：
1. ビルド処理を待つ（15〜30分）
2. App Store Connect で内部テスターを追加
3. テスターに招待メールが届く
4. TestFlight アプリ経由でインストール
5. Sandbox アカウントで購入をテスト（ステップ4と同様）

---

## 主な用語集

|用語|説明|例|
|---|---|---|
|**Sandbox**|アプリ内課金のための Apple のテスト環境|実際の請求なしでテスト可能|
|**Sandbox Tester**|Sandbox 購入用のテスト Apple アカウント|`test+sandbox1@example.com`|
|**StoreKit Testing**|Xcode によるローカル IAP シミュレーション (iOS 14+)|シミュレーターでのオフラインテスト|
|**Development Build**|ネイティブモジュールを含むアプリビルド|RevenueCat テストに必須|
|**Entitlement**|RevenueCat におけるユーザーのアクセス権限|`premium`（購入後にアンロック）|
|**Offering**|サブスクリプション製品のグループ|月額/年額プランを含む `default` オファリング|
|**Product ID**|サブスクリプションの一意識別子|`monthly_plan`, `annual_plan`|
|**Receipt Validation**|サーバーサイドでの購入検証|RevenueCat が自動処理|

---

## まとめ

**このリポジトリで推奨されるテストフロー**:

1. ✅ Sandbox テスターアカウントの作成（初回のみ）
2. ✅ 実機で開発用ビルドを作成
3. ✅ Sandbox アカウントで購入をテスト
4. ✅ RevenueCat ダッシュボードで購入を確認
5. ✅ 「購入の復元」をテスト
6. ✅ 自動更新をモニタリング（5分待機）

**所要時間**: ~30分

**費用**: $0（すべての Sandbox 購入は無料）

**結果**: RevenueCat 統合が正常に動作していることを確認 ✨

---

## 出典・参考資料

このガイドは 2025年時点の公式ドキュメントに基づいています：

- [Sandbox Apple Account の作成 - Apple Developer](https://developer.apple.com/help/app-store-connect/test-in-app-purchases/create-a-sandbox-apple-account/)
- [Sandbox でのテストの概要 - Apple Developer](https://developer.apple.com/help/app-store-connect/test-in-app-purchases/overview-of-testing-in-sandbox/)
- [RevenueCat Sandbox Testing Guide](https://www.revenuecat.com/docs/test-and-launch/sandbox)
- [Apple App Store & TestFlight Testing - RevenueCat](https://www.revenuecat.com/docs/test-and-launch/sandbox/apple-app-store)
