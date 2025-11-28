/**
 * NotificationDemo Component
 *
 * Apple HIG-compliant push notification demo
 * Demonstrates permission requests, local notification scheduling,
 * and graceful handling of denied permissions
 *
 * Requirements: Development Build (Expo Go not supported)
 *
 * Usage:
 *   <NotificationDemo />
 */

import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, Linking } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useThemedColors } from '@/hooks/use-theme-color';
import {
  requestNotificationPermissions,
  scheduleNotification,
  cancelNotification,
  getAllScheduledNotifications,
  type PermissionResult,
} from '@/services/notifications';

export interface NotificationDemoProps {
  testID?: string;
}

interface Status {
  type: 'idle' | 'success' | 'error' | 'info';
  message: string;
}

type PermissionStatus = 'unknown' | 'granted' | 'denied';

export function NotificationDemo({ testID }: NotificationDemoProps) {
  const { colors } = useThemedColors();
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>('unknown');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [scheduledIds, setScheduledIds] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Load scheduled notifications on mount
  useEffect(() => {
    const loadScheduled = async () => {
      try {
        const notifications = await getAllScheduledNotifications();
        setScheduledIds(notifications.map((n) => n.identifier));
      } catch {
        // Ignore errors on initial load
      }
    };
    loadScheduled();
  }, []);

  const handleRequestPermission = useCallback(async () => {
    setIsLoading(true);
    setStatus({ type: 'idle', message: '' });

    const result = await requestNotificationPermissions();

    if (result.status === 'granted') {
      setPermissionStatus('granted');
      setPushToken(result.token);
      setStatus({
        type: 'success',
        message: 'Notifications enabled successfully',
      });
    } else {
      setPermissionStatus('denied');
      setStatus({
        type: 'error',
        message: result.error,
      });
    }

    setIsLoading(false);
  }, []);

  const handleSchedule = useCallback(
    async (seconds: number) => {
      if (permissionStatus !== 'granted') {
        setStatus({
          type: 'info',
          message: 'Please grant permission first',
        });
        return;
      }

      setIsLoading(true);

      try {
        const id = await scheduleNotification(
          'Test Notification',
          `This notification was scheduled ${seconds} seconds ago`,
          { seconds }
        );

        setScheduledIds((prev) => [...prev, id]);
        setStatus({
          type: 'success',
          message: `Scheduled in ${seconds}s (ID: ${id.slice(0, 8)}...)`,
        });
      } catch (error) {
        setStatus({
          type: 'error',
          message:
            error instanceof Error ? error.message : 'Failed to schedule',
        });
      }

      setIsLoading(false);
    },
    [permissionStatus]
  );

  const handleCancelAll = useCallback(async () => {
    setIsLoading(true);

    try {
      await Promise.all(scheduledIds.map((id) => cancelNotification(id)));
      setScheduledIds([]);
      setStatus({
        type: 'success',
        message: 'All notifications cancelled',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to cancel',
      });
    }

    setIsLoading(false);
  }, [scheduledIds]);

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const getStatusBackgroundColor = () => {
    switch (status.type) {
      case 'success':
        return colors.semantic.success;
      case 'error':
        return colors.semantic.error;
      case 'info':
        return colors.semantic.info;
      default:
        return 'transparent';
    }
  };

  return (
    <Card variant="flat" testID={testID} style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.headerSection,
          { borderBottomColor: colors.interactive.separator },
        ]}
      >
        <Text
          style={[
            styles.title,
            Typography.headline,
            { color: colors.text.primary },
          ]}
        >
          Push Notifications
        </Text>
        <Text
          style={[
            styles.description,
            Typography.body,
            { color: colors.text.secondary },
          ]}
        >
          Request permissions and schedule local notifications
        </Text>
      </View>

      {/* Status Banner */}
      {status.message && (
        <View
          testID={testID ? `${testID}-status` : 'notification-status'}
          style={[
            styles.statusBanner,
            { backgroundColor: getStatusBackgroundColor() },
          ]}
        >
          <Text
            style={[
              Typography.body,
              styles.statusText,
              { color: colors.text.inverse },
            ]}
          >
            {status.message}
          </Text>
        </View>
      )}

      {/* Permission Status Section */}
      <View style={styles.section}>
        <Text
          style={[
            styles.sectionLabel,
            Typography.caption1,
            { color: colors.text.secondary },
          ]}
        >
          Permission Status
        </Text>
        <View
          style={[
            styles.statusBox,
            {
              backgroundColor: colors.background.secondary,
              borderColor: colors.interactive.separator,
            },
          ]}
        >
          <View style={styles.statusRow}>
            <Text style={[Typography.body, { color: colors.text.primary }]}>
              Status:
            </Text>
            <Text
              style={[
                Typography.body,
                {
                  color:
                    permissionStatus === 'granted'
                      ? colors.semantic.success
                      : permissionStatus === 'denied'
                        ? colors.semantic.error
                        : colors.text.secondary,
                  fontWeight: '600',
                },
              ]}
            >
              {permissionStatus === 'granted'
                ? 'Granted'
                : permissionStatus === 'denied'
                  ? 'Denied'
                  : 'Unknown'}
            </Text>
          </View>

          {pushToken && (
            <View style={styles.tokenSection}>
              <Text
                style={[Typography.footnote, { color: colors.text.secondary }]}
              >
                Push Token:
              </Text>
              <Text
                style={[
                  Typography.footnote,
                  styles.tokenText,
                  {
                    color: colors.text.tertiary,
                    backgroundColor: colors.background.tertiary,
                  },
                ]}
                numberOfLines={2}
              >
                {pushToken}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Denied Permission Guidance */}
      {permissionStatus === 'denied' && (
        <View
          style={[
            styles.guidanceBox,
            {
              backgroundColor: colors.semantic.warning + '20',
              borderColor: colors.semantic.warning,
            },
          ]}
        >
          <Text style={[Typography.footnote, { color: colors.text.primary }]}>
            Notifications are disabled. To enable them, please go to Settings
            and allow notifications for this app.
          </Text>
          <Button
            title="Open Settings"
            variant="secondary"
            size="sm"
            onPress={handleOpenSettings}
            style={styles.settingsButton}
          />
        </View>
      )}

      {/* Scheduled Count */}
      {scheduledIds.length > 0 && (
        <View
          style={[
            styles.scheduledBox,
            {
              backgroundColor: colors.background.secondary,
              borderColor: colors.interactive.separator,
            },
          ]}
        >
          <Text style={[Typography.body, { color: colors.text.primary }]}>
            {scheduledIds.length} notification
            {scheduledIds.length > 1 ? 's' : ''} scheduled
          </Text>
        </View>
      )}

      {/* Info Box */}
      <View
        style={[
          styles.infoBox,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.interactive.separator,
          },
        ]}
      >
        <Text style={[Typography.footnote, { color: colors.text.secondary }]}>
          Note: Push notifications require a Development Build. They do not work
          in Expo Go.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonSection}>
        <Button
          testID={testID ? `${testID}-permission-button` : 'permission-button'}
          title="Request Permission"
          variant="primary"
          onPress={handleRequestPermission}
          style={styles.mainButton}
          disabled={isLoading || permissionStatus === 'granted'}
        />

        {permissionStatus === 'granted' && (
          <>
            <View style={styles.scheduleRow}>
              <Button
                testID={testID ? `${testID}-schedule-5s` : 'schedule-5s'}
                title="Schedule (5s)"
                variant="secondary"
                onPress={() => handleSchedule(5)}
                style={styles.scheduleButton}
                disabled={isLoading}
              />
              <Button
                testID={testID ? `${testID}-schedule-10s` : 'schedule-10s'}
                title="Schedule (10s)"
                variant="secondary"
                onPress={() => handleSchedule(10)}
                style={styles.scheduleButton}
                disabled={isLoading}
              />
            </View>

            {scheduledIds.length > 0 && (
              <Button
                testID={testID ? `${testID}-cancel-all` : 'cancel-all'}
                title="Cancel All"
                variant="secondary"
                onPress={handleCancelAll}
                style={styles.mainButton}
                disabled={isLoading}
              />
            )}
          </>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  headerSection: {
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  description: {
    marginBottom: 0,
  },
  statusBanner: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontWeight: '500',
  },
  section: {
    marginTop: Spacing.md,
  },
  sectionLabel: {
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  statusBox: {
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenSection: {
    gap: Spacing.xs,
  },
  tokenText: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    fontFamily: 'monospace',
  },
  guidanceBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  settingsButton: {
    marginTop: Spacing.xs,
  },
  scheduledBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  infoBox: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  buttonSection: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  mainButton: {
    width: '100%',
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  scheduleButton: {
    flex: 1,
  },
});
