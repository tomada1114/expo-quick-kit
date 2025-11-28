# Product Context

## Core Purpose

expo-quick-kit is a **React Native boilerplate template** for building cross-platform mobile applications. It provides a pre-configured starting point with proven patterns and modern tooling, enabling developers to begin building features immediately rather than spending time on project scaffolding.

## Target Users

- React Native developers building new mobile projects
- Teams needing a consistent, well-structured foundation
- Developers familiar with React seeking a professional boilerplate

## Core Capabilities

### 1. Universal Cross-Platform Delivery

- **iOS, Android, Web Support**: Single codebase runs on all three platforms (React Native + expo-web)
- **Unified Development Experience**: Same component APIs across platforms with platform-specific optimizations

### 2. Modern Routing Architecture

- **File-based Navigation** via expo-router: Routes defined in directory structure (`app/` directory)
- **Tab-Based UI Pattern**: Pre-configured bottom tab navigation (Home/Demo tabs)
- **Type-Safe Routing**: TypeScript support for route definitions and navigation

### 3. iOS Design System & Theming

- **Apple HIG準拠**: iOS System Colors、Dark Mode対応（+10% brightness rule）
- **構造化カラーパレット**: Background/Text/Semantic/Interactiveの階層構造
- **デザイントークン**: Spacing, Typography, BorderRadius, Shadowsの一貫したシステム

### 4. Optimization Features

- **React 19 + React Compiler**: Automatic component memoization and performance optimizations
- **New Architecture (TurboModules)**: Modern React Native runtime enabled
- **Reanimated 4 + Worklets**: Smooth animations and native thread performance

### 5. Data & State Management

- **Zustand**: AsyncStorage永続化付きのクライアント状態管理
- **TanStack Query**: サーバー状態、キャッシュ、データフェッチ
- **Drizzle ORM + SQLite**: 型安全なローカルデータベース

## What Developers Don't Build From Scratch

- Project setup and configuration
- Basic navigation structure
- iOS Design System (HIG準拠テーマ)
- State management architecture
- Local database layer
- Linting, testing, and code quality standards
- Feature module pattern (参照実装付き)

## Value Proposition

**Fast Project Startup**: Professional-grade structure from day one, following Expo best practices. Use established patterns for routing, theming, and components instead of designing architecture while learning your domain problem.
