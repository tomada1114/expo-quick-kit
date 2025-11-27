/**
 * Expo Design System - Spacing
 * Apple iOS 8pt Grid System準拠のスペーシング定数
 *
 * Usage:
 *   import { Spacing } from '@/constants/spacing';
 *   <View style={{ padding: Spacing.md, marginBottom: Spacing.lg }}>
 */

// ============================================================
// Spacing Scale（8pt Grid基盤）
// ============================================================

export const Spacing = {
  // Extra small - 4pt（最小単位）
  xs: 4,

  // Small - 8pt
  sm: 8,

  // Medium - 16pt（デフォルト）
  md: 16,

  // Large - 24pt
  lg: 24,

  // Extra large - 32pt
  xl: 32,

  // 2x Extra large - 48pt
  xxl: 48,
} as const;

// ============================================================
// Aliases（セマンティック名）
// ============================================================

export const SpacingAliases = {
  // Container padding（画面全体のパディング）
  containerPadding: Spacing.md,

  // Component padding（カード等の内側パディング）
  componentPadding: Spacing.md,

  // Component gap（要素間のスペース）
  componentGap: Spacing.md,

  // Section margin（セクション間のマージン）
  sectionMargin: Spacing.xl,

  // Row height（リスト項目など）
  rowHeight: 44,

  // Touch target minimum（タッチ可能な最小サイズ）
  touchTargetMin: 44,
} as const;

// ============================================================
// iOS Safe Area（Notch対応）
// ============================================================

export const SafeAreaInsets = {
  // 標準的な Safe Area（Dynamic Island非対応時）
  topDefault: 20,      // Status bar高さ
  bottomDefault: 21,   // Home Indicator高さ

  // Dynamic Island対応（iPhone 14+）
  topDynamicIsland: 54,

  // 標準タブバー高さ
  tabBarHeight: 49,

  // 拡張タブバー（カスタムコンポーネント）
  tabBarHeightExtended: 60,
} as const;

// ============================================================
// Layout Margins（デフォルトマージン）
// ============================================================

export const LayoutMargins = {
  // ページ全体のホリゾンタルマージン
  pageHorizontal: Spacing.md,

  // ページ全体のバーティカルマージン
  pageVertical: Spacing.md,

  // カード間のマージン
  cardMargin: Spacing.md,

  // リスト項目間のマージン
  listItemMargin: Spacing.sm,
} as const;

// ============================================================
// Border Radius（角丸）
// ============================================================

export const BorderRadius = {
  // 小 - 4pt（軽い丸み）
  sm: 4,

  // 中 - 8pt（標準的な丸み）
  md: 8,

  // 大 - 12pt（より丸い）
  lg: 12,

  // 特大 - 16pt（かなり丸い）
  xl: 16,

  // サークル（円形、48x48以上推奨）
  full: 999,
} as const;

// ============================================================
// Z-Index Scale（レイヤー階層）
// ============================================================

export const ZIndex = {
  // 通常のコンテンツ
  base: 0,

  // フローティング要素（FAB等）
  floating: 10,

  // モーダル背景
  modal: 100,

  // モーダルコンテンツ
  modalContent: 101,

  // ポップオーバー
  popover: 110,

  // トースト
  toast: 120,

  // ドロップダウンメニュー
  dropdown: 115,
} as const;

// ============================================================
// Shadow Definitions（影）
// ============================================================

export const Shadows = {
  // 影なし
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  // 小さい影（subtle）
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // 中程度の影（default）
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  // 大きい影（prominent）
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },

  // 特大の影（modal）
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
} as const;

// ============================================================
// Spacing Utilities（ユーティリティ関数）
// ============================================================

/**
 * 複数のスペーシング値を組み合わせて inset 値を生成
 * @param top - 上側スペーシング
 * @param right - 右側スペーシング
 * @param bottom - 下側スペーシング
 * @param left - 左側スペーシング
 * @returns margin/padding オブジェクト
 */
export function createInset(
  top: number,
  right: number = top,
  bottom: number = top,
  left: number = right
) {
  return {
    marginTop: top,
    marginRight: right,
    marginBottom: bottom,
    marginLeft: left,
  };
}

/**
 * パディングオブジェクトを生成
 */
export function createPadding(
  top: number,
  right: number = top,
  bottom: number = top,
  left: number = right
) {
  return {
    paddingTop: top,
    paddingRight: right,
    paddingBottom: bottom,
    paddingLeft: left,
  };
}

/**
 * マージンオブジェクトを生成
 */
export function createMargin(
  top: number,
  right: number = top,
  bottom: number = top,
  left: number = right
) {
  return {
    marginTop: top,
    marginRight: right,
    marginBottom: bottom,
    marginLeft: left,
  };
}

// ============================================================
// Common Layout Patterns（一般的なレイアウトパターン）
// ============================================================

/**
 * リスト項目用パディング
 */
export const ListItemPadding = createPadding(
  Spacing.md, // top/bottom
  Spacing.md, // left/right
);

/**
 * カード用パディング
 */
export const CardPadding = createPadding(Spacing.md);

/**
 * ページ用パディング（上下左右均等）
 */
export const PagePadding = createPadding(Spacing.md);

/**
 * ホリゾンタルマージンのみ（上下マージンなし）
 */
export const HorizontalMargin = {
  marginLeft: Spacing.md,
  marginRight: Spacing.md,
};

/**
 * バーティカルマージンのみ（左右マージンなし）
 */
export const VerticalMargin = {
  marginTop: Spacing.md,
  marginBottom: Spacing.md,
};

// ============================================================
// Export Types
// ============================================================

export type Spacing = typeof Spacing;
export type SpacingValue = typeof Spacing[keyof typeof Spacing];
export type BorderRadius = typeof BorderRadius;
export type BorderRadiusValue = typeof BorderRadius[keyof typeof BorderRadius];
export type ZIndex = typeof ZIndex;
export type ZIndexValue = typeof ZIndex[keyof typeof ZIndex];
export type Shadow = typeof Shadows[keyof typeof Shadows];
