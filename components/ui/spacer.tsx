/**
 * Spacer Component
 * Spacing component compliant with 8pt Grid System
 *
 * Usage:
 *   <Spacer />  // 16pt vertical
 *   <Spacer size="lg" />  // 24pt vertical
 *   <Spacer size="sm" direction="horizontal" />  // 8pt horizontal
 *   <Spacer value={20} />  // custom 20pt
 */
import React from 'react';
import { View, type ViewProps } from 'react-native';

import { Spacing } from '@/constants/theme';

export type SpacerSize = keyof typeof Spacing;
export type SpacerDirection = 'vertical' | 'horizontal';

export interface SpacerProps extends ViewProps {
  /** Predefined size from Spacing constants */
  size?: SpacerSize;
  /** Direction of spacing */
  direction?: SpacerDirection;
  /** Custom value (overrides size) */
  value?: number;
}

export function Spacer({
  size = 'md',
  direction = 'vertical',
  value,
  testID,
  ...props
}: SpacerProps) {
  const spacing = value ?? Spacing[size];

  const style =
    direction === 'vertical'
      ? { height: spacing, width: '100%' as const }
      : { width: spacing, height: '100%' as const };

  return <View testID={testID} style={style} {...props} />;
}
