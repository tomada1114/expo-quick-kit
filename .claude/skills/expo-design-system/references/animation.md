# Animation & Haptics

iOS標準のアニメーションとハプティックフィードバック。

---

## Animation Principles

Apple HIG準拠のアニメーション原則：

1. **Purposeful** - 目的がある（ユーザーの操作をサポート）
2. **Responsive** - 即座に反応（ユーザーのアクションに追従）
3. **Appropriate** - 適切な速度（違和感のない自然さ）

---

## Timing & Easing

### Duration（継続時間）

```typescript
// 標準的なアニメーション期間
fast:   300ms  // Quick interactions（タップフィードバック）
standard: 350ms  // Regular transitions（画面遷移）
slow:   500ms  // Slow transitions（モーダルアニメーション）
```

### Easing（加速度）

```typescript
// iOS標準の easing 関数
easeOut:   // 始まりは速く、終わりは遅く（UI要素の出現）
easeInOut: // 始まり遅く、中盤速く、終わり遅く（スクロール）
```

### 実装例

```typescript
import { Animated, Easing } from 'react-native';

const opacity = new Animated.Value(0);

Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  easing: Easing.out(Easing.cubic),
  useNativeDriver: true,
}).start();

<Animated.View style={{ opacity }}>
  {/* Content */}
</Animated.View>
```

---

## Transitions

### Push Transition（画面遷移）

```typescript
// React Navigation default
const screenOptions = {
  transitionSpec: {
    open: {
      animation: 'timing',
      config: { duration: 350 },
    },
  },
};
```

### Cross Fade（クロスフェード）

```typescript
import { Animated } from 'react-native';

const fadeOutIn = () => {
  const opacity = new Animated.Value(1);

  Animated.sequence([
    Animated.timing(opacity, {
      toValue: 0,
      duration: 150,
    }),
    Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
    }),
  ]).start();

  return opacity;
};
```

---

## Haptic Feedback

### Haptic Types

```typescript
import { Haptics } from 'expo';

// Light impact（軽いタップ）
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium impact（中程度）
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy impact（重い）
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Selection feedback（選択）
Haptics.selectionAsync();

// Notification success（成功）
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Notification warning（警告）
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

// Notification error（エラー）
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

### 使用タイミング

| Feedback  | Use Cases                        |
| --------- | -------------------------------- |
| Light     | ボタンタップ、軽い操作           |
| Medium    | リスト項目選択、フォーム入力     |
| Heavy     | 削除確認、重要なアクション       |
| Selection | ピッカー選択、スクロール位置変更 |
| Success   | 保存完了、アップロード完了       |
| Warning   | 警告メッセージ、限界値到達       |
| Error     | エラー発生、失敗した操作         |

### 実装例

```typescript
import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

function SaveButton({ onSave }: { onSave: () => void }) {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave();
  };

  return (
    <Pressable onPress={handlePress}>
      <Text>Save</Text>
    </Pressable>
  );
}
```

---

## Color Animations

### Color Transition（色のアニメーション）

```typescript
import { Animated } from 'react-native';

const animateColor = (fromColor: string, toColor: string) => {
  // Note: React Native は色アニメーションを直接サポートしないため、
  // 複数の値をアニメートして中間色を計算するか、
  // react-native-reanimated 使用を推奨
};
```

### Reanimated での実装（推奨）

```typescript
import Animated, {
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

function ColorButton() {
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        ['#007AFF', '#FF3B30']
      ),
    };
  });

  const handlePress = () => {
    progress.value = withTiming(progress.value === 0 ? 1 : 0, {
      duration: 300,
    });
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={handlePress}>
        <Text>Tap to animate</Text>
      </Pressable>
    </Animated.View>
  );
}
```

---

## Common Animation Patterns

### Button Press Animation

```typescript
import { Pressable, Animated } from 'react-native';

function AnimatedButton({ onPress, children }: { onPress: () => void; children: ReactNode }) {
  const scaleValue = new Animated.Value(1);

  const onPressIn = () => {
    Animated.timing(scaleValue, {
      toValue: 0.95,
      duration: 100,
    }).start();
  };

  const onPressOut = () => {
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 100,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
```

### Fade In/Out

```typescript
const FadeIn = Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,
});

const FadeOut = Animated.timing(opacity, {
  toValue: 0,
  duration: 300,
  useNativeDriver: true,
});
```

### Slide Animation

```typescript
const position = new Animated.Value(100);  // Start off-screen

Animated.timing(position, {
  toValue: 0,      // Slide to top
  duration: 300,
  useNativeDriver: true,
}).start();

<Animated.View style={{ transform: [{ translateY: position }] }}>
  {/* Content */}
</Animated.View>
```

---

## Best Practices

1. **アニメーション時間を守る**
   - Fast（300ms）：軽いインタラクション
   - Standard（350ms）：画面遷移
   - Slow（500ms）：複雑な遷移

2. **useNativeDriver: true を使う**
   - パフォーマンス改善
   - JavaScript スレッドを圧迫しない

3. **ハプティックフィードバックを活用**
   - タップ：Light
   - 成功：Success
   - エラー：Error

4. **アニメーションは目的を持たせる**
   - 装飾目的のみはNG
   - ユーザー操作への応答として機能

5. **複雑なアニメーションは react-native-reanimated を使用**
   - 色アニメーション
   - 複数同時アニメーション
   - gesture-driven animation

---

## Related Topics

- [Color](./color.md) - Color transition
- [Spacing](./spacing.md) - Transform animations
- [Accessibility](./accessibility.md) - Motion sensitivity （OS設定の尊重）
