/**
 * SecureStorageDemo Component
 *
 * Apple HIG準拠のセキュアストレージデモ
 * expo-secure-storeのインタラクティブデモを提供
 * AUTH_TOKENの保存、取得、削除操作とグレースフルなエラーハンドリング
 *
 * Usage:
 *   <SecureStorageDemo />
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useThemedColors } from '@/hooks/use-theme-color';
import {
  deleteSecure,
  getSecure,
  saveSecure,
  SecureStorageKey,
} from '@/lib/secure-storage';

export interface SecureStorageDemoProps {
  testID?: string;
}

interface Status {
  type: 'idle' | 'success' | 'error' | 'info';
  message: string;
}

export function SecureStorageDemo({ testID }: SecureStorageDemoProps) {
  const { colors } = useThemedColors();
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const MAX_INPUT_LENGTH = 2000;

  const handleInputChange = useCallback((text: string) => {
    // Limit input to MAX_INPUT_LENGTH characters
    if (text.length <= MAX_INPUT_LENGTH) {
      setInputValue(text);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!inputValue.trim()) {
      setStatus({
        type: 'info',
        message: 'トークンを入力してください',
      });
      return;
    }

    setIsLoading(true);
    const result = await saveSecure(SecureStorageKey.AUTH_TOKEN, inputValue);

    if (result.success) {
      setStatus({
        type: 'success',
        message: '✓ トークンを保存しました',
      });
      setInputValue('');
    } else {
      setStatus({
        type: 'error',
        message: result.error,
      });
    }
    setIsLoading(false);
  }, [inputValue]);

  const handleRetrieve = useCallback(async () => {
    setIsLoading(true);
    const result = await getSecure(SecureStorageKey.AUTH_TOKEN);

    if (result.success) {
      if (result.data) {
        setInputValue(result.data);
        setStatus({
          type: 'success',
          message: '✓ トークンを取得しました',
        });
      } else {
        setStatus({
          type: 'info',
          message: 'トークンが保存されていません',
        });
      }
    } else {
      setStatus({
        type: 'error',
        message: result.error,
      });
    }
    setIsLoading(false);
  }, []);

  const handleDelete = useCallback(async () => {
    setIsLoading(true);
    const result = await deleteSecure(SecureStorageKey.AUTH_TOKEN);

    if (result.success) {
      setStatus({
        type: 'success',
        message: '✓ トークンを削除しました',
      });
      setInputValue('');
    } else {
      setStatus({
        type: 'error',
        message: result.error,
      });
    }
    setIsLoading(false);
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

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.background.secondary,
      color: colors.text.primary,
      borderColor: colors.interactive.separator,
    },
  ];

  return (
    <Card variant="flat" testID={testID} style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text
          style={[
            styles.title,
            Typography.headline,
            { color: colors.text.primary },
          ]}
        >
          セキュア保存
        </Text>
        <Text
          style={[
            styles.description,
            Typography.body,
            { color: colors.text.secondary },
          ]}
        >
          トークンを暗号化して安全に保存します
        </Text>
      </View>

      {/* Status Banner */}
      {status.message && (
        <View
          testID={testID ? `${testID}-status` : 'secure-storage-status'}
          style={[
            styles.statusBanner,
            {
              backgroundColor: getStatusBackgroundColor(),
            },
          ]}
        >
          <Text
            style={[
              Typography.body,
              styles.statusText,
              {
                color: colors.text.inverse,
              },
            ]}
          >
            {status.message}
          </Text>
        </View>
      )}

      {/* Input Section */}
      <View style={styles.formGroup}>
        <Text
          style={[
            styles.label,
            Typography.caption1,
            { color: colors.text.secondary },
          ]}
        >
          トークン入力
        </Text>
        <TextInput
          testID={testID ? `${testID}-input` : 'secure-storage-input'}
          style={inputStyle}
          placeholder="暗号化したいトークンまたはキーを入力"
          placeholderTextColor={colors.text.tertiary}
          value={inputValue}
          onChangeText={handleInputChange}
          maxLength={MAX_INPUT_LENGTH}
          editable={!isLoading}
          secureTextEntry={false}
          multiline
          numberOfLines={4}
        />
        <View style={styles.counterSection}>
          <Text
            style={[
              Typography.footnote,
              {
                color: colors.text.tertiary,
              },
            ]}
          >
            {inputValue.length} / {MAX_INPUT_LENGTH}
          </Text>
        </View>
      </View>

      {/* Info Text */}
      <View
        style={[
          styles.infoBox,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.interactive.separator,
          },
        ]}
      >
        <Text
          style={[
            Typography.footnote,
            {
              color: colors.text.secondary,
            },
          ]}
        >
          💡 暗号化保存対応: iOS KeychainとAndroid EncryptedSharedPreferencesで
          安全に保護されます
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonSection}>
        <Button
          testID={testID ? `${testID}-save-button` : 'save-button'}
          title="保存"
          variant="primary"
          onPress={handleSave}
          style={styles.mainButton}
          disabled={isLoading}
        />
        <View style={styles.secondaryButtonRow}>
          <Button
            testID={testID ? `${testID}-retrieve-button` : 'retrieve-button'}
            title="取得"
            variant="secondary"
            onPress={handleRetrieve}
            style={styles.secondaryButton}
            disabled={isLoading}
          />
          <Button
            testID={testID ? `${testID}-delete-button` : 'delete-button'}
            title="削除"
            variant="secondary"
            onPress={handleDelete}
            style={styles.secondaryButton}
            disabled={isLoading}
          />
        </View>
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
    borderBottomColor: '#F2F2F7',
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
    marginHorizontal: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  statusText: {
    fontWeight: '500',
  },
  formGroup: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  input: {
    height: 100,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    textAlignVertical: 'top',
  },
  counterSection: {
    marginTop: Spacing.xs,
    alignItems: 'flex-end',
  },
  infoBox: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  buttonSection: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  mainButton: {
    width: '100%',
  },
  secondaryButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  secondaryButton: {
    flex: 1,
  },
});
