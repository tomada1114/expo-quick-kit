---
name: mobile-ux-design
description: Mobile UX design principles for intuitive, user-centered app experiences. Use PROACTIVELY when designing user flows, navigation patterns, interaction design, onboarding, form design, error handling, loading states, or optimizing for one-handed use. Examples: <example>Context: User asks about user flow user: 'How should I structure the checkout flow?' assistant: 'I will use mobile-ux-design skill' <commentary>Triggered by user flow design request</commentary></example>
---

# Mobile UX Design Principles

A comprehensive guide to creating intuitive, user-centered mobile app experiences. Focuses on user behavior, interaction patterns, and cognitive principles.

> **Note:** For visual design (colors, typography, spacing), use the `expo-design-system` skill instead.

---

## When to Use This Skill

Use this skill when:

- Designing user flows and navigation structures
- Implementing interaction patterns (gestures, feedback)
- Optimizing for one-handed/thumb-zone operation
- Designing onboarding experiences
- Creating forms and input flows
- Implementing loading states and error handling
- Reducing cognitive load in complex features
- Improving user retention through better UX

---

## Core UX Principles

### 9 Foundational Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Clarity** | Users understand purpose and next action instantly |
| 2 | **Consistency** | Unified patterns reduce learning curve |
| 3 | **Efficiency** | Minimum steps to achieve goals |
| 4 | **Feedback** | Every action gets appropriate response |
| 5 | **Flexibility** | Multiple ways to accomplish tasks |
| 6 | **Visibility** | Important elements are discoverable |
| 7 | **Predictability** | UI behaves as users expect |
| 8 | **Error Prevention** | Design prevents mistakes before they happen |
| 9 | **Accessibility** | Usable by everyone regardless of ability |

---

## One Screen, One Action

**The most critical mobile UX rule:** Each screen should have ONE primary action.

### Why This Matters

- Mobile screens are small
- Users are often distracted (commuting, walking)
- Cognitive load must be minimized

### Implementation

```
Good: Uber pickup screen
- One input: "Where to?"
- One action: Set destination
- Auto-detected location

Bad: Multiple CTAs competing for attention
- "Sign up", "Learn more", "Contact us" all equally prominent
```

### Checklist

- [ ] What is the ONE thing users should do on this screen?
- [ ] Is the primary CTA visually dominant?
- [ ] Are secondary actions clearly subordinate?
- [ ] Can the user complete the action in under 3 seconds?

---

## Thumb-Zone Design

49% of users operate their phone with one thumb. Design for this reality.

### Thumb Reach Zones

```
┌─────────────────────┐
│  Hard to reach (Red)│  ← Destructive actions, settings
├─────────────────────┤
│ Stretch zone (Yellow│  ← Secondary actions
├─────────────────────┤
│ Natural zone (Green)│  ← Primary actions, main nav
└─────────────────────┘
        👍 Thumb
```

### Zone Usage

| Zone | Color | Best For |
|------|-------|----------|
| **Natural** | Green | Primary CTA, main navigation, frequent actions |
| **Stretch** | Yellow | Secondary actions, filters, less frequent items |
| **Hard** | Red | Delete, settings, rarely used features |

### Implementation Rules

1. **Bottom navigation** for primary actions
2. **FAB (Floating Action Button)** in thumb-reachable area
3. **Swipe gestures** for common actions (delete, archive)
4. **Pull-to-refresh** at top (natural gesture)

---

## Touch Target Requirements

### Minimum Sizes

| Platform | Minimum Size | Recommended |
|----------|-------------|-------------|
| iOS | 44 x 44 pt | 48 x 48 pt |
| Android | 48 x 48 dp | 56 x 56 dp |
| WCAG | 44 x 44 px | - |

### Spacing Between Targets

- Minimum: **8pt** between interactive elements
- Recommended: **16pt** for frequently used actions

### Implementation

