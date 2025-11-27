# Research & Design Decisions Template

---
**Feature**: `custom-boilerplate`
**Discovery Scope**: New Feature (複雑なボイラープレート構築)
**Key Findings**:
  - Drizzle ORM は Expo SQLite と完全互換、`enableChangeListener` と `useLiveQuery` フックでリアルタイム更新をサポート
  - Zustand は React Native 2025 標準であり、軽量（2KB）で TypeScript 対応、Redux より学習コストが低い
  - TanStack Query v5 は React Native で完全サポート、オンライン/オフライン対応、自動キャッシュ管理
  - React 19 + React Native 0.78+ は 2025 で完全互換、React Compiler により自動最適化可能
  - Jest + React Native Testing Library が標準テスト環境、jest-expo プリセット使用
  - ESLint Flat Config + Prettier 統合が 2025 推奨、Husky/lint-staged による自動化可能

---

## Summary

このボイラープレート構築は、Expo SDK 54 上で以下の技術スタックを採用する複雑な機能です：

- **Database Layer**: Drizzle ORM + expo-sqlite（型安全なローカル DB）
- **State Management**: Zustand（グローバル状態）+ TanStack Query（非同期状態）
- **Routing**: expo-router 6.0（ファイルベースルーティング）
- **Development**: Jest + React Native Testing Library（テスト）、ESLint Flat Config + Prettier（品質管理）
- **UI Base**: iOS System Colors準拠テーマシステム（expo-design-system準拠）、共通コンポーネント（button, card, spacer, loading）

発見プロセスは以下の領域をカバー：
1. **Database & ORM**: Drizzle 最新ベストプラクティス
2. **State Management**: Zustand スライスパターン、TanStack Query キャッシュ戦略
3. **Testing**: Jest-Expo, React Native Testing Library セットアップ
4. **Code Quality**: ESLint 9 Flat Config, Prettier 連携
5. **Routing**: expo-router パターンと最適化
6. **既存コードベース**: 現在の directory structure, component patterns, theme system

## Research Log

### Drizzle ORM と Expo SQLite の統合

