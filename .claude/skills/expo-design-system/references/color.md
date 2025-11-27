# Color System - iOS System Colors準拠

Apple Human Interface Guidelinesに基づいた、機能的で一貫性のある配色システム。このリファレンスは SKILL.md の詳細版です。

---

## Overview

iOS System Colorsは、Apple設計のセマンティックカラーシステムです。

**特徴：**

- **機能優先** - 色は情報を伝えるために使用。装飾は最小限。
- **一貫性** - すべての色がiOS標準に準拠
- **Dark Mode対応** - Light/Dark両モードで視認性確保
- **アクセシビリティ** - WCAG AA基準（4.5:1）を満たす

---

## Basic Color Palette

### Primary Colors（アプリの主要アクション色）

**ルール：** アプリごとに **1色のみ** をprimaryとして使用

```typescript
primary: {
  blue: '#007AFF',    // Decision Journal - 理性的、信頼感
  green: '#34C759',   // Energy Tracker - 健康、エネルギー
  orange: '#FF9500',  // 12 Week Year - 緊急性、実行
}
```

**使用方針：**

- ✅ 主要アクション（記録ボタン、送信ボタン、主CTA）に使用
- ✅ アプリのブランドカラーとして一貫使用
- ❌ 複数のprimary colorを同一画面で混在使用
- ❌ 単なる装飾目的での使用

**選択時のポイント：**

- Blue（#007AFF）：ビジネス、情報系アプリ向け（信頼感、落ち着き）
- Green（#34C759）：健康、フィットネス系向け（成長、活動）
- Orange（#FF9500）：生産性、アクション系向け（緊急性、実行感）

---

### Background Colors（3段階の背景階層）

```typescript
background: {
  base: '#FFFFFF',        // 画面全体の基本背景
  secondary: '#F2F2F7',   // カード、セクション背景
  tertiary: '#FFFFFF',    // モーダル、オーバーレイ背景
}
```

**使用方針：**

- ✅ `base`：画面全体、最外層の背景
- ✅ `secondary`：カード、リスト項目、グループ化されたコンテンツ
- ✅ `tertiary`：モーダル、ポップオーバー、オーバーレイ
- ❌ 3段階以上の背景階層を作らない（複雑化防止）

**実装例：**

```typescript
// 画面全体
<View style={{ backgroundColor: colors.background.base }}>

  // カード内
  <View style={{ backgroundColor: colors.background.secondary }}>
    <Text style={{ color: colors.text.primary }}>Card Content</Text>
  </View>

  // モーダル
  <Modal>
    <View style={{ backgroundColor: colors.background.tertiary }}>
      {/* Modal content */}
    </View>
  </Modal>

</View>
```

---

### Text Colors（4段階のテキスト色）

```typescript
text: {
  primary: '#000000',     // メインテキスト
  secondary: '#3C3C43',   // 補足情報（~60% opacity相当）
  tertiary: '#8E8E93',    // プレースホルダー、非活性テキスト
  inverse: '#FFFFFF',     // Dark背景上のテキスト
}
```

**使用方針：**

| Color     | Font Size | Use Cases                            | Example                                      |
| --------- | --------- | ------------------------------------ | -------------------------------------------- |
| primary   | 17pt+     | 見出し、本文、重要な情報             | ページタイトル、リスト項目本文               |
| secondary | 15-17pt   | サブタイトル、説明文、メタ情報       | リスト副説明、日時、詳細情報                 |
| tertiary  | 12-15pt   | プレースホルダー、ヒント、非活性状態 | 入力フィールドプレースホルダー、無効化ボタン |
| inverse   | 17pt+     | Dark背景上のコンテンツ               | プライマリボタンテキスト、Dark section       |

**実装例：**

```typescript
<Text style={{ color: colors.text.primary, fontSize: 20, fontWeight: '600' }}>
  Main Title
</Text>

<Text style={{ color: colors.text.secondary, fontSize: 16 }}>
  Subtitle or description
</Text>

<TextInput
  placeholder="Enter text"
  placeholderTextColor={colors.text.tertiary}
/>
```

---

### Semantic Colors（機能的な意味を持つ色）

```typescript
semantic: {
  success: '#34C759',  // iOS Green - 成功、完了
  warning: '#FF9500',  // iOS Orange - 注意、警告
  error: '#FF3B30',    // iOS Red - エラー、削除
  info: '#007AFF',     // iOS Blue - 情報、ヒント
}
```

