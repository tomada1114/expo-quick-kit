# Gesture Design

Comprehensive guide to gesture-based interactions in mobile apps.

## Standard Gesture Vocabulary

### System Gestures (Do Not Override)

| Gesture | System Action | Platform |
|---------|--------------|----------|
| Swipe from left edge | Back navigation | iOS |
| Swipe from bottom | Home / App switcher | iOS |
| Swipe from top | Notification center | Both |
| Three-finger tap | Undo/Redo | iOS |

### App-Level Gestures

| Gesture | Common Usage | Discoverability |
|---------|-------------|-----------------|
| **Tap** | Select, activate | High |
| **Double tap** | Zoom, like | Medium |
| **Long press** | Context menu | Medium |
| **Swipe horizontal** | Delete, archive, navigate | Low |
| **Swipe vertical** | Scroll, refresh | High |
| **Pinch** | Zoom in/out | Medium |
| **Rotate** | Rotate content | Low |
| **Pan** | Move, reorder | Medium |

---

## Swipe Actions

### iOS Mail-Style Swipe

```typescript
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

function SwipeableListItem({ item, onDelete, onArchive }) {
  const renderRightActions = () => (
    <View style={styles.rightActions}>
      <Pressable style={styles.archiveAction} onPress={() => onArchive(item.id)}>
        <IconSymbol name="archivebox.fill" color="white" />
        <Text style={styles.actionText}>Archive</Text>
      </Pressable>
      <Pressable style={styles.deleteAction} onPress={() => onDelete(item.id)}>
        <IconSymbol name="trash.fill" color="white" />
        <Text style={styles.actionText}>Delete</Text>
      </Pressable>
    </View>
  );

  const renderLeftActions = () => (
    <View style={styles.leftActions}>
      <Pressable style={styles.pinAction}>
        <IconSymbol name="pin.fill" color="white" />
        <Text style={styles.actionText}>Pin</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      overshootRight={false}
    >
      <ListItemContent item={item} />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rightActions: {
    flexDirection: 'row',
  },
  deleteAction: {
    backgroundColor: colors.semantic.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  archiveAction: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
});
```

### Swipe Discovery Hints

```typescript
// Show hint animation on first use
function SwipeHint({ onDismiss }) {
  useEffect(() => {
    const hasSeenHint = await AsyncStorage.getItem('swipe_hint_seen');
    if (!hasSeenHint) {
      // Show animated hint
      Animated.sequence([
        Animated.timing(translateX, { toValue: -50, duration: 300 }),
        Animated.timing(translateX, { toValue: 0, duration: 300 }),
      ]).start();
      await AsyncStorage.setItem('swipe_hint_seen', 'true');
    }
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateX }] }}>
      <Text>Swipe for more options</Text>
    </Animated.View>
  );
}
```

---

## Long Press

### Context Menu

```typescript
import { MenuView } from '@react-native-menu/menu';

function ItemWithContextMenu({ item }) {
  return (
    <MenuView
      title="Item Options"
      onPressAction={({ nativeEvent }) => {
        switch (nativeEvent.event) {
          case 'edit': handleEdit(item); break;
          case 'share': handleShare(item); break;
          case 'delete': handleDelete(item); break;
        }
      }}
      actions={[
        { id: 'edit', title: 'Edit', image: 'pencil' },
        { id: 'share', title: 'Share', image: 'square.and.arrow.up' },
        { id: 'delete', title: 'Delete', attributes: { destructive: true }, image: 'trash' },
      ]}
    >
      <ItemCard item={item} />
    </MenuView>
  );
}
```

### Long Press vs Tap

| Duration | Action Type |
|----------|-------------|
| < 150ms | Tap |
| 150-500ms | Ambiguous (avoid) |
| > 500ms | Long press |

---

## Pull to Refresh

```typescript
import { RefreshControl, ScrollView } from 'react-native';

function RefreshableList() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNewData();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          title="Pull to refresh"
        />
      }
    >
      {/* Content */}
    </ScrollView>
  );
}
```

---

## Drag and Drop / Reorder

```typescript
import DraggableFlatList from 'react-native-draggable-flatlist';

function ReorderableList({ items, onReorder }) {
  const renderItem = ({ item, drag, isActive }) => (
    <Pressable
      onLongPress={drag}
      style={[
        styles.item,
        isActive && styles.itemDragging,
      ]}
    >
      <IconSymbol name="line.3.horizontal" color={colors.text.tertiary} />
      <Text>{item.title}</Text>
    </Pressable>
  );

  return (
    <DraggableFlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      onDragEnd={({ data }) => onReorder(data)}
      onDragBegin={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
    />
  );
}
```

---

## Pinch to Zoom

```typescript
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

function ZoomableImage({ source }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      scale.value = savedScale.value * event.scale;
    },
    onEnd: () => {
      savedScale.value = scale.value;
      // Clamp scale
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      } else if (scale.value > 3) {
        scale.value = withSpring(3);
        savedScale.value = 3;
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <PinchGestureHandler onGestureEvent={pinchHandler}>
      <Animated.Image source={source} style={[styles.image, animatedStyle]} />
    </PinchGestureHandler>
  );
}
```

---

## Gesture Feedback

### Haptic Feedback

```typescript
import * as Haptics from 'expo-haptics';

// Light - Selection, button press
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium - Drag start, toggle
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy - Important action complete
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Notification - Success/Warning/Error
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// Selection - Scrolling through options
Haptics.selectionAsync();
```

### When to Use Haptics

| Action | Haptic Type |
|--------|-------------|
| Button tap | Light impact |
| Toggle switch | Light impact |
| Drag start | Medium impact |
| Drag drop | Medium impact |
| Success | Success notification |
| Error | Error notification |
| Picker scroll | Selection |

---

## Discoverability Best Practices

### Progressive Disclosure

1. **Primary actions** via visible buttons
2. **Secondary actions** via swipe (with hints)
3. **Tertiary actions** via long press menu

### Visual Affordances

```typescript
// Show drag handle for reorderable items
<View style={styles.dragHandle}>
  <IconSymbol name="line.3.horizontal" />
</View>

// Show chevron for swipeable items
<View style={styles.swipeIndicator}>
  <IconSymbol name="chevron.left" size={12} color={colors.text.tertiary} />
</View>
```

### Teach Through Empty States

```typescript
function EmptyInbox() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No messages</Text>
      <Text style={styles.emptyHint}>
        Swipe left on messages to delete or archive
      </Text>
    </View>
  );
}
```

---

## Anti-Patterns

### Avoid

1. **Gesture-only interactions** - Always provide button alternative
2. **Conflicting gestures** - Swipe left for both delete and edit
3. **Hidden essential features** - Core features must be tappable
4. **Precision requirements** - Allow generous touch areas
5. **Overriding system gestures** - Don't hijack edge swipes
6. **No feedback** - Every gesture needs visual/haptic response
