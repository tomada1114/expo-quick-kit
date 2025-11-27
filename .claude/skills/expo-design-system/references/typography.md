# Typography - San Francisco Font準拠

Apple Human Interface Guidelines に基づいた、iOS標準のタイポグラフィシステム。

---

## San Francisco Font（SF Font）

### フォントファミリー

Apple設計のSan Francisco Fontは、iOSおよびmacOS標準のタイポグラフィです。

**プラットフォーム別フォント:**

```typescript
// iOS
fontSize-ui: system-ui

// Android
fontSize-ui: normal

// Web
fontSize-ui: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
```

### Font Variants

San Francisco には、異なるサイズ用に最適化された2つのバリアントがあります：

- **SF Text** - 20pt 未満（小さいテキスト用）
- **SF Display** - 20pt 以上（見出し用）

各バリアントは、字間（トラッキング）と行間（リーディング）が最適化されています。

---

## Typography Scale

Apple HIG準拠の11段階のタイポグラフィスケール：

| Style       | Size | Weight | Line Height | Use Cases                            |
| ----------- | ---- | ------ | ----------- | ------------------------------------ |
| largeTitle  | 34pt | 400    | 41pt        | ページタイトル、大見出し             |
| title1      | 28pt | 400    | 34pt        | セクションタイトル                   |
| title2      | 22pt | 400    | 26pt        | サブセクションタイトル               |
| title3      | 20pt | 400    | 24pt        | グループタイトル                     |
| headline    | 17pt | 600    | 22pt        | 強調テキスト、ボタンラベル           |
| body        | 17pt | 400    | 22pt        | 本文テキスト（標準）                 |
| callout     | 16pt | 400    | 21pt        | 補足、注釈                           |
| subheadline | 15pt | 400    | 20pt        | 副見出し                             |
| caption1    | 13pt | 400    | 16pt        | 説明テキスト、メタ情報               |
| caption2    | 12pt | 400    | 15pt        | 細かい補足情報                       |
| footnote    | 11pt | 400    | 13pt        | 最小テキスト（アクセシビリティ考慮） |

### 最小フォントサイズ

✅ **最小11pt（footnote）** - WCAG AAアクセシビリティ基準を満たす
❌ 11pt未満は使用禁止

---

## Font Weights

Apple標準フォントウェイト：

```typescript
fontWeight: {
  '400': 'normal',      // 標準
  '500': 'medium',      // 中
  '600': 'semibold',    // 半太字（UI要素、ボタン）
  '700': 'bold',        // 太字（見出し）
}
```

**使用方針:**

- **400（Normal）**: 本文、説明テキスト
- **500（Medium）**: 強調テキスト（iOS 13+）
- **600（Semibold）**: ボタンテキスト、強調見出し
- **700（Bold）**: 特に強調する見出し

---

## Implementation

### 基本的な使用方法

```typescript
import { Typography } from '@/constants/typography';

// largeTitle（34pt）
<Text style={Typography.largeTitle}>Page Title</Text>

// body（17pt 標準）
<Text style={Typography.body}>Body text</Text>

// headline（17pt bold）
<Text style={Typography.headline}>Button Label</Text>

// caption1（13pt 補足）
<Text style={Typography.caption1}>Subtitle</Text>
```

### フォントウェイト変更

```typescript
import { Typography, withFontWeight } from '@/constants/typography';

// body を semibold にする
<Text style={withFontWeight(Typography.body, '600')}>
  Bold Body
</Text>
```

### カスタムフック使用

```typescript
import { useTypography, useBodyStyle, useButtonStyle } from '@/hooks/useTypography';

function MyComponent() {
  const typography = useTypography();
  const bodyStyle = useBodyStyle();

  return (
    <>
      <Text style={typography.largeTitle}>Title</Text>
      <Text style={bodyStyle}>Body text</Text>
    </>
  );
}
```

---

## Dynamic Type（アクセシビリティ）

### Dynamic Type対応

React Native では、以下の方法でDynamic Typeをサポート：

```typescript
import { AccessibilityInfo, useWindowDimensions } from 'react-native';

// フォントサイズ計算（簡易版）
const screenWidth = useWindowDimensions().width;
const multiplier = screenWidth > 375 ? 1.1 : 1.0;

<Text style={{
  fontSize: 17 * multiplier,
  maxFontSizeMultiplier: 1.5,  // 最大1.5倍
}}>
  Dynamic Text
</Text>
```

### maxFontSizeMultiplier プロップ

ユーザーがデバイス設定でテキストサイズを変更したとき、フォントの最大倍率を制限：

```typescript
// テキストサイズ変更で最大1.5倍まで
<Text
  style={Typography.body}
  maxFontSizeMultiplier={1.5}
>
  Content
</Text>
```

---

## Dark Mode 対応

タイポグラフィ自体は Light/Dark Mode で変わりません。

**変わるもの:**

- テキスト色（colors.text.primary / colors.text.secondary 等）
- 背景色（colors.background 等）

```typescript
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Typography } from '@/constants/typography';

function MyText() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Text
      style={[
        Typography.body,
        { color: colors.text.primary },  // このみ変わる
      ]}
    >
      Text Content
    </Text>
  );
}
```

---

## Semantic Typography Styles

よく使うスタイル組み合わせ：

### ページタイトル

```typescript
import { PageTitle } from '@/constants/typography';

<Text style={PageTitle}>My App Title</Text>
```

### セクションタイトル

```typescript
import { SectionTitle } from '@/constants/typography';

<Text style={SectionTitle}>Settings</Text>
```

### 本文

```typescript
import { BodyText } from '@/constants/typography';

<Text style={BodyText}>Regular body content</Text>
```

### ボタンテキスト

```typescript
import { ButtonText } from '@/constants/typography';

<Text style={ButtonText}>Press Me</Text>
```

### ラベル・キャプション

```typescript
import { Label } from '@/constants/typography';

<Text style={Label}>Subtitle</Text>
```

### エラーメッセージ

```typescript
import { ErrorText } from '@/constants/typography';
import { useSemanticColor } from '@/hooks/useSemanticColor';

const errorColor = useSemanticColor('error');

<Text style={[ErrorText, { color: errorColor }]}>
  Error occurred
</Text>
```

---

## Best Practices

1. **見出しは largeTitle/title1/title2 から選択**
   - ページ層構造を表現

2. **本文は 17pt（body）を基本**
   - 読みやすさが最適化

3. **補足情報は caption1（13pt）以上**
   - 11pt未満は使用禁止（アクセシビリティ）

4. **ボタンテキストは semibold（600）**
   - ユーザーの操作対象を明確に

5. **コントラスト比を確保**
   - 色とサイズの組み合わせでWCAG AA対応

6. **Dynamic Type対応**
   - maxFontSizeMultiplier で最大倍率制限

---

## Related Topics

- [Color System](./color.md) - テキスト色の選択
- [Spacing](./spacing.md) - テキスト周辺のスペース
- [Accessibility](./accessibility.md) - 最小フォントサイズ（11pt）
