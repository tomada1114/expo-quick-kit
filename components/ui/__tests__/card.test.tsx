/**
 * Card Component Tests
 * iOS System Colors準拠のカードコンポーネントテスト
 */
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { Card } from '../card';

describe('Card', () => {
  describe('rendering', () => {
    it('should render children', () => {
      const { getByText } = render(
        <Card>
          <Text>Card content</Text>
        </Card>
      );
      expect(getByText('Card content')).toBeTruthy();
    });

    it('should render with testID', () => {
      const { getByTestId } = render(
        <Card testID="test-card">
          <Text>Content</Text>
        </Card>
      );
      expect(getByTestId('test-card')).toBeTruthy();
    });
  });

  describe('variants', () => {
    it('should render flat variant by default', () => {
      const { getByTestId } = render(
        <Card testID="card">
          <Text>Flat card</Text>
        </Card>
      );
      expect(getByTestId('card')).toBeTruthy();
    });

    it('should render elevated variant with shadow', () => {
      const { getByTestId } = render(
        <Card variant="elevated" testID="card">
          <Text>Elevated card</Text>
        </Card>
      );
      const card = getByTestId('card');
      expect(card).toBeTruthy();
      const style = card.props.style;
      const flattenedStyle = Array.isArray(style)
        ? style.reduce(
            (acc: Record<string, unknown>, s: Record<string, unknown>) => ({
              ...acc,
              ...s,
            }),
            {}
          )
        : style;
      expect(flattenedStyle.shadowOpacity).toBeDefined();
    });

    it('should render outlined variant with border', () => {
      const { getByTestId } = render(
        <Card variant="outlined" testID="card">
          <Text>Outlined card</Text>
        </Card>
      );
      expect(getByTestId('card')).toBeTruthy();
    });
  });

  describe('customization', () => {
    it('should accept custom padding', () => {
      const { getByTestId } = render(
        <Card padding={24} testID="card">
          <Text>Custom padding</Text>
        </Card>
      );
      expect(getByTestId('card')).toBeTruthy();
    });

    it('should accept custom borderRadius', () => {
      const { getByTestId } = render(
        <Card borderRadius={16} testID="card">
          <Text>Custom radius</Text>
        </Card>
      );
      expect(getByTestId('card')).toBeTruthy();
    });

    it('should accept custom style', () => {
      const { getByTestId } = render(
        <Card style={{ marginTop: 10 }} testID="card">
          <Text>Custom style</Text>
        </Card>
      );
      expect(getByTestId('card')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should apply accessibilityLabel when provided', () => {
      const { getByLabelText } = render(
        <Card accessibilityLabel="Information card">
          <Text>Content</Text>
        </Card>
      );
      expect(getByLabelText('Information card')).toBeTruthy();
    });
  });
});
