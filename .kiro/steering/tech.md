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
- **iOS Design System**: Apple HIG準拠のカラーパレット（constants/theme.ts）
- **react-native-reanimated 4.1**: Hardware-accelerated animations
- **react-native-web 0.21**: Web platform support
- **expo-vector-icons**: Icon library from Expo

## State Management & Data

- **Zustand 5.x**: Lightweight state management with persistence (AsyncStorage)
- **TanStack Query 5.x**: Server state management, caching, data fetching
- **Drizzle ORM + expo-sqlite**: Type-safe local database (SQLite)

## Development & Tooling

- **ESLint (Expo config)**: Flat config format with Expo defaults + Prettier
- **Jest + Testing Library**: Unit/component testing with jest-expo
- **React Compiler**: Enabled to automatically optimize render performance
- **New Architecture**: Enabled (TurboModules, JSI)
- **pnpm**: Package manager with hoisted node linker

## Key Decisions

| Decision                                      | Rationale                                                             |
| --------------------------------------------- | --------------------------------------------------------------------- |
| **File-based routing**                        | Reduces boilerplate, familiar mental model (like Next.js)             |
| **iOS Design System (HIG準拠)**               | Apple Human Interface Guidelines準拠、Dark Mode自動対応              |
| **Hook-based color access**                   | `useThemedColors()`で構造化されたカラーアクセス                       |
| **Zustand + AsyncStorage**                    | シンプルな状態管理、自動永続化                                        |
| **TanStack Query**                            | サーバー状態のキャッシュ、非同期データ管理                            |
| **Drizzle ORM**                               | 型安全なSQLite操作、マイグレーション管理                              |
| **Feature-based structure**                   | 機能ごとにcomponents/hooks/servicesを配置                             |
| **React Compiler enabled**                    | Automatic memoization, better performance without manual optimization |
| **TypeScript strict mode**                    | Catches errors at compile time; paths alias for clean imports         |

## Platform Support

- **iOS**: Native App + Web (simulator/device)
- **Android**: Native App + Emulator + Web
- **Web**: Static output, responsive design via react-native-web

## Performance Optimizations Active

- React Compiler: Automatic memoization
- New Architecture: Modern runtime with better interop
- Reanimated Worklets: Animations run on native thread
