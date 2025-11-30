/**
 * SubscriptionDemo Component Tests
 *
 * Test coverage:
 * - Subscription status display (free/premium tier)
 * - Usage limits display (maxItems, maxExports, hasAds)
 * - Feature gating checks (basic/premium levels)
 * - Purchase and restore actions
 * - Error handling and loading states
 */

import React from 'react';
import { Alert } from 'react-native';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';

import { SubscriptionDemo } from '../components/subscription-demo';
import { useSubscription } from '@/features/subscription';

// Mock useSubscription hook
jest.mock('@/features/subscription', () => ({
  useSubscription: jest.fn(),
}));

// Mock Alert.alert separately
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const mockUseSubscription = useSubscription as jest.MockedFunction<
  typeof useSubscription
>;

describe('SubscriptionDemo Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Free user display', () => {
    beforeEach(() => {
      mockUseSubscription.mockReturnValue({
        subscription: {
          isActive: false,
          tier: 'free',
          expiresAt: null,
          productId: null,
        },
        isPremium: false,
        isFree: true,
        usageLimits: {
          maxItems: 10,
          maxExports: 1,
          hasAds: true,
        },
        loading: false,
        error: null,
        purchasePackage: jest.fn(),
        restorePurchases: jest.fn(),
        canAccessFeature: jest.fn((level: string) => level === 'basic'),
        refetchSubscription: jest.fn(),
      });
    });

    it('should display free tier badge', () => {
      render(<SubscriptionDemo />);
      expect(screen.getByText('無料')).toBeTruthy();
    });

    it('should display correct free tier usage limits', () => {
      render(<SubscriptionDemo />);
      expect(screen.getByText('10')).toBeTruthy();
      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('あり')).toBeTruthy();
    });

    it('should allow basic feature access', () => {
      render(<SubscriptionDemo />);
      expect(screen.getByText('基本機能')).toBeTruthy();
    });

    it('should deny premium feature access', () => {
      render(<SubscriptionDemo />);
      expect(screen.getAllByText('ロック中')).toHaveLength(1);
    });
  });

  describe('Premium user display', () => {
    beforeEach(() => {
      mockUseSubscription.mockReturnValue({
        subscription: {
          isActive: true,
          tier: 'premium',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          productId: 'annual_plan',
        },
        isPremium: true,
        isFree: false,
        usageLimits: {
          maxItems: Infinity,
          maxExports: Infinity,
          hasAds: false,
        },
        loading: false,
        error: null,
        purchasePackage: jest.fn(),
        restorePurchases: jest.fn(),
        canAccessFeature: jest.fn(() => true),
        refetchSubscription: jest.fn(),
      });
    });

    it('should display premium tier badge', () => {
      render(<SubscriptionDemo />);
      expect(screen.getByText('プレミアム')).toBeTruthy();
    });

    it('should display unlimited usage limits', () => {
      render(<SubscriptionDemo />);
      expect(screen.getAllByText('無制限')).toHaveLength(2);
    });

    it('should display no ads for premium user', () => {
      render(<SubscriptionDemo />);
      expect(screen.getByText('なし')).toBeTruthy();
    });

    it('should allow premium feature access', () => {
      render(<SubscriptionDemo />);
      expect(screen.getAllByText('アクセス可')).toHaveLength(2);
    });

    it('should display expiration date', () => {
      render(<SubscriptionDemo />);
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const dateString = futureDate.toLocaleDateString('ja-JP');
      expect(screen.getByText(dateString)).toBeTruthy();
    });
  });

  describe('Loading state', () => {
    beforeEach(() => {
      mockUseSubscription.mockReturnValue({
        subscription: null,
        isPremium: false,
        isFree: true,
        usageLimits: {
          maxItems: 0,
          maxExports: 0,
          hasAds: false,
        },
        loading: true,
        error: null,
        purchasePackage: jest.fn(),
        restorePurchases: jest.fn(),
        canAccessFeature: jest.fn(),
        refetchSubscription: jest.fn(),
      });
    });

    it('should display loading message', () => {
      render(<SubscriptionDemo />);
      expect(
        screen.getByText('サブスクリプション情報を読み込み中...')
      ).toBeTruthy();
    });
  });

  describe('Purchase action', () => {
    let mockPurchasePackage: jest.Mock;

    beforeEach(() => {
      mockPurchasePackage = jest.fn().mockResolvedValue(undefined);
      mockUseSubscription.mockReturnValue({
        subscription: {
          isActive: false,
          tier: 'free',
          expiresAt: null,
          productId: null,
        },
        isPremium: false,
        isFree: true,
        usageLimits: {
          maxItems: 10,
          maxExports: 1,
          hasAds: true,
        },
        loading: false,
        error: null,
        purchasePackage: mockPurchasePackage,
        restorePurchases: jest.fn(),
        canAccessFeature: jest.fn((level: string) => level === 'basic'),
        refetchSubscription: jest.fn(),
      });
    });

    it('should call purchasePackage with correct package ID on monthly button press', async () => {
      render(<SubscriptionDemo />);

      const monthlyButton = screen.getByText('月額プランを購入');
      fireEvent.press(monthlyButton);

      await waitFor(() => {
        expect(mockPurchasePackage).toHaveBeenCalledWith('$rc_monthly');
      });
    });

    it('should call purchasePackage with correct package ID on annual button press', async () => {
      render(<SubscriptionDemo />);

      const annualButton = screen.getByText('年額プランを購入');
      fireEvent.press(annualButton);

      await waitFor(() => {
        expect(mockPurchasePackage).toHaveBeenCalledWith('$rc_annual');
      });
    });

    it('should show success alert on successful purchase', async () => {
      render(<SubscriptionDemo />);

      const monthlyButton = screen.getByText('月額プランを購入');
      fireEvent.press(monthlyButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '成功',
          '購入処理が完了しました'
        );
      });
    });

    it('should show error alert on purchase failure', async () => {
      mockPurchasePackage.mockRejectedValueOnce(
        new Error('購入処理に失敗しました')
      );

      render(<SubscriptionDemo />);

      const monthlyButton = screen.getByText('月額プランを購入');
      fireEvent.press(monthlyButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'エラー',
          '購入処理に失敗しました'
        );
      });
    });
  });

  describe('Restore action', () => {
    let mockRestorePurchases: jest.Mock;

    beforeEach(() => {
      mockRestorePurchases = jest.fn().mockResolvedValue(undefined);
      mockUseSubscription.mockReturnValue({
        subscription: {
          isActive: false,
          tier: 'free',
          expiresAt: null,
          productId: null,
        },
        isPremium: false,
        isFree: true,
        usageLimits: {
          maxItems: 10,
          maxExports: 1,
          hasAds: true,
        },
        loading: false,
        error: null,
        purchasePackage: jest.fn(),
        restorePurchases: mockRestorePurchases,
        canAccessFeature: jest.fn((level: string) => level === 'basic'),
        refetchSubscription: jest.fn(),
      });
    });

    it('should call restorePurchases on restore button press', async () => {
      render(<SubscriptionDemo />);

      const restoreButton = screen.getByText('購入を復元');
      fireEvent.press(restoreButton);

      await waitFor(() => {
        expect(mockRestorePurchases).toHaveBeenCalled();
      });
    });

    it('should show success alert on successful restore', async () => {
      render(<SubscriptionDemo />);

      const restoreButton = screen.getByText('購入を復元');
      fireEvent.press(restoreButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('成功', '購入を復元しました');
      });
    });

    it('should show error alert on restore failure', async () => {
      mockRestorePurchases.mockRejectedValueOnce(
        new Error('復元処理に失敗しました')
      );

      render(<SubscriptionDemo />);

      const restoreButton = screen.getByText('購入を復元');
      fireEvent.press(restoreButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'エラー',
          '復元処理に失敗しました'
        );
      });
    });
  });

  describe('Feature gating display', () => {
    it('should show feature access status correctly', () => {
      mockUseSubscription.mockReturnValue({
        subscription: {
          isActive: true,
          tier: 'premium',
          expiresAt: null,
          productId: 'monthly_plan',
        },
        isPremium: true,
        isFree: false,
        usageLimits: {
          maxItems: Infinity,
          maxExports: Infinity,
          hasAds: false,
        },
        loading: false,
        error: null,
        purchasePackage: jest.fn(),
        restorePurchases: jest.fn(),
        canAccessFeature: jest.fn(
          (level: string) => level === 'premium' || level === 'basic'
        ),
        refetchSubscription: jest.fn(),
      });

      render(<SubscriptionDemo />);

      expect(screen.getByText('基本機能')).toBeTruthy();
      expect(screen.getByText('プレミアム機能')).toBeTruthy();
    });
  });

  describe('Accessibility and rendering', () => {
    beforeEach(() => {
      mockUseSubscription.mockReturnValue({
        subscription: {
          isActive: false,
          tier: 'free',
          expiresAt: null,
          productId: null,
        },
        isPremium: false,
        isFree: true,
        usageLimits: {
          maxItems: 10,
          maxExports: 1,
          hasAds: true,
        },
        loading: false,
        error: null,
        purchasePackage: jest.fn(),
        restorePurchases: jest.fn(),
        canAccessFeature: jest.fn((level: string) => level === 'basic'),
        refetchSubscription: jest.fn(),
      });
    });

    it('should render with testID', () => {
      const { getByTestId } = render(
        <SubscriptionDemo testID="subscription-demo" />
      );
      expect(getByTestId('subscription-demo')).toBeTruthy();
    });

    it('should display all section headers', () => {
      render(<SubscriptionDemo />);

      expect(screen.getByText('サブスクリプション機能デモ')).toBeTruthy();
      expect(screen.getByText('1. サブスクリプション状態')).toBeTruthy();
      expect(screen.getByText('2. 利用制限')).toBeTruthy();
      expect(screen.getByText('3. 機能制限')).toBeTruthy();
      expect(screen.getByText('4. 購入と復元アクション')).toBeTruthy();
    });

    it('should render ScrollView for content', () => {
      const { getByTestId } = render(
        <SubscriptionDemo testID="subscription-demo" />
      );
      expect(getByTestId('subscription-demo')).toBeTruthy();
    });
  });
});
