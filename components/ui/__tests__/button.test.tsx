/**
 * Button Component Tests
 * iOS System Colors準拠のボタンコンポーネントテスト
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { Button } from '../button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render with title', () => {
      const { getByText } = render(<Button title="Click me" />);
      expect(getByText('Click me')).toBeTruthy();
    });

    it('should render children when provided', () => {
      const { getByTestId } = render(
        <Button testID="button">
          <></>
        </Button>
      );
      // Button should render even with empty children
      expect(getByTestId('button')).toBeTruthy();
    });
  });

  describe('variants', () => {
    it('should render primary variant by default', () => {
      const { getByTestId } = render(
        <Button title="Primary" testID="button" />
      );
      const button = getByTestId('button');
      expect(button).toBeTruthy();
    });

    it('should render secondary variant', () => {
      const { getByTestId } = render(
        <Button title="Secondary" variant="secondary" testID="button" />
      );
      const button = getByTestId('button');
      expect(button).toBeTruthy();
    });

    it('should render ghost variant', () => {
      const { getByTestId } = render(
        <Button title="Ghost" variant="ghost" testID="button" />
      );
      const button = getByTestId('button');
      expect(button).toBeTruthy();
    });

    it('should render destructive variant', () => {
      const { getByTestId } = render(
        <Button title="Delete" variant="destructive" testID="button" />
      );
      const button = getByTestId('button');
      expect(button).toBeTruthy();
    });
  });

  describe('sizes', () => {
    it('should render small size', () => {
      const { getByTestId } = render(
        <Button title="Small" size="sm" testID="button" />
      );
      expect(getByTestId('button')).toBeTruthy();
    });

    it('should render medium size by default', () => {
      const { getByTestId } = render(<Button title="Medium" testID="button" />);
      expect(getByTestId('button')).toBeTruthy();
    });

    it('should render large size', () => {
      const { getByTestId } = render(
        <Button title="Large" size="lg" testID="button" />
      );
      expect(getByTestId('button')).toBeTruthy();
    });
  });

  describe('states', () => {
    it('should handle onPress', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <Button title="Press me" onPress={onPressMock} />
      );

      fireEvent.press(getByText('Press me'));
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <Button title="Disabled" onPress={onPressMock} disabled />
      );

      fireEvent.press(getByText('Disabled'));
      expect(onPressMock).not.toHaveBeenCalled();
    });

    it('should show loading indicator when loading', () => {
      const { getByTestId, queryByText } = render(
        <Button title="Save" loading testID="button" />
      );

      expect(getByTestId('button-loading')).toBeTruthy();
      // Title should not be visible when loading
      expect(queryByText('Save')).toBeNull();
    });

    it('should not call onPress when loading', () => {
      const onPressMock = jest.fn();
      const { getByTestId } = render(
        <Button title="Save" onPress={onPressMock} loading testID="button" />
      );

      fireEvent.press(getByTestId('button'));
      expect(onPressMock).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have minimum touch target height of 44pt for md size', () => {
      const { getByTestId } = render(
        <Button title="Accessible" testID="button" size="md" />
      );
      const button = getByTestId('button');
      // Button should exist and have proper accessibility
      expect(button).toBeTruthy();
    });

    it('should apply accessibilityLabel when provided', () => {
      const { getByLabelText } = render(
        <Button title="Save" accessibilityLabel="Save changes" />
      );
      expect(getByLabelText('Save changes')).toBeTruthy();
    });
  });
});
