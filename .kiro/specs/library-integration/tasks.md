# Implementation Plan
-

## 1. ライブラリインストールと基盤セットアップ

- [x] 1.1 (P) zodバリデーションライブラリの導入
  - pnpm経由でzod ^3.xをインストール
  - package.jsonの依存関係を確認
  - _Requirements: 1.1_

- [x] 1.2 (P) date-fns日付処理ライブラリの導入
  - pnpm経由でdate-fns ^4.1.0をインストール
  - package.jsonの依存関係を確認
  - _Requirements: 2.1_

- [x] 1.3 (P) expo-secure-storeセキュアストレージの導入
  - pnpm expo installでexpo-secure-store ~15.0.7をインストール
  - package.jsonの依存関係を確認
  - _Requirements: 3.1_

- [x] 1.4 (P) expo-notificationsプッシュ通知ライブラリの導入
  - pnpm expo installでexpo-notifications ~54.xをインストール
  - pnpm expo installでexpo-device（物理デバイスチェック用）をインストール
  - package.jsonの依存関係を確認
  -
  - _Requirements: 4.1_

## 2. バリデーション機能の実装

- [x] 2.1 (P) zodバリデーションスキーマの作成
  - lib/validation.tsに再利用可能なバリデーションスキーマを定義
  - emailSchema（メールアドレス検証、日本語エラーメッセージ）
  - passwordSchema（8文字以上、大文字小文字数字を含む、日本語エラーメッセージ）
  - phoneSchema（日本の電話番号形式検証、日本語エラーメッセージ）
  - ValidationResult型とvalidateData関数を実装
  - _Requirements: 1.3, 1.4_

- [x] 2.2 バリデーションデモUIの実装
  - features/_example/components/validation-demo.tsxにデモコンポーネントを作成
  - メール、パスワード、電話番号の入力フォームを配置
  - リアルタイムバリデーション（入力変更時にvalidateDataを実行）
  - フィールド別エラーメッセージの表示
  - features/_example/index.tsからエクスポート
  - lib/validation.ts（タスク2.1）の完了が必要
  - _Requirements: 1.2, 1.4_

- [x]* 2.3 zodバリデーションのユニットテスト
  - lib/__tests__/validation.test.tsにテストスイートを作成
  - emailSchema検証テスト（正常系・異常系）
  - passwordSchema検証テスト（8文字未満、大文字なし、小文字なし、数字なし）
  - phoneSchema検証テスト（日本の電話番号形式）
  - validateData関数のテスト（success/errorsパス）
  - `pnpm check` がパスすることを確認したら、コミットしてプッシュしつつ、PRを作成する
  - _Requirements: 1.5_

## 3. 日付処理機能の実装

- [x] 3.1 (P) date-fnsユーティリティモジュールの作成
  - lib/date.tsにdate-fnsラッパー関数を実装
  - formatDate関数（デフォルトロケール: ja）
  - formatDistanceToNow関数（相対時刻表示、日本語ロケール）
  - formatRelativeDate関数（相対日付表示、日本語ロケール）
  - date-fnsのモジュラーインポートを使用（Tree-shaking維持）
  - _Requirements: 2.2_

- [x] 3.2 日付フォーマットデモUIの実装
  - features/_example/components/date-demo.tsxにデモコンポーネントを作成
  - format, formatDistanceToNow, formatRelativeDateの使用例を表示
  - 複数のフォーマットパターンを並列表示（'yyyy-MM-dd HH:mm:ss'、'3日前'、'今日'など）
  - Date objectのみを使用（文字列渡しを禁止）
  - features/_example/index.tsからエクスポート
  - lib/date.ts（タスク3.1）の完了が必要
  - _Requirements: 2.3, 2.4_

- [x]* 3.3 date-fnsユーティリティのユニットテスト
  - lib/__tests__/date.test.tsにテストスイートを作成
  - formatDate関数のテスト（様々なフォーマット文字列）
  - formatDistanceToNow関数のテスト（過去・未来の日付）
  - formatRelativeDate関数のテスト（今日、昨日、明日など）
  - 日本語ロケールの検証
  -
  - _Requirements: 2.5_

## 4. セキュアストレージ機能の実装

- [x] 4.1 (P) SecureStoreラッパーモジュールの作成
  - lib/secure-storage.tsにSecureStoreラッパーAPIを実装
  - SecureStorageKey列挙型（AUTH_TOKEN, USER_ID, API_KEY）
  - SecureStorageResult型（Result型パターン）
  - saveSecure, getSecure, deleteSecure関数
  - エラーハンドリングの統一（try-catchでResult型返却）
  - ペイロードサイズ制限（2048バイト）のJSDocコメント追加
  - _Requirements: 3.2, 3.4, 3.5_

