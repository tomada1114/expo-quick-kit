# 購入型・フリーミアム対応 - リサーチログ

## Summary

本要件は既存のRevenueCat統合に加えて、ワンタイム購入（買い切り型）とフリーミアムモデルに対応するため、プラットフォーム購入APIの実装戦略、ローカルデータベース設計、レシート検証戦略、およびエラーハンドリング・リカバリーパターンについて包括的に調査・分析した。

## Research Findings

### 1. プラットフォーム購入API実装戦略

#### StoreKit2（iOS）の要件
- **Non-consumable Products**: ワンタイム購入はStoreKit2の「Non-consumable products」として実装
- **トランザクション検証**: `Transaction.currentEntitlements`は永続的な購入アクセスを表す非同期シーケンス
- **ローカル状態は信頼できない**: StoreKit2が真実のソース。ローカル状態はUXを平滑化するためのみ使用
- **JWS署名検証**: 購入成功時、App Store署名されたverification resultを取得して検証必須
- **2025年最新機能**: `introductoryOfferEligibility`、JWS形式での`promotionalOffer`署名サポート

**実装パターン**:
```
1. Product.products(for: ["product_id"])でメタデータ取得
2. StoreKit Viewで購入フロー実行
3. Transaction.verifiedプロパティで署名検証
4. 検証済みトランザクション情報をローカルDBに記録
5. 複数セッション間でTransaction.currentEntitlementsから確認
```

#### Google Play Billing（Android）の要件
- **One-time products**: 非消費型として一度だけ購入可能
- **Billing Library v7以上**: 2025年8月31日までに必須アップデート（拡張期限11月1日）
- **OneTimeProductNotification**: 購入完了時にサーバーサイドで処理
- **複数購入オプション対応**: 同一商品に複数の購入オプション・オファー設定可能
- **数量サポート**: Billing Library v4.0+で複数購入対応

**実装パターン**:
```
1. launchBillingFlow()で購入フロー起動
2. onPurchasesUpdated()コールバックで結果処理
3. 購入トークン検証（サーバーサイド推奨）
4. ローカルDBに記録後、OneTimeProductNotificationで同期
```

#### RevenueCat統合の拡張アプローチ
- **エンタイトルメント設計**: ワンタイム購入は「非消費型」としてエンタイトルメント設定するとlifetime access
- **注意点**: エンタイトルメントを消費型に設定すると「一度の購入でlifetime unlock」となるため、複数購入を許可する場合は慎重に設計
- **推奨パターン**: ワンタイム購入はエンタイトルメントなしで独立管理し、ローカルDBで購入状態を追跡

---

### 2. ローカルデータベース・永続化戦略

#### Drizzle ORM + expo-sqlite の活用
- **型安全性**: TypeScriptでスキーマ定義・操作可能
- **Expo環境対応**: `expo-sqlite`との統合により管理デバイスでのSQLite操作確実化
- **リアクティブクエリ**: `useLiveQuery`で自動的にDBの変更を画面に反映
- **マイグレーション管理**: `pnpm db:generate`でスキーマ変更を追跡
- **開発支援**: `expo-drizzle-studio-plugin`でDrizzle Studioからデータ参照・編集可能

#### ローカルキャッシュ戦略
- **レシートキャッシング**: 最新のexpiration_date等をローカル保存し、オフラインシナリオで使用
- **オフラインモード**: 未同期の購入記録をローカルDBから読み込み機能を解放
- **同期フラグ管理**: `isSynced: boolean`でサーバー同期済みかを記録
- **復旧戦略**: ローカルDB破損時、トランザクション履歴から再構成を試行

---

### 3. 暗号化・セキュアストレージ

#### expo-secure-store の活用
- **プラットフォーム別実装**:
  - iOS: Keychain (kSecClassGenericPassword)
  - Android: SharedPreferences + Android Keystore
- **用途**: トランザクションID、署名検証情報の暗号化保存
- **容量制限**: 歴史的に約2048バイトの上限（iOS）だが、Expoは実装依存に委譲
- **利点**: デバイスロック時の自動暗号化、ユーザーログアウト時のクリア

#### 設計原則
- **暗号化キーの難読化**: 不正変更を困難にするため、キーは可視化・アクセス困難化
- **サーバーサイド検証優先**: クライアント検証は過信不可（中間者攻撃リスク）
- **機密情報の分離**: 大量データはDrizzle DB、小量の機密情報はsecure-store

---

### 4. レシート検証戦略

#### Server-side検証が推奨
- **理由**: 中間者攻撃（MITM）回避、改ざん防止
- **App Store直接呼び出しNG**: `/verifyReceipt`をクライアントから呼ぶ → MITM脆弱性
- **iOS新仕様**: OrderInfo.Apple.jwsRepresentation使用（legacy payload非推奨）

#### Offline検証（ローカルモード）
- キャッシュされたレシート情報のみで検証
- オフラインシナリオで機能を解放
- 署名検証キーの難読化が重要

#### オフライン対応パターン
```
1. Purchase実行 → ローカルDBに記録
2. サーバー接続あり → サーバー検証
3. サーバー接続なし → キャッシュ済みレシートで検証 or 待機
4. 接続復帰 → 未同期購入をサーバーに送信
```

---

### 5. エラーハンドリング・リカバリー戦略

