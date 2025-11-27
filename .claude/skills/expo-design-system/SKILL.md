---
name: expo-design-system
description: Apple Human Interface Guidelines準拠のデザインシステム。iOS System Colors、Semantic Colors、Dark Mode対応をExpo/React Nativeアプリに即座に実装。Use when implementing theme system, setting up colors, configuring Dark Mode, building UI components, or following iOS design patterns in Expo apps.
---

# Expo Design System - iOS System Colors準拠

Apple Human Interface Guidelinesに基づいた、ミニマルで機能的なデザインシステム。Expo/React Nativeアプリを素早くセットアップできます。

---

## When to Use This Skill

このスキルは以下の場面で活用してください：

- Expo/React Nativeアプリにテーマシステムを追加したい
- iOS System Colorsに準拠した配色を実装したい
- Dark Mode対応を追加・改善したい
- Semantic Colors（成功/警告/エラー）を使いたい
- Apple Human Interface Guidelines準拠のデザインにしたい
- UIコンポーネント（Button、Card、Input等）を実装したい
- アクセシビリティ基準（WCAG AA）に対応したい

---

## Quick Start（5分でセットアップ）

### 1. テーマファイルを置き換え

既存の `constants/theme.ts` を `templates/theme.ts` で置き換えるだけです。

```bash
cp .claude/skills/expo-design-system/templates/theme.ts constants/theme.ts
```

### 2. コンポーネントで使用

既存の `ThemedText`、`ThemedView` などはそのまま使えます。

```typescript
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function MyComponent() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={{ backgroundColor: colors.background.base }}>
      <Text style={{ color: colors.text.primary }}>Hello World</Text>
    </View>
  );
}
```

### 3. Primary Colorを選択

アプリのメインアクション色を1つ選択します（Blue/Green/Orangeから）。

```typescript
// constants/theme.ts の PRIMARY_COLOR を設定
// Blue (#007AFF)  - 理性的、信頼感 → Decision Journal
// Green (#34C759) - 健康、エネルギー → Energy Tracker
// Orange (#FF9500) - 緊急性、実行 → 12 Week Year
```

---

## Core Concepts

### iOS System Colors とは

iOS System Colorsは、Apple設計のセマンティックカラーシステムです。Light/Dark Modeに自動対応し、機能優先の設計原則に従います。

**特徴：**

- **機能優先** - 色は意味を伝えるために使用
- **装飾最小限** - SaaSのようなIndigo、グラデーション、ネオン系は不採用
- **一貫性** - すべての色がiOS標準に準拠
- **Dark Mode対応** - Light/Dark両モードで視認性確保

### Semantic Colors（機能的な色）

色に機能的な意味を持たせます：

