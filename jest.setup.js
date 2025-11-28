// Import built-in Jest matchers from React Native Testing Library
// In @testing-library/react-native v12.4+, matchers are included by default
// No need to manually import extend-expect

// Suppress console output during tests
// Production logs (console.log) and expected error logs (console.error/warn)
// should not clutter test output
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
