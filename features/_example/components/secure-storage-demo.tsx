/**
 * SecureStorageDemo Component
 *
 * expo-secure-storeのインタラクティブデモを提供
 * AUTH_TOKENの保存、取得、削除操作とエラーハンドリング
 *
 * Usage:
 *   <SecureStorageDemo />
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, TextInput, View, Alert } from 'react-native';

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
  type: 'idle' | 'success' | 'error';
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
      setStatus({ type: 'error', message: 'トークンを入力してください' });
      return;
    }

    setIsLoading(true);
    const result = await saveSecure(SecureStorageKey.AUTH_TOKEN, inputValue);

    if (result.success) {
      setStatus({ type: 'success', message: 'トークンを保存しました' });
      setInputValue('');
    } else {
      setStatus({ type: 'error', message: result.error });
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
          message: 'トークンを取得しました',
        });
      } else {
        setStatus({
          type: 'error',
          message: 'トークンが見つかりません',
        });
      }
    } else {
      setStatus({ type: 'error', message: result.error });
    }
    setIsLoading(false);
  }, []);

  const handleDelete = useCallback(async () => {
    setIsLoading(true);
    const result = await deleteSecure(SecureStorageKey.AUTH_TOKEN);

    if (result.success) {
      setStatus({ type: 'success', message: 'トークンを削除しました' });
      setInputValue('');
    } else {
      setStatus({ type: 'error', message: result.error });
    }
    setIsLoading(false);
  }, []);

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.background.secondary,
      color: colors.text.primary,
      borderColor: colors.interactive.separator,
    },
  ];

  const statusColor =
    status.type === 'success'
      ? colors.semantic.success
      : status.type === 'error'
        ? colors.semantic.error
        : colors.text.secondary;

  return (
    <Card variant="flat" testID={testID} style={styles.container}>
      <Text
        style={[
          styles.title,
          Typography.headline,
          { color: colors.text.primary },
        ]}
      >
        Secure Storage Demo
      </Text>
      <Text
        style={[
          styles.description,
          Typography.subheadline,
          { color: colors.text.secondary },
        ]}
      >
        セキュアストレージのサンプル実装です
      </Text>

      <View style={styles.formGroup}>
        <Text
          style={[
            styles.label,
            Typography.caption1,
            { color: colors.text.secondary },
          ]}
        >
          AUTH_TOKEN
        </Text>
        <TextInput
          testID={testID ? `${testID}-input` : 'secure-storage-input'}
          style={inputStyle}
          placeholder="トークンを入力"
          placeholderTextColor={colors.text.tertiary}
          value={inputValue}
          onChangeText={handleInputChange}
          maxLength={MAX_INPUT_LENGTH}
          editable={!isLoading}
          secureTextEntry={false}
          multiline
          numberOfLines={4}
        />
        <Text
          style={[
            styles.infoText,
            Typography.footnote,
            { color: colors.text.tertiary },
          ]}
        >
          2000文字以内で入力してください ({inputValue.length}/{MAX_INPUT_LENGTH}
          )
        </Text>
      </View>

      {status.message && (
        <View
          testID={testID ? `${testID}-status` : 'secure-storage-status'}
          style={{
            backgroundColor:
              status.type === 'success'
                ? colors.semantic.success
                : colors.semantic.error,
            borderRadius: BorderRadius.md,
            padding: Spacing.sm,
            marginBottom: Spacing.md,
          }}
        >
          <Text
            style={[
              Typography.caption1,
              {
                color:
                  status.type === 'success'
                    ? colors.text.inverse
                    : colors.text.inverse,
              },
            ]}
          >
            {status.message}
          </Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Button
          testID={testID ? `${testID}-save-button` : 'save-button'}
          title="保存"
          variant="primary"
          onPress={handleSave}
          style={styles.button}
          disabled={isLoading}
        />
        <Button
          testID={testID ? `${testID}-retrieve-button` : 'retrieve-button'}
          title="取得"
          variant="primary"
          onPress={handleRetrieve}
          style={styles.button}
          disabled={isLoading}
        />
        <Button
          testID={testID ? `${testID}-delete-button` : 'delete-button'}
          title="削除"
          variant="secondary"
          onPress={handleDelete}
          style={styles.button}
          disabled={isLoading}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.md,
  },
  formGroup: {
    marginBottom: Spacing.sm,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  input: {
    height: 120,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    textAlignVertical: 'top',
  },
  infoText: {
    marginTop: Spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  button: {
    flex: 1,
  },
});
