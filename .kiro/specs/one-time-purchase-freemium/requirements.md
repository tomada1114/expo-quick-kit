# 購入型・フリーミアム対応 - 要件定義書

## Project Description (Input)

現状はRevenueCatでのサブスクに対応したリポジトリであるが、買い切り型（ダウンロード後の機能解放。一度きり。フリーミアム）にも対応できるようにしてほしい。

## 要件概要

本要件は、既存のサブスクリプション（RevenueCat）対応に加えて、以下の購入モデルへの対応を実現します：

- **買い切り型（ワンタイム購入）**: ユーザーが一度だけ購入して機能解放（永続）
- **フリーミアムモデル**: 基本機能は無料、一部機能は購入で解放
- **複数の購入オプション**: 異なる金額・機能セットの購入オプションをサポート

## 要件群

### 要件 1: 購入型商品定義とメタデータ管理

**目的:** アプリケーションが買い切り型の商品を定義・管理できるようにすること。

#### 受け入れ基準

1. When アプリケーションが起動する, the Purchase System shall 購入型商品のメタデータを設定ファイルから読み込む
2. The Purchase System shall 各購入商品に対して以下の情報を管理する：商品ID・名前・説明・価格・解放機能リスト
3. Where RevenueCatプラグインが利用可能な場合, the Purchase System shall RevenueCatから商品情報を取得する
4. While ネットワーク接続が利用不可の場合, the Purchase System shall ローカルキャッシュされた商品情報を使用する
5. If 商品情報の読み込みに失敗した場合, the Purchase System shall エラーログを記録し安全にデフォルト商品メタデータを使用する

### 要件 2: ワンタイム購入フロー

**目的:** ユーザーが購入型商品を購入・決済できるようにすること。

#### 受け入れ基準

1. When ユーザーが購入ボタンをタップする, the Checkout Service shall 購入確認ダイアログを表示する
2. When ユーザーが購入を確認する, the Payment Processor shall プラットフォーム決済API（StoreKit2 / Google Play Billing）を呼び出す
3. When 決済が成功する, the Checkout Service shall 購入トランザクション情報をローカルDBに記録する
4. If 決済がキャンセルされた場合, the Checkout Service shall 購入状態の変更を行わずダイアログを閉じる
5. If 決済エラーが発生した場合, the Error Handler shall ユーザーに対して詳細なエラーメッセージを表示する
6. While 決済処理中である, the Checkout Service shall ローディングインジケータを表示し他の操作を無効化する

### 要件 3: 購入状態の永続化と同期

**目的:** 購入状態をローカルに永続化し、複数セッション間で一貫性を保つこと。

#### 受け入れ基準

1. When 購入が完了する, the Purchase State Manager shall 購入情報（商品ID・タイムスタンプ・トランザクションID）をSQLiteDBに記録する
2. The Purchase State Manager shall 購入情報を同期状態フラグ付きで管理する（ローカルのみ / サーバー同期済み）
3. When アプリケーションが起動する, the Purchase Verifier shall ローカルDBから購入状態を復元する
4. While オフラインである, the Purchase State Manager shall ローカル購入記録を使用し機能を解放する
5. When ネットワーク接続が復帰する, the Sync Service shall 未同期の購入をサーバーに送信する（実装の場合）
6. If ローカル購入記録が破損した場合, the Recovery Handler shall トランザクション履歴から再構成を試みる

### 要件 4: フリーミアムモデル - 機能ロック管理

**目的:** 機能を購入状態に基づいてロック・アンロックし、UI/UXレベルで制御すること。

#### 受け入れ基準

1. The Feature Gating System shall 各機能に対して以下の状態のいずれかを持つ：`free`（無料）/ `premium`（購入要）
2. When ユーザーがプレミアム機能にアクセスする, the Feature Gating System shall 購入状態を確認する
3. If 該当商品が購入済みの場合, the Feature Gating System shall 機能へのアクセスを許可する
4. If 該当商品が未購入の場合, the Feature Gating System shall ペイウォールUIを表示する
5. Where フリーティアル期間が設定されている場合, the Trial Manager shall 残り試用日数を計算し表示する
6. The Feature Gating System shall 複数の機能を単一の購入商品に紐付けることをサポートする（バンドル機能）

### 要件 5: ペイウォール / 購入UI

**目的:** ユーザーに購入オプションを分かりやすく提示し、購入を促進すること。

#### 受け入れ基準

1. The Paywall Component shall プレミアム機能へのアクセス試行時にペイウォール画面を表示する
2. The Paywall Component shall 利用可能な購入オプションをカード形式でリスト表示する
3. When ユーザーが特定の購入オプションをタップする, the Paywall shall 価格・説明・解放機能を強調表示する
4. The Paywall Component shall 各オプションのCTA（Call To Action）ボタンを備える
5. While 購入処理中である, the Paywall shall すべてのインタラクションを無効化し、ローディング状態を表示する
6. The Paywall Component shall ダークモード・ライトモード対応のApple HIG準拠デザインを採用する

