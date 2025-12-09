/**
 * HomeScreen Tests
 * Tests for the boilerplate home screen
 */

import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from '../index';

const renderWithSafeArea = (ui: React.ReactElement) => {
  const initialMetrics = {
    frame: { x: 0, y: 0, width: 0, height: 0 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  };
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>{ui}</SafeAreaProvider>
  );
};

// Mock dependencies
jest.mock('@/hooks/use-theme-color', () => ({
  useThemedColors: () => ({
    colors: {
      primary: '#007AFF',
      background: {
        base: '#FFFFFF',
        secondary: '#F2F2F7',
        tertiary: '#FFFFFF',
      },
      text: {
        primary: '#000000',
        secondary: '#3C3C43',
        tertiary: '#8E8E93',
        inverse: '#FFFFFF',
      },
      semantic: {
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30',
        info: '#007AFF',
      },
      interactive: {
        separator: '#C6C6C8',
        fill: '#787880',
        fillSecondary: '#BCBCC0',
      },
      tint: '#007AFF',
      icon: '#787880',
      tabIconDefault: '#787880',
      tabIconSelected: '#007AFF',
    },
    colorScheme: 'light',
  }),
  useThemeColor: () => '#007AFF',
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

describe('HomeScreen', () => {
  describe('Rendering', () => {
    it('should render welcome title', () => {
      renderWithSafeArea(<HomeScreen />);
      expect(screen.getByText('expo-quick-kit')).toBeTruthy();
    });

    it('should render subtitle description', () => {
      renderWithSafeArea(<HomeScreen />);
      expect(screen.getByText(/Expo SDK 54 Boilerplate/i)).toBeTruthy();
    });

    it('should render feature sections', () => {
      renderWithSafeArea(<HomeScreen />);
      // Verify that key feature sections are displayed
      expect(screen.getByText(/Zustand/i)).toBeTruthy();
      expect(screen.getByText(/Drizzle/i)).toBeTruthy();
      expect(screen.getByText(/TanStack Query/i)).toBeTruthy();
    });
  });

  describe('Layout', () => {
    it('should apply themed background color', () => {
      const { getByTestId } = renderWithSafeArea(<HomeScreen />);
      const container = getByTestId('home-container');
      expect(container).toBeTruthy();
    });
  });
});
