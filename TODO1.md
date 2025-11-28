# TODO1: 追加ライブラリのインストール（優先度: 中）

TEMPLATE_ARCHITECTURE.md Phase 3 で記載されているが未インストールのライブラリ。

## タスク

### 1. バリデーションライブラリ

```bash
pnpm add zod
```

**用途**: フォーム入力やAPIレスポンスの型安全なバリデーション

### 2. 日付処理ライブラリ

```bash
pnpm add date-fns
```

**用途**: 日付のフォーマット、計算、比較など

**追加実装**:
- `lib/date.ts` を作成（フォーマット関数など）

### 3. セキュアストレージ

```bash
pnpm expo install expo-secure-store
```

**用途**: トークン、APIキーなどの安全な保存

### 4. 通知機能

```bash
pnpm expo install expo-notifications
```

**用途**: プッシュ通知、ローカル通知

## 一括インストールコマンド

```bash
pnpm add zod date-fns
pnpm expo install expo-secure-store expo-notifications
```

## 完了条件

- [ ] 全ライブラリがインストールされている
- [ ] `lib/date.ts` が作成されている
- [ ] `pnpm typecheck` が通る
- [ ] `pnpm test` が通る
