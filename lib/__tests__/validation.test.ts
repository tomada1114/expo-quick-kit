/**
 * Validation Utility Tests
 *
 * Tests cover:
 * - Email validation schema (valid/invalid cases)
 * - Password validation schema (minimum 8 characters, uppercase, lowercase, number required)
 * - Phone number validation schema (Japanese phone number format)
 * - validateData function (success/errors paths)
 */

import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  validateData,
  type ValidationResult,
} from '../validation';

describe('emailSchema', () => {
  it('should validate correct email format', () => {
    const result = emailSchema.safeParse('test@example.com');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('test@example.com');
    }
  });

  it('should validate email with subdomain', () => {
    const result = emailSchema.safeParse('user@mail.example.co.jp');
    expect(result.success).toBe(true);
  });

  it('should reject invalid email format', () => {
    const result = emailSchema.safeParse('invalid-email');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid email format');
    }
  });

  it('should reject empty email', () => {
    const result = emailSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) {
      // Empty string will fail email format first
      expect(result.error.errors.length).toBeGreaterThan(0);
    }
  });

  it('should reject email without domain', () => {
    const result = emailSchema.safeParse('test@');
    expect(result.success).toBe(false);
  });

  it('should reject email without @ symbol', () => {
    const result = emailSchema.safeParse('testexample.com');
    expect(result.success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('should validate password with all requirements', () => {
    const result = passwordSchema.safeParse('Password1');
    expect(result.success).toBe(true);
  });

  it('should validate complex password', () => {
    const result = passwordSchema.safeParse('MySecure123Password');
    expect(result.success).toBe(true);
  });

  it('should reject password shorter than 8 characters', () => {
    const result = passwordSchema.safeParse('Pass1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        'Password must be at least 8 characters'
      );
    }
  });

  it('should reject password without uppercase', () => {
    const result = passwordSchema.safeParse('password1');
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message);
      expect(messages).toContain(
        'Password must contain at least one uppercase letter'
      );
    }
  });

  it('should reject password without lowercase', () => {
    const result = passwordSchema.safeParse('PASSWORD1');
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message);
      expect(messages).toContain(
        'Password must contain at least one lowercase letter'
      );
    }
  });

  it('should reject password without number', () => {
    const result = passwordSchema.safeParse('Passwordd');
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message);
      expect(messages).toContain('Password must contain at least one number');
    }
  });

  it('should reject empty password', () => {
    const result = passwordSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('phoneSchema', () => {
  it('should validate Japanese mobile number (11 digits)', () => {
    const result = phoneSchema.safeParse('09012345678');
    expect(result.success).toBe(true);
  });

  it('should validate Japanese landline number (10 digits)', () => {
    const result = phoneSchema.safeParse('0312345678');
    expect(result.success).toBe(true);
  });

  it('should reject phone number with hyphens', () => {
    const result = phoneSchema.safeParse('090-1234-5678');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        'Invalid phone number format (example: 09012345678)'
      );
    }
  });

  it('should reject phone number not starting with 0', () => {
    const result = phoneSchema.safeParse('19012345678');
    expect(result.success).toBe(false);
  });

  it('should reject phone number with too few digits', () => {
    const result = phoneSchema.safeParse('090123456');
    expect(result.success).toBe(false);
  });

  it('should reject phone number with too many digits', () => {
    const result = phoneSchema.safeParse('090123456789');
    expect(result.success).toBe(false);
  });

  it('should reject phone number with letters', () => {
    const result = phoneSchema.safeParse('0901234567a');
    expect(result.success).toBe(false);
  });

  it('should reject empty phone number', () => {
    const result = phoneSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('validateData', () => {
  it('should return success with valid data', () => {
    const result = validateData(emailSchema, 'test@example.com');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('test@example.com');
    }
  });

  it('should return errors with invalid data', () => {
    const result = validateData(emailSchema, 'invalid-email');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toBeDefined();
      expect(typeof result.errors).toBe('object');
    }
  });

  it('should return field-specific errors for object schema', () => {
    const { z } = require('zod');
    const userSchema = z.object({
      email: emailSchema,
      password: passwordSchema,
    });

    const result = validateData(userSchema, {
      email: 'invalid',
      password: 'weak',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors['email']).toBeDefined();
      expect(result.errors['password']).toBeDefined();
    }
  });

  it('should handle nested schema paths', () => {
    const { z } = require('zod');
    const nestedSchema = z.object({
      user: z.object({
        email: emailSchema,
      }),
    });

    const result = validateData(nestedSchema, {
      user: { email: 'invalid' },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors['user.email']).toBeDefined();
    }
  });

  it('should return typed ValidationResult', () => {
    const result: ValidationResult<string> = validateData(
      emailSchema,
      'test@example.com'
    );
    expect(result.success).toBe(true);
  });
});
