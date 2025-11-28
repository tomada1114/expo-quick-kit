# Research & Design Decisions

---

**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design.

**Usage**:

- Log research activities and outcomes during the discovery phase.
- Document design decision trade-offs that are too detailed for `design.md`.
- Provide references and evidence for future audits or reuse.

---

## Summary

- **Feature**: `library-integration`
- **Discovery Scope**: Extension (既存ボイラープレートへの標準ライブラリ統合)
- **Key Findings**:
  - Zod v4にReact Native互換性問題があるため、Zod v3の使用を推奨
  - date-fns v4.1.0は安定版でReact Native完全互換（タイムゾーン処理は@date-fns/tzを推奨）
  - expo-secure-store, expo-notificationsはExpo SDK 54で完全サポート（Expo Go制約あり）
  - 既存の`features/_example`パターンとRepositoryパターンを活用可能

## Research Log

### Zod バリデーションライブラリの互換性調査

- **Context**: Requirement 1でzodの統合が必要。最新バージョンとReact Native互換性を確認
- **Sources Consulted**:
  - [Zod v4 and React Native compatibility](https://github.com/colinhacks/zod/issues/4690)
  - [React Native with zod v4 and react-hook-form](https://github.com/colinhacks/zod/issues/4989)
  - [Zod NPM package](https://www.npmjs.com/package/zod)
  - [Expo, React Hook Form + TypeScript + Zod](https://dev.to/birolaydin/expo-react-hook-form-typescript-zod-4oac)
- **Findings**:
  - **Zod v4 (latest)にReact Native互換性問題が報告されている**:
    - react-hook-formとの統合で"Invalid element at key: expected a Zod schema"エラー
    - `zod/v4-mini`のモジュール解決問題
    - `navigator.userAgent`がReact Nativeランタイムで未定義
  - **Zod v3は安定版として動作**:
    - ワークアラウンドで`import * as z from 'zod/v3'`を使用すると解決
    - React Hook Formおよび@hookform/resolversと良好な統合実績
- **Implications**:
  - 本番環境では**Zod v3系を推奨**（バージョン指定: `^3.x`）
  - v4の安定化まではv3を使用し、将来的なマイグレーションパスを文書化
  - フォームバリデーションはreact-hook-formとの統合を想定

### date-fns 日付処理ライブラリの調査

- **Context**: Requirement 2でdate-fnsの統合が必要。React Native環境での利用パターンを確認
- **Sources Consulted**:
  - [date-fns NPM package](https://www.npmjs.com/package/date-fns)
  - [date-fns GitHub](https://github.com/date-fns/date-fns)
  - [date-fns official site](https://date-fns.org/)
  - [@date-fns/tz NPM](https://www.npmjs.com/package/@date-fns/tz)
- **Findings**:
  - **最新版: v4.1.0**（約1年前公開、安定版）
  - **React Native完全互換**:
    - モジュラー設計でTree-shakingサポート
    - TypeScript 100%サポート、ハンドメイドの型定義
    - 200以上の関数を提供（format, formatDistance, formatRelative等）
  - **タイムゾーン処理**:
    - `@date-fns/tz` v1.3.0以降でHermes JS Engine（React Nativeデフォルト）をサポート
    - iOSは標準でIntl APIサポート、AndroidはHermesでデフォルト対応
  - **注意点**:
    - Date()コンストラクタに文字列を渡すとランタイムごとに異なる挙動（開発/本番で差異）
    - 常にDate objectまたはタイムスタンプを使用推奨
- **Implications**:
  - date-fns v4.1.0を標準ライブラリとして統合
  - タイムゾーン処理が必要な場合は`@date-fns/tz`を追加
  - lib/date.tsでformat, formatDistance, formatRelativeのユーティリティを提供
  - サンプルでDate()コンストラクタの正しい使い方を明示

### expo-secure-store セキュアストレージの調査

- **Context**: Requirement 3でexpo-secure-storeの統合が必要。Expo SDK 54での利用パターンとAPI制約を確認
- **Sources Consulted**:
  - [SecureStore - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/)
  - [expo-secure-store NPM](https://www.npmjs.com/package/expo-secure-store)
  - [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- **Findings**:
  - **バージョン**: 15.0.7（Expo SDK 54対応）
  - **ストレージ実装**:
    - iOS: Keychain Services
    - Android: EncryptedSharedPreferences（AndroidX Security）
  - **制約事項**:
    - **ペイロードサイズ制限**: iOSで約2048バイト以上が拒否される可能性（過去バージョン）
    - **Expo Go制限**: 生体認証が利用可能な場合、requireAuthenticationオプションはNSFaceIDUsageDescriptionキーがないためサポート外
    - **アンインストール後の挙動**:
      - Android: データは削除される
      - iOS: 同じbundle IDで再インストールすればデータ永続化
  - **APIパターン**:
    - `setItemAsync(key, value, options)`: 非同期保存
    - `getItemAsync(key, options)`: 非同期取得
    - `deleteItemAsync(key, options)`: 非同期削除
- **Implications**:
  - lib/secure-storage.tsでラッパー関数を提供（エラーハンドリング統一）
  - TypeScript型定義でストレージキーを列挙型として管理
  - サンプル実装でエラーハンドリングパターンを明示
  - 大容量データには使用せず、トークンや認証情報など小サイズデータに限定

### expo-notifications プッシュ通知の調査

- **Context**: Requirement 4でexpo-notificationsの統合が必要。Expo SDK 54での設定パターンと権限処理を確認
- **Sources Consulted**:
  - [Notifications - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
  - [Expo push notifications setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)
  - [Push Notifications Setup for Expo App (SDK 54+)](https://gist.github.com/Xansiety/5e8d264c5391b7e287705efbca70b80f)
- **Findings**:
  - **重要変更: Expo SDK 54以降、Expo Goでプッシュ通知は動作しない**
    - Development Buildが必須（expo-dev-client使用）
  - **権限処理パターン**:
    1. `Notifications.getPermissionsAsync()`で現在の権限状態を確認
    2. 未許可の場合`Notifications.requestPermissionsAsync()`でリクエスト
    3. 許可後に`Notifications.getExpoPushTokenAsync()`でトークン取得
  - **Android 13以降の制約**:
    - 権限プロンプトは最低1つの通知チャンネル作成後に表示される
  - **必須ライブラリ**:
    - expo-notifications: 通知制御とトークン取得
    - expo-device: 物理デバイスチェック
    - expo-constants: projectId取得
- **Implications**:
  - services/notifications.tsで通知サービスラッパーを提供
  - 権限リクエスト、ローカル通知スケジュール、キャンセル、取得機能を実装
  - サンプル実装で権限拒否時のUI案内パターンを明示
  - フォアグラウンド通知ハンドラー設定を含める

### 既存コードパターン分析

- **Context**: features/_exampleの既存実装パターンを調査し、統合戦略を決定
- **Sources Consulted**:
  - features/_example/services/repository.ts
  - features/_example/hooks/use-item-list.ts
  - lib/query-client.ts
- **Findings**:
  - **Repositoryパターン**: Drizzle ORMでCRUD操作をカプセル化（ItemRepository）
  - **TanStack Query統合**: repositoryメソッドをqueryFnとして使用、itemKeysでクエリキー管理
  - **lib/配下の構造**: ユーティリティ関数をlib/に配置（format.ts, query-client.ts）
  - **テストパターン**: `__tests__/`ディレクトリにJestテスト配置
- **Implications**:
  - 新規ライブラリもlib/配下に配置（lib/date.ts, lib/secure-storage.ts）
  - services/ディレクトリに通知サービス配置（services/notifications.ts）
  - features/_example/に統合サンプルを追加（validation, date, secure-storage, notification-demo）
  - 各ライブラリのテストも`__tests__/`に配置

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Feature Module Extension | 既存features/_exampleパターンを拡張し、各ライブラリのデモを追加 | 既存パターンに整合、開発者に馴染みやすい | features/_exampleが肥大化する可能性 | 推奨: サンプル実装は後で削除可能 |
| Utility Module Pattern | lib/配下にユーティリティモジュールを配置（date.ts, secure-storage.ts） | プロジェクト全体で再利用可能、シンプルなインポート | ライブラリ固有のロジックが分散 | 推奨: 汎用性の高いヘルパー関数向け |
| Service Layer Pattern | services/配下に通知サービスを配置 | ビジネスロジックとインフラ層の分離 | 小規模プロジェクトでは過剰 | 推奨: expo-notificationsのような複雑な初期化処理向け |

## Design Decisions

### Decision: Zod v3の採用（v4ではなく）

- **Context**: zodの最新バージョンはv4だが、React Native互換性問題が報告されている
- **Alternatives Considered**:
  1. Zod v4を採用し、issue解決を待つ
  2. Zod v3を採用し、安定性を優先
  3. yupなど別のバリデーションライブラリを検討
- **Selected Approach**: Zod v3系（`^3.x`）を採用
- **Rationale**:
  - v3はreact-hook-formとの統合実績が豊富
  - v4の互換性問題（navigator.userAgent未定義、モジュール解決）が解決されていない
  - ボイラープレートとして安定性を優先
  - v3からv4への移行パスは将来的に提供可能
- **Trade-offs**:
  - **Benefits**: 即座に動作保証、既存エコシステムと互換
  - **Compromises**: 最新機能は利用不可、将来的なマイグレーション必要
- **Follow-up**: v4の安定化を定期的にモニタリングし、マイグレーションガイドを後日提供

### Decision: date-fnsのモジュラーインポート推奨

- **Context**: date-fnsは200以上の関数を提供するが、Tree-shakingを活用したい
- **Alternatives Considered**:
  1. 全体インポート: `import * as dateFns from 'date-fns'`
  2. モジュラーインポート: `import { format, formatDistance } from 'date-fns'`
- **Selected Approach**: モジュラーインポートをlib/date.tsで再エクスポート
- **Rationale**:
  - バンドルサイズ削減
  - 使用関数が明示的
  - lib/date.tsでプロジェクト固有のデフォルト設定を提供可能（ロケール等）
- **Trade-offs**:
  - **Benefits**: 最小バンドルサイズ、明示的な依存関係
  - **Compromises**: インポートパスが若干長くなる
- **Follow-up**: lib/date.tsで日本語ロケール（ja）のデフォルト設定を検討

### Decision: expo-secure-storeのキー管理をTypeScriptで型安全化

- **Context**: SecureStoreは文字列キーでデータ管理するが、タイポや重複を防ぎたい
- **Alternatives Considered**:
  1. 文字列リテラルを直接使用
  2. 定数オブジェクトでキー管理
  3. TypeScript列挙型（enum）でキー管理
- **Selected Approach**: lib/secure-storage.tsでキーを列挙型として定義
- **Rationale**:
  - 型補完でキー入力ミス防止
  - キー一覧が一元管理される
  - リファクタリング時の変更が容易
- **Trade-offs**:
  - **Benefits**: 型安全、保守性向上
  - **Compromises**: 若干の定義コスト
- **Follow-up**: 各キーのペイロードサイズ制限（2048バイト）を型レベルで検証する仕組みは実装せず、ドキュメントで注意喚起

### Decision: expo-notificationsの初期化をservices層に配置

- **Context**: expo-notificationsは権限リクエスト、トークン取得、通知設定など複雑な初期化が必要
- **Alternatives Considered**:
  1. アプリケーションエントリポイント（app/_layout.tsx）で直接初期化
  2. カスタムフックでカプセル化
  3. services/notifications.tsでサービスクラスとして実装
- **Selected Approach**: services/notifications.tsにサービス関数群を実装
- **Rationale**:
  - ビジネスロジックとインフラ層の分離
  - テスト容易性（モック化可能）
  - 複数画面で再利用可能
- **Trade-offs**:
  - **Benefits**: 保守性、テスト容易性
  - **Compromises**: ファイル数増加
- **Follow-up**: サービス関数のエラーハンドリングを統一し、型安全なResult型で返却

## Risks & Mitigations

- **Risk 1: Zod v3からv4へのマイグレーション負債**
  - Mitigation: v4安定化を定期モニタリング、マイグレーションガイドを後日文書化
- **Risk 2: expo-secure-storeのペイロードサイズ制限でランタイムエラー**
  - Mitigation: lib/secure-storage.tsのドキュメントで2048バイト制限を明記、大容量データはSQLiteに保存を推奨
- **Risk 3: expo-notificationsのExpo Go制約で開発体験低下**
  - Mitigation: Development Build必須をREADMEとCLAUDE.mdに明記、pnpm dev:iosコマンド提供
- **Risk 4: date-fnsのDate()コンストラクタ誤用でランタイムバグ**
  - Mitigation: lib/date.tsサンプルで正しい使用パターンを明示、Date objectまたはタイムスタンプ使用を推奨

## References

- [Zod v4 and React Native compatibility · Issue #4690 · colinhacks/zod](https://github.com/colinhacks/zod/issues/4690)
- [React Native with zod v4 and react-hook-form not submitting · Issue #4989 · colinhacks/zod](https://github.com/colinhacks/zod/issues/4989)
- [Zod - npm](https://www.npmjs.com/package/zod)
- [date-fns - npm](https://www.npmjs.com/package/date-fns)
- [date-fns official site](https://date-fns.org/)
- [@date-fns/tz - npm](https://www.npmjs.com/package/@date-fns/tz)
- [SecureStore - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [expo-secure-store - npm](https://www.npmjs.com/package/expo-secure-store)
- [Notifications - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo push notifications setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Push Notifications Setup for Expo App (SDK 54+)](https://gist.github.com/Xansiety/5e8d264c5391b7e287705efbca70b80f)
