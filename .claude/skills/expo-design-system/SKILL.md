---
name: expo-design-system
description: Design system based on Apple Human Interface Guidelines. Instantly implement iOS System Colors, Semantic Colors, and Dark Mode support in Expo/React Native apps. Use when implementing theme system, setting up colors, configuring Dark Mode, building UI components, or following iOS design patterns in Expo apps.
---

# Expo Design System - iOS System Colors

A minimal and functional design system based on Apple Human Interface Guidelines. Quickly set up Expo/React Native apps.

---

## When to Use This Skill

Use this skill when:

- Adding a theme system to Expo/React Native apps
- Implementing color schemes compliant with iOS System Colors
- Adding or improving Dark Mode support
- Using Semantic Colors (success/warning/error)
- Following Apple Human Interface Guidelines design
- Implementing UI components (Button, Card, Input, etc.)
- Meeting accessibility standards (WCAG AA)

---

## Quick Start (5-minute setup)

### 1. Replace theme file

Simply replace the existing `constants/theme.ts` with `templates/theme.ts`.

```bash
cp .claude/skills/expo-design-system/templates/theme.ts constants/theme.ts
```

### 2. Use in components

Existing components like `ThemedText`, `ThemedView` work as-is.

```typescript
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function MyComponent() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={{ backgroundColor: colors.background.base }}>
      <Text style={{ color: colors.text.primary }}>Hello World</Text>
    </View>
  );
}
```

### 3. Choose Primary Color

Select one main action color for your app (from Blue/Green/Orange).

```typescript
// Set PRIMARY_COLOR in constants/theme.ts
// Blue (#007AFF)  - Rational, trustworthy → Decision Journal
// Green (#34C759) - Health, energy → Energy Tracker
// Orange (#FF9500) - Urgency, action → 12 Week Year
```

---

## Core Concepts

### What are iOS System Colors?

iOS System Colors are Apple's semantic color system. They automatically support Light/Dark Mode and follow function-first design principles.

**Features:**

- **Function-first** - Colors are used to convey meaning
- **Minimal decoration** - No SaaS-style Indigo, gradients, or neon colors
- **Consistency** - All colors comply with iOS standards
- **Dark Mode support** - Visibility ensured in both Light/Dark modes

### Semantic Colors (functional colors)

Colors with functional meaning:

