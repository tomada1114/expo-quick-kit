# Navigation Patterns

Detailed navigation patterns for mobile apps.

## Navigation Types

### Tab Bar (Bottom Navigation)

**When to use:** Primary app sections (3-5 items)

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol name="house.fill" color={color} />,
        }}
      />
      {/* 3-5 tabs total */}
    </Tabs>
  );
}
```

**Best practices:**
- 3-5 items maximum
- Icons with labels (not icons alone)
- Highlight current location
- Keep order consistent

### Stack Navigation

**When to use:** Hierarchical content, detail views

```typescript
// Automatic back button with expo-router
<Stack>
  <Stack.Screen name="index" options={{ title: 'List' }} />
  <Stack.Screen
    name="[id]"
    options={{
      title: 'Detail',
      headerBackTitle: 'Back',
    }}
  />
</Stack>
```

**Best practices:**
- Always show back button
- Use meaningful back button labels
- Consider swipe-back gesture (iOS default)
- Save scroll position when returning

### Modal Navigation

**When to use:** Focused tasks, confirmations, selections

```typescript
<Stack.Screen
  name="modal"
  options={{
    presentation: 'modal',
    title: 'Select Option',
    headerLeft: () => <CloseButton />,
    headerRight: () => <DoneButton />,
  }}
/>
```

**Modal types:**
- **Full screen modal** - Complex forms, creation flows
- **Sheet modal** - Quick selections, confirmations
- **Alert** - Critical confirmations, errors

### Drawer Navigation

**When to use:** Secondary navigation, settings, less frequent actions

```typescript
import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
  return (
    <Drawer>
      <Drawer.Screen name="settings" options={{ title: 'Settings' }} />
      <Drawer.Screen name="help" options={{ title: 'Help' }} />
      <Drawer.Screen name="about" options={{ title: 'About' }} />
    </Drawer>
  );
}
```

**Best practices:**
- Use for 6+ navigation items
- Group related items
- Show user profile at top (if applicable)
- Hamburger menu in header

---

## Navigation Hierarchy

### Information Architecture

```
App
├── Tab 1 (Home)
│   ├── Featured
│   └── Categories
│       └── Category Detail
│           └── Item Detail
├── Tab 2 (Search)
│   └── Search Results
│       └── Item Detail
├── Tab 3 (Profile)
│   ├── Settings (→ Stack or Drawer)
│   └── Account
└── Modal (Create/Edit flows)
```

### Depth Guidelines

| Depth | Example | Recommendation |
|-------|---------|----------------|
| 1 | Tab selection | Primary sections |
| 2 | List view | Content browsing |
| 3 | Detail view | Maximum recommended |
| 4+ | Nested detail | Consider flattening |

---

## State Persistence

### Save Navigation State

```typescript
// Save scroll position
const scrollOffset = useRef(0);

<FlatList
  onScroll={(e) => {
    scrollOffset.current = e.nativeEvent.contentOffset.y;
  }}
  // Restore on focus
  onLayout={() => {
    flatListRef.current?.scrollToOffset({
      offset: scrollOffset.current,
      animated: false,
    });
  }}
/>
```

### Preserve Form Data

```typescript
// Use Zustand for form persistence
const useFormStore = create(
  persist(
    (set) => ({
      formData: {},
      setFormData: (data) => set({ formData: data }),
      clearFormData: () => set({ formData: {} }),
    }),
    { name: 'form-storage' }
  )
);
```

---

## Deep Linking

### URL Structure

```typescript
// app.json
{
  "expo": {
    "scheme": "myapp",
    "experiments": {
      "typedRoutes": true
    }
  }
}

// Usage
// myapp://item/123 → app/item/[id].tsx
// myapp://settings → app/settings.tsx
```

### Universal Links

```typescript
// Handle incoming links
import { useURL } from 'expo-linking';

function App() {
  const url = useURL();

  useEffect(() => {
    if (url) {
      // Parse and navigate
      const { path, queryParams } = Linking.parse(url);
      router.push(path);
    }
  }, [url]);
}
```

---

## Transition Animations

### Standard Transitions

| Navigation Type | Animation |
|----------------|-----------|
| Stack push | Slide from right (iOS) / Fade (Android) |
| Stack pop | Slide to right (iOS) / Fade (Android) |
| Modal present | Slide from bottom |
| Modal dismiss | Slide to bottom |
| Tab switch | Cross-fade or none |

### Custom Transitions

```typescript
import { TransitionPresets } from '@react-navigation/stack';

<Stack.Screen
  name="modal"
  options={{
    ...TransitionPresets.ModalSlideFromBottomIOS,
    gestureEnabled: true,
  }}
/>
```

---

## Anti-Patterns

### Avoid

1. **Hidden navigation** - All primary nav should be visible
2. **Inconsistent placement** - Back button always in same spot
3. **Dead ends** - Always provide escape route
4. **Forced sequences** - Let users skip when possible
5. **Over-nesting** - Flatten deep hierarchies
6. **Gestural-only navigation** - Always provide button alternatives