#### エラーカテゴリーと再試行可能性
| エラー | 再試行 | 対応 |
|--------|--------|------|
| Network Error (NETWORK_ERROR) | ✅ Yes | Exponential backoff |
| Store Problem (STORE_PROBLEM_ERROR) | ✅ Yes | 再試行可能 |
| User Cancel (PURCHASE_CANCELLED) | ❌ No | ユーザー案内 |
| Invalid Purchase (PURCHASE_INVALID) | ❌ No | エラーログ・詳細表示 |
| Rate Limit (429) | ✅ Yes | Jitter付き exponential backoff |

#### Exponential Backoff実装パターン
```
Retry Delay = baseDelay * (2 ^ attempt) + jitter
例: 1s, 2s, 4s, 8s, 16s (最大16s)
Jitter: 0~1sのランダム値で「thundering herd」回避
```

#### レート制限対応
- Error code 429でリクエスト上限超過判定
- Exponential backoffで自動復旧
- ダッシュボード警告で管理者に通知

#### Graceful Degradation
- ネットワーク接続不可時 → ローカルキャッシュで機能解放
- サーバー同期失敗 → ローカルDB記録のみで続行、再接続時に同期
- レシート検証失敗 → デバッグログ記録、管理画面で手動確認

---

### 6. ArchitectureパターンとドメインBoundary

#### Onion Architecture適用
- **Domain層**: `Purchase`(買い切り型)、`Subscription`(サブスク) エンティティ分離
- **Application層**: `PurchaseService`（ビジネスロジック）、`ReceiptVerifier`（署名検証）
- **Infrastructure層**: `PurchaseRepository`（PlattformAPI）、`LocalDatabase`（Drizzle）
- **Presentation層**: `PaywallComponent`、`PurchaseHistoryUI`

#### ドメインBoundary設計
- **Purchase（買い切り型）**: 永続的、revoke不可、複数購入不可 → 独立したaggregate
- **Subscription（サブスク）**: 更新・復帰可能 → 既存Subscriptionエンティティ
- **Feature Gating**: `FeatureLevel`でaccess control（基本/プレミアム分岐）

#### 既存パターンからの拡張
- 既存subscription実装（TypeScript types、Repository pattern）を参考
- RevenueCatの`Purchases.purchaseStoreProduct()`でサポート
- ワンタイム購入用の新規エンタイティ・サービス層を追加

---

### 7. フリーミアムモデル・Feature Gating

#### 推奨実装パターン
1. **Feature定義**: 各機能に`level: 'free' | 'premium'`タグ
2. **アクセス時判定**:
   - Free → 直接実行
   - Premium且つ未購入 → Paywall表示
   - Premium且つ購入済み → 実行
3. **Paywall表示時機**: コンテキストに応じて表示・スキップ可能
4. **複数購入オプション**: 単一ワンタイム購入で複数機能を解放（バンドル）

#### UI/UXパターン
- **Paywall As Context**: ユーザーが機能アクセス試行時に自然に表示
- **Dismiss可能**: Freemiumモデルではユーザーが閉じる選択肢を保有
- **Apple HIG準拠**: Dark mode対応、タッチターゲット最小44pt、カラーアクセシビリティ

---

### 8. Analytics・Monitoring

#### 記録すべきイベント
- `purchase_initiated`: 購入開始
- `purchase_completed`: 購入成功（商品ID・金額・通貨・タイムスタンプ）
- `purchase_failed`: 購入失敗（エラーコード）
- `paywall_displayed`: Paywall表示
- `restore_attempted`: 復元試行
- `receipt_verification_failed`: レシート検証失敗

#### 監視メトリクス
- 購入フロー段階別処理時間（ペイウォール表示, 決済処理, レシート検証）
- ネットワークレイテンシ閾値超過警告
- エラーレート監視（異常検出）
- 復元処理完了時間（15秒以内目標）

---

## Architecture Pattern Decision

### 選択: **Event-Driven + Domain-Driven Design (DDD) with Onion Architecture**

**理由**:
1. **既存Subscription実装と整合**: 現在のdomain層、repository patternを活用
2. **ワンタイム購入の独立性**: 別エンティティとしてドメイン分離
3. **非同期イベント処理対応**: 購入成功→DBレコード→UI更新の流れをイベント駆動で実装
4. **テスト容易性**: 各層が独立、mock容易
5. **チーム並列開発対応**: Boundary明確化でmerge conflict最小化

**具体設計**:
- Domain: `Purchase`, `PurchaseHistory`, `Receipt` エンティティ
- Application: `PurchaseService`, `ReceiptVerifier`, `PurchaseRestorer`
- Infrastructure: `PurchaseRepository` (RevenueCat/StoreKit/PlayBilling), `LocalDatabase` (Drizzle), `SecureStorage` (expo-secure-store)
- Presentation: React Hooks + Components

---

## Known Gaps & Implementation Considerations

1. **Backend実装スコープ**: 本設計はクライアント側を中心。サーバーサイドレシート検証は実装時に詳細化
2. **マイグレーション戦略**: 既存Subscriptionテーブルとの共存時のDB設計・クエリ最適化
3. **A/B Testing**: Freemium機能制限値の段階的調整（今後分析で最適化）
4. **支払い方法拡張**: Google Pay / Apple Payシート統合（将来検討）

---

## Supporting Information

### External References
- [StoreKit2 Documentation - Apple Developer](https://developer.apple.com/storekit/)
- [Google Play Billing Docs - Android Developers](https://developer.android.com/google/play/billing)
- [RevenueCat React Native Integration](https://www.revenuecat.com/docs/getting-started/making-purchases)
- [Drizzle ORM + expo-sqlite](https://orm.drizzle.team/docs/connect-expo-sqlite)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
