/**
 * _example Feature Component Tests
 *
 * Tests cover:
 * - ItemCard: Rendering, press handling
 * - ItemList: Empty state, list rendering, refresh
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ItemCard } from '../components/item-card';
import { ItemList } from '../components/item-list';
import type { Item } from '../types';

// Mock themed colors hook
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
    },
    colorScheme: 'light',
  }),
}));

const createMockItem = (overrides?: Partial<Item>): Item => ({
  id: 1,
  title: 'Test Item',
  description: 'Test description',
  createdAt: new Date('2024-01-15'),
  ...overrides,
});

describe('ItemCard', () => {
  it('should render item title', () => {
    const item = createMockItem();
    const { getByText } = render(<ItemCard item={item} />);

    expect(getByText('Test Item')).toBeTruthy();
  });

  it('should render item description when provided', () => {
    const item = createMockItem({ description: 'My description' });
    const { getByText } = render(<ItemCard item={item} />);

    expect(getByText('My description')).toBeTruthy();
  });

  it('should not render description when not provided', () => {
    const item = createMockItem({ description: null });
    const { queryByText } = render(<ItemCard item={item} />);

    // Should not find description text (only title should be present)
    expect(queryByText('Test description')).toBeNull();
  });

  it('should render formatted date', () => {
    const item = createMockItem({ createdAt: new Date('2024-01-15') });
    const { getByText } = render(<ItemCard item={item} />);

    // Japanese locale format: "2024年1月15日"
    expect(getByText(/2024/)).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const item = createMockItem();
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ItemCard item={item} onPress={onPress} testID="item-card" />
    );

    fireEvent.press(getByTestId('item-card'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should have accessibility label', () => {
    const item = createMockItem({
      title: 'Accessible Item',
      description: 'With description',
    });
    const { getByLabelText } = render(<ItemCard item={item} />);

    expect(getByLabelText('Accessible Item, With description')).toBeTruthy();
  });
});

describe('ItemList', () => {
  it('should render empty state when items array is empty', () => {
    const { getByText } = render(<ItemList items={[]} />);

    expect(getByText('アイテムがありません')).toBeTruthy();
    expect(getByText('新しいアイテムを追加してください')).toBeTruthy();
  });

  it('should render list of items', () => {
    const items = [
      createMockItem({ id: 1, title: 'Item 1' }),
      createMockItem({ id: 2, title: 'Item 2' }),
    ];
    const { getByText } = render(<ItemList items={items} />);

    expect(getByText('Item 1')).toBeTruthy();
    expect(getByText('Item 2')).toBeTruthy();
  });

  it('should call onItemPress with item id when item is pressed', () => {
    const items = [createMockItem({ id: 42, title: 'Pressable Item' })];
    const onItemPress = jest.fn();
    const { getByTestId } = render(
      <ItemList items={items} onItemPress={onItemPress} />
    );

    fireEvent.press(getByTestId('item-card-42'));

    expect(onItemPress).toHaveBeenCalledWith(42);
  });

  it('should render with testID', () => {
    const items = [createMockItem()];
    const { getByTestId } = render(
      <ItemList items={items} testID="item-list" />
    );

    expect(getByTestId('item-list')).toBeTruthy();
  });
});
