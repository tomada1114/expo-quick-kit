/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/.expo/**',
    '!**/dist/**',
    '!**/build/**',
  ],
  // Coverage thresholds for library integrations (80% minimum)
  coverageThreshold: {
    'lib/validation.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'lib/date.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'lib/secure-storage.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'services/notifications.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFiles: ['<rootDir>/jest.setup.pre.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
};
