# Spacing & Layout - 8pt Grid System

Apple iOS標準のレイアウト・スペーシングシステム。

---

## 8pt Grid System

iOS アプリケーションは **8pt Grid System** に基づいています。

### Grid基盤の考え方

すべてのスペーシングを8ptの倍数で定義することで：

- 視覚的な一貫性
- レイアウト計算の簡潔さ
- プロトタイピングの効率化

**Grid値:**

```typescript
xs:   4pt   (1/2 grid)
sm:   8pt   (1 grid)
md:   16pt  (2 grid)
lg:   24pt  (3 grid)
xl:   32pt  (4 grid)
xxl:  48pt  (6 grid)
```

---

## Spacing Scale

### コンテナ・コンポーネント Padding

```typescript
// 標準的なコンテナパディング
containerPadding: 16pt

// カード内パディング
cardPadding: 16pt

// ページ全体パディング
pagePadding: 16pt
```

### コンポーネント間 Gap

```typescript
// 要素間のギャップ（リスト、フレックスレイアウト）
componentGap: 16pt

// 密集したレイアウト
compactGap: 8pt
```

### セクション間 Margin

```typescript
// セクション間のマージン
sectionMargin: 32pt
```

### リスト項目

```typescript
// リスト項目高さ（タッチターゲット最小値）
rowHeight: 44pt

// リスト項目マージン
listItemMargin: 8pt
```

---

## Minimum Touch Target

### タッチ可能な最小サイズ

✅ **最小 44pt x 44pt** - WCAG AAアクセシビリティ基準

```typescript
touchTargetMin: 44pt
```

### 実装例

```typescript
import { Spacing } from '@/constants/spacing';

<Pressable
  style={{
    minWidth: Spacing.touchTargetMin,
    minHeight: Spacing.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
  }}
>
  <Icon size={24} />
</Pressable>
```

---

## Safe Area（Notch対応）

### Safe Area Insets

```typescript
// Status bar高さ（常時表示）
topDefault: 20pt

// Dynamic Island（iPhone 14+）
topDynamicIsland: 54pt

// Home Indicator（下部）
bottomDefault: 21pt

// Tab Bar高さ
tabBarHeight: 49pt
```

### Safe Area の使用

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function MyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        flex: 1,
      }}
    >
      {/* Content */}
    </View>
  );
}
```

**または expo-navigation 使用:**

```typescript
import { useSafeAreaInsets } from '@react-navigation/native';

function MyScreen() {
  const insets = useSafeAreaInsets();
  // Same as above
}
```

---

## Border Radius

Apple標準の角丸（Border Radius）：

```typescript
sm:   4pt   (軽い丸み)
md:   8pt   (標準的な丸み)
lg:   12pt  (より丸い)
xl:   16pt  (かなり丸い)
full: 999pt (サークル)
```

### 使い分け

| Radius       | Use Cases                      | Examples                          |
| ------------ | ------------------------------ | --------------------------------- |
| sm (4pt)     | 軽い丸み                       | テキスト入力フィールド            |
| md (8pt)     | 標準（推奨）                   | ボタン、カード、ポップオーバー    |
| lg (12pt)    | より丸い感じ                   | モーダル、オーバーレイ            |
| xl (16pt)    | かなり丸い                     | 大きなカード、アラート            |
| full (999pt) | サークル（プロフィール画像等） | アバター、サムネイル（48x48以上） |

### 実装例

```typescript
import { BorderRadius } from '@/constants/spacing';

// ボタン
<Pressable style={{ borderRadius: BorderRadius.md }} />

// カード
<View style={{ borderRadius: BorderRadius.md }} />

// アバター（プロフィール画像）
<Image
  style={{
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
  }}
/>
```

---

## Z-Index Layers

レイヤー管理（重なり順序）：

```typescript
base: 0; // 通常のコンテンツ
floating: 10; // FAB（フローティングアクションボタン）
dropdown: 115; // ドロップダウンメニュー
popover: 110; // ポップオーバー
modal: 100; // モーダル背景
modalContent: 101; // モーダルコンテンツ
toast: 120; // トースト通知
```

### 使用例

```typescript
import { ZIndex } from '@/constants/spacing';

// Floating Action Button
<Pressable style={{ zIndex: ZIndex.floating }} />

// Modal Background
<View style={{ zIndex: ZIndex.modal }} />

// Toast Notification
<View style={{ zIndex: ZIndex.toast }} />
```

---

## Shadows

影の定義（Elevation）：

| Shadow | shadowRadius | Use Cases              |
| ------ | ------------ | ---------------------- |
| none   | 0            | 影なし                 |
| sm     | 2pt          | 軽い影（subtle）       |
| md     | 4pt          | 標準的な影             |
| lg     | 8pt          | より目立つ影           |
| xl     | 12pt         | モーダル・オーバーレイ |

### 実装例

```typescript
import { Shadows } from '@/constants/spacing';

// カード with shadow
<View style={[
  styles.card,
  Shadows.md,  // 4pt影
]}>
  {/* Content */}
</View>

// モーダル背景
<View style={[
  styles.modal,
  Shadows.xl,  // 12pt影
]}>
  {/* Content */}
</View>
```

---

## Common Layout Patterns

### ページレイアウト

```typescript
import { Spacing, LayoutMargins } from '@/constants/spacing';

<ScrollView
  contentContainerStyle={{
    paddingHorizontal: LayoutMargins.pageHorizontal,   // 16pt
    paddingVertical: LayoutMargins.pageVertical,       // 16pt
  }}
>
  {/* Content */}
</ScrollView>
```

### リストレイアウト

```typescript
import { Spacing } from '@/constants/spacing';

<FlatList
  data={items}
  renderItem={({ item }) => (
    <View style={{ marginBottom: Spacing.sm }}>  // 8pt
      {/* Item */}
    </View>
  )}
  ItemSeparatorComponent={() => (
    <View style={{ height: Spacing.xs }} />  // 4pt
  )}
/>
```

### グリッドレイアウト

```typescript
import { Spacing } from '@/constants/spacing';

<View style={{
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: Spacing.md,  // 16pt
}}>
  {/* Grid items */}
</View>
```

### Spacer コンポーネント

```typescript
import { Spacer } from '@/components/Spacer';

<View>
  <Text>Content 1</Text>
  <Spacer size="md" />
  <Text>Content 2</Text>
  <Spacer size="lg" direction="vertical" />
  <Text>Content 3</Text>
</View>
```

---

## Best Practices

1. **常に8pt Grid に従う**
   - スペーシング値は 4, 8, 16, 24, 32, 48pt のいずれか

2. **タッチターゲットは最小44pt**
   - ボタン、リスト項目、タップ可能領域

3. **Safe Area を尊重**
   - Status Bar / Home Indicator / Notch 対応

4. **適切な Border Radius を選択**
   - 基本は md (8pt)、カードは lg (12pt)

5. **影（Shadow）は控え目に**
   - カードやポップオーバーで軽い影（sm/md）を使用
   - 多用すると視覚的ノイズになる

6. **セマンティックな命名**
   - Spacing.md ではなく、用途に応じて semanticAlias を使用

---

## Related Topics

- [Typography](./typography.md) - テキストのマージン・パディング
- [Color](./color.md) - 背景色のコントラスト
- [Accessibility](./accessibility.md) - 44pt最小タッチターゲット