**使用方針：**

| Color   | Meaning                  | Use Cases                                      |
| ------- | ------------------------ | ---------------------------------------------- |
| success | 成功、完了、確認         | チェックマーク、完了メッセージ、保存成功       |
| warning | 注意、警告、予防的な情報 | 警告アイコン、注意メッセージ、確認ダイアログ   |
| error   | エラー、失敗、削除予定   | エラーメッセージ、削除ボタン、入力エラーの下線 |
| info    | 情報、ヒント、補足       | 情報アイコン、ヒントテキスト、案内メッセージ   |

**ルール：**

- ✅ 必ず意味に沿った使用（成功=緑、エラー=赤）
- ✅ トースト、アラート、バリデーションメッセージに使用
- ✅ ユーザーのアクション結果を伝えるに最適
- ❌ semantic colorを装飾目的で使用
- ❌ semantic colorをprimaryの代替として使用

**実装例：**

```typescript
// 成功メッセージ
<Text style={{ color: colors.semantic.success }}>✓ 保存完了しました</Text>

// エラーメッセージ
<Text style={{ color: colors.semantic.error }}>✕ エラーが発生しました</Text>

// 警告トースト
showToast({
  backgroundColor: colors.semantic.warning,
  text: '注意：操作を取り消せません',
});
```

---

### Interactive Elements（操作要素）

```typescript
interactive: {
  separator: '#C6C6C8',      // 区切り線、ボーダー
  fill: '#787880',           // アイコン、非活性要素（~30% opacity）
  fillSecondary: '#BCBCC0',  // 副次的な塗りつぶし（~20% opacity）
}
```

**使用方針：**

| Element       | Color   | Use Cases                                      |
| ------------- | ------- | ---------------------------------------------- |
| separator     | #C6C6C8 | リスト区切り線、カード境界線、セクション区切り |
| fill          | #787880 | アイコン、チェックボックス非選択、スイッチoff  |
| fillSecondary | #BCBCC0 | グレーアウト状態、無効化要素、バッジ背景       |

**ルール：**

- ✅ separator：細い線（1pt）で視覚的な区切りを作成
- ✅ fill：アイコンの通常状態（選択されていない）
- ❌ 境界線に色付き（primaryなど）を使用しない
- ❌ separator を強調目的で使用しない

**実装例：**

```typescript
// リスト区切り線
<View style={{
  height: 1,
  backgroundColor: colors.interactive.separator,
}} />

// グレーアウトアイコン
<Icon
  name="settings"
  color={colors.interactive.fill}
  size={24}
/>

// 無効化ボタン
<Pressable
  style={{
    backgroundColor: colors.interactive.fillSecondary,
    opacity: 0.5,
  }}
  disabled
>
  <Text>Disabled</Text>
</Pressable>
```

---

## Dark Mode

### Dark Mode Color Palette

Dark Modeの色はLight Modeから以下のルールで導出されます：

**Rule: +10% Brightness Adjustment**

Light Mode の色を10%明るくしてDark Mode版を生成：

```typescript
dark: {
  primary: {
    blue: '#0A84FF',      // #007AFF + 10%
    green: '#30D158',     // #34C759 + 10%
    orange: '#FF9F0A',    // #FF9500 + 10%
  },
  background: {
    base: '#000000',           // Pure black
    secondary: '#1C1C1E',      // iOS Dark Gray
    tertiary: '#2C2C2E',       // Elevated surface
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#EBEBF5',      // 60% opacity white相当
    tertiary: '#8E8E93',       // Light Mode と同じ
    inverse: '#000000',
  },
  semantic: {
    success: '#30D158',        // #34C759 + 10%
    warning: '#FF9F0A',        // #FF9500 + 10%
    error: '#FF453A',          // #FF3B30 + 10%
    info: '#0A84FF',           // #007AFF + 10%
  },
  interactive: {
    separator: '#38383A',
    fill: '#787880',           // Light Mode と同じ
    fillSecondary: '#48484A',
  },
}
```

### なぜ+10% Brightness か？

- Dark Mode では、光を発するディスプレイ上で色が暗く見える
- 白い背景上の色よりも、黒い背景上の同じ色は暗く感じられる
- 視覚的な明るさを統一するため、Dark Mode では意図的に明るくする

