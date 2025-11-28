/**
 * Services Module
 *
 * Barrel export for application services
 */

export {
  requestNotificationPermissions,
  scheduleNotification,
  cancelNotification,
  getAllScheduledNotifications,
  setupForegroundHandler,
  type PermissionResult,
} from './notifications';
