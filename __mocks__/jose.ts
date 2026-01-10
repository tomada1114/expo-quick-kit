/**
 * Mock for jose library - JWS/JWT verification
 * Used in tests to verify iOS receipt signatures
 */

export const jwtVerify = jest.fn(async (token: string, key: any) => {
  // Mock implementation: verify JWT structure and return payload
  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  // Simulate successful verification by returning the decoded payload
  try {
    const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    return {
      payload,
      protected: Buffer.from(parts[0], 'base64').toString('utf8'),
      signature: parts[2],
    };
  } catch (error) {
    throw new Error('Failed to verify JWT');
  }
});

export const importSPKI = jest.fn(async (key: string, algorithm: string) => {
  // Mock implementation: return a key object for verification
  if (!key || typeof key !== 'string') {
    throw new Error('Invalid SPKI key');
  }
  return { alg: algorithm, type: 'public' };
});

export const jwtDecode = jest.fn((token: string) => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  return JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
});
