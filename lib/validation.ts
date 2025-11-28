/**
 * Zod Validation Schemas
 *
 * 再利用可能なバリデーションスキーマを提供
 * - Email validation schema with localized error messages
 * - Password validation schema (8文字以上、大文字小文字数字を含む)
 * - Phone number validation schema (Japanese format)
 */

import { z } from 'zod';

/**
 * Email validation schema with localized error messages
 */
export const emailSchema = z
  .string()
  .min(1, { message: 'メールアドレスを入力してください' })
  .email({ message: 'メールアドレスの形式が正しくありません' });

/**
 * Password validation schema
 * - At least 8 characters
 * - Contains at least one uppercase, one lowercase, and one number
 */
export const passwordSchema = z
  .string()
  .min(8, { message: 'パスワードは8文字以上で入力してください' })
  .regex(/[A-Z]/, { message: '大文字を1文字以上含めてください' })
  .regex(/[a-z]/, { message: '小文字を1文字以上含めてください' })
  .regex(/[0-9]/, { message: '数字を1文字以上含めてください' });

/**
 * Phone number validation schema (Japanese format)
 * - Starts with 0
 * - 10-11 digits total (no hyphens)
 */
export const phoneSchema = z
  .string()
  .regex(/^0\d{9,10}$/, {
    message: '電話番号の形式が正しくありません（例: 09012345678）',
  });

/**
 * Generic form validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

/**
 * Validate data against a zod schema and return typed result
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns ValidationResult with data or field-specific errors
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.length > 0 ? err.path.join('.') : '_root';
    errors[path] = err.message;
  });
  return { success: false, errors };
}