```typescript
import { TouchTarget } from '@/constants/theme';

const styles = StyleSheet.create({
  button: {
    minHeight: TouchTarget.min, // 44pt
    minWidth: TouchTarget.min,
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

---

## Navigation Patterns

### 3-Click Rule

Users should reach any content within **3 taps** from the home screen.

```
Home → Category → Item Detail  ✅ (3 taps)
Home → Settings → Account → Security → Password  ❌ (5 taps)
```

### Navigation Hierarchy

```
1. Tab Bar (bottom) - 3-5 main sections
2. Stack Navigation - Hierarchical content
3. Modal - Focused tasks, confirmations
4. Drawer - Secondary navigation, settings
```

### Best Practices

1. **Show current location** - Highlight active tab, show breadcrumbs
2. **Enable back navigation** - Always provide escape route
3. **Persist state** - Save scroll position, form data
4. **Cross-device sync** - Resume on any device

---

## Gesture Patterns

### Standard Gestures

| Gesture | Common Action | Example |
|---------|---------------|---------|
| **Tap** | Select, activate | Button press |
| **Swipe horizontal** | Navigate, delete | Email swipe actions |
| **Swipe vertical** | Scroll, refresh | Pull-to-refresh |
| **Long press** | Context menu | iOS 3D Touch alternative |
| **Pinch** | Zoom | Photo zoom |
| **Double tap** | Zoom/Like | Instagram like |

### Swipe Actions Pattern

```typescript
// Swipe to reveal actions (iOS Mail style)
<Swipeable
  renderRightActions={() => (
    <View style={styles.deleteAction}>
      <IconSymbol name="trash" color="white" />
    </View>
  )}
  onSwipeableOpen={() => handleDelete(item.id)}
>
  <ListItem item={item} />
</Swipeable>
```

### Gesture Guidelines

- **Swipe is secondary** to tap (not everyone discovers swipe)
- **Provide visual hints** for hidden gestures
- **Keep gestures consistent** across the app
- **Don't require precision** - forgive slight deviations

---

## Feedback & Response

### Feedback Types

| Type | When to Use | Duration |
|------|-------------|----------|
| **Visual** | Button state change | Immediate |
| **Haptic** | Confirmation, warning | 10-50ms |
| **Audio** | Important events | 100-500ms |
| **Toast/Snackbar** | Action confirmation | 2-4 seconds |

### Response Time Guidelines

| Duration | User Perception | Action Required |
|----------|----------------|-----------------|
| < 100ms | Instant | None |
| 100-300ms | Slight delay | Visual feedback |
| 300-1000ms | Noticeable | Loading indicator |
| > 1000ms | Slow | Progress bar + skeleton |

### Implementation

```typescript
function SubmitButton({ onPress, isLoading }) {
  const handlePress = async () => {
    // Immediate visual feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await onPress();

    // Completion feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed, // Visual feedback
      ]}
    >
      {isLoading ? <ActivityIndicator /> : <Text>Submit</Text>}
    </Pressable>
  );
}
```

---

## Loading States

### Progressive Loading

Show content as it becomes available, don't wait for everything.

```
1. Show skeleton immediately (< 100ms)
2. Load critical content first
3. Load secondary content (images, recommendations)
4. Load tertiary content (comments, related items)
```

### Skeleton Screens

```typescript
function CardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={200} /> {/* Image */}
      <Skeleton width="70%" height={20} />  {/* Title */}
      <Skeleton width="40%" height={16} />  {/* Subtitle */}
    </View>
  );
}
```

### Loading Indicators

| Type | Use When |
|------|----------|
| **Spinner** | Unknown duration, < 5 seconds expected |
| **Progress bar** | Known duration, file uploads |
| **Skeleton** | Content structure known, lists/cards |
| **Shimmer** | Content loading, premium feel |

---

## Error Prevention

### Pre-emptive Strategies

1. **Confirmation dialogs** for destructive actions
2. **Input validation** in real-time (not on submit)
3. **Undo functionality** instead of "Are you sure?"
4. **Smart defaults** reduce wrong choices
5. **Constraints** prevent invalid input

### Error Message Guidelines

```
Bad:  "Error 500"
Good: "Couldn't save your changes. Check your connection and try again."

