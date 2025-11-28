/**
 * Notification Service Unit Tests
 *
 * Tests for expo-notifications wrapper functions with mocked APIs
 * Covers permission requests, scheduling, cancellation, and retrieval
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import {
  requestNotificationPermissions,
  scheduleNotification,
  cancelNotification,
  getAllScheduledNotifications,
  setupForegroundHandler,
  type PermissionResult,
} from '../notifications';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: 'timeInterval',
    DATE: 'date',
  },
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
}));

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestNotificationPermissions', () => {
    it('should return granted status with token when permissions are already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[xxxxx]',
      });

      const result = await requestNotificationPermissions();

      expect(result).toEqual({
        status: 'granted',
        token: 'ExponentPushToken[xxxxx]',
      });
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should request permissions when not already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[yyyyy]',
      });

      const result = await requestNotificationPermissions();

      expect(result).toEqual({
        status: 'granted',
        token: 'ExponentPushToken[yyyyy]',
      });
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should return denied status when permissions are denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await requestNotificationPermissions();

      expect(result).toEqual({
        status: 'denied',
        error: 'Permission to send notifications was denied',
      });
    });

    it('should return denied status when not running on physical device', async () => {
      // Override the mock for this specific test
      jest.doMock('expo-device', () => ({
        isDevice: false,
      }));

      // Re-import with updated mock
      jest.resetModules();
      const DeviceMock = require('expo-device');
      Object.defineProperty(DeviceMock, 'isDevice', { value: false });

      const {
        requestNotificationPermissions: requestPermissionsWithMock,
      } = require('../notifications');

      const result = await requestPermissionsWithMock();

      expect(result).toEqual({
        status: 'denied',
        error: 'Must use physical device for push notifications',
      });
    });

    it('should handle errors gracefully', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error('Permission check failed')
      );

      const result = await requestNotificationPermissions();

      expect(result).toEqual({
        status: 'denied',
        error: 'Permission check failed',
      });
    });

    it('should handle unknown errors gracefully', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(
        'Unknown error'
      );

      const result = await requestNotificationPermissions();

      expect(result).toEqual({
        status: 'denied',
        error: 'Unknown error',
      });
    });
  });

  describe('scheduleNotification', () => {
    it('should schedule notification with seconds trigger and return identifier', async () => {
      const mockId = 'notification-123';
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
        mockId
      );

      const result = await scheduleNotification('Test Title', 'Test Body', {
        seconds: 5,
      });

      expect(result).toBe(mockId);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: { title: 'Test Title', body: 'Test Body' },
        trigger: { type: 'timeInterval', seconds: 5 },
      });
    });

    it('should schedule notification with date trigger', async () => {
      const mockId = 'notification-456';
      const futureDate = new Date(Date.now() + 60000);
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
        mockId
      );

      const result = await scheduleNotification('Title', 'Body', {
        date: futureDate,
      });

      expect(result).toBe(mockId);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: { title: 'Title', body: 'Body' },
        trigger: { type: 'date', date: futureDate },
      });
    });

    it('should throw error when scheduling fails', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Scheduling failed')
      );

      await expect(
        scheduleNotification('Title', 'Body', { seconds: 5 })
      ).rejects.toThrow('Scheduling failed');
    });
  });

  describe('cancelNotification', () => {
    it('should cancel notification by id', async () => {
      (
        Notifications.cancelScheduledNotificationAsync as jest.Mock
      ).mockResolvedValue(undefined);

      await cancelNotification('notification-123');

      expect(
        Notifications.cancelScheduledNotificationAsync
      ).toHaveBeenCalledWith('notification-123');
    });

    it('should throw error when cancellation fails', async () => {
      (
        Notifications.cancelScheduledNotificationAsync as jest.Mock
      ).mockRejectedValue(new Error('Cancellation failed'));

      await expect(cancelNotification('notification-123')).rejects.toThrow(
        'Cancellation failed'
      );
    });
  });

  describe('getAllScheduledNotifications', () => {
    it('should return all scheduled notifications', async () => {
      const mockNotifications = [
        { identifier: 'notif-1', content: { title: 'Test 1' }, trigger: null },
        { identifier: 'notif-2', content: { title: 'Test 2' }, trigger: null },
      ];
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue(mockNotifications);

      const result = await getAllScheduledNotifications();

      expect(result).toEqual(mockNotifications);
      expect(
        Notifications.getAllScheduledNotificationsAsync
      ).toHaveBeenCalled();
    });

    it('should return empty array when no notifications scheduled', async () => {
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValue([]);

      const result = await getAllScheduledNotifications();

      expect(result).toEqual([]);
    });
  });

  describe('setupForegroundHandler', () => {
    it('should set notification handler with default behavior', () => {
      setupForegroundHandler();

      expect(Notifications.setNotificationHandler).toHaveBeenCalledWith({
        handleNotification: expect.any(Function),
      });
    });

    it('should return correct notification behavior from handler', async () => {
      let capturedHandler: (
        notification: Notifications.Notification
      ) => Promise<Notifications.NotificationBehavior>;

      (Notifications.setNotificationHandler as jest.Mock).mockImplementation(
        (config) => {
          capturedHandler = config.handleNotification;
        }
      );

      setupForegroundHandler();

      const mockNotification = {
        request: { identifier: 'test', content: {}, trigger: null },
        date: Date.now(),
      } as Notifications.Notification;

      const behavior = await capturedHandler!(mockNotification);

      expect(behavior).toEqual({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      });
    });

    it('should call custom handler when provided', async () => {
      const customHandler = jest.fn();
      let capturedHandler: (
        notification: Notifications.Notification
      ) => Promise<Notifications.NotificationBehavior>;

      (Notifications.setNotificationHandler as jest.Mock).mockImplementation(
        (config) => {
          capturedHandler = config.handleNotification;
        }
      );

      setupForegroundHandler(customHandler);

      const mockNotification = {
        request: { identifier: 'test', content: {}, trigger: null },
        date: Date.now(),
      } as Notifications.Notification;

      await capturedHandler!(mockNotification);

      expect(customHandler).toHaveBeenCalledWith(mockNotification);
    });
  });
});