### 要件 6: 復元機能（Restore Purchases）

**目的:** ユーザーが他のデバイスやアプリ再インストール後に購入を復元できるようにすること。

#### 受け入れ基準

1. The Restore Service shall "復元" ボタンをアカウント設定画面に提供する
2. When ユーザーが復元ボタンをタップする, the Restore Service shall デバイスの購入履歴をプラットフォーム決済システムから取得する
3. The Restore Service shall 取得した購入を検証し、ローカルDBに登録する
4. If 復元対象の購入が見つからない場合, the Restore Service shall ユーザーに「購入履歴がない」と通知する
5. While 復元処理中である, the Restore Service shall ローディングインジケータを表示する
6. If 復元処理に失敗した場合, the Error Handler shall 詳細なエラーメッセージとリトライ機能を提供する

### 要件 7: 購入履歴・レシート管理

**目的:** ユーザーが購入履歴を確認でき、ビジネスロジックが購入レシートを検証できるようにすること。

#### 受け入れ基準

1. The Purchase History Component shall ユーザーが購入した全商品とその日時をリスト表示する
2. When ユーザーが購入履歴の項目をタップする, the Purchase Details Modal shall 商品名・金額・購入日時・トランザクションIDを表示する
3. The Receipt Manager shall StoreKit2 / Google Play Billingから取得したレシートデータを検証する
4. The Receipt Manager shall レシート署名を検証し、改ざんされていないことを確認する
5. If レシート検証に失敗した場合, the Verification Handler shall 購入を無効化し、ログを記録する
6. The Receipt Manager shall 検証済みレシートをローカルDBに安全に保存する

### 要件 8: エラーハンドリング・リカバリー

**目的:** 各種エラー（決済失敗、ネットワーク障害など）に対応し、ユーザーが適切に対処できるようにすること。

#### 受け入れ基準

1. If 決済がネットワークエラーで失敗した場合, the Retry Handler shall 再試行オプションを提供する
2. If 決済がプラットフォーム側の理由で拒否された場合, the Error Message shall 原因を詳細に説明する
3. If ローカル購入記録とプラットフォーム記録に不一致が生じた場合, the Sync Reconciler shall 最新情報を取得し同期する
4. While エラー復旧処理中である, the System shall ユーザーをロック状態に維持する（安全性のため）
5. The Error Logger shall すべての購入関連エラーをタイムスタンプ付きでログに記録する
6. The Support Handler shall エラーログを圧縮しエクスポートできる機能を提供する

### 要件 9: セキュリティとコンプライアンス

**目的:** 購入情報を安全に扱い、プラットフォームのコンプライアンス要件を満たすこと。

#### 受け入れ基準

1. The Secure Storage shall 購入トランザクションIDと検証情報を暗号化して保存する（expo-secure-store使用）
2. The Receipt Validator shall すべてのレシートをプラットフォーム（Apple / Google）に対して検証する
3. Where ローカルモード（オフライン検証）を許可する場合, the Offline Validator shall キャッシュされたレシート情報のみで検証を行う
4. The System shall ユーザーの購入履歴を個人情報として扱い、アクセス制御を実施する
5. The Privacy Handler shall 削除リクエスト時に購入関連の個人情報を適切に削除できる
6. If レシート検証失敗時に自動リトライが実行される場合, the Rate Limiter shall 過度なリトライを防ぐためレート制限を実施する

### 要件 10: AnalyticsとMonitoring

**目的:** 購入関連のイベントを追跡し、ビジネス分析・問題診断に活用すること。

#### 受け入れ基準

1. The Analytics Engine shall 以下のイベントを記録する：`purchase_initiated`, `purchase_completed`, `purchase_failed`, `paywall_displayed`, `restore_attempted`
2. When 購入が完了する, the Analytics shall 商品ID・価格・通貨・タイムスタンプを記録する
3. The Performance Monitor shall 購入フロー各段階の処理時間を測定する
4. If ネットワークレイテンシが閾値を超える場合, the Performance Alert shall ログに警告を記録する
5. The System shall 購入関連のエラーレートを監視し、異常を検出する
6. The Reporting System shall ダッシュボード用の集計データを提供する（実装時）

## 非機能要件

### パフォーマンス
- 購入商品リスト取得: 2秒以内
- ペイウォール表示: 500ms以内
- 復元処理完了: 15秒以内

### 互換性
- iOS 14以上（StoreKit2対応）
- Android 6.0以上（Google Play Billing対応）
- 既存のRevenueCat実装との共存

### ローカライゼーション
- UI文字列は多言語対応可能な設計
- 価格表示は通貨・地域別フォーマット対応