- **Context**: 型安全なローカル DB が Requirement 5 の中核。Drizzle は SQLite + React Native 用に設計されたが、Expo SQLite との統合方法が重要
- **Sources Consulted**:
  - [Drizzle ORM - Expo SQLite](https://orm.drizzle.team/docs/connect-expo-sqlite)
  - [Modern SQLite for React Native apps](https://expo.dev/blog/modern-sqlite-for-react-native-apps)
  - [Drizzle ORM with Expo](https://israel-taha.com/blog/build-local-first-app-with-expo-sqlite-and-drizzle/)
- **Findings**:
  - `enableChangeListener: true` を設定して SQLite ネイティブリスナーを有効化
  - `useLiveQuery` フックで DB 変更自動検出、自動再レンダリング
  - マイグレーション管理は `drizzle.config.ts` で設定、Babel inline-import プラグイン必須
  - `useDrizzleStudio` で開発時 Drizzle Studio UI アクセス可能
  - `typeof table.$inferInsert` で insert 型安全性確保
- **Implications**: Design では database/client.ts, database/schema.ts, drizzle.config.ts の契約を明記。マイグレーション戦略は implementation 時に検証

### Zustand スライスパターンと型安全性

- **Context**: Requirement 6 で Zustand 採用、スライスパターンの実装方法を確認
- **Sources Consulted**:
  - [GitHub - pmndrs/zustand](https://github.com/pmndrs/zustand)
  - [React State Management 2025: Zustand](https://www.syncfusion.com/blogs/post/react-state-management-libraries)
  - [Mastering State Management in React Native with Zustand](https://javascript.plainenglish.io/mastering-state-management-in-react-native-with-zustand-a-modern-guide)
- **Findings**:
  - Zustand は hook-based、store.ts + store/slices/ パターン推奨
  - TypeScript 第一級サポート、`typeof useStore` で型推論可能
  - Middleware は必要時のみ使用、通常は不要
  - Selectors で fine-grained updates、不要な re-render 防止
  - React Native Hermes JS engine, Fabric concurrent rendering 完全互換
- **Implications**: store/index.ts で create 関数とスライスを統合、store/slices/app-slice.ts で基本状態定義。Redux より軽量で保守性高い

### TanStack Query v5 と キャッシュ戦略

- **Context**: Requirement 7 で TanStack Query（旧 React Query）採用、キャッシュ戦略と React Native サポート確認
- **Sources Consulted**:
  - [TanStack Query React Native](https://tanstack.com/query/latest/docs/framework/react/react-native)
  - [Caching Examples - TanStack Query](https://tanstack.com/query/v4/docs/react/guides/caching)
  - [The Ultimate Data-Fetching Solution for React Native](https://medium.com/@andrew.chester/tanstack-query-the-ultimate-data-fetching-solution-for-react-native-developers)
- **Findings**:
  - v5.90.11（最新）で React Native 完全サポート
  - useQuery 同じ key 呼び出しで自動キャッシュ返却
  - onlineManager で オフライン対応、focus refetch hook で画面戻る際自動更新
  - QueryClientProvider は app/_layout.tsx でセットアップ必須
  - デフォルト設定（staleTime, cacheTime）プロジェクト全体で統一
- **Implications**: QueryClient config を constants or lib に集約、app/_layout.tsx で Provider ラップ。非同期通信の一元管理

### React 19 と React Native 0.81+ 互換性

- **Context**: package.json に React 19.1.0, React Native 0.81.5 が既存。互換性と新機能の活用を確認
- **Sources Consulted**:
  - [React Native 0.78 - React 19](https://reactnative.dev/blog/2025/02/19/react-native-0.78)
  - [React v19](https://react.dev/blog/2024/12/05/react-19)
  - [React Compiler Support](https://react.dev/blog/2025/10/01/react-19-2)
- **Findings**:
  - React 19 は 2024/12 リリース、React Native 0.78+ で 完全互換（今回 0.81.5 採用）
  - React Compiler で automatic memoization、手動最適化不要
  - propTypes 削除、Actions/useActionState は boilerplate 外
  - 破壊的変更最小、2025 より release frequency 上昇予定
  - app.json で newArchEnabled, reactCompiler, typedRoutes 既に有効化済み
- **Implications**: React Compiler 自動最適化を前提、memoization 戦略不要。Component design は hooks-first で OK

### Expo Router ファイルベースルーティング

- **Context**: Requirement 10 で expo-router 使用、Requirement 2 フォルダ構造との整合、ナビゲーション最適化を確認
- **Sources Consulted**:
  - [Expo Router Introduction](https://docs.expo.dev/router/introduction/)
  - [File-based routing - Expo Docs](https://docs.expo.dev/develop/file-based-routing/)
  - [Common navigation patterns](https://docs.expo.dev/router/basics/common-navigation-patterns/)
- **Findings**:
  - app/ directory が routes、_layout.tsx が layout/nesting 定義
  - (parentheses) route groups は URL に含まれない、tab/modal structuring に最適
  - Dynamic routes [param].tsx で型安全ルーティング（typedRoutes 実験的機能有効化済み）
  - Deep linking 自動、全 screen deep-linkable
  - lazy-eval production, deferred dev bundle 最適化
  - Web SEO 対応（SSG 可能）
- **Implications**: app/_layout.tsx (root), app/(tabs)/_layout.tsx (tab bar), app/(tabs)/index.tsx (home), app/modal.tsx 構造維持。ルート定義はシンプル

### Jest + React Native Testing Library セットアップ

- **Context**: Requirement 4 でテスト環境構築、jest-expo と testing-library 確認
- **Sources Consulted**:
  - [Unit testing with Jest - Expo Docs](https://docs.expo.dev/develop/unit-testing/)
  - [jest-expo - npm](https://www.npmjs.com/package/jest-expo)
  - [How to set up Jest & RNTL in Expo](https://dev.to/tiaeastwood/how-to-set-up-jest-react-native-testing-library-in-your-expo-app-p3e)
- **Findings**:
  - jest-expo preset で built-in transform 設定済み（expo modules)
  - React Native Testing Library (@testing-library/react-native) は react-test-renderer より推奨（React 19 非対応）
  - setupFilesAfterEnv で jest-native extend-expect register
  - @/ path alias Jest で解決可能（jest.config.js moduleNameMapper で設定）
  - jest.setup.js で test env 初期化
- **Implications**: jest.config.js, jest.setup.js, jest-setup-after-env.js 設定必須。expo-sqlite mock 戦略は implementation 時

### ESLint Flat Config + Prettier 統合

- **Context**: Requirement 1 で ESLint + Prettier 設定、Flat Config 推奨 (eslint.config.js)
- **Sources Consulted**:
  - [ESLint 9 & Prettier Integration](https://github.com/vasilestefirta/react-native-eslint-prettier-example)
  - [ESLint configuration with Prettier for RN & TS](https://github.com/eslint/eslint/discussions/18580)
  - [Mastering Code Quality: ESLint, Prettier, Husky](https://medium.com/@manthankaslemk/mastering-code-quality-in-react-native-eslint-prettier-commitlint-and-husky-setup-for-2024)
- **Findings**:
  - ESLint 9 は Flat Config が標準、eslint.config.js で typescript-eslint + react + react-native extend
  - eslint-config-prettier で conflicting rules 無効化
  - .prettierrc で formatting 設定（arrowParens, singleQuote, bracketSpacing, semi）
  - .prettierignore で build output, node_modules 除外
  - Husky + lint-staged で pre-commit hook 自動化（pnpm lint:fix → prettier → eslint）
- **Implications**: eslint.config.js, .prettierrc, .prettierignore 設定ファイル必須。pnpm lint, lint:fix, format script 提供

### expo-design-system（iOS System Colors準拠デザインシステム）

- **Context**: Requirement 14 でデザインシステム遵守が必須。`expo-design-system` Claude Skill に定義された iOS System Colors 準拠のカラーパレットとコンポーネントパターンを反映
- **Sources Consulted**:
  - `.claude/skills/expo-design-system/SKILL.md` — デザインシステム概要、Quick Start
  - `.claude/skills/expo-design-system/references/color.md` — カラーシステム詳細、NG Rules
  - `.claude/skills/expo-design-system/references/typography.md` — San Francisco Font、Typography Scale
  - `.claude/skills/expo-design-system/references/spacing.md` — 8pt Grid System、Safe Area
  - `.claude/skills/expo-design-system/references/components.md` — Button/Card/Input 実装パターン
  - [Color | Apple HIG](https://developer.apple.com/design/human-interface-guidelines/color)
  - [Dark Mode | Apple HIG](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
- **Findings**:
  - **Primary Colors**: アプリごとに1色のみ使用（Blue #007AFF / Green #34C759 / Orange #FF9500）
  - **Background Colors**: 3段階（base/secondary/tertiary）で背景階層管理
  - **Text Colors**: 4段階（primary/secondary/tertiary/inverse）で視認性確保
  - **Semantic Colors**: 機能的な意味を持つ色（success/warning/error/info）、装飾禁止
  - **Interactive Elements**: separator/fill/fillSecondary で操作要素を表現
  - **Dark Mode**: Light Mode の色を +10% 明るくして Dark Mode 版を生成
  - **NG Rules**: Indigo系・グラデーション・ネオン系・パステル系・カスタムグレー禁止
  - **Typography Scale**: Apple HIG準拠の11段階（largeTitle 34pt 〜 footnote 11pt）
  - **8pt Grid System**: すべてのスペーシングを 4/8/16/24/32/48pt で定義
  - **Touch Target**: 最小 44pt x 44pt（WCAG AA準拠）
  - **Border Radius**: sm(4)/md(8)/lg(12)/xl(16)/full(9999)
- **Implications**:
  - design.md の UI Theming System セクションを iOS System Colors 準拠に全面更新
  - constants/theme.ts の Colors 型を primary/background/text/semantic/interactive 構造に変更
  - 共通UIコンポーネント（Button, Card, Spacer, LoadingOverlay）でデザインシステムを使用
  - Requirements Traceability に Requirement 14（デザインシステム遵守）の詳細項目を追加

### 既存コードベース 分析

- **Context**: 現在のコードベースは Expo SDK 54 template（minimal state）
- **Sources**:
  - app/, components/, constants/, hooks/ 既存構造
  - package.json （React 19.1.0, React Native 0.81.5 確定）
  - CLAUDE.md (kebab-case 命名, @/ alias, theming system)
- **Findings**:
  - app/(tabs)/_layout.tsx, app/(tabs)/index.tsx, app/modal.tsx 基本 screens 存在
  - components/themed-*.tsx, ui/ に基本コンポーネント構造
  - constants/theme.ts 既存（colors, fonts light/dark mode）
  - hooks/use-color-scheme.ts, use-theme-color.ts 既存
  - @/ alias 既に tsconfig.json で設定済み
  - Requirement 13 で app/(tabs)/explore.tsx, 不要 sample 削除予定
- **Implications**: Design では既存パターン維持、new directories (features/, store/, database/, lib/, types/) 追加。Requirement 2 フォルダ構造を確立

## Architecture Pattern Evaluation

| Pattern | Description | Strengths | Risks / Limitations | Notes |
|---------|-------------|-----------|---------------------|-------|
| Onion Architecture (DDD) | Domain-Centric + Application/Infrastructure layers | Clear domain boundaries, testable, CLAUDE.md guideline | Requires discipline for separation | Steering default, exam 採用 |
| Feature-Sliced Design | features/ directory per domain feature | Scalable, team-safe, parallel development | Learning curve, 新人教育コスト | Requirement 2 の features/ align |
| Modular Monolith | layers (domain, application, infrastructure) + features | Coherent structure, future microservice migration path | Boundary enforcement工数 | Custom boilerplate 向け |

**Selected**: Hybrid approach combining Onion Architecture (layer organization) + Feature-Sliced Design (features/ by domain) で steering principles と Requirement 2 目標を両立

## Design Decisions

### Decision: Drizzle + Expo SQLite for Type-Safe Persistence

- **Context**: Requirement 5 でローカル DB が必須。型安全性と DX 重視
- **Alternatives Considered**:
  1. SQLite + Raw SQL — Simple だが型安全性ゼロ、maintenance hard
  2. Realm (React Native) — 型安全だが Expo 非サポート
  3. AsyncStorage — Simple だが大データには不向き、SQLite の方がperformance 優
- **Selected Approach**: Drizzle ORM + expo-sqlite (enableChangeListener=true, useLiveQuery hook)
- **Rationale**: Expo 公式推奨、型安全、ライブクエリで UI 自動同期、Drizzle Studio for development UX
- **Trade-offs**:
  - ✅ 型安全（最優先）
  - ✅ Real-time updates（useLiveQuery）
  - ⚠️ マイグレーション管理工数（Drizzle Studio で補う）
  - ⚠️ Babel inline-import plugin 必須
- **Follow-up**: Implementation で migration versioning, rollback strategy 検証

### Decision: Zustand + TanStack Query for State Layering

- **Context**: Requirement 6, 7 で状態管理分離。グローバル状態（Zustand）vs 非同期状態（TanStack Query）の境界
- **Alternatives Considered**:
  1. Redux — Overkill, boilerplate 多い、学習コスト高
  2. Context API only — Performance 問題、selector pattern 不安定
  3. Zustand only — Non-async 状態は OK だが cache 戦略が複雑
- **Selected Approach**: Zustand (app/global state) + TanStack Query (server/API state separate)
- **Rationale**: Lightweight (2KB), TypeScript first-class, React Native Hermes/Fabric compatible, 2025 standard, DX 優秀
- **Trade-offs**:
  - ✅ 学習コスト低（Redux より）
  - ✅ Bundle size 小（2KB vs 20KB）
  - ✅ 自動最適化（selectors で fine-grained）
  - ⚠️ Middleware pattern は Redux より weak
  - ⚠️ DevTools support は Redux より limited（react-hooks-devtools plugin 推奨）
- **Follow-up**: DevTools integration, middleware usage verify in implementation

### Decision: Onion Architecture with Feature-Sliced Design

- **Context**: Requirement 2 で consistent folder structure 要求。steering principles (Onion Architecture) と align
- **Alternatives Considered**:
  1. Flat structure (components/, hooks/, utils/ only) — Simple だが scale 困難
  2. Pure Onion (domain/, application/, infrastructure/) — Clear だが boilerplate 多い
  3. Pure Feature-Sliced — Scalable だが初期セットアップ工数多い
- **Selected Approach**: Hybrid: layers (constants/, hooks/, lib/, components/) + features/ (per-feature slicing)
  ```
  src/ or root level:
    features/             # Domain-specific modules
    components/          # Shared UI components (ui/)
    constants/           # Global constants (theme, types)
    hooks/               # Shared hooks
    store/               # Zustand stores + slices
    database/            # Drizzle schema, client, migrations
    lib/                 # Utilities, helpers
    types/               # Global TypeScript types
    app/                 # expo-router routes
  ```
- **Rationale**:
  - CLAUDE.md 既存 structure honor （@/ alias, kebab-case）
  - Requirement 2 folder spec 直接反映
  - Team-safe boundaries（parallel development）
  - Steering principles (Onion) compliance
- **Trade-offs**:
  - ✅ Scalable（新 feature 追加は features/ folder のみ）
  - ✅ Clear ownership（feature folder owner = feature owner）
  - ✅ Testing isolated by feature
  - ⚠️ Shared component decision require discipline（components/ vs feature internal）
  - ⚠️ Cross-feature dependency需要 care
- **Follow-up**: Integration tests で cross-feature boundary validation

### Decision: Testing Strategy (Jest + RNTL + Testing Library practices)

- **Context**: Requirement 4 でテスト環境、boilerplate quality assurance 重視（Requirement 14）
- **Alternatives Considered**:
  1. Vitest — Fast だが React Native support experimental
  2. React Test Renderer — Official だが deprecated (React 19 非対応)
  3. Jest + Testing Library — Community standard, React 19 ready
- **Selected Approach**: Jest (jest-expo preset) + React Native Testing Library (RNTL) + jest-native matchers
- **Rationale**: jest-expo は built-in transform, RNTL は React 19 ready, jest-native は accessibility matchers 提供
- **Trade-offs**:
  - ✅ React 19 compatible
  - ✅ Community standard（stackoverflow support good）
  - ✅ RNTL behavior-focused（implementation detail 不依存）
  - ⚠️ snapshot testing 要avoid （boilerplate readability 低下）
  - ⚠️ Async mock setup 複雑（expo-sqlite mock 戦略）
- **Follow-up**: Unit/integration test sample, e2e test strategy (detox?) は separate phase

## Risks & Mitigations

- **Risk**: Drizzle migration versioning が複雑 → **Mitigation**: Drizzle Studio + drizzle-kit で tooling support, docs 参照, test migration on startup
- **Risk**: Zustand + TanStack Query の境界混同 → **Mitigation**: design.md で明確に責任分離、store slices pattern strict enforcement
- **Risk**: Feature-Sliced scale-up で shared component boundary 曖昧 → **Mitigation**: code review guidelines, ADR document で shared component decision log
- **Risk**: Jest setup (expo-sqlite mock) が複雑 → **Mitigation**: jest.setup.js で mocking helper 提供, sample test implementation
- **Risk**: ESLint Flat Config 新 (ESLint 9) は adoption risk → **Mitigation**: expo preset latest, community example reference, troubleshooting doc

## References

- [Drizzle ORM - Expo SQLite](https://orm.drizzle.team/docs/connect-expo-sqlite) — Official integration guide
- [Modern SQLite for React Native apps](https://expo.dev/blog/modern-sqlite-for-react-native-apps) — Expo team best practices
- [Zustand GitHub](https://github.com/pmndrs/zustand) — Official repository, examples
- [TanStack Query React Native](https://tanstack.com/query/latest/docs/framework/react/react-native) — Official docs, caching patterns
- [React 19 Upgrade](https://react.dev/blog/2024/12/05/react-19) — Breaking changes, new features
- [Expo Router Docs](https://docs.expo.dev/router/introduction/) — Routing patterns, best practices
- [Unit Testing with Jest](https://docs.expo.dev/develop/unit-testing/) — Expo official testing guide
- [jest-expo on npm](https://www.npmjs.com/package/jest-expo) — Preset configuration
- [ESLint Flat Config Migration](https://eslint.org/docs/latest/use/configure/configuration-files-new) — ESLint 9 format
- CLAUDE.md — Project-specific patterns, kebab-case, @/ alias, theming