- [x] 4.2 セキュアストレージデモUIの実装
  - features/_example/components/secure-storage-demo.tsxにデモコンポーネントを作成
  - SecureStorageKey.AUTH_TOKENの保存/取得/削除UI
  - エラーハンドリングとユーザーフィードバック表示
  - ペイロードサイズ制限（最大2000文字）の入力制限
  - features/_example/index.tsからエクスポート
  - lib/secure-storage.ts（タスク4.1）の完了が必要
  - _Requirements: 3.3, 3.4_

- [x]* 4.3 SecureStoreラッパーのユニットテスト
  - lib/__tests__/secure-storage.test.tsにテストスイートを作成
  - saveSecure関数のモック化テスト（成功・失敗）
  - getSecure関数のモック化テスト（値あり・値なし・エラー）
  - deleteSecure関数のモック化テスト（成功・失敗）
  - SecureStorageKey列挙型の型安全性検証
  - SecureStore APIをモック化（jest.mock）
  - `pnpm check` がパスすることを確認したら、コミットしてプッシュしつつ、PRを作成する
  - _Requirements: 3.4_

## 5. プッシュ通知機能の実装

- [x] 5.1 (P) 通知サービスモジュールの作成
  - services/notifications.tsに通知サービスを実装
  - requestNotificationPermissions関数（権限確認・リクエスト・トークン取得）
  - scheduleNotification関数（ローカル通知スケジュール）
  - cancelNotification関数（通知キャンセル）
  - getAllScheduledNotifications関数（スケジュール済み通知取得）
  - setupForegroundHandler関数（フォアグラウンド通知ハンドラー設定）
  - 物理デバイスチェック（Device.isDevice）
  - PermissionResult型の定義
  - _Requirements: 4.2, 4.3, 4.5, 4.7_

- [x] 5.2 通知デモUIの実装
  - features/_example/components/notification-demo.tsxにデモコンポーネントを作成
  - 権限リクエストボタン（requestNotificationPermissions呼び出し）
  - 通知スケジュールボタン（5秒後、10秒後のローカル通知）
  - 権限拒否時の設定案内UI表示
  - Push Tokenの表示
  - features/_example/index.tsからエクスポート
  - services/notifications.ts（タスク5.1）の完了が必要
  - _Requirements: 4.4, 4.6_

- [x] 5.3 アプリ起動時の通知ハンドラー初期化
  - app/_layout.tsxのRoot Layoutでsetupforegroundhandler()を呼び出し
  - フォアグラウンド通知受信時の動作設定（shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false）
  - services/notifications.ts（タスク5.1）の完了が必要
  - _Requirements: 4.5_

- [x]* 5.4 通知サービスのユニットテスト
  - services/__tests__/notifications.test.tsにテストスイートを作成
  - requestNotificationPermissions関数のモック化テスト（権限許可・拒否・デバイスチェック）
  - scheduleNotification関数のモック化テスト（正常系・異常系）
  - cancelNotification関数のモック化テスト
  - getAllScheduledNotifications関数のモック化テスト
  - expo-notifications APIをモック化（jest.mock）
  - `pnpm check` がパスすることを確認したら、コミットしてプッシュしつつ、PRを作成する
  - _Requirements: 4.2, 4.3, 4.7_

## 6. 統合とドキュメント整備

- [ ] 6.1 サンプル実装の統合
  - features/_example/配下の全デモコンポーネントをapp/(tabs)/demo.tsxまたは新規ルートに統合
  - ValidationDemo, DateDemo, SecureStorageDemo, NotificationDemoを並列表示
  - 複数ライブラリ統合パターンの実装（例: zodでdate入力検証 + date-fnsでフォーマット）
  - タスク2.2, 3.2, 4.2, 5.2の完了が必要
  - _Requirements: 5.1, 5.4_

- [ ] 6.2 lib/README.mdドキュメントの作成
  - lib/README.mdにユーティリティモジュールのドキュメントを記述
  - lib/validation.ts、lib/date.ts、lib/secure-storage.tsの使用方法と例
  - TypeScript型アノテーションの例示
  - services/notifications.tsの使用方法
  - _Requirements: 5.2, 5.3_

- [ ] 6.3 CLAUDE.mdとTEMPLATE_ARCHITECTURE.mdの更新
  - CLAUDE.mdにライブラリインストール状況と使用パターンを追記
  - TEMPLATE_ARCHITECTURE.mdにzod, date-fns, expo-secure-store, expo-notificationsの導入ステータスを反映
  - lib/配下のユーティリティモジュール構成を記載
  - services/notifications.tsの説明を追加
  - _Requirements: 5.6_

- [ ]* 6.4 テストカバレッジ検証と80%達成
  - pnpm test:coverageでカバレッジレポート生成
  - lib/validation.ts, lib/date.ts, lib/secure-storage.ts, services/notifications.tsのカバレッジが80%以上であることを確認
  - 不足している場合は追加テストを作成
  - jest.config.jsのcoverageThresholdを80%に設定
  - `pnpm check` がパスすることを確認したら、コミットしてプッシュしつつ、PRを作成する
  - _Requirements: 5.5_
