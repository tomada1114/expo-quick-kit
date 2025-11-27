/**
 * LoadingOverlay Component Tests
 * フルスクリーンローディング表示コンポーネントテスト
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { LoadingOverlay } from '../loading-overlay';

describe('LoadingOverlay', () => {
  describe('visibility', () => {
    it('should render when visible is true', () => {
      const { getByTestId } = render(
        <LoadingOverlay visible testID="loading" />
      );
      expect(getByTestId('loading')).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      const { queryByTestId } = render(
        <LoadingOverlay visible={false} testID="loading" />
      );
      expect(queryByTestId('loading')).toBeNull();
    });
  });

  describe('content', () => {
    it('should render activity indicator', () => {
      const { getByTestId } = render(
        <LoadingOverlay visible testID="loading" />
      );
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should render message when provided', () => {
      const { getByText } = render(
        <LoadingOverlay visible message="Loading..." />
      );
      expect(getByText('Loading...')).toBeTruthy();
    });

    it('should not render message when not provided', () => {
      const { queryByTestId } = render(
        <LoadingOverlay visible testID="loading" />
      );
      expect(queryByTestId('loading-message')).toBeNull();
    });
  });

  describe('customization', () => {
    it('should accept custom style', () => {
      const { getByTestId } = render(
        <LoadingOverlay
          visible
          testID="loading"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        />
      );
      expect(getByTestId('loading')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have accessibility label', () => {
      const { getByLabelText } = render(
        <LoadingOverlay visible accessibilityLabel="Loading content" />
      );
      expect(getByLabelText('Loading content')).toBeTruthy();
    });

    it('should use default accessibility label when not provided', () => {
      const { getByLabelText } = render(<LoadingOverlay visible />);
      expect(getByLabelText('Loading')).toBeTruthy();
    });
  });
});