- **Success** - Green (#34C759) - Completion, checked
- **Warning** - Orange (#FF9500) - Caution required
- **Error** - Red (#FF3B30) - Error, deletion
- **Info** - Blue (#007AFF) - Information, hints

### Automatic Light/Dark Mode switching

The `useColorScheme()` hook automatically switches colors based on system settings. No context needed.

```typescript
const colorScheme = useColorScheme();
const color = Colors[colorScheme ?? 'light'].text.primary;
```

---

## Color System

### Primary Colors (main action colors)

**Rule:** Use **only 1 color** as primary per app

```typescript
primary: {
  blue: '#007AFF',    // Decision Journal - Rational, trustworthy
  green: '#34C759',   // Energy Tracker - Health, energy
  orange: '#FF9500',  // 12 Week Year - Urgency, action
}
```

✅ Usage: Record button, submit button, main CTA
❌ NG: Using multiple primary colors on the same screen

### Background Colors (3 levels)

```typescript
background: {
  base: '#FFFFFF',        // Base background for entire screen
  secondary: '#F2F2F7',   // Card, section background
  tertiary: '#FFFFFF',    // Modal, overlay background
}
```

✅ Maximum 3 background levels
❌ Don't create 4+ levels (prevents complexity)

### Text Colors (4 levels)

```typescript
text: {
  primary: '#000000',     // Main text, headings
  secondary: '#3C3C43',   // Subtitles, descriptions
  tertiary: '#8E8E93',    // Placeholders, inactive text
  inverse: '#FFFFFF',     // Text on dark backgrounds
}
```

**Usage examples:**

- primary: Paragraphs, button text, list items
- secondary: Meta info, descriptions, supplementary text
- tertiary: Placeholders, disabled states, hints
- inverse: Only on dark backgrounds

### Semantic Colors (colors with meaning)

```typescript
semantic: {
  success: '#34C759',  // iOS Green - Success, completion
  warning: '#FF9500',  // iOS Orange - Caution, warning
  error: '#FF3B30',    // iOS Red - Error, deletion
  info: '#007AFF',     // iOS Blue - Information, hints
}
```

✅ Always use according to meaning (success=green, error=red)
❌ Using colors contrary to meaning, or for decoration only

### Interactive Elements

```typescript
interactive: {
  separator: '#C6C6C8',      // Dividers, borders
  fill: '#787880',           // Icons, inactive elements
  fillSecondary: '#BCBCC0',  // Secondary fills
}
```

---

## Dark Mode

### Dark Mode Color Palette

Dark Mode colors are derived from Light Mode using these rules:

```typescript
dark: {
  // Primary colors - +10% brightness adjustment
  primary: {
    blue: '#0A84FF',      // #007AFF + 10%
    green: '#30D158',     // #34C759 + 10%
    orange: '#FF9F0A',    // #FF9500 + 10%
  },

  // Background colors - Black-based
  background: {
    base: '#000000',           // Pure black
    secondary: '#1C1C1E',      // iOS Dark Gray
    tertiary: '#2C2C2E',       // Elevated surface
  },

  // Text colors - White-based
  text: {
    primary: '#FFFFFF',
    secondary: '#EBEBF5',      // 60% opacity white
    tertiary: '#8E8E93',       // Same gray
    inverse: '#000000',
  },

  // Semantic colors - +10% brightness adjustment
  semantic: {
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#0A84FF',
  },

  // Interactive elements - For dark backgrounds
  interactive: {
    separator: '#38383A',
    fill: '#787880',
    fillSecondary: '#48484A',
  },
}
```

**How automatic switching works:**

```typescript
const colorScheme = useColorScheme();
const colors = Colors[colorScheme ?? 'light'];
// Light/Dark automatically selected
```

---

## NG Rules (absolutely prohibited colors)

### 🚫 Indigo colors (#6366F1, #818CF8, etc.)

**Reason:** SaaS startup cliché, following trends without differentiation

**Alternative:** Use iOS Blue (#007AFF)

### 🚫 Gradients

```typescript
❌ linear-gradient(135deg, #667eea 0%, #764ba2 100%)
```

**Reason:** Performance degradation, over-decoration, difficult maintenance

**Alternative:** Solid colors are sufficient

### 🚫 Neon/vivid colors (#FF00FF, #00FF00, #00FFFF, etc.)

**Reason:** Too stimulating for eyes, unsuitable for long-term use

**Alternative:** Choose from iOS standard colors (Red/Orange/Green/Blue)

### 🚫 Pastel colors (#FFB3D9, #B3D9FF, #B3FFB3, etc.)

**Reason:** Mistaken for cute apps, unsuitable for business users

**Alternative:** iOS standard colors are soft enough

### 🚫 Custom grays (#F5F5F5, #E0E0E0, #9E9E9E, etc.)

**Reason:** iOS standard grays are sufficient, breaks consistency

**Alternative:** Use iOS standard → `background.secondary` (#F2F2F7)

---

## Usage Patterns

### Pattern 1: Basic theme color usage

```typescript
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function Card() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={{ backgroundColor: colors.background.secondary }}>
      <Text style={{ color: colors.text.primary }}>Card Title</Text>
      <Text style={{ color: colors.text.secondary }}>Description</Text>
    </View>
  );
}
```

### Pattern 2: Using Semantic Colors

```typescript
function MessageBanner() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={{ backgroundColor: colors.background.base }}>
      <Text style={{ color: colors.semantic.success }}>✓ Saved</Text>
      <Text style={{ color: colors.semantic.error }}>✕ Error occurred</Text>
      <Text style={{ color: colors.semantic.warning }}>⚠ Please be careful</Text>
    </View>
  );
}
```

### Pattern 3: Custom components

```typescript
interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
}

export function Button({ title, variant = 'primary', onPress }: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const backgroundColor = variant === 'primary'
    ? colors.primary.blue
    : colors.background.secondary;
  const textColor = variant === 'primary'
    ? colors.text.inverse
    : colors.text.primary;

  return (
    <Pressable
      style={{
        backgroundColor,
        minHeight: 44,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
      }}
      onPress={onPress}
    >
      <Text style={{ color: textColor, fontSize: 17, fontWeight: '600' }}>
        {title}
      </Text>
    </Pressable>
  );
}
```

---

## Customization Guide

### Changing Primary Color

Simply change `PRIMARY_COLOR` in `constants/theme.ts`:

```typescript
// Current
export const PRIMARY_COLOR = AppPrimaryColor.blue;

// To change to Orange
export const PRIMARY_COLOR = AppPrimaryColor.orange;
```

### Adding/customizing Semantic Colors

You can add new colors to existing semantic colors:

```typescript
// Example: Adding Neutral (neutral information)
semantic: {
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  neutral: '#5AC8FA',  // New addition
}
```

### Adjusting background hierarchy

You can adjust modal/overlay contrast by changing tertiary color:

```typescript
// For stronger background
tertiary: '#F2F2F7',  // Same as background.secondary

// For lighter background (not recommended)
// More than 3 levels increases complexity
```

---

## Detailed Documentation

Refer to the following references for detailed specifications and best practices:

- **[Color System](references/color.md)** - Color specifications, NG color rules, contrast ratio validation
- **[Typography](references/typography.md)** - San Francisco Font, Dynamic Type, text styles
- **[Spacing & Layout](references/spacing.md)** - 8pt Grid System, Safe Area, Margins
- **[SF Symbols](references/icons.md)** - Icon system, Symbol Variants
- **[Component Patterns](references/components.md)** - Implementation patterns for Button, Card, Input, etc.
- **[Accessibility](references/accessibility.md)** - WCAG 2.1 AA, VoiceOver, accessibility support
- **[Animation & Haptics](references/animation.md)** - Animations, haptic feedback

---

## Apple HIG Reference

### Official Documentation

- [Color | Apple HIG](https://developer.apple.com/design/human-interface-guidelines/color)
- [Typography | Apple HIG](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Dark Mode | Apple HIG](https://developer.apple.com/design/human-interface-guidelines/dark-mode)

### Key Principles (Summary)

1. **Function-first** - Colors are used to convey function. Minimal decoration.
2. **Ensure contrast** - Always ensure WCAG AA standards (4.5:1 or higher) contrast ratio.
3. **Consistency** - Use system standard colors, minimize custom colors.
4. **Dark Mode support** - Provide Dark Mode version for all colors. Automatic switching required.
5. **Liquid Glass (2025)** - Sophisticated design utilizing transparency, depth, and fluidity.

---

## Template Files

### theme.ts - Complete iOS System Colors implementation

`templates/theme.ts` contains a complete theme implementation including:

- Primary Colors (3 colors: Blue/Green/Orange)
- Background Colors (3 levels)
- Text Colors (4 levels)
- Semantic Colors (success/warning/error/info)
- Interactive Elements (dividers, icons)
- Full Light/Dark Mode support
- Compatibility with existing code (legacy properties: tint, icon, etc.)

```bash
cp .claude/skills/expo-design-system/templates/theme.ts constants/theme.ts
```

---

## AI Assistant Instructions

When implementing UI using this skill, follow these steps:

### When user requests UI implementation

1. **Check SKILL.md** - Understand latest color rules
2. **Check templates/theme.ts** - Understand theme implementation
3. **Confirm Primary Color** - Check which primary color the user's app uses
4. **Remind NG Rules** - Remind about prohibited: Indigo, gradients, etc.
5. **WCAG AA compliance** - Ensure contrast ratio (4.5:1 or higher)

### When user requests detailed information

- Present reference documents (references/\*.md) from SKILL.md
- If Apple HIG details needed, fetch latest info with WebFetch
- Refer to references/components.md for component implementation patterns

### When consulted about customization

- Semantic Colors, Primary Color, and background hierarchy are adjustable
- However, NG Rules are absolute (Indigo/gradients/neon/pastels prohibited)
- When changing, confirm Dark Mode support simultaneously

### Common questions

**Q: I want to use multiple accent colors**
A: Use only one primary color. Multiple accent colors break information design. Use Semantic Colors (success/warning/error) instead.

**Q: I want to add custom colors**
A: Can be done by extending Semantic Colors. However, iOS standard color base is recommended.

**Q: Color changes during animations**
A: Refer to animation.md. Implement natural transitions with Timing (0.3-0.5s) and Easing (ease-out).

---

## Version

**v1.0.0** - Initial release (2025)

- Complete iOS System Colors implementation
- Semantic Colors support
- Dark Mode support
- Compliant with Apple HIG 2025
- WCAG 2.1 AA compliant
