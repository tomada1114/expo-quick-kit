import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemedColors } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const { colors, colorScheme } = useThemedColors();

  // Determine text color based on type and custom color props
  const getColor = () => {
    const customColor = colorScheme === 'light' ? lightColor : darkColor;
    if (customColor) return customColor;

    // Link type uses semantic.info color (iOS Blue)
    if (type === 'link') return colors.semantic.info;

    return colors.text.primary;
  };

  return (
    <Text
      style={[
        { color: getColor() },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    // color is applied dynamically via getColor() to support theming
  },
});