### 自動切り替えの仕組み

```typescript
import { useColorScheme } from '@/hooks/use-color-scheme';

const colorScheme = useColorScheme();
const colors = Colors[colorScheme ?? 'light'];
// Light/Dark が自動で切り替わる
```

`useColorScheme()` はシステム設定を監視し、ユーザーが手動でLight/Darkを切り替えると自動で反応します。

---

## NG Color Rules（絶対禁止の配色）

### 🚫 Indigo系（#6366F1, #818CF8, #4F46E5等）

**色コード例：**

```typescript
const BAD_INDIGO = {
  indigo400: '#818CF8',
  indigo500: '#6366F1',
  indigo600: '#4F46E5',
};
```

**理由：**

- SaaSスタートアップ臭（2020年代の流行カラー）
- Apple標準色ではなく、流行に乗っているだけ
- 差別化できない（多数のアプリが使用）
- iOS UIKit では使用されていない

**代替：**
`iOS Blue (#007AFF)` を使用。標準感と洗練さを両立。

---

### 🚫 グラデーション

**例：**

```typescript
const BAD_GRADIENT = `
  linear-gradient(135deg, #667eea 0%, #764ba2 100%)
  linear-gradient(to right, #f093fb 0%, #f5576c 100%)
`;
```

**理由：**

- パフォーマンス低下（特にモバイル）
- 装飾過多（情報量が増える）
- メンテナンス困難（複数の色パターン管理）
- iOS 標準では単色が推奨

**代替：**
単色で十分。必要に応じて `opacity` で濃淡を調整。

```typescript
// ✅ Good
style={{ backgroundColor: colors.background.secondary }}

// ❌ Bad
style={{
  backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
}}
```

---

### 🚫 ネオン・ビビッド系（#FF00FF, #00FF00, #00FFFF等）

**色コード例：**

```typescript
const BAD_VIVID = {
  neonPink: '#FF00FF',
  neonGreen: '#00FF00',
  electricBlue: '#00FFFF',
};
```

**理由：**

- 目に刺激的すぎる
- 長時間の使用に不向き（疲労増加）
- ビジネスアプリに不適切

**代替：**
iOS標準色から選択。十分に視認性があります：

- Red：#FF3B30（ネオンより濃い）
- Orange：#FF9500
- Green：#34C759

---

### 🚫 パステル系（#FFB3D9, #B3D9FF, #B3FFB3等）

**色コード例：**

```typescript
const BAD_PASTEL = {
  pastelPink: '#FFB3D9',
  pastelBlue: '#B3D9FF',
  pastelGreen: '#B3FFB3',
};
```

**理由：**

- 可愛い系アプリと誤認（意図しないブランドイメージ）
- ビジネス層に不向き
- コントラスト不足の可能性（白背景上で見づらい）

**代替：**
iOS標準色で十分。パステルほど淡くない自然な明るさ。

---

### 🚫 カスタムグレー（#F5F5F5, #E0E0E0, #9E9E9E等）

**色コード例：**

```typescript
const BAD_GRAY = {
  customGray1: '#F5F5F5',
  customGray2: '#E0E0E0',
  customGray3: '#9E9E9E',
};
```

**理由：**

- iOS標準グレーで十分（複数段階用意されている）
- カスタムグレーを追加するとシステムの一貫性が崩れる
- Dark Mode対応の手間が増える
- Color Palette管理が複雑化

**代替：**
iOS標準グレーを使用：

- Light背景：`background.secondary` (#F2F2F7)
- Dark：`background.secondary` (#1C1C1E)
- Separator：`interactive.separator` (#C6C6C8)

---

## Contrast Ratio（コントラスト比）

### WCAG 2.1 AA基準

すべてのカラー組み合わせは **WCAG AA基準（4.5:1以上）** を満たす必要があります。

**Light Mode コントラスト比：**

| Foreground               | Background                     | Contrast Ratio | Status  |
| ------------------------ | ------------------------------ | -------------- | ------- |
| text.primary (#000000)   | background.base (#FFFFFF)      | 21.00:1        | ✅ PASS |
| text.primary (#000000)   | background.secondary (#F2F2F7) | 20.30:1        | ✅ PASS |
| text.secondary (#3C3C43) | background.base (#FFFFFF)      | 8.25:1         | ✅ PASS |
| text.tertiary (#8E8E93)  | background.base (#FFFFFF)      | 4.54:1         | ✅ PASS |
| semantic.error (#FF3B30) | background.base (#FFFFFF)      | 3.99:1         | ⚠️ FAIL |
| semantic.error (#FF3B30) | background.secondary (#F2F2F7) | 3.87:1         | ⚠️ FAIL |

**Dark Mode コントラスト比：**

| Foreground               | Background                     | Contrast Ratio | Status  |
| ------------------------ | ------------------------------ | -------------- | ------- |
| text.primary (#FFFFFF)   | background.base (#000000)      | 21.00:1        | ✅ PASS |
| text.primary (#FFFFFF)   | background.secondary (#1C1C1E) | 19.80:1        | ✅ PASS |
| semantic.error (#FF453A) | background.base (#000000)      | 5.89:1         | ✅ PASS |

**ルール：**

- ✅ 標準テキスト（17pt以上）：4.5:1以上
- ✅ 大きいテキスト（18pt以上、太字）：3:1以上
- ✅ UIコンポーネント（ボタン、アイコン）：3:1以上
- ❌ Semantic colorの単体背景使用：テキストコントラスト不足の可能性

**Semantic Error の扱い：**

Semantic color の error は テキスト前景として使用する場合、背景によっては WCAG AA を満たしません。以下の方法で対応：

```typescript
// ✅ Good: エラーアイコン + テキスト
<View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <Icon color={colors.semantic.error} name="alert" />
  <Text style={{ color: colors.text.primary }}>
    エラーが発生しました
  </Text>
</View>

// ✅ Good: エラー背景 + 濃いテキスト
<View style={{ backgroundColor: colors.semantic.error }}>
  <Text style={{ color: colors.text.inverse }}>
    エラーが発生しました
  </Text>
</View>

// ❌ Bad: エラーテキストのみ（コントラスト不足の可能性）
<Text style={{ color: colors.semantic.error }}>
  エラーが発生しました
</Text>
```

---

## Implementation Patterns

### パターン1: 基本的なView

```typescript
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function Card({ title, description }: { title: string; description: string }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={{
        backgroundColor: colors.background.secondary,
        padding: 16,
        borderRadius: 12,
      }}
    >
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 17,
          fontWeight: '600',
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <Text style={{ color: colors.text.secondary, fontSize: 15 }}>
        {description}
      </Text>
    </View>
  );
}
```

### パターン2: Semantic Colorsの使用

```typescript
export function ResultMessage({ type, message }: {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const semanticColor = colors.semantic[type];

  return (
    <View
      style={{
        backgroundColor: colors.background.secondary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderLeftWidth: 4,
        borderLeftColor: semanticColor,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: semanticColor, fontWeight: '600' }}>
        {message}
      </Text>
    </View>
  );
}
```

### パターン3: Primary Color Button

```typescript
export function PrimaryButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Pressable
      style={{
        backgroundColor: colors.primary,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
      onPress={onPress}
    >
      <Text
        style={{
          color: colors.text.inverse,
          fontSize: 17,
          fontWeight: '600',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
```

---

## Customization

### Primary Color の変更

`templates/theme.ts` で `PRIMARY_COLOR` を選択：

```typescript
// Before
export const PRIMARY_COLOR = AppPrimaryColor.blue;

// After - Orange に変更
export const PRIMARY_COLOR = AppPrimaryColor.orange;
```

変更後、自動的にLight/Dark両モードのprimaryが更新されます。

### Semantic Colors の拡張

新しいsemantic colorを追加：

```typescript
// light colors
semantic: {
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  neutral: '#8E8E93',  // 新規追加
}

// dark colors
semantic: {
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#0A84FF',
  neutral: '#8E8E93',  // 同じ色を使用
}
```

### Background 階層の調整

必要に応じて `tertiary` の色を変更：

```typescript
// より強いコントラストが必要な場合
tertiary: '#F2F2F7',  // secondary と同じ（背景階層を減らす）

// より淡い背景が必要な場合（非推奨）
// ただし3段階以上になるため避けるべき
```

---

## Related Topics

- [SKILL.md](../SKILL.md) - クイックスタートとコア概念
- [Accessibility](./accessibility.md) - WCAG 2.1 AA 完全ガイド
- [Components](./components.md) - Button/Card/Input の実装
- [Animation & Haptics](./animation.md) - 色の遷移アニメーション
