# Accessibility - WCAG 2.1 AA

Web Content Accessibility Guidelines（WCAG）2.1 AA準拠のアクセシビリティガイド。

---

## WCAG 2.1 AA 基準

### 4つの基本原則（POUR）

1. **Perceivable（知覚可能）** - ユーザーが情報を認識できる
2. **Operable（操作可能）** - ユーザーが操作できる
3. **Understandable（理解可能）** - ユーザーが理解できる
4. **Robust（堅牢）** - 様々なデバイスで機能する

---

## Contrast Ratio（コントラスト比）

### 要件

| Text Type | Minimum Ratio |
|-----------|--------------|
| Normal text（< 18pt） | 4.5:1 |
| Large text（≥ 18pt） | 3:1 |
| UI components（borders, icons） | 3:1 |

### 検証方法

カラーシステムはすべてWCAG AA基準を満たしています。

```typescript
// テキスト色の組み合わせ
colors.text.primary (#000000) on colors.background.base (#FFFFFF)
→ Contrast Ratio: 21.00:1 ✅ PASS

colors.text.tertiary (#8E8E93) on colors.background.base (#FFFFFF)
→ Contrast Ratio: 4.54:1 ✅ PASS
```

### 実装時の注意

```typescript
// ✅ Good: 十分なコントラスト
<Text style={{ color: colors.text.primary }}>
  Important text
</Text>

// ❌ Bad: コントラスト不足
<Text style={{ color: colors.semantic.error }}>
  Error on white background  // コントラスト不足の可能性
</Text>
```

**Semantic Color（Error）の場合：**

```typescript
// ✅ Good: アイコン + テキスト
<View style={{ flexDirection: 'row' }}>
  <Icon color={colors.semantic.error} name="alert" />
  <Text style={{ color: colors.text.primary }}>Error message</Text>
</View>

// ✅ Good: 背景色 + 逆色テキスト
<View style={{ backgroundColor: colors.semantic.error }}>
  <Text style={{ color: colors.text.inverse }}>Error message</Text>
</View>
```

---

## Font Size & Readability

### 最小フォントサイズ

✅ **最小 11pt（footnote）**

```typescript
// OK
<Text style={{ fontSize: 11 }}>Footnote text</Text>

// NG
<Text style={{ fontSize: 10 }}>Too small</Text>
```

### Dynamic Type 対応

```typescript
<Text
  style={Typography.body}
  maxFontSizeMultiplier={1.5}
>
  User-scalable text
</Text>
```

ユーザーがデバイス設定でテキストサイズを変更したとき、最大1.5倍まで拡大。

---

## Touch Targets

### 最小タッチサイズ

✅ **最小 44pt x 44pt**

```typescript
import { Spacing } from '@/constants/spacing';

<Pressable
  style={{
    minWidth: Spacing.touchTargetMin,     // 44pt
    minHeight: Spacing.touchTargetMin,    // 44pt
  }}
>
  <Icon size={24} />
</Pressable>
```

### 実装チェックリスト

- [ ] ボタン：最小44pt x 44pt
- [ ] リスト項目：最小44pt高さ
- [ ] タップ可能アイコン：最小44pt x 44pt
- [ ] 隣同士の要素：最小8pt間隔

---

## VoiceOver 対応

### accessibilityLabel

すべてのインタラクティブ要素にラベルを設定：

```typescript
<Pressable
  accessibilityLabel="Save button"
  onPress={onSave}
>
  <Text>Save</Text>
</Pressable>
```

### accessibilityHint

ユーザーへの追加情報を提供：

```typescript
<Pressable
  accessibilityLabel="Delete item"
  accessibilityHint="This action cannot be undone"
  onPress={onDelete}
>
  <Icon name="trash" />
</Pressable>
```

### accessibilityRole

要素の役割を明示：

```typescript
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Send message"
>
  <Text>Send</Text>
</Pressable>

<Text
  accessibilityRole="header"
  style={Typography.largeTitle}
>
  Page Title
</Text>
```

### accessibilityState

要素の状態を伝える：

```typescript
<Pressable
  accessibilityRole="checkbox"
  accessibilityState={{ checked: isChecked }}
  onPress={toggleCheck}
>
  {/* Content */}
</Pressable>
```

---

## Color Alone は NG

**色だけで情報を伝えない：**

```typescript
// ❌ Bad: 色のみで状態を表示
<View style={{
  backgroundColor: isValid ? colors.semantic.success : colors.semantic.error,
}}>
  {/* No text indicator */}
</View>

// ✅ Good: 色 + テキスト/アイコン
<View style={{
  flexDirection: 'row',
  alignItems: 'center',
}}>
  <Icon
    color={isValid ? colors.semantic.success : colors.semantic.error}
    name={isValid ? 'checkmark' : 'xmark'}
  />
  <Text style={{ color: colors.text.primary }}>
    {isValid ? 'Valid' : 'Invalid'}
  </Text>
</View>
```

---

## Focus Management

### Keyboard Navigation

```typescript
<TextInput
  accessibilityLabel="Email input"
  editable
/>

<Pressable
  accessibilityRole="button"
  accessibilityLabel="Submit button"
  onPress={onSubmit}
/>
```

### Focus State Indicator

```typescript
const [focused, setFocused] = useState(false);

<TextInput
  onFocus={() => setFocused(true)}
  onBlur={() => setFocused(false)}
  style={{
    borderColor: focused ? colors.primary : colors.interactive.separator,
    borderWidth: 2,
  }}
/>
```

---

## Testing Accessibility

### iOS VoiceOver テスト

```
Settings → Accessibility → VoiceOver
→ VoiceOver を有効にして UI をテスト
```

### React Native Accessibility Inspector

```bash
# Expo CLI で起動
expo start
# Web プレビューで、ブラウザの DevTools → Accessibility を使用
```

### アクセシビリティチェックリスト

- [ ] すべてのボタンに accessibilityLabel
- [ ] テキスト最小11pt
- [ ] コントラスト比 4.5:1以上
- [ ] タッチ対象最小44pt x 44pt
- [ ] 色のみで情報を伝えていない
- [ ] VoiceOver で操作可能
- [ ] Dynamic Type で 1.5倍まで対応
- [ ] キーボードナビゲーション対応

---

## Best Practices

1. **常にコントラスト比を確認**
   - カラーシステムはWCAG AA対応
   - Semantic Color 単体使用時は特に注意

2. **最小フォントサイズは11pt**
   - caption2 (12pt) からが推奨

3. **すべてのインタラクティブ要素に accessibilityLabel**
   - ボタン、リンク、フォーム入力

4. **タッチターゲット最小44pt**
   - ユーザーが正確にタップできる

5. **VoiceOver でテスト**
   - iOS標準のスクリーンリーダー
   - 実際のユーザー体験を確認

6. **Dynamic Type 対応**
   - maxFontSizeMultiplier で倍率制限
   - ユーザーのテキスト設定を尊重

---

## Related Topics

- [Color](./color.md) - コントラスト比、Semantic Color
- [Typography](./typography.md) - フォントサイズ最小値
- [Spacing](./spacing.md) - タッチターゲット最小44pt
