/**
 * Home Screen
 * Main home screen of the boilerplate
 */

import { StyleSheet, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Spacer } from '@/components/ui/spacer';
import { Spacing, Typography } from '@/constants/theme';
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.base }]}
      contentContainerStyle={styles.contentContainer}
      testID="home-container"
    >
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>expo-quick-kit</ThemedText>
        <Spacer size="sm" />
        <ThemedText style={styles.subtitle}>Expo SDK 54 Boilerplate</ThemedText>
      </ThemedView>

      <Spacer size="lg" />

      <View style={styles.featuresSection}>
        <ThemedText style={styles.sectionTitle}>Key Features</ThemedText>
        <Spacer size="sm" />

        {features.map((feature, index) => (
          <View key={feature.title}>
            <Card style={styles.featureCard}>
              <ThemedText style={styles.featureTitle}>
                {feature.title}
              </ThemedText>
              <Spacer size="xs" />
              <ThemedText style={styles.featureDescription}>
                {feature.description}
              </ThemedText>
            </Card>
            {index < features.length - 1 && <Spacer size="sm" />}
          </View>
        ))}
      </View>

      <Spacer size="lg" />

      <ThemedView style={styles.footer}>
        <ThemedText style={styles.footerText}>
          See features/_example/ for details
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    ...Typography.largeTitle,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.body,
  },
  featuresSection: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.headline,
  },
  featureCard: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  featureTitle: {
    ...Typography.headline,
  },
  featureDescription: {
    ...Typography.subheadline,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  footerText: {
    ...Typography.caption1,
  },
});
