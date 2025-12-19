---
alwaysApply: false
globs:
  - app/**/*.tsx
  - app/**/_layout.tsx
---

# Routing (expo-router) Guidelines

## Purpose

File-based routing patterns using expo-router.

## Directory Structure

```
app/
├── _layout.tsx           # Root layout (providers, themes)
├── index.tsx             # Home screen (/)
├── modal.tsx             # Modal screen (/modal)
├── [id].tsx              # Dynamic route (/123)
├── (tabs)/               # Tab navigation group
│   ├── _layout.tsx       # Tab bar configuration
│   ├── index.tsx         # First tab (home)
│   ├── explore.tsx       # Second tab
│   └── settings.tsx      # Third tab
├── (auth)/               # Auth group (shared layout)
│   ├── _layout.tsx       # Auth layout
│   ├── login.tsx         # /login
│   └── register.tsx      # /register
└── +not-found.tsx        # 404 page
```

## Root Layout

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme } from '@/constants/theme';
import { queryClient } from '@/lib/query-client';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              title: 'Modal',
            }}
          />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

## Tab Navigation

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <IconSymbol name="paperplane.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <IconSymbol name="gear" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

## Navigation

### Programmatic Navigation

```typescript
import { router } from 'expo-router';

// Navigate to a route
router.push('/details');
router.push('/user/123');

// Replace current route (no back)
router.replace('/home');

// Go back
router.back();

// Navigate with params
router.push({
  pathname: '/user/[id]',
  params: { id: '123' },
});
```

### Link Component

```typescript
import { Link } from 'expo-router';

// Simple link
<Link href="/about">About</Link>

// Link with params
<Link href={{ pathname: '/user/[id]', params: { id: '123' } }}>
  View User
</Link>

// Link as button
<Link href="/settings" asChild>
  <Pressable>
    <Text>Settings</Text>
  </Pressable>
</Link>
```

## Dynamic Routes

### Single Parameter

```typescript
// app/user/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <Text>User ID: {id}</Text>;
}
```

### Multiple Parameters

```typescript
// app/[category]/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function ItemScreen() {
  const { category, id } = useLocalSearchParams<{
    category: string;
    id: string;
  }>();

  return <Text>{category}: {id}</Text>;
}
```

### Catch-All Routes

```typescript
// app/[...path].tsx - matches /a/b/c
import { useLocalSearchParams } from 'expo-router';

export default function CatchAllScreen() {
  const { path } = useLocalSearchParams<{ path: string[] }>();

  return <Text>Path: {path?.join('/')}</Text>;
}
```

## Screen Options

### Static Options

```typescript
// In the screen file
export default function DetailsScreen() {
  return <View>...</View>;
}

// Static options
DetailsScreen.options = {
  title: 'Details',
  headerShown: true,
};
```

### Dynamic Options

```typescript
import { Stack } from 'expo-router';

export default function DetailsScreen() {
  const { id } = useLocalSearchParams();

  return (
    <>
      <Stack.Screen
        options={{
          title: `Item ${id}`,
          headerRight: () => <ShareButton />,
        }}
      />
      <View>...</View>
    </>
  );
}
```

## Modal Presentation

```typescript
// app/_layout.tsx
<Stack>
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  <Stack.Screen
    name="modal"
    options={{
      presentation: 'modal',
      title: 'Modal Title',
    }}
  />
</Stack>

// app/modal.tsx
export default function ModalScreen() {
  return (
    <View>
      <Text>Modal Content</Text>
      <Button title="Close" onPress={() => router.back()} />
    </View>
  );
}
```

## Protected Routes

```typescript
// app/(auth)/_layout.tsx
import { Redirect, Slot } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Slot />;
}
```

## Error Handling

```typescript
// app/+not-found.tsx
import { Link, Stack } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text>This page doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          Go to home
        </Link>
      </View>
    </>
  );
}
```

## Typed Routes

With `experiments.typedRoutes: true` in app.json:

```typescript
import { router } from 'expo-router';

// TypeScript will validate routes
router.push('/valid-route');    // OK
router.push('/invalid-route');  // Type error
```

## Best Practices

1. **Group related routes** using parentheses: `(tabs)/`, `(auth)/`
2. **Use `_layout.tsx`** for shared UI (headers, tabs, providers)
3. **Keep screen files focused** on the screen content
4. **Extract navigation logic** to custom hooks when complex
5. **Use typed routes** for compile-time route validation
6. **Handle loading states** in layouts for protected routes
