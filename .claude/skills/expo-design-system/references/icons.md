# SF Symbols - Icon System

Apple SF Symbols准拠のアイコンシステム。

---

## SF Symbols Overview

**SF Symbols** は Apple設計の統一アイコンセット。6,900以上の開発者向けシンボルが提供されています。

### 特徴

- **Unified Design** - iOS, macOS, watchOS, tvOS で一貫
- **Render Modes** - Monochrome、Hierarchical、Palette、Multicolor
- **Variants** - Outline、Fill
- **Scales** - Small、Medium、Large

---

## Expo での使用

### expo-symbols（iOS）

iOS では `expo-symbols` パッケージで SF Symbols を使用：

```typescript
import { SFSymbol } from 'expo-symbols';

<SFSymbol
  name="heart.fill"
  size={24}
  color="#FF3B30"
  weight="semibold"
/>
```

### @expo/vector-icons（クロスプラットフォーム）

Android/Web では Material Icons または FontAwesome を使用：

```typescript
import { MaterialIcons } from '@expo/vector-icons';

<MaterialIcons
  name="favorite"
  size={24}
  color="#FF3B30"
/>
```

---

## Symbol Variants

### Outline（推奨）

```
settings      // 開いた外枠アイコン
```

**用途:**

- 通常状態
- 非選択状態
- 標準的なアイコン表示

### Fill（塗りつぶし）

```
settings.fill  // 塗りつぶされたアイコン
```

**用途:**

- 選択状態
- アクティブ状態
- 強調表示

---

## Symbol Weights（太さ）

```typescript
weight: 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';
```

| Weight   | Use Cases        |
| -------- | ---------------- |
| thin     | 装飾的なアイコン |
| light    | 補足的なアイコン |
| regular  | 標準（推奨）     |
| semibold | 強調アイコン     |
| bold     | より強調         |
| heavy    | 特に強調         |

---

## Symbol Scales

```typescript
scale: 'small' | 'medium' | 'large';
```

| Scale  | Size Range | Use Cases                          |
| ------ | ---------- | ---------------------------------- |
| small  | 16-18pt    | ツールバー、タブバー               |
| medium | 20-24pt    | リスト項目、ナビゲーション（標準） |
| large  | 28-32pt    | ヘッダーアイコン、FAB              |

---

## Common Icons

### Navigation

```
house
house.fill
settings
settings.fill
search
```

### Media

```
play
play.fill
pause
stop
camera
camera.fill
photo
photo.fill
```

### Interaction

```
heart
heart.fill
star
star.fill
bookmark
bookmark.fill
share
```

### Status

```
checkmark
checkmark.circle
xmark
xmark.circle
exclamationmark.triangle
info.circle
```

### Input

```
plus
minus
pencil
trash
```

---

## Best Practices

1. **Fill/Outline を使い分け**
   - Outline：通常状態
   - Fill：選択/アクティブ状態

2. **サイズは一貫性を保つ**
   - タブバー：18pt
   - リスト：24pt
   - ヘッダー：32pt

3. **色は semantic color を使用**
   - Primary：primary color
   - Success：success
   - Error：error
   - Disabled：interactive.fill

4. **クロスプラットフォーム対応**
   - iOS：expo-symbols
   - Android/Web：@expo/vector-icons（Material Icons）

5. **アイコン + ラベルを組み合わせ**
   - 視認性と説明性の両立

---

## Implementation Example

```typescript
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

function NavigationTab({ active, name }: { active: boolean; name: string }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const iconColor = active ? colors.primary : colors.interactive.fill;

  const iconName = active ? `${name}-filled` : name;

  return (
    <MaterialIcons
      name={iconName}
      size={24}
      color={iconColor}
    />
  );
}
```

---

## Related Topics

- [Color](./color.md) - アイコン色の選択
- [Accessibility](./accessibility.md) - アイコンのアクセシビリティラベル
