/**
 * Notification Service
 *
 * Wrapper for expo-notifications providing:
 * - Permission request and push token retrieval
 * - Local notification scheduling
 * - Notification cancellation and retrieval
 * - Foreground notification handler setup
 * - Android Notification Channel setup (Android 8.0+ required)
 *
 * Best Practices Applied:
 * - iOS: Explicit allowAlert/allowBadge/allowSound permissions
 * - Android: Notification channel setup (required for Android 8.0+)
 * - projectId from expo-constants for push token (EAS Build)
 * - SchedulableTriggerInputTypes for type-safe triggers
 * - Modern handler API (shouldShowBanner/shouldShowList)
 *
 * Requirements: Development Build (Expo Go not supported)
 *
 * @see https://docs.expo.dev/versions/latest/sdk/notifications/
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Notification permission result
 */
export type PermissionResult =
  | { status: 'granted'; token: string }
  | { status: 'denied'; error: string };

/**
 * Request notification permissions and get push token
 *
 * Best practices applied:
 * - iOS: Explicit allowAlert/allowBadge/allowSound permissions
 * - Android: Notification channel setup (required for Android 8.0+)
 * - projectId from expo-constants for push token (EAS Build)
 *
 * @returns Permission result with token or error message
 *
 * @example
 * const result = await requestNotificationPermissions();
 * if (result.status === 'granted') {
 *   console.log('Push token:', result.token);
 * } else {
 *   console.log('Permission denied:', result.error);
 * }
 */
export async function requestNotificationPermissions(): Promise<PermissionResult> {
  try {
    // Check if running on physical device
    if (!Device.isDevice) {
      return {
        status: 'denied',
        error: 'Must use physical device for push notifications',
      };
    }

    // Setup Android notification channel (required for Android 8.0+)
    // Must be called before requesting permissions on Android 13+
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Check existing permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted (with iOS-specific options)
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return {
        status: 'denied',
        error: 'Permission to send notifications was denied',
      };
    }

    // Get push token with projectId (required for EAS Build)
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    });
    return { status: 'granted', token: token.data };
  } catch (error) {
    return {
      status: 'denied',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Schedule a local notification
 *
 * @param title - Notification title
 * @param body - Notification body message
 * @param trigger - Trigger configuration (seconds from now or specific date)
 * @returns Notification identifier for cancellation
 *
 * @example
 * // Schedule 5 seconds from now
 * const id = await scheduleNotification('Reminder', 'Time to check!', { seconds: 5 });
 *
 * // Schedule at specific date
 * const id = await scheduleNotification('Meeting', 'Starting now', { date: new Date() });
 */
export async function scheduleNotification(
  title: string,
  body: string,
  trigger: { seconds: number } | { date: Date }
): Promise<string> {
  // Build trigger with proper type for expo-notifications API
  const notificationTrigger =
    'seconds' in trigger
      ? {
          type: Notifications.SchedulableTriggerInputTypes
            .TIME_INTERVAL as const,
          seconds: trigger.seconds,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.DATE as const,
          date: trigger.date,
        };

  return await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: notificationTrigger,
  });
}

/**
 * Cancel scheduled notification by ID
 *
 * @param notificationId - Notification identifier from scheduleNotification
 *
 * @example
 * await cancelNotification('notification-123');
 */
export async function cancelNotification(
  notificationId: string
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Get all scheduled notifications
 *
 * @returns Array of scheduled notification requests
 *
 * @example
 * const scheduled = await getAllScheduledNotifications();
 * console.log(`${scheduled.length} notifications pending`);
 */
export async function getAllScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Setup foreground notification handler
 *
 * Configures how notifications are displayed when app is in foreground.
 * Should be called once during app initialization (e.g., in _layout.tsx).
 *
 * @param handler - Optional custom handler called when notification received
 *
 * @example
 * // Basic setup (shows alert, plays sound, no badge)
 * setupForegroundHandler();
 *
 * // With custom handler
 * setupForegroundHandler((notification) => {
 *   console.log('Received:', notification.request.content.title);
 * });
 */
export function setupForegroundHandler(
  handler?: (notification: Notifications.Notification) => void
): void {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      handler?.(notification);
      return {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    },
  });
}
