import { View, type ViewProps } from 'react-native';

import { useThemedColors } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const { colors, colorScheme } = useThemedColors();
  const backgroundColor =
    (colorScheme === 'light' ? lightColor : darkColor) ??
    colors.background.base;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
