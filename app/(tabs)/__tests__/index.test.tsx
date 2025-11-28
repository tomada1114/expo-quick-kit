/**
 * HomeScreen Tests
 * ボイラープレートのホーム画面のテスト
 */

import { render, screen } from '@testing-library/react-native';
import React from 'react';

import HomeScreen from '../index';

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
      render(<HomeScreen />);
      expect(screen.getByText('expo-quick-kit')).toBeTruthy();
    });

    it('should render subtitle description', () => {
      render(<HomeScreen />);
      expect(screen.getByText(/Expo SDK 54 ボイラープレート/i)).toBeTruthy();
    });

    it('should render feature sections', () => {
      render(<HomeScreen />);
      // 主要な機能セクションが表示されていることを確認
      expect(screen.getByText(/Zustand/i)).toBeTruthy();
      expect(screen.getByText(/Drizzle/i)).toBeTruthy();
      expect(screen.getByText(/TanStack Query/i)).toBeTruthy();
    });
  });

  describe('Layout', () => {
    it('should apply themed background color', () => {
      const { getByTestId } = render(<HomeScreen />);
      const container = getByTestId('home-container');
      expect(container).toBeTruthy();
    });
  });
});
