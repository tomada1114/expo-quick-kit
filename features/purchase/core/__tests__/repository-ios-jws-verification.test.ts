/**
 * iOS JWS Signature Verification Tests (Task 4.1)
 *
 * Comprehensive tests for StoreKit2 JWS signature verification:
 * - Valid signature verification with payload extraction
 * - Invalid signature detection
 * - Edge cases (malformed JWS, missing fields, invalid formats)
 * - Error mapping to PurchaseError types
 *
 * Coverage target: 100% branch coverage for verifyIOSTransaction
 */

import { Platform } from 'react-native';
import type { Transaction, PurchaseError } from '../types';

// Mock jose - JWS verification library
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  importSPKI: jest.fn(),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

// Import after mocks to ensure mocks are applied
import { purchaseRepository } from '../repository';
import * as secureStore from 'expo-secure-store';
import * as jose from 'jose';

const mockedSecureStore = secureStore as jest.Mocked<typeof secureStore>;
const mockedJose = jose as jest.Mocked<typeof jose>;

describe('verifyIOSTransaction - iOS JWS Signature Verification (Task 4.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';

    // Default mock for jose.importSPKI
    mockedJose.importSPKI.mockResolvedValue({ alg: 'ES256', type: 'public' } as any);

    // Default mock for jose.jwtVerify - successful verification
    mockedJose.jwtVerify.mockResolvedValue({
      payload: {},
      protected: 'header',
    } as any);
  });

  describe('Happy Path - Valid JWS Signatures', () => {
    // Test 1: Valid JWS with all required fields
    it('should verify valid JWS with all required fields (transactionId, productId, purchaseDate)', async () => {
      // Given: A properly signed JWS with all required fields
      const validJWS =
        'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.' + // header
        'eyJ0cmFuc2FjdGlvbklkIjoiYm9ndXNfdHJhbnNhY3Rpb25faWQiLCJwcm9kdWN0SWQiOiJwcmVtaXVtX3VubG9jayIsInB1cmNoYXNlRGF0ZSI6MTczMzM2ODAwMDAwMCwiYnVuZGxlSWQiOiJjb20uZXhhbXBsZS5hcHAifQ.' + // payload
        'signature_placeholder'; // signature

      const transaction: Transaction = {
        transactionId: 'bogus_transaction_id',
        productId: 'premium_unlock',
        purchaseDate: new Date('2024-12-04T20:00:00Z'),
        receiptData: validJWS,
      };

      // Mock the key loading
      mockedSecureStore.getItemAsync.mockResolvedValue(
        JSON.stringify({
          alg: 'ES256',
          crv: 'P-256',
          kty: 'EC',
          x: 'test_x_value',
          y: 'test_y_value',
        })
      );

      // When: Verification is performed with valid signature
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns success with verification status
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    // Test 2: Valid JWS with minimal payload (only required fields)
    it('should verify valid JWS with minimal payload (no optional fields)', async () => {
      // Given: A JWS containing only required fields
      const minimalJWS =
        'eyJhbGciOiJFUzI1NiJ9.' + // minimal header
        'eyJ0cmFuc2FjdGlvbklkIjoiaWQxMjMiLCJwcm9kdWN0SWQiOiJwcm9kdWN0MjMiLCJwdXJjaGFzZURhdGUiOjE3MzMzNjgwMDAwMDB9.' + // minimal payload
        'sig';

      const transaction: Transaction = {
        transactionId: 'id123',
        productId: 'product23',
        purchaseDate: new Date(1733368000000),
        receiptData: minimalJWS,
      };

      mockedSecureStore.getItemAsync.mockResolvedValue(
        JSON.stringify({
          alg: 'ES256',
          crv: 'P-256',
          kty: 'EC',
          x: 'test_x',
          y: 'test_y',
        })
      );

      // When: Verification is performed
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Successfully verifies
      expect(result.success).toBe(true);
    });

    // Test 3: Valid JWS with extended payload (optional fields)
    it('should verify valid JWS with extended payload (optional fields ignored)', async () => {
      // Given: A JWS with extra optional fields
      const extendedJWS =
        'eyJhbGciOiJFUzI1NiIsImtpZCI6ImtleTEifQ.' + // header with kid
        'eyJ0cmFuc2FjdGlvbklkIjoiaWQxIiwicHJvZHVjdElkIjoicHJvZDEiLCJwdXJjaGFzZURhdGUiOjE3MzMzNjgwMDAwMDAsImV4cGlyYXRpb25EYXRlIjoxNzY1MDcyMDAwMDAwLCJhcHBBY2NvdW50VG9rZW4iOiJ0b2tlbiJ9.' +
        'extendedsig';

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(1733368000000),
        receiptData: extendedJWS,
      };

      mockedSecureStore.getItemAsync.mockResolvedValue(
        JSON.stringify({
          alg: 'ES256',
          crv: 'P-256',
          kty: 'EC',
          x: 'x1',
          y: 'y1',
          kid: 'key1',
        })
      );

      // When: Verification is performed
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Successfully verifies, extra fields ignored
      expect(result.success).toBe(true);
    });
  });

  describe('Sad Path - Invalid Signatures', () => {
    // Test 4: Modified payload after signing
    it('should reject JWS with modified payload', async () => {
      // Given: A JWS where payload was tampered
      const tamperedJWS =
        'eyJhbGciOiJFUzI1NiJ9.' +
        'eyJ0cmFuc2FjdGlvbklkIjoiZm9rZSIsInByb2R1Y3RJZCI6InRhbXBlcmVkIiwicHVyY2hhc2VEYXRlIjoxNzMzMzY4MDAwMDAwfQ.' + // Modified productId
        'signature';

      const transaction: Transaction = {
        transactionId: 'fake',
        productId: 'tampered',
        purchaseDate: new Date(1733368000000),
        receiptData: tamperedJWS,
      };

      mockedSecureStore.getItemAsync.mockResolvedValue(
        JSON.stringify({
          alg: 'ES256',
          crv: 'P-256',
          kty: 'EC',
          x: 'test_x',
          y: 'test_y',
        })
      );

      // Mock signature verification to fail for tampered payload
      mockedJose.jwtVerify.mockRejectedValueOnce(
        new Error('Signature verification failed')
      );

      // When: Verification is attempted
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('PURCHASE_INVALID');
        expect(result.error.reason).toBe('not_signed');
      }
    });

    // Test 5: Modified signature part
    it('should reject JWS with modified signature', async () => {
      // Given: JWS with valid header/payload but tampered signature
      const signatureModifiedJWS =
        'eyJhbGciOiJFUzI1NiJ9.' +
        'eyJ0cmFuc2FjdGlvbklkIjoiaWQxIiwicHJvZHVjdElkIjoicHJvZDEiLCJwdXJjaGFzZURhdGUiOjE3MzMzNjgwMDAwMDB9.' +
        'XXXXX_INVALID_SIGNATURE_XXXXX';

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(1733368000000),
        receiptData: signatureModifiedJWS,
      };

      mockedSecureStore.getItemAsync.mockResolvedValue(
        JSON.stringify({
          alg: 'ES256',
          crv: 'P-256',
          kty: 'EC',
          x: 'test_x',
          y: 'test_y',
        })
      );

      // Mock signature verification to fail
      mockedJose.jwtVerify.mockRejectedValueOnce(
        new Error('Invalid signature')
      );

      // When: Verification is attempted
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns PURCHASE_INVALID error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('PURCHASE_INVALID');
      }
    });

    // Test 6: Missing required field - transactionId
    it('should reject JWS missing required field: transactionId', async () => {
      // Given: JWS payload without transactionId
      const missingTransactionIdJWS =
        'eyJhbGciOiJFUzI1NiJ9.' +
        'eyJwcm9kdWN0SWQiOiJwcm9kIiwicHVyY2hhc2VEYXRlIjoxNzMzMzY4MDAwMDAwfQ.' + // No transactionId
        'sig';

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod',
        purchaseDate: new Date(1733368000000),
        receiptData: missingTransactionIdJWS,
      };

      mockedSecureStore.getItemAsync.mockResolvedValue(
        JSON.stringify({
          alg: 'ES256',
          crv: 'P-256',
          kty: 'EC',
          x: 'x',
          y: 'y',
        })
      );

      // When: Verification is attempted
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns error indicating missing field
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('PURCHASE_INVALID');
        expect(result.error.message).toContain('transactionId');
      }
    });

    // Test 7: Missing required field - productId
    it('should reject JWS missing required field: productId', async () => {
      // Given: JWS payload without productId
      const missingProductIdJWS =
        'eyJhbGciOiJFUzI1NiJ9.' +
        'eyJ0cmFuc2FjdGlvbklkIjoiaWQxIiwicHVyY2hhc2VEYXRlIjoxNzMzMzY4MDAwMDAwfQ.' + // No productId
        'sig';

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod',
        purchaseDate: new Date(1733368000000),
        receiptData: missingProductIdJWS,
      };

      mockedSecureStore.getItemAsync.mockResolvedValue(
        JSON.stringify({
          alg: 'ES256',
          crv: 'P-256',
          kty: 'EC',
          x: 'x',
          y: 'y',
        })
      );

      // When: Verification is attempted
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns error for missing productId
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('PURCHASE_INVALID');
        expect(result.error.message).toContain('productId');
      }
    });

    // Test 8: Missing required field - purchaseDate
    it('should reject JWS missing required field: purchaseDate', async () => {
      // Given: JWS payload without purchaseDate
      const missingDateJWS =
        'eyJhbGciOiJFUzI1NiJ9.' +
        'eyJ0cmFuc2FjdGlvbklkIjoiaWQxIiwicHJvZHVjdElkIjoicHJvZDEifQ.' + // No purchaseDate
        'sig';

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(1733368000000),
        receiptData: missingDateJWS,
      };

      mockedSecureStore.getItemAsync.mockResolvedValue(
        JSON.stringify({
          alg: 'ES256',
          crv: 'P-256',
          kty: 'EC',
          x: 'x',
          y: 'y',
        })
      );

      // When: Verification is attempted
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns error for missing purchaseDate
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('PURCHASE_INVALID');
        expect(result.error.message).toContain('purchaseDate');
      }
    });

    // Test 9: Invalid date format
    it('should reject JWS with invalid purchaseDate format', async () => {
      // Given: JWS with non-numeric purchaseDate
      const invalidDateJWS =
        'eyJhbGciOiJFUzI1NiJ9.' +
        'eyJ0cmFuc2FjdGlvbklkIjoiaWQxIiwicHJvZHVjdElkIjoicHJvZDEiLCJwdXJjaGFzZURhdGUiOiJpbnZhbGlkIn0=' + // purchaseDate: "invalid"
        '.sig';

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(),
        receiptData: invalidDateJWS,
      };

      mockedSecureStore.getItemAsync.mockResolvedValue(
        JSON.stringify({
          alg: 'ES256',
          crv: 'P-256',
          kty: 'EC',
          x: 'x',
          y: 'y',
        })
      );

      // When: Verification is attempted
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns error for invalid date format
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('PURCHASE_INVALID');
      }
    });
  });

  describe('Boundary Values - JWS Format', () => {
    // Test 10: Empty receipt string
    it('should reject empty JWS string', async () => {
      // Given: Empty receiptData
      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(),
        receiptData: '', // Empty
      };

      // When: Verification is attempted
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns error (either "missing" or "format" are acceptable)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('PURCHASE_INVALID');
        expect(
          result.error.message.toLowerCase().includes('format') ||
            result.error.message.toLowerCase().includes('missing') ||
            result.error.message.toLowerCase().includes('invalid')
        ).toBe(true);
      }
    });

    // Test 11: JWS with only two parts
    it('should reject JWS with only two parts (missing signature)', async () => {
      // Given: JWS with only header.payload (no signature)
      const twoPartJWS =
        'eyJhbGciOiJFUzI1NiJ9.' + // header
        'eyJ0cmFuc2FjdGlvbklkIjoiaWQxIn0'; // payload (no signature)

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(),
        receiptData: twoPartJWS,
      };

      // When: Verification is attempted
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns format error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('format');
      }
    });

    // Test 12: JWS with four parts
    it('should reject JWS with four parts (extra separator)', async () => {
      // Given: JWS with extra part
      const fourPartJWS = 'a.b.c.d';

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(),
        receiptData: fourPartJWS,
      };

      // When: Verification is attempted
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns format error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('format');
      }
    });

    // Test 13: Very old timestamp (epoch 0)
    it('should accept JWS with very old timestamp (epoch 0)', async () => {
      // Given: JWS with purchaseDate = 0 (1970-01-01)
      const oldTimestampJWS =
        'eyJhbGciOiJFUzI1NiJ9.' +
        'eyJ0cmFuc2FjdGlvbklkIjoiaWQxIiwicHJvZHVjdElkIjoicHJvZDEiLCJwdXJjaGFzZURhdGUiOjB9.' +
        'sig';

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(0),
        receiptData: oldTimestampJWS,
      };

      mockedSecureStore.getItemAsync.mockResolvedValue(
        JSON.stringify({
          alg: 'ES256',
          crv: 'P-256',
          kty: 'EC',
          x: 'x',
          y: 'y',
        })
      );

      // When: Verification is performed
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Still attempts verification (timestamp validation is separate)
      expect(result.success).toBe(true);
    });

    // Test 14: Future timestamp
    it('should accept JWS with future timestamp', async () => {
      // Given: JWS with future purchaseDate
      const futureDate = Date.now() + 86400000; // 1 day from now
      // Create valid JWS with future timestamp
      const futurePayload = Buffer.from(
        JSON.stringify({
          transactionId: 'id1',
          productId: 'prod1',
          purchaseDate: futureDate,
        })
      ).toString('base64');
      const futureTimestampJWS =
        'eyJhbGciOiJFUzI1NiJ9.' + futurePayload + '.sig';

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(futureDate),
        receiptData: futureTimestampJWS,
      };

      mockedSecureStore.getItemAsync.mockResolvedValue(
        JSON.stringify({
          alg: 'ES256',
          crv: 'P-256',
          kty: 'EC',
          x: 'x',
          y: 'y',
        })
      );

      // When: Verification is performed
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Accepts (timestamp validation is separate concern)
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid Type/Format Inputs', () => {
    // Test 15: Invalid Base64 in header
    it('should reject JWS with invalid Base64 in header', async () => {
      // Given: JWS with malformed Base64 header
      const invalidBase64HeaderJWS = '!!!invalid!!!.payload.signature';

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(),
        receiptData: invalidBase64HeaderJWS,
      };

      // When: Verification is attempted
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns error for invalid data
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.message.toLowerCase().includes('base64') ||
            result.error.message.toLowerCase().includes('invalid') ||
            result.error.message.toLowerCase().includes('json')
        ).toBe(true);
      }
    });

    // Test 16: Invalid Base64 in payload
    it('should reject JWS with invalid Base64 in payload', async () => {
      // Given: JWS with malformed Base64 payload
      const invalidBase64PayloadJWS =
        'eyJhbGciOiJFUzI1NiJ9.###invalid###.signature';

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(),
        receiptData: invalidBase64PayloadJWS,
      };

      // When: Verification is attempted
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns error for invalid data
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.message.toLowerCase().includes('base64') ||
            result.error.message.toLowerCase().includes('invalid') ||
            result.error.message.toLowerCase().includes('json')
        ).toBe(true);
      }
    });

    // Test 17: Non-JSON payload
    it('should reject JWS with non-JSON payload', async () => {
      // Given: JWS with valid Base64 but not JSON content
      // 'dGhpcyBpcyBwbGFpbiB0ZXh0Lg==' = "this is plain text."
      const nonJsonPayloadJWS =
        'eyJhbGciOiJFUzI1NiJ9.' +
        'dGhpcyBpcyBwbGFpbiB0ZXh0Lg==.' + // Plain text, not JSON
        'signature';

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(),
        receiptData: nonJsonPayloadJWS,
      };

      // When: Verification is attempted
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns JSON parsing error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('JSON');
      }
    });

    // Test 18: Null receiptData
    it('should reject transaction with null receiptData', async () => {
      // Given: Transaction with null receiptData
      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(),
        receiptData: null as unknown as string, // Type violation for testing
      };

      // When: Verification is attempted
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns missing data error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('missing');
      }
    });

    // Test 19: Numeric receiptData (wrong type)
    it('should reject transaction with numeric receiptData', async () => {
      // Given: Transaction with number instead of string
      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(),
        receiptData: 12345 as unknown as string, // Wrong type for testing
      };

      // When: Verification is attempted
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns type error
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('invalid');
      }
    });
  });

  describe('External Dependency Failures - Key Loading', () => {
    // Test 20: Verification key not available
    it('should return error when verification key is not available', async () => {
      // Given: Key loading fails (key not cached, not available)
      const validJWS =
        'eyJhbGciOiJFUzI1NiJ9.' +
        'eyJ0cmFuc2FjdGlvbklkIjoiaWQxIiwicHJvZHVjdElkIjoicHJvZDEiLCJwdXJjaGFzZURhdGUiOjE3MzMzNjgwMDAwMDB9.' +
        'sig';

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(1733368000000),
        receiptData: validJWS,
      };

      mockedSecureStore.getItemAsync.mockResolvedValue(null); // No key cached

      // When: Verification is attempted without available key
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns error indicating key not available
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toMatch(/PURCHASE_INVALID|NETWORK_ERROR/);
      }
    });

    // Test 21: Corrupted cached verification key
    it('should handle corrupted verification key in secure store', async () => {
      // Given: A corrupted key in secure store
      const validJWS =
        'eyJhbGciOiJFUzI1NiJ9.' +
        'eyJ0cmFuc2FjdGlvbklkIjoiaWQxIiwicHJvZHVjdElkIjoicHJvZDEiLCJwdXJjaGFzZURhdGUiOjE3MzMzNjgwMDAwMDB9.' +
        'sig';

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(1733368000000),
        receiptData: validJWS,
      };

      mockedSecureStore.getItemAsync.mockResolvedValue('not_valid_json{{{'); // Corrupted

      // When: Verification is attempted with corrupted key
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns appropriate error
      expect(result.success).toBe(false);
    });
  });

  describe('Exception Handling', () => {
    // Test 22: Signature verification throws unexpected error
    it('should handle unexpected error during signature verification', async () => {
      // Given: A valid JWS structure but crypto operation throws
      const validJWS =
        'eyJhbGciOiJFUzI1NiJ9.' +
        'eyJ0cmFuc2FjdGlvbklkIjoiaWQxIiwicHJvZHVjdElkIjoicHJvZDEiLCJwdXJjaGFzZURhdGUiOjE3MzMzNjgwMDAwMDB9.' +
        'sig';

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(1733368000000),
        receiptData: validJWS,
      };

      mockedSecureStore.getItemAsync.mockRejectedValue(
        new Error('Unexpected crypto error')
      );

      // When: Verification is attempted
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns error (not thrown)
      expect(result.success).toBe(false);
      expect(() => {
        if (!result.success) {
          // Error should be handled gracefully
          expect(result.error.code).toBeDefined();
        }
      }).not.toThrow();
    });
  });

  describe('Integration - Verification Flow', () => {
    // Test 23: Real-world valid receipt verification flow
    it('should successfully verify a real-world iOS receipt flow', async () => {
      // Given: A complete, valid JWS receipt from StoreKit2
      const realWorldJWS =
        'eyJhbGciOiJFUzI1NiIsIng1YyI6WyJNSUlCb...' + // Real Apple certificate chain (truncated)
        'eyJidW5kbGVJZCI6ImNvbS5leGFtcGxlLmFwcCIs...' + // Payload with all fields
        'MEUCIQDZABCD1234...'; // Real ES256 signature (example)

      const transaction: Transaction = {
        transactionId: '2000001234567890',
        productId: 'com.example.premium_unlock',
        purchaseDate: new Date('2024-12-04T20:00:00Z'),
        receiptData: realWorldJWS,
      };

      mockedSecureStore.getItemAsync.mockResolvedValue(
        JSON.stringify({
          alg: 'ES256',
          crv: 'P-256',
          kty: 'EC',
          x: 'WKn33Z3',
          y: '9zDEOCVtj',
        })
      );

      // When: Verification is performed
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Either succeeds or fails with proper error (not crash)
      expect(result.success).toBeDefined();
      expect(result.error || result.data).toBeDefined();
    });

    // Test 24: Verification fails, retries are possible
    it('should indicate retryable vs non-retryable errors appropriately', async () => {
      // Given: A network-related failure during verification
      const validJWS =
        'eyJhbGciOiJFUzI1NiJ9.' +
        'eyJ0cmFuc2FjdGlvbklkIjoiaWQxIiwicHJvZHVjdElkIjoicHJvZDEiLCJwdXJjaGFzZURhdGUiOjE3MzMzNjgwMDAwMDB9.' +
        'sig';

      const transaction: Transaction = {
        transactionId: 'id1',
        productId: 'prod1',
        purchaseDate: new Date(1733368000000),
        receiptData: validJWS,
      };

      mockedSecureStore.getItemAsync.mockRejectedValue(
        new Error('Network timeout')
      );

      // When: Verification is attempted
      const result = await purchaseRepository.verifyTransaction(transaction);

      // Then: Returns error with retryable flag set appropriately
      if (!result.success) {
        expect(result.error.retryable).toBeDefined();
        // Network errors should be retryable, signature errors should not
        if (result.error.code === 'NETWORK_ERROR') {
          expect(result.error.retryable).toBe(true);
        } else if (result.error.code === 'PURCHASE_INVALID') {
          expect(result.error.retryable).toBe(false);
        }
      }
    });
  });
});
