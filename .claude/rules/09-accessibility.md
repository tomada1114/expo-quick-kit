---
alwaysApply: false
globs:
  - components/**/*.tsx
  - features/**/components/**/*.tsx
  - app/**/*.tsx
---

# Accessibility Guidelines

## Purpose

Accessibility requirements for React Native components following iOS Human Interface Guidelines and WCAG standards.

## Required Attributes

Every interactive component MUST include these accessibility attributes:

```typescript
<Pressable
  testID={testID}                              // For testing
  accessibilityLabel={accessibilityLabel}      // Screen reader text
  accessibilityRole="button"                   // Semantic role
  accessibilityState={{ disabled: isDisabled }} // Current state
  // ...
>
```

### testID

Required for all interactive elements:

```typescript
// Component
<Button testID="submit-button" title="Submit" />

// Test
const { getByTestId } = render(<Button testID="submit-button" />);
expect(getByTestId('submit-button')).toBeTruthy();
```

### accessibilityLabel

Provide descriptive text for screen readers:

```typescript
// Falls back to visible text if not provided
accessibilityLabel={accessibilityLabel ?? title}

// Icons need explicit labels
<IconButton
  icon="trash"
  accessibilityLabel="Delete item"
/>

// Complex components need context
<Card accessibilityLabel={`${item.name}, ${item.status}`}>
```

### accessibilityRole

Map to semantic roles:

| Component | Role |
|-----------|------|
| Button, Pressable | `"button"` |
| Text | `"text"` |
| Heading | `"header"` |
| Link | `"link"` |
| TextInput | `"none"` (default) or `"search"` |
| Image | `"image"` |
| Switch | `"switch"` |
| Checkbox | `"checkbox"` |
| Tab | `"tab"` |

### accessibilityState

Communicate current state:

```typescript
accessibilityState={{
  disabled: isDisabled,      // Greyed out, not interactive
  selected: isSelected,      // Currently selected item
  checked: isChecked,        // Checkbox/radio state
  expanded: isExpanded,      // Accordion/dropdown state
  busy: isLoading,           // Loading state
}}
```

## Touch Targets

### Minimum Size: 44x44pt

iOS Human Interface Guidelines require 44pt minimum touch targets:

```typescript
import { TouchTarget } from '@/constants/theme';

const styles = StyleSheet.create({
  button: {
    minHeight: TouchTarget.min, // 44pt
    minWidth: TouchTarget.min,  // 44pt
  },
});
```

### Small Visual, Large Touch

For visually small elements, extend the touch area:

```typescript
<Pressable
  style={styles.touchArea}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
>
  <Icon size={24} />
</Pressable>
```

## Color Contrast

### WCAG AA Requirements

- Normal text: 4.5:1 contrast ratio
- Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

### Using Theme Colors

Theme colors are designed for sufficient contrast:

```typescript
const { colors } = useThemedColors();

// Good contrast combinations
<View style={{ backgroundColor: colors.background.base }}>
  <Text style={{ color: colors.text.primary }} />      {/* High contrast */}
  <Text style={{ color: colors.text.secondary }} />    {/* Medium contrast */}
  <Text style={{ color: colors.text.tertiary }} />     {/* Lower contrast - use sparingly */}
</View>
```

### Avoid Color-Only Information

Don't rely solely on color to convey information:

```typescript
// BAD: Color only
<Text style={{ color: isError ? 'red' : 'green' }}>
  Status
</Text>

// GOOD: Color + icon/text
<View style={styles.status}>
  <Icon name={isError ? 'alert-circle' : 'check-circle'} />
  <Text style={{ color: isError ? colors.semantic.error : colors.semantic.success }}>
    {isError ? 'Error occurred' : 'Success'}
  </Text>
</View>
```

## Screen Reader Support

### VoiceOver (iOS) Testing

1. Enable: Settings > Accessibility > VoiceOver
2. Navigate: Swipe left/right
3. Activate: Double-tap
4. Verify: Labels are descriptive and state is announced

### Reading Order

Ensure logical focus order:

```typescript
// Group related content
<View accessible={true} accessibilityLabel="Product card, iPhone 15, $999">
  <Image source={productImage} />
  <Text>iPhone 15</Text>
  <Text>$999</Text>
</View>

// Or let items be individually focusable in logical order
<View>
  <Text accessibilityRole="header">iPhone 15</Text>
  <Text>$999</Text>
  <Button title="Add to cart" />
</View>
```

### Announcements

Announce dynamic changes:

```typescript
import { AccessibilityInfo } from 'react-native';

// Announce after action
const handleSubmit = async () => {
  await submitForm();
  AccessibilityInfo.announceForAccessibility('Form submitted successfully');
};

// Announce errors
if (error) {
  AccessibilityInfo.announceForAccessibility(`Error: ${error.message}`);
}
```

## Form Accessibility

### Labels

```typescript
<View>
  <Text nativeID="email-label">Email</Text>
  <TextInput
    accessibilityLabelledBy="email-label"
    accessibilityLabel="Email input"
    placeholder="Enter your email"
  />
</View>
```

### Error States

```typescript
<TextInput
  accessibilityLabel={`Email${error ? ', error: ' + error : ''}`}
  accessibilityState={{ disabled: false }}
  style={error ? styles.errorInput : styles.input}
/>
{error && (
  <Text
    accessibilityRole="alert"
    accessibilityLiveRegion="polite"
    style={styles.errorText}
  >
    {error}
  </Text>
)}
```

## Images

### Decorative Images

```typescript
// Hide from screen readers
<Image
  source={decorativePattern}
  accessible={false}
  accessibilityElementsHidden={true}
/>
```

### Informative Images

```typescript
// Provide description
<Image
  source={productImage}
  accessibilityLabel="iPhone 15 Pro in Natural Titanium"
  accessibilityRole="image"
/>
```

## Accessibility Testing Checklist

- [ ] All interactive elements have `testID`
- [ ] All interactive elements have `accessibilityLabel`
- [ ] All interactive elements have appropriate `accessibilityRole`
- [ ] Touch targets are at least 44x44pt
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Information is not conveyed by color alone
- [ ] Focus order is logical
- [ ] VoiceOver navigation works correctly
- [ ] Dynamic content changes are announced
- [ ] Form fields have associated labels
- [ ] Error states are accessible
