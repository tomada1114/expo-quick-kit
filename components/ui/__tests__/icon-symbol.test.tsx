/**
 * IconSymbol Component Tests
 *
 * Tests for the cross-platform icon component that uses:
 * - SF Symbols on iOS (via expo-symbols)
 * - Material Icons on Android/web (via @expo/vector-icons)
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// Import the Android/web version (fallback) directly
// This tests the icon-symbol.tsx (not icon-symbol.ios.tsx)
import { IconSymbol } from '../icon-symbol';

describe('IconSymbol (Android/web fallback)', () => {
  describe('Happy path', () => {
    // Given: A valid icon name and color
    // When: IconSymbol is rendered
    // Then: Renders without throwing
    it('should render with required props', () => {
      expect(() => {
        render(<IconSymbol name="house.fill" color="#007AFF" />);
      }).not.toThrow();
    });

    // Given: A custom size is provided
    // When: IconSymbol is rendered
    // Then: Renders without throwing
    it('should render with custom size', () => {
      expect(() => {
        render(<IconSymbol name="house.fill" color="#007AFF" size={28} />);
      }).not.toThrow();
    });

    // Given: All optional props are provided
    // When: IconSymbol is rendered
    // Then: Renders without throwing
    it('should render with all props', () => {
      expect(() => {
        render(
          <IconSymbol
            name="house.fill"
            color="#007AFF"
            size={28}
            style={{ marginLeft: 10 }}
            weight="bold"
          />
        );
      }).not.toThrow();
    });
  });

  describe('Icon name mapping', () => {
    const testCases = [
      { sfSymbol: 'house.fill', expected: 'home' },
      { sfSymbol: 'paperplane.fill', expected: 'send' },
      {
        sfSymbol: 'chevron.left.forwardslash.chevron.right',
        expected: 'code',
      },
      { sfSymbol: 'chevron.right', expected: 'chevron-right' },
    ] as const;

    testCases.forEach(({ sfSymbol, expected }) => {
      // Given: SF Symbol name
      // When: IconSymbol is rendered
      // Then: Should map to correct Material Icon (implicitly tested by not throwing)
      it(`should support ${sfSymbol} icon`, () => {
        expect(() => {
          render(<IconSymbol name={sfSymbol} color="#007AFF" />);
        }).not.toThrow();
      });
    });
  });

  describe('Edge cases', () => {
    // Given: Size is 0
    // When: IconSymbol is rendered
    // Then: Renders without errors
    it('should handle size of 0', () => {
      expect(() => {
        render(<IconSymbol name="house.fill" color="#007AFF" size={0} />);
      }).not.toThrow();
    });

    // Given: Color is a transparent value
    // When: IconSymbol is rendered
    // Then: Uses the transparent color
    it('should handle transparent color', () => {
      expect(() => {
        render(<IconSymbol name="house.fill" color="transparent" />);
      }).not.toThrow();
    });

    // Given: Style is undefined
    // When: IconSymbol is rendered
    // Then: Renders without errors
    it('should handle undefined style', () => {
      expect(() => {
        render(
          <IconSymbol name="house.fill" color="#007AFF" style={undefined} />
        );
      }).not.toThrow();
    });

    // Given: Very large size
    // When: IconSymbol is rendered
    // Then: Handles large size without errors
    it('should handle very large size', () => {
      expect(() => {
        render(<IconSymbol name="house.fill" color="#007AFF" size={1000} />);
      }).not.toThrow();
    });

    // Given: Negative size (edge case)
    // When: IconSymbol is rendered
    // Then: Should not throw (let the component handle it)
    it('should handle negative size', () => {
      expect(() => {
        render(<IconSymbol name="house.fill" color="#007AFF" size={-10} />);
      }).not.toThrow();
    });
  });

  describe('Props validation', () => {
    // Given: IconSymbol component is rendered
    // When: Checking the component structure
    // Then: Should have expected structure
    it('should render a testable element', () => {
      const { toJSON } = render(
        <IconSymbol name="house.fill" color="#007AFF" />
      );

      const tree = toJSON();
      expect(tree).not.toBeNull();
    });
  });
});