Bad:  "Invalid input"
Good: "Password must be at least 8 characters with one number"
```

### Implementation

```typescript
function DeleteButton({ onDelete, itemName }) {
  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${itemName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return <Button title="Delete" variant="destructive" onPress={handleDelete} />;
}
```

---

## Form Design

### Input Minimization

- **Auto-fill** from device (name, email, address)
- **GPS** for location instead of manual entry
- **Camera** for credit cards, documents
- **Social login** reduces registration friction
- **Smart defaults** pre-select common options

### Form Best Practices

| Rule | Example |
|------|---------|
| **One column layout** | Never side-by-side inputs on mobile |
| **Show keyboard type** | `keyboardType="email-address"` |
| **Auto-advance** | Move to next field on completion |
| **Inline validation** | Check email format as user types |
| **Clear error states** | Red border + message below input |

### Implementation

```typescript
<TextInput
  keyboardType="email-address"
  autoCapitalize="none"
  autoComplete="email"
  textContentType="emailAddress"
  returnKeyType="next"
  onSubmitEditing={() => passwordRef.current?.focus()}
  style={[styles.input, error && styles.inputError]}
/>
{error && <Text style={styles.errorText}>{error}</Text>}
```

---

## Onboarding

### First Impression Rules

1. **Show value immediately** - Don't gate with signup
2. **Minimize friction** - Social login, skip options
3. **Tutorial on demand** - Not forced walkthrough
4. **Progressive disclosure** - Teach as they go

### Onboarding Patterns

| Pattern | Best For |
|---------|----------|
| **Coach marks** | Highlighting new features |
| **Tooltips** | Explaining specific UI elements |
| **Walkthrough** | Complex apps (keep to 3 screens max) |
| **Empty states** | Teaching through first-use prompts |

### Anti-Patterns

- Forced 5+ screen tutorials
- Signup before seeing any value
- Asking permissions immediately
- Dense text instructions

---

## Accessibility Checklist

### Visual

- [ ] Text contrast ratio 4.5:1 (WCAG AA)
- [ ] Touch targets 44x44pt minimum
- [ ] Color is not the only indicator
- [ ] Text scalable to 200%

### Motor

- [ ] No time-limited interactions
- [ ] Generous tap targets with spacing
- [ ] Alternative to complex gestures

### Screen Reader

- [ ] All images have alt text / accessibilityLabel
- [ ] Logical focus order
- [ ] Proper heading hierarchy
- [ ] Form labels associated with inputs

---

## Detailed References

For in-depth patterns and examples:

- **[Navigation Patterns](references/navigation.md)** - Tab bar, stack, modal, drawer
- **[Gesture Design](references/gestures.md)** - Swipe, long press, custom gestures
- **[Form UX](references/forms.md)** - Validation, multi-step, error handling
- **[Loading & Performance](references/loading.md)** - Perceived performance, skeleton

---

## AI Assistant Instructions

When applying UX principles:

### For User Flow Design

1. **Identify primary user goal** for each screen
2. **Map the journey** - Entry → Action → Confirmation
3. **Apply 3-click rule** - Simplify deep hierarchies
4. **Design for interruption** - Users get distracted

### For Interaction Design

1. **Check thumb zone** - Primary actions in green zone
2. **Verify touch targets** - 44pt minimum
3. **Add appropriate feedback** - Visual, haptic, audio
4. **Test gesture discoverability** - Not everyone swipes

### For Forms

1. **Minimize required fields**
2. **Use appropriate keyboard types**
3. **Validate inline, not on submit**
4. **Provide clear error messages**

### Common Questions

**Q: Should I use a modal or new screen?**
A: Modal for focused tasks requiring quick resolution. New screen for content exploration.

**Q: How many tabs in bottom navigation?**
A: 3-5 tabs. More than 5 requires drawer or reorganization.

**Q: When to show onboarding?**
A: Only when necessary. Prefer teaching through first-use with empty states.

---

## Version

**v1.0.0** - Initial release (2025)

- 9 foundational UX principles
- Thumb-zone design patterns
- Touch target requirements
- Navigation and gesture patterns
- Loading and feedback guidelines
- Form design best practices
- Onboarding patterns
- Accessibility checklist
