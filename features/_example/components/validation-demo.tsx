/**
 * ValidationDemo Component
 *
 * zodバリデーションのインタラクティブデモを提供
 * メール、パスワード、電話番号の入力フォームとリアルタイムバリデーション
 *
 * Usage:
 *   <ValidationDemo />
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useThemedColors } from '@/hooks/use-theme-color';
import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  validateData,
} from '@/lib/validation';

interface FormState {
  email: string;
  password: string;
  phone: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  phone?: string;
}

export interface ValidationDemoProps {
  testID?: string;
}

export function ValidationDemo({ testID }: ValidationDemoProps) {
  const { colors } = useThemedColors();
  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
    phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    (field: keyof FormState, value: string) => {
      let schema;
      switch (field) {
        case 'email':
          schema = emailSchema;
          break;
        case 'password':
          schema = passwordSchema;
          break;
        case 'phone':
          schema = phoneSchema;
          break;
      }

      const result = validateData(schema, value);
      setErrors((prev) => ({
        ...prev,
        [field]: result.success ? undefined : Object.values(result.errors)[0],
      }));
    },
    []
  );

  const handleChange = useCallback(
    (field: keyof FormState) => (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (touched[field]) {
        validateField(field, value);
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (field: keyof FormState) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      validateField(field, form[field]);
    },
    [form, validateField]
  );

  const handleSubmit = useCallback(() => {
    setTouched({ email: true, password: true, phone: true });
    validateField('email', form.email);
    validateField('password', form.password);
    validateField('phone', form.phone);
  }, [form, validateField]);

  const handleReset = useCallback(() => {
    setForm({ email: '', password: '', phone: '' });
    setErrors({});
    setTouched({});
  }, []);

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.background.secondary,
      color: colors.text.primary,
      borderColor: colors.interactive.separator,
    },
  ];

  const errorInputStyle = {
    borderColor: colors.semantic.error,
  };

  return (
    <Card variant="flat" testID={testID} style={styles.container}>
      <Text
        style={[styles.title, Typography.headline, { color: colors.text.primary }]}
      >
        Zod Validation Demo
      </Text>
      <Text
        style={[
          styles.description,
          Typography.subheadline,
          { color: colors.text.secondary },
        ]}
      >
        リアルタイムバリデーションのサンプル実装です
      </Text>

      <View style={styles.formGroup}>
        <Text style={[styles.label, Typography.caption1, { color: colors.text.secondary }]}>
          メールアドレス
        </Text>
        <TextInput
          testID={testID ? `${testID}-email-input` : 'email-input'}
          style={[inputStyle, touched.email && errors.email && errorInputStyle]}
          placeholder="example@email.com"
          placeholderTextColor={colors.text.tertiary}
          value={form.email}
          onChangeText={handleChange('email')}
          onBlur={handleBlur('email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {touched.email && errors.email && (
          <Text
            testID={testID ? `${testID}-email-error` : 'email-error'}
            style={[styles.error, Typography.caption1, { color: colors.semantic.error }]}
          >
            {errors.email}
          </Text>
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, Typography.caption1, { color: colors.text.secondary }]}>
          パスワード
        </Text>
        <TextInput
          testID={testID ? `${testID}-password-input` : 'password-input'}
          style={[inputStyle, touched.password && errors.password && errorInputStyle]}
          placeholder="8文字以上、大小英字・数字を含む"
          placeholderTextColor={colors.text.tertiary}
          value={form.password}
          onChangeText={handleChange('password')}
          onBlur={handleBlur('password')}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        {touched.password && errors.password && (
          <Text
            testID={testID ? `${testID}-password-error` : 'password-error'}
            style={[styles.error, Typography.caption1, { color: colors.semantic.error }]}
          >
            {errors.password}
          </Text>
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, Typography.caption1, { color: colors.text.secondary }]}>
          電話番号
        </Text>
        <TextInput
          testID={testID ? `${testID}-phone-input` : 'phone-input'}
          style={[inputStyle, touched.phone && errors.phone && errorInputStyle]}
          placeholder="09012345678"
          placeholderTextColor={colors.text.tertiary}
          value={form.phone}
          onChangeText={handleChange('phone')}
          onBlur={handleBlur('phone')}
          keyboardType="phone-pad"
        />
        {touched.phone && errors.phone && (
          <Text
            testID={testID ? `${testID}-phone-error` : 'phone-error'}
            style={[styles.error, Typography.caption1, { color: colors.semantic.error }]}
          >
            {errors.phone}
          </Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <Button
          testID={testID ? `${testID}-submit-button` : 'submit-button'}
          title="検証"
          variant="primary"
          onPress={handleSubmit}
          style={styles.button}
        />
        <Button
          testID={testID ? `${testID}-reset-button` : 'reset-button'}
          title="リセット"
          variant="secondary"
          onPress={handleReset}
          style={styles.button}
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
    height: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    ...Typography.body,
  },
  error: {
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
