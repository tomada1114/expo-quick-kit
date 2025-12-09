/**
 * Home Screen
 * Main home screen of the boilerplate
 */

import React, { useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacer } from '@/components/ui/spacer';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useThemedColors } from '@/hooks/use-theme-color';

interface FeatureItem {
  title: string;
  description: string;
}

const features: FeatureItem[] = [
  {
    title: 'Zustand',
    description:
      'Simple and lightweight state management. Persistence support with persist middleware.',
  },
  {
    title: 'Drizzle ORM',
    description:
      'Type-safe SQLite database operations. Works with expo-sqlite.',
  },
  {
    title: 'TanStack Query',
    description: 'Asynchronous data caching and fetch management.',
  },
  {
    title: 'expo-router',
    description: 'File-based routing. Type-safe navigation.',
  },
];

export default function HomeScreen() {
  const { colors } = useThemedColors();
  const { top } = useSafeAreaInsets();
  const [fadeAnims] = useState(
    features.map(() => new Animated.Value(0))
  );

  // Animate feature cards on mount with staggered effect
  useEffect(() => {
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnims]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.base }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: top + Spacing.lg },
      ]}
      testID="home-container"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerWrapper}>
        <ThemedText style={styles.title}>expo-quick-kit</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.text.secondary }]}>
          Expo SDK 54 Boilerplate
        </ThemedText>
      </View>

      <Spacer size="xl" />

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <ThemedText
          style={[styles.sectionLabel, { color: colors.text.tertiary }]}
        >
          KEY FEATURES
        </ThemedText>

        <Spacer size="md" />

        {features.map((feature, index) => (
          <Animated.View
            key={feature.title}
            style={[
              styles.featureCardWrapper,
              {
                opacity: fadeAnims[index],
                transform: [
                  {
                    translateY: fadeAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.featureCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.interactive.separator,
                },
              ]}
            >
              {/* Feature accent line */}
              <View
                style={[
                  styles.featureAccent,
                  { backgroundColor: colors.primary },
                ]}
              />

              <ThemedText
                style={[styles.featureTitle, { color: colors.text.primary }]}
              >
                {feature.title}
              </ThemedText>

              <Spacer size="xs" />

              <ThemedText
                style={[
                  styles.featureDescription,
                  { color: colors.text.secondary },
                ]}
              >
                {feature.description}
              </ThemedText>
            </View>
          </Animated.View>
        ))}
      </View>

      <Spacer size="2xl" />

      {/* Footer */}
      <View style={styles.footerContainer}>
        <ThemedText
          style={[styles.footerText, { color: colors.text.tertiary }]}
        >
          Explore features/_example/ for implementation details
        </ThemedText>
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },

  // ===== Header Section =====
  headerWrapper: {
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.largeTitle,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.subheadline,
    marginTop: Spacing.sm,
  },

  // ===== Features Section =====
  featuresSection: {
    width: '100%',
  },
  sectionLabel: {
    ...Typography.caption1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  featureCardWrapper: {
    marginBottom: Spacing.md,
  },
  featureCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.sm,
  },

  featureAccent: {
    width: 3,
    height: 24,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },

  featureTitle: {
    ...Typography.headline,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    ...Typography.subheadline,
    lineHeight: 20,
  },

  // ===== Footer Section =====
  footerContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  footerText: {
    ...Typography.caption1,
    textAlign: 'center',
    lineHeight: 16,
  },
});
