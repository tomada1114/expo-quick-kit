# Technical Stack & Decisions

## Core Runtime

- **React 19.1.0**: Latest React with concurrent features and compiler support
- **React Native 0.81.5**: Latest stable with New Architecture support
- **Expo SDK 54**: Modern mobile development framework with managed services
- **TypeScript 5.9**: Strict mode enabled for type safety

## Navigation

- **expo-router 6.0.15**: File-based routing (Next.js-style for React Native)
- **React Navigation 7.x**: Underlying navigation primitives
- **Typed Routes**: Enabled via experiments for compile-time route safety

## UI & Styling

- **React Native Built-ins**: StyleSheet for styling (no CSS framework)
- **react-native-reanimated 4.1**: Hardware-accelerated animations
- **react-native-web 0.21**: Web platform support
- **expo-vector-icons**: Icon library from Expo

## Development & Tooling

- **ESLint (Expo config)**: Flat config format with Expo defaults
- **React Compiler**: Enabled to automatically optimize render performance
- **New Architecture**: Enabled (TurboModules, JSI)
- **pnpm**: Package manager with hoisted node linker

## Key Decisions

| Decision                                      | Rationale                                                             |
| --------------------------------------------- | --------------------------------------------------------------------- |
| **File-based routing**                        | Reduces boilerplate, familiar mental model (like Next.js)             |
| **Centralized theming in constants/theme.ts** | Single source of truth, easy dark mode support                        |
| **Hook-based color access**                   | Reactive theme switching, no context prop drilling                    |
| **React Compiler enabled**                    | Automatic memoization, better performance without manual optimization |
| **No CSS framework**                          | StyleSheet sufficient for mobile; reduces dependencies                |
| **TypeScript strict mode**                    | Catches errors at compile time; paths alias for clean imports         |
| **pnpm hoisted linker**                       | Reduces node_modules bloat compared to npm/yarn                       |

## Platform Support

- **iOS**: Native App + Web (simulator/device)
- **Android**: Native App + Emulator + Web
- **Web**: Static output, responsive design via react-native-web

## Performance Optimizations Active

- React Compiler: Automatic memoization
- New Architecture: Modern runtime with better interop
- Reanimated Worklets: Animations run on native thread
