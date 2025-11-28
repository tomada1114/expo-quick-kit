/**
 * TabLayout Tests
 *
 * Tests for tab navigation, theming, and screen configuration
 */

/* eslint-disable @typescript-eslint/no-require-imports, import/first */

import React from 'react';

// Mock expo-router
const mockTabs = jest.fn();
const mockTabsScreen = jest.fn();

jest.mock('expo-router', () => {
  const { View } = require('react-native');

  const TabsScreen = (props: {
    name: string;
    options: Record<string, unknown>;
  }) => {
    mockTabsScreen(props);
    return null;
  };

  const Tabs = (props: {
    screenOptions: Record<string, unknown>;
    children: React.ReactNode;
  }) => {
    mockTabs(props);
    return <View testID="tabs-navigator">{props.children}</View>;
  };

  Tabs.Screen = TabsScreen;

  return { Tabs };
});

// Mock IconSymbol component
jest.mock('@/components/ui/icon-symbol', () => ({
  IconSymbol: ({
    name,
    color,
    size,
  }: {
    name: string;
    color: string;
    size: number;
  }) => {
    const { View } = require('react-native');
    return (
      <View
        testID={`icon-${name}`}
        accessibilityLabel={`${name}-${color}-${size}`}
      />
    );
  },
}));

// Mock useColorScheme
let mockColorScheme: 'light' | 'dark' = 'light';
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => mockColorScheme,
}));

// Import after mocks
import { render, screen } from '@testing-library/react-native';
import { Colors } from '@/constants/theme';
import TabLayout from '@/app/(tabs)/_layout';

describe('TabLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockColorScheme = 'light';
  });

  describe('Tab Configuration', () => {
    it('should render Tabs navigator', () => {
      render(<TabLayout />);
      expect(screen.getByTestId('tabs-navigator')).toBeTruthy();
    });

    it('should configure index screen with Home title', () => {
      render(<TabLayout />);

      const indexScreenCall = mockTabsScreen.mock.calls.find(
        (call) => call[0].name === 'index'
      );

      expect(indexScreenCall).toBeTruthy();
      expect(indexScreenCall[0].options.title).toBe('Home');
    });

    it('should not configure explore screen (removed from boilerplate)', () => {
      render(<TabLayout />);

      const exploreScreenCall = mockTabsScreen.mock.calls.find(
        (call) => call[0].name === 'explore'
      );

      // Explore tab has been removed from the boilerplate
      expect(exploreScreenCall).toBeFalsy();
    });
  });

  describe('Theme Support - Light Mode', () => {
    beforeEach(() => {
      mockColorScheme = 'light';
    });

    it('should use light mode tint color for active tab', () => {
      render(<TabLayout />);

      expect(mockTabs).toHaveBeenCalledWith(
        expect.objectContaining({
          screenOptions: expect.objectContaining({
            tabBarActiveTintColor: Colors.light.tint,
          }),
        })
      );
    });

    it('should use light mode inactive tint color', () => {
      render(<TabLayout />);

      expect(mockTabs).toHaveBeenCalledWith(
        expect.objectContaining({
          screenOptions: expect.objectContaining({
            tabBarInactiveTintColor: Colors.light.tabIconDefault,
          }),
        })
      );
    });

    it('should use light mode background color for tab bar', () => {
      render(<TabLayout />);

      expect(mockTabs).toHaveBeenCalledWith(
        expect.objectContaining({
          screenOptions: expect.objectContaining({
            tabBarStyle: expect.objectContaining({
              backgroundColor: Colors.light.background.base,
            }),
          }),
        })
      );
    });

    it('should use light mode separator color for tab bar border', () => {
      render(<TabLayout />);

      expect(mockTabs).toHaveBeenCalledWith(
        expect.objectContaining({
          screenOptions: expect.objectContaining({
            tabBarStyle: expect.objectContaining({
              borderTopColor: Colors.light.interactive.separator,
            }),
          }),
        })
      );
    });
  });

  describe('Theme Support - Dark Mode', () => {
    beforeEach(() => {
      mockColorScheme = 'dark';
    });

    it('should use dark mode tint color for active tab', () => {
      render(<TabLayout />);

      expect(mockTabs).toHaveBeenCalledWith(
        expect.objectContaining({
          screenOptions: expect.objectContaining({
            tabBarActiveTintColor: Colors.dark.tint,
          }),
        })
      );
    });

    it('should use dark mode inactive tint color', () => {
      render(<TabLayout />);

      expect(mockTabs).toHaveBeenCalledWith(
        expect.objectContaining({
          screenOptions: expect.objectContaining({
            tabBarInactiveTintColor: Colors.dark.tabIconDefault,
          }),
        })
      );
    });

    it('should use dark mode background color for tab bar', () => {
      render(<TabLayout />);

      expect(mockTabs).toHaveBeenCalledWith(
        expect.objectContaining({
          screenOptions: expect.objectContaining({
            tabBarStyle: expect.objectContaining({
              backgroundColor: Colors.dark.background.base,
            }),
          }),
        })
      );
    });

    it('should use dark mode separator color for tab bar border', () => {
      render(<TabLayout />);

      expect(mockTabs).toHaveBeenCalledWith(
        expect.objectContaining({
          screenOptions: expect.objectContaining({
            tabBarStyle: expect.objectContaining({
              borderTopColor: Colors.dark.interactive.separator,
            }),
          }),
        })
      );
    });
  });

  describe('Tab Bar Options', () => {
    it('should hide header', () => {
      render(<TabLayout />);

      expect(mockTabs).toHaveBeenCalledWith(
        expect.objectContaining({
          screenOptions: expect.objectContaining({
            headerShown: false,
          }),
        })
      );
    });
  });

  describe('Tab Icons', () => {
    it('should configure Home tab with house.fill icon', () => {
      render(<TabLayout />);

      const indexScreenCall = mockTabsScreen.mock.calls.find(
        (call) => call[0].name === 'index'
      );

      expect(indexScreenCall).toBeTruthy();
      expect(indexScreenCall[0].options.tabBarIcon).toBeDefined();

      // Render the icon function to verify it produces correct icon
      const iconFn = indexScreenCall[0].options.tabBarIcon;
      const iconElement = iconFn({ color: '#007AFF' });
      expect(iconElement.props.name).toBe('house.fill');
      expect(iconElement.props.size).toBe(28);
    });

    it('should not have Explore tab icon (removed from boilerplate)', () => {
      render(<TabLayout />);

      const exploreScreenCall = mockTabsScreen.mock.calls.find(
        (call) => call[0].name === 'explore'
      );

      // Explore tab has been removed from the boilerplate
      expect(exploreScreenCall).toBeFalsy();
    });
  });
});