- **Success（成功）** - 緑 (#34C759) - 完了、チェック完了
- **Warning（警告）** - オレンジ (#FF9500) - 注意が必要な状態
- **Error（エラー）** - 赤 (#FF3B30) - エラー、削除予定
- **Info（情報）** - 青 (#007AFF) - 情報提供、ヒント

### Light/Dark Mode自動切り替え

`useColorScheme()` フックがシステム設定に基づいて自動で色を切り替えます。コンテクストは不要です。

```typescript
const colorScheme = useColorScheme();
const color = Colors[colorScheme ?? 'light'].text.primary;
```

---

## Color System（カラーシステム）

### Primary Colors（アプリの主要アクション色）

**ルール:** アプリごとに **1色のみ** をprimaryとして使用

```typescript
primary: {
  blue: '#007AFF',    // Decision Journal - 理性的、信頼感
  green: '#34C759',   // Energy Tracker - 健康、エネルギー
  orange: '#FF9500',  // 12 Week Year - 緊急性、実行
}
```

✅ 使用例：記録ボタン、送信ボタン、主要CTA
❌ NG：複数のprimary colorを同一画面で使用

### Background Colors（背景色 - 3段階）

```typescript
background: {
  base: '#FFFFFF',        // 画面全体の基本背景
  secondary: '#F2F2F7',   // カード、セクション背景
  tertiary: '#FFFFFF',    // モーダル、オーバーレイ背景
}
```

✅ 背景階層は最大3段階
❌ 4段階以上の背景を作らない（複雑化防止）

### Text Colors（テキスト色 - 4段階）

```typescript
text: {
  primary: '#000000',     // メインテキスト、見出し
  secondary: '#3C3C43',   // サブタイトル、説明文
  tertiary: '#8E8E93',    // プレースホルダー、非活性テキスト
  inverse: '#FFFFFF',     // Dark背景上のテキスト
}
```

**配置例：**

- primary：段落、ボタンテキスト、リスト項目
- secondary：メタ情報、説明、補足テキスト
- tertiary：プレースホルダー、無効状態、ヒント
- inverse：暗い背景上に置く時のみ

### Semantic Colors（意味を持つ色）

```typescript
semantic: {
  success: '#34C759',  // iOS Green - 成功、完了
  warning: '#FF9500',  // iOS Orange - 注意、警告
  error: '#FF3B30',    // iOS Red - エラー、削除
  info: '#007AFF',     // iOS Blue - 情報、ヒント
}
```

✅ 必ず意味に沿った使用（成功=緑、エラー=赤）
❌ 意味と異なる色の使用、装飾目的での使用は禁止

### Interactive Elements（操作要素）

```typescript
interactive: {
  separator: '#C6C6C8',      // 区切り線、ボーダー
  fill: '#787880',           // アイコン、非活性要素
  fillSecondary: '#BCBCC0',  // 副次的な塗りつぶし
}
```

---

## Dark Mode

### Dark Mode Color Palette

Dark Modeの色はLight Modeから次のルールで導出されます：

```typescript
dark: {
  // Primary colors - +10% brightness調整
  primary: {
    blue: '#0A84FF',      // #007AFF + 10%
    green: '#30D158',     // #34C759 + 10%
    orange: '#FF9F0A',    // #FF9500 + 10%
  },

  // Background colors - 黒ベース
  background: {
    base: '#000000',           // Pure black
    secondary: '#1C1C1E',      // iOS Dark Gray
    tertiary: '#2C2C2E',       // Elevated surface
  },

  // Text colors - 白ベース
  text: {
    primary: '#FFFFFF',
    secondary: '#EBEBF5',      // 60% opacity white
    tertiary: '#8E8E93',       // 同じグレー
    inverse: '#000000',
  },

  // Semantic colors - +10% brightness調整
  semantic: {
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#0A84FF',
  },

  // Interactive elements - 暗い背景用
  interactive: {
    separator: '#38383A',
    fill: '#787880',
    fillSecondary: '#48484A',
  },
}
```

**自動切り替えの仕組み：**

```typescript
const colorScheme = useColorScheme();
const colors = Colors[colorScheme ?? 'light'];
// Light/Dark が自動で選択される
```

---

## NG Rules（絶対禁止の配色）

### 🚫 Indigo系（#6366F1, #818CF8等）

**理由:** SaaSスタートアップ臭、流行に乗っているだけで差別化できない

**代替:** iOS Blue (#007AFF) を使用

### 🚫 グラデーション

```typescript
❌ linear-gradient(135deg, #667eea 0%, #764ba2 100%)
```

**理由:** パフォーマンス低下、装飾過多、メンテナンス困難

**代替:** 単色で十分

### 🚫 ネオン・ビビッド系（#FF00FF, #00FF00, #00FFFF等）

**理由:** 目に刺激的すぎ、長時間使用に不向き

**代替:** iOS標準色（Red/Orange/Green/Blue）から選択

### 🚫 パステル系（#FFB3D9, #B3D9FF, #B3FFB3等）

**理由:** 可愛い系アプリと誤認、ビジネス層に不向き

**代替:** iOS標準色で十分（十分に柔らかい）

### 🚫 カスタムグレー（#F5F5F5, #E0E0E0, #9E9E9E等）

**理由:** iOS標準グレーで十分、一貫性が崩れる

**代替:** iOS標準 → `background.secondary` (#F2F2F7) を使用

---

## Usage Patterns（使用パターン）

### パターン1: テーマカラーの基本使用

```typescript
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function Card() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={{ backgroundColor: colors.background.secondary }}>
      <Text style={{ color: colors.text.primary }}>Card Title</Text>
      <Text style={{ color: colors.text.secondary }}>Description</Text>
    </View>
  );
}
```

### パターン2: Semantic Colorsの使用

```typescript
function MessageBanner() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={{ backgroundColor: colors.background.base }}>
      <Text style={{ color: colors.semantic.success }}>✓ 保存完了</Text>
      <Text style={{ color: colors.semantic.error }}>✕ エラーが発生</Text>
      <Text style={{ color: colors.semantic.warning }}>⚠ 注意してください</Text>
    </View>
  );
}
```

### パターン3: カスタムコンポーネント

```typescript
interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
}

export function Button({ title, variant = 'primary', onPress }: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const backgroundColor = variant === 'primary'
    ? colors.primary.blue
    : colors.background.secondary;
  const textColor = variant === 'primary'
    ? colors.text.inverse
    : colors.text.primary;

  return (
    <Pressable
      style={{
        backgroundColor,
        minHeight: 44,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
      }}
      onPress={onPress}
    >
      <Text style={{ color: textColor, fontSize: 17, fontWeight: '600' }}>
        {title}
      </Text>
    </Pressable>
  );
}
```

---

## Customization Guide

### Primary Colorの変更

`constants/theme.ts` の `PRIMARY_COLOR` を変更するだけです：

```typescript
// 現在
export const PRIMARY_COLOR = AppPrimaryColor.blue;

// Orange に変更する場合
export const PRIMARY_COLOR = AppPrimaryColor.orange;
```

### Semantic Colorsの追加・カスタマイズ

既存の semantic colors に加えて、新しい色を追加できます：

```typescript
// 例：Neutral（中立的な情報）を追加
semantic: {
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  neutral: '#5AC8FA',  // 新規追加
}
```

### 背景階層の調整

tertiary の色を変更することで、モーダル・オーバーレイのコントラストを調整できます：

```typescript
// より強い背景が必要な場合
tertiary: '#F2F2F7',  // background.secondary と同じ背景を作る

// より淡い背景が必要な場合（推奨しない）
// 3段階以上の背景は複雑さを増す
```

---

## Detailed Documentation

各トピックの詳細な仕様やベストプラクティスは以下のリファレンスを参照してください：

- **[Color System](references/color.md)** - 配色仕様、NG配色ルール、コントラスト比検証
- **[Typography](references/typography.md)** - San Francisco Font、Dynamic Type、テキストスタイル
- **[Spacing & Layout](references/spacing.md)** - 8pt Grid System、Safe Area、Margins
- **[SF Symbols](references/icons.md)** - アイコンシステム、Symbol Variants
- **[Component Patterns](references/components.md)** - Button、Card、Input等の実装パターン
- **[Accessibility](references/accessibility.md)** - WCAG 2.1 AA、VoiceOver、アクセシビリティ対応
- **[Animation & Haptics](references/animation.md)** - アニメーション、ハプティックフィードバック

---

## Apple HIG Reference

### 公式ドキュメント

- [Color | Apple HIG](https://developer.apple.com/design/human-interface-guidelines/color)
- [Typography | Apple HIG](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Dark Mode | Apple HIG](https://developer.apple.com/design/human-interface-guidelines/dark-mode)

### 重要な原則（要約）

1. **機能優先** - 色は機能を伝えるために使用。装飾は最小限。
2. **コントラスト確保** - WCAG AA基準（4.5:1以上）のコントラスト比を必ず確保。
3. **一貫性** - システム標準色を使用し、カスタム色は最小限に。
4. **Dark Mode対応** - すべての色にDark Mode版を用意。自動切り替え必須。
5. **Liquid Glass（2025）** - 透明感、深度、流動性を活用した洗練されたデザイン。

---

## Template Files

### theme.ts - iOS System Colors完全実装版

`templates/theme.ts` に以下を含む完全なテーマ実装があります：

- Primary Colors（Blue/Green/Orange 3色）
- Background Colors（3段階）
- Text Colors（4段階）
- Semantic Colors（成功/警告/エラー/情報）
- Interactive Elements（区切り線、アイコン）
- Light/Dark Mode 完全対応
- 既存コードとの互換性（legacy properties: tint, icon等）

```bash
cp .claude/skills/expo-design-system/templates/theme.ts constants/theme.ts
```

---

## AI Assistant Instructions

このスキルを活用してUIを実装する際は、以下の手順に従ってください：

### ユーザーがUI実装を依頼した時

1. **SKILL.md確認** - 最新の色ルールを理解
2. **templates/theme.ts 確認** - テーマの実装を把握
3. **Primary Color確認** - ユーザーのアプリがどのprimary colorを使用しているか確認
4. **NG Rules リマインド** - Indigo禁止、グラデーション禁止等を随時リマインド
5. **WCAG AA対応** - コントラスト比（4.5:1以上）を確保するよう指示

### ユーザーが詳細情報を求めた時

- リファレンスドキュメント（references/\*.md）をSKILL.mdから提示
- Apple HIG詳細が必要な場合は WebFetch で最新情報を取得
- コンポーネント実装パターンは references/components.md を参照

### カスタマイズの相談を受けた時

- Semantic Colors、Primary Color、背景階層は調整可能
- ただし NG Rules は絶対（Indigo/グラデーション/ネオン/パステル禁止）
- 変更時は Dark Mode 対応も同時に確認

### よくある質問への対応

**Q: 複数の accent color を使いたい**
A: Primary colorは1色のみ。複数アクセント色は情報設計が崩れます。Semantic Colors（success/warning/error）で対応してください。

**Q: カスタムカラーを追加したい**
A: Semantic Colorsの拡張で対応可能。ただし iOS標準色ベースを推奨。

**Q: アニメーション時のカラー変化**
A: animation.md を参照。Timing（0.3-0.5s）と Easing（ease-out）で自然な遷移を実装。

---

## Version

**v1.0.0** - 初期リリース（2025）

- iOS System Colors 完全実装
- Semantic Colors 対応
- Dark Mode 対応
- Apple HIG 2025 準拠
- WCAG 2.1 AA 対応
