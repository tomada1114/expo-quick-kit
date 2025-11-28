/**
 * Zod Validation Schemas
 *
 * Provides reusable validation schemas
 * - Email validation schema with localized error messages
 * - Password validation schema (minimum 8 characters, uppercase, lowercase, and number required)
 * - Phone number validation schema (Japanese format)
 */

import { z } from 'zod';

/**
 * Email validation schema with localized error messages
 */
export const emailSchema = z
  .string()
  .min(1, { message: 'Please enter your email address' })
  .email({ message: 'Invalid email format' });

/**
 * Password validation schema
 * - At least 8 characters
 * - Contains at least one uppercase, one lowercase, and one number
 */
export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .regex(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  .regex(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' });

/**
 * Phone number validation schema (Japanese format)
 * - Starts with 0
 * - 10-11 digits total (no hyphens)
 */
export const phoneSchema = z.string().regex(/^0\d{9,10}$/, {
  message: 'Invalid phone number format (example: 09012345678)',
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
