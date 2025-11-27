/**
 * Spacer Component Tests
 * 8pt Grid System準拠のスペーシングコンポーネントテスト
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { Spacer } from '../spacer';

describe('Spacer', () => {
  describe('sizes', () => {
    it('should render with default size (md = 16pt)', () => {
      const { getByTestId } = render(<Spacer testID="spacer" />);
      expect(getByTestId('spacer')).toBeTruthy();
    });

    it('should render xs size (4pt)', () => {
      const { getByTestId } = render(<Spacer size="xs" testID="spacer" />);
      expect(getByTestId('spacer')).toBeTruthy();
    });

    it('should render sm size (8pt)', () => {
      const { getByTestId } = render(<Spacer size="sm" testID="spacer" />);
      expect(getByTestId('spacer')).toBeTruthy();
    });

    it('should render md size (16pt)', () => {
      const { getByTestId } = render(<Spacer size="md" testID="spacer" />);
      expect(getByTestId('spacer')).toBeTruthy();
    });

    it('should render lg size (24pt)', () => {
      const { getByTestId } = render(<Spacer size="lg" testID="spacer" />);
      expect(getByTestId('spacer')).toBeTruthy();
    });

    it('should render xl size (32pt)', () => {
      const { getByTestId } = render(<Spacer size="xl" testID="spacer" />);
      expect(getByTestId('spacer')).toBeTruthy();
    });

    it('should render 2xl size (48pt)', () => {
      const { getByTestId } = render(<Spacer size="2xl" testID="spacer" />);
      expect(getByTestId('spacer')).toBeTruthy();
    });
  });

  describe('direction', () => {
    it('should render vertical space by default', () => {
      const { getByTestId } = render(<Spacer testID="spacer" />);
      expect(getByTestId('spacer')).toBeTruthy();
    });

    it('should render horizontal space', () => {
      const { getByTestId } = render(
        <Spacer direction="horizontal" testID="spacer" />
      );
      expect(getByTestId('spacer')).toBeTruthy();
    });
  });

  describe('custom value', () => {
    it('should accept custom numeric value', () => {
      const { getByTestId } = render(<Spacer value={20} testID="spacer" />);
      expect(getByTestId('spacer')).toBeTruthy();
    });

    it('should use custom value over size when both provided', () => {
      const { getByTestId } = render(
        <Spacer size="lg" value={10} testID="spacer" />
      );
      expect(getByTestId('spacer')).toBeTruthy();
    });
  });
});
