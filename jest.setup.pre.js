// Pre-setup file - runs before modules are loaded
// Used to suppress warnings that occur during module import

// Mock AsyncStorage before any modules are loaded
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Suppress console output during module import phase
// This catches warnings from expo-notifications and other libraries
// that emit warnings when their modules are first imported
const originalWarn = console.warn;
const originalError = console.error;
const originalLog = console.log;

console.warn = (...args) => {
  // Filter out expo-notifications Expo Go warning
  if (
    args[0]?.includes?.('expo-notifications') ||
    args[0]?.includes?.('Expo Go')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  originalError.apply(console, args);
};

console.log = (...args) => {
  originalLog.apply(console, args);
};
