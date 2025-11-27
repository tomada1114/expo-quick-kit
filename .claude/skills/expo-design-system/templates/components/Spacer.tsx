/**
 * Expo Design System - Spacer Component
 * 要素間のスペーシング用コンポーネント
 *
 * Usage:
 *   <View>
 *     <Text>Content 1</Text>
 *     <Spacer size="md" />
 *     <Text>Content 2</Text>
 *   </View>
 */

import React from 'react';
import { View } from 'react-native';
import { Spacing, SpacingValue } from '../spacing';

// ============================================================
// Types
// ============================================================

interface SpacerProps {
  /** スペーシングのサイズ */
  size?: keyof typeof Spacing | number;

  /** 方向 */
  direction?: 'vertical' | 'horizontal';

  /** flex を追加（スペースを埋める） */
  flex?: boolean;
}

// ============================================================
// Spacer Component
// ============================================================

export function Spacer({
  size = 'md',
  direction = 'vertical',
  flex = false,
}: SpacerProps) {
  // サイズ値を取得
  const spaceValue: number =
    typeof size === 'number' ? size : Spacing[size as keyof typeof Spacing];

  const style =
    direction === 'vertical'
      ? {
          height: spaceValue,
          width: flex ? '100%' : undefined,
        }
      : {
          width: spaceValue,
          height: flex ? '100%' : undefined,
        };

  return <View style={[style, flex && { flex: 1 }]} />;
}

// ============================================================
// Export
// ============================================================

export default Spacer;
