/**
 * NotificationDemo Component Tests
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

import { NotificationDemo } from '../components/notification-demo';
import * as NotificationService from '@/services/notifications';

// Mock the notification service
jest.mock('@/services/notifications', () => ({
  requestNotificationPermissions: jest.fn(),
  scheduleNotification: jest.fn(),
  cancelNotification: jest.fn(),
  getAllScheduledNotifications: jest.fn(),
}));

// Mock Linking for settings
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openSettings: jest.fn(),
}));

describe('NotificationDemo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      NotificationService.getAllScheduledNotifications as jest.Mock
    ).mockResolvedValue([]);
  });

  it('should render correctly with initial state', async () => {
    const { getByText } = render(
      <NotificationDemo testID="notification-demo" />
    );

    // Wait for initial useEffect to complete
    await waitFor(() => {
      expect(getByText('Push Notifications')).toBeTruthy();
      expect(getByText('Request Permission')).toBeTruthy();
    });
  });

  it('should request permissions when button is pressed', async () => {
    (
      NotificationService.requestNotificationPermissions as jest.Mock
    ).mockResolvedValue({
      status: 'granted',
      token: 'ExponentPushToken[test]',
    });

    const { getByText } = render(
      <NotificationDemo testID="notification-demo" />
    );

    await act(async () => {
      fireEvent.press(getByText('Request Permission'));
    });

    await waitFor(() => {
      expect(
        NotificationService.requestNotificationPermissions
      ).toHaveBeenCalled();
    });
  });

  it('should show token when permission is granted', async () => {
    (
      NotificationService.requestNotificationPermissions as jest.Mock
    ).mockResolvedValue({
      status: 'granted',
      token: 'ExponentPushToken[abc123]',
    });

    const { getByText, findByText } = render(
      <NotificationDemo testID="notification-demo" />
    );

    await act(async () => {
      fireEvent.press(getByText('Request Permission'));
    });

    await waitFor(() => {
      expect(getByText(/ExponentPushToken/)).toBeTruthy();
    });
  });

  it('should show settings guidance when permission is denied', async () => {
    (
      NotificationService.requestNotificationPermissions as jest.Mock
    ).mockResolvedValue({
      status: 'denied',
      error: 'Permission denied',
    });

    const { getByText, findByText } = render(
      <NotificationDemo testID="notification-demo" />
    );

    await act(async () => {
      fireEvent.press(getByText('Request Permission'));
    });

    await waitFor(() => {
      expect(getByText(/Permission denied/)).toBeTruthy();
    });
  });

  it('should schedule notification when schedule button is pressed', async () => {
    (
      NotificationService.requestNotificationPermissions as jest.Mock
    ).mockResolvedValue({
      status: 'granted',
      token: 'ExponentPushToken[test]',
    });
    (NotificationService.scheduleNotification as jest.Mock).mockResolvedValue(
      'notif-1'
    );

    const { getByText, getByTestId } = render(
      <NotificationDemo testID="notification-demo" />
    );

    // First request permissions
    await act(async () => {
      fireEvent.press(getByText('Request Permission'));
    });

    await waitFor(() => {
      expect(getByText('Schedule (5s)')).toBeTruthy();
    });

    // Then schedule notification
    await act(async () => {
      fireEvent.press(getByText('Schedule (5s)'));
    });

    await waitFor(() => {
      expect(NotificationService.scheduleNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { seconds: 5 }
      );
    });
  });
});
