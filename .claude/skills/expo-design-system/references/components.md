# Component Patterns

デザインシステムに含まれるコンポーネントの実装パターン。

---

## Button Component

Apple HIG準拠のボタンコンポーネント。

### Variants

```typescript
<Button variant="primary" title="Save" onPress={onSave} />
<Button variant="secondary" title="Cancel" onPress={onCancel} />
<Button variant="ghost" title="Learn more" onPress={onLearn} />
<Button variant="destructive" title="Delete" onPress={onDelete} />
```

| Variant     | Background    | Text Color       | Use Cases                   |
| ----------- | ------------- | ---------------- | --------------------------- |
| primary     | Primary Color | Inverse（white） | Main action、Save、Submit   |
| secondary   | Secondary     | Primary          | Alternate action            |
| ghost       | Transparent   | Primary          | Tertiary action、Links      |
| destructive | Error         | Inverse（white） | Delete、Confirm destructive |

### Sizes

```typescript
<Button size="sm" title="Small" onPress={onPress} />
<Button size="md" title="Medium" onPress={onPress} />  // Default
<Button size="lg" title="Large" onPress={onPress} />
```

| Size | Height | Padding | Use Cases                        |
| ---- | ------ | ------- | -------------------------------- |
| sm   | 36pt   | 8pt     | Inline buttons、Confirmations    |
| md   | 44pt   | 16pt    | Primary buttons（標準）          |
| lg   | 48pt   | 24pt    | Full-width buttons、Hero buttons |

### States

```typescript
<Button disabled title="Disabled" onPress={onPress} />
<Button loading title="Saving..." onPress={onPress} />
<Button loading loadingText="Saving..." onPress={onPress} />
```

---

## Card Component

コンテンツをまとめるカードコンポーネント。

### Variants

```typescript
<Card variant="flat">
  <Text>Flat card - background.secondary</Text>
</Card>

<Card variant="elevated">
  <Text>Elevated card - shadow</Text>
</Card>
```

### Customization

```typescript
<Card
  variant="elevated"
  padding={24}
  borderRadius={12}
>
  <Text>Custom padding & radius</Text>
</Card>
```

---

## Input Component

テキスト入力フィールド。

### Variants

```typescript
<Input variant="default" placeholder="Default input" />
<Input variant="filled" placeholder="Filled input" />
```

| Variant | Style           | Use Cases        |
| ------- | --------------- | ---------------- |
| default | Border only     | 標準入力（推奨） |
| filled  | Background fill | Compact layouts  |

### Error State

```typescript
<Input
  error
  placeholder="Invalid input"
  value={value}
  onChangeText={setValue}
/>
```

Error時：境界線が`semantic.error`に変わります。

---

## Spacer Component

要素間のスペーシング用コンポーネント。

```typescript
import { Spacer } from '@/components/Spacer';

<View>
  <Text>Content 1</Text>
  <Spacer size="md" />  // 16pt vertical space
  <Text>Content 2</Text>
  <Spacer size="lg" direction="horizontal" />  // 24pt horizontal
</View>
```

### Sizes

```
xs:  4pt
sm:  8pt
md:  16pt  (Default)
lg:  24pt
xl:  32pt
xxl: 48pt
```

---

## Divider Component

要素を分ける区切り線。

```typescript
import { Divider } from '@/components/Divider';

<Divider />  // Horizontal divider（デフォルト）
<Divider direction="vertical" />  // Vertical divider
<Divider margin={16} />  // Divider with margin
```

### Properties

```typescript
<Divider
  direction="vertical"
  color={colors.semantic.error}
  thickness={2}
  margin={8}
/>
```

---

## Composition Patterns

### Card with Title + Description

```typescript
import { Card } from '@/components/Card';
import { Typography } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

function ItemCard({ title, description }: { title: string; description: string }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Card variant="elevated">
      <Text style={Typography.headline}>
        {title}
      </Text>
      <Text
        style={[Typography.body, { color: colors.text.secondary }]}
      >
        {description}
      </Text>
    </Card>
  );
}
```

### Button Group

```typescript
function ConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <View style={{ gap: 8 }}>
      <Button
        variant="primary"
        title="Confirm"
        onPress={onConfirm}
      />
      <Button
        variant="secondary"
        title="Cancel"
        onPress={onCancel}
      />
    </View>
  );
}
```

### List Item

```typescript
import { Divider } from '@/components/Divider';

function ListItem({ title, subtitle }: { title: string; subtitle: string }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View>
      <View style={{ padding: 16 }}>
        <Text style={Typography.body}>{title}</Text>
        <Text style={[Typography.caption1, { color: colors.text.secondary }]}>
          {subtitle}
        </Text>
      </View>
      <Divider />
    </View>
  );
}
```

---

## Best Practices

1. **Button用途を明確に**
   - Primary：主要アクション
   - Secondary：代替アクション
   - Ghost：テーシャリアクション
   - Destructive：削除・危険なアクション

2. **タッチターゲットは最小44pt**
   - Button最小高さ：44pt
   - タップ可能領域：44pt x 44pt

3. **一貫したスペーシング**
   - Spacing定数を常に使用
   - 8ptの倍数を守る

4. **Dark Mode対応を確認**
   - colors.primary、colors.semantic 等が自動で切り替わる
   - テキスト色も colors.text から選択

5. **アクセシビリティ**
   - すべてのインタラクティブ要素に最小44pt
   - コントラスト比を確保
   - accessibilityLabel を設定

---

## Related Topics

- [Typography](./typography.md) - コンポーネント内テキストスタイル
- [Spacing](./spacing.md) - パディング・マージン
- [Accessibility](./accessibility.md) - アクセシビリティラベル・コントラスト
