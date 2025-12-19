---
alwaysApply: false
globs:
  - store/**/*.ts
---

# State Management Guidelines

## Purpose

Zustand store patterns with slices and persistence.

## Store Structure

```
store/
├── index.ts              # Main store creation
├── types.ts              # State and action types
├── slices/
│   ├── auth-slice.ts     # Auth slice factory
│   ├── settings-slice.ts # Settings slice factory
│   └── index.ts          # Barrel export
└── __tests__/
    └── store.test.ts
```

## Type Definitions

```typescript
// store/types.ts

// State types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
}

// Action types
export interface AuthActions {
  setUser: (user: User | null) => void;
  logout: () => void;
}

export interface SettingsActions {
  setTheme: (theme: SettingsState['theme']) => void;
  toggleNotifications: () => void;
}

// Combined store type
export interface StoreState extends AuthState, SettingsState {}
export interface StoreActions extends AuthActions, SettingsActions {}
export type Store = StoreState & StoreActions;
```

## Slice Pattern

```typescript
// store/slices/auth-slice.ts
import type { StateCreator } from 'zustand';
import type { AuthState, AuthActions, Store } from '../types';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

export const createAuthSlice: StateCreator<
  Store,
  [],
  [],
  AuthState & AuthActions
> = (set) => ({
  ...initialState,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
    }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
});
```

```typescript
// store/slices/settings-slice.ts
import type { StateCreator } from 'zustand';
import type { SettingsState, SettingsActions, Store } from '../types';

const initialState: SettingsState = {
  theme: 'system',
  notifications: true,
};

export const createSettingsSlice: StateCreator<
  Store,
  [],
  [],
  SettingsState & SettingsActions
> = (set) => ({
  ...initialState,

  setTheme: (theme) => set({ theme }),

  toggleNotifications: () =>
    set((state) => ({ notifications: !state.notifications })),
});
```

## Store Creation

```typescript
// store/index.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Store } from './types';
import { createAuthSlice } from './slices/auth-slice';
import { createSettingsSlice } from './slices/settings-slice';

export const useStore = create<Store>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createSettingsSlice(...a),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist specific fields
      partialize: (state) => ({
        theme: state.theme,
        notifications: state.notifications,
        // Don't persist: user, isAuthenticated
      }),
    }
  )
);

// Export types
export type { Store, AuthState, SettingsState } from './types';
```

## Usage in Components

### Select State

```typescript
import { useStore } from '@/store';

function Profile() {
  // Select specific state (prevents re-renders from other state changes)
  const user = useStore((state) => state.user);
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return <Text>{user?.name}</Text>;
}
```

### Select Actions

```typescript
function LogoutButton() {
  const logout = useStore((state) => state.logout);

  return <Button title="Logout" onPress={logout} />;
}
```

### Combined Selection

```typescript
import { useShallow } from 'zustand/react/shallow';

function Settings() {
  // Use shallow comparison for object selection
  const { theme, setTheme } = useStore(
    useShallow((state) => ({
      theme: state.theme,
      setTheme: state.setTheme,
    }))
  );

  return (
    <ThemePicker value={theme} onChange={setTheme} />
  );
}
```

## Persistence

### Selective Persistence

```typescript
persist(
  (...a) => ({ /* slices */ }),
  {
    name: 'app-storage',
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (state) => ({
      // Only persist these fields
      theme: state.theme,
      notifications: state.notifications,
      // Exclude sensitive/temporary data
    }),
  }
)
```

### Hydration

```typescript
// Check hydration status
const hasHydrated = useStore.persist.hasHydrated();

// Wait for hydration
useEffect(() => {
  const unsubscribe = useStore.persist.onFinishHydration(() => {
    console.log('Store hydrated');
  });
  return unsubscribe;
}, []);
```

## Action Naming

Use verb-based names:

| Pattern | Example |
|---------|---------|
| `set{Field}` | `setUser`, `setTheme` |
| `update{Entity}` | `updateProfile` |
| `toggle{Boolean}` | `toggleNotifications` |
| `reset{Slice}` | `resetAuth` |
| `hydrate` | `hydrateFromStorage` |

## Testing

```typescript
// store/__tests__/store.test.ts
import { act, renderHook } from '@testing-library/react-native';
import { useStore } from '../index';

describe('Store', () => {
  beforeEach(() => {
    // Reset store between tests
    useStore.setState({
      user: null,
      isAuthenticated: false,
      theme: 'system',
      notifications: true,
    });
  });

  describe('auth slice', () => {
    it('should set user and update isAuthenticated', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setUser({ id: '1', name: 'Test' });
      });

      expect(result.current.user).toEqual({ id: '1', name: 'Test' });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should logout and clear user', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setUser({ id: '1', name: 'Test' });
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
```

## Anti-Patterns

### Avoid Large Selections

```typescript
// BAD - re-renders on any state change
const state = useStore();

// GOOD - only re-renders when user changes
const user = useStore((state) => state.user);
```

### Avoid Actions in Render

```typescript
// BAD
function Component() {
  useStore.getState().setTheme('dark'); // Called every render
}

// GOOD
function Component() {
  const setTheme = useStore((state) => state.setTheme);
  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);
}
```
