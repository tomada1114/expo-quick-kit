# TODO2: 不要ファイル削除 & ドキュメント整備（優先度: 低）

TEMPLATE_ARCHITECTURE.md Phase 1, Phase 6 の残タスク。

## タスク

### 1. 不要ファイル削除

Phase 1.2 で削除対象とされているが残っているファイル:

```bash
rm -rf components/external-link.tsx
rm -rf components/haptic-tab.tsx
```

**注意**: 削除前に他ファイルからの参照がないか確認すること

### 2. ドキュメント作成

Phase 6.2 で記載されているドキュメント:

| ファイル | 内容 |
|---------|------|
| `docs/ARCHITECTURE.md` | アーキテクチャ説明 |
| `docs/CONVENTIONS.md` | コーディング規約 |
| `docs/TESTING.md` | テスト方針 |

**docs/ARCHITECTURE.md の内容案**:
- フォルダ構造の説明
- 各レイヤーの責務
- データフローの概要

**docs/CONVENTIONS.md の内容案**:
- 命名規則（kebab-case）
- ファイル配置ルール
- インポート順序

**docs/TESTING.md の内容案**:
- テストファイルの配置（`__tests__/`）
- テスト命名規則
- モックの使い方

## 完了条件

- [ ] `components/external-link.tsx` が削除されている
- [ ] `components/haptic-tab.tsx` が削除されている
- [ ] `docs/ARCHITECTURE.md` が作成されている
- [ ] `docs/CONVENTIONS.md` が作成されている
- [ ] `docs/TESTING.md` が作成されている
- [ ] `pnpm lint` が通る
- [ ] `pnpm test` が通る
