import { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Expo App Configuration
 *
 * This file contains all the configuration needed for store submission.
 * Look for the following markers to identify what needs to be changed:
 *
 * - TODO: CHANGE THIS     - Required changes for your app
 * - OPTIONAL:             - Optional configuration you may want to customize
 * - REMOVE IF NOT NEEDED: - Remove these if your app doesn't use the feature
 *
 * Reference: https://docs.expo.dev/versions/latest/config/app/
 */

// =============================================================================
// Environment Variables
// =============================================================================
// These are loaded from .env files. See .env.example for documentation.
//
// For RevenueCat API Keys:
// - EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE: iOS RevenueCat public API key
// - EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE: Android RevenueCat public API key
//
// For Firebase (if using):
// - GOOGLE_SERVICES_PLIST: Path to iOS GoogleService-Info.plist
// - GOOGLE_SERVICES_JSON: Path to Android google-services.json
// =============================================================================

export default ({ config }: ConfigContext): ExpoConfig => ({
  // ===========================================================================
  // Basic Information
  // ===========================================================================

  // TODO: CHANGE THIS - Your app's display name shown on the home screen
  name: 'expo-quick-kit',

  // TODO: CHANGE THIS - URL-friendly slug (lowercase, hyphens only)
  // Used in Expo URLs: https://expo.dev/@username/{slug}
  slug: 'expo-quick-kit',

  // TODO: CHANGE THIS - Deep link URL scheme (e.g., "myapp" for myapp://)
  // Used for deep linking and OAuth redirects
  scheme: 'expoquickkit',

  // ===========================================================================
  // Version Information
  // ===========================================================================

  // TODO: UPDATE WITH EACH RELEASE - Semantic version (X.Y.Z)
  // Follow semver: major.minor.patch
  version: '1.0.0',

  // OPTIONAL: Lock to specific Expo SDK version
  // sdkVersion: '54.0.0',

  // ===========================================================================
  // General Settings
  // ===========================================================================

  // OPTIONAL: Screen orientation ('portrait', 'landscape', 'default')
  orientation: 'portrait',

  // OPTIONAL: User interface style ('automatic', 'light', 'dark')
  // 'automatic' follows system settings
  userInterfaceStyle: 'automatic',

  // Enable React Native New Architecture for better performance
  newArchEnabled: true,

  // ===========================================================================
  // App Icons
  // ===========================================================================

  // TODO: CHANGE THIS - Main app icon (1024x1024 PNG)
  // Used as fallback for platforms without specific icons
  icon: './assets/images/icon.png',

  // ===========================================================================
  // iOS Configuration
  // ===========================================================================
  ios: {
    // TODO: CHANGE THIS - iOS bundle identifier
    // Format: com.{company}.{appname}
    // WARNING: Cannot be changed after App Store registration!
    bundleIdentifier: 'com.tomada.expo-quick-kit',

    // TODO: UPDATE WITH EACH BUILD - iOS build number (must increment with each TestFlight/App Store submission)
    // Must be a string, incremented manually or via CI/CD
    buildNumber: '1',

    // OPTIONAL: Enable iPad support
    supportsTablet: true,

    // =========================================================================
    // iOS Permission Descriptions (Info.plist)
    // =========================================================================
    // These strings are shown to users when requesting permissions.
    // App Store will reject if descriptions don't clearly explain usage.
    //
    // REMOVE IF NOT NEEDED: Delete permissions your app doesn't use
    // =========================================================================
    infoPlist: {
      // Required for App Store submission: Indicates app uses only standard/exempt encryption
      ITSAppUsesNonExemptEncryption: false,

      // REMOVE IF NOT NEEDED: Camera permission
      // NSCameraUsageDescription: 'Used to take profile photos and scan documents',
      // REMOVE IF NOT NEEDED: Photo library permission
      // NSPhotoLibraryUsageDescription: 'Used to select images for your profile',
      // REMOVE IF NOT NEEDED: Microphone permission
      // NSMicrophoneUsageDescription: 'Used to record voice messages',
      // REMOVE IF NOT NEEDED: Location permission (when in use)
      // NSLocationWhenInUseUsageDescription: 'Used to show nearby locations',
      // REMOVE IF NOT NEEDED: Location permission (always)
      // NSLocationAlwaysUsageDescription: 'Used for location-based reminders',
      // REMOVE IF NOT NEEDED: Face ID permission
      // NSFaceIDUsageDescription: 'Used for secure authentication',
      // REMOVE IF NOT NEEDED: Contacts permission
      // NSContactsUsageDescription: 'Used to invite friends to the app',
      // REMOVE IF NOT NEEDED: Calendar permission
      // NSCalendarsUsageDescription: 'Used to create event reminders',
      // REMOVE IF NOT NEEDED: Health data permission
      // NSHealthShareUsageDescription: 'Used to display your health data',
      // NSHealthUpdateUsageDescription: 'Used to save workout data',
      // REMOVE IF NOT NEEDED: Motion & Fitness permission
      // NSMotionUsageDescription: 'Used to track steps and activity',
      // REMOVE IF NOT NEEDED: App Tracking Transparency (ATT) permission
      // Required for advertising tracking in iOS 14.5+
      // NSUserTrackingUsageDescription: 'Used to provide personalized ads',
    },

    // =========================================================================
    // Firebase Configuration (iOS)
    // =========================================================================
    // REMOVE IF NOT NEEDED: Uncomment if using Firebase
    // googleServicesFile:
    //   process.env.GOOGLE_SERVICES_PLIST ?? './GoogleService-Info.plist',

    // =========================================================================
    // iOS App Store Configuration
    // =========================================================================
    // OPTIONAL: Associated domains for Universal Links
    // associatedDomains: ['applinks:example.com'],

    // OPTIONAL: Background modes
    // backgroundModes: ['fetch', 'remote-notification', 'audio'],

    // OPTIONAL: URL types for OAuth/deep linking
    // urlTypes: [
    //   {
    //     schemes: ['expoquickkit'],
    //     role: 'Editor',
    //   },
    // ],
  },

  // ===========================================================================
  // Android Configuration
  // ===========================================================================
  android: {
    // TODO: CHANGE THIS - Android package name
    // Format: com.{company}.{appname}
    // WARNING: Cannot be changed after Play Store registration!
    package: 'com.tomada.expoquickkit',

    // TODO: UPDATE WITH EACH BUILD - Android version code (must increment with each Play Store submission)
    // Must be an integer, incremented manually or via CI/CD
    versionCode: 1,

    // =========================================================================
    // Android Adaptive Icon
    // =========================================================================
    adaptiveIcon: {
      // TODO: CHANGE THIS - Background color for adaptive icon
      backgroundColor: '#E6F4FE',
      // TODO: CHANGE THIS - Foreground image (108dp safe zone, 432px for xxxhdpi)
      foregroundImage: './assets/images/android-icon-foreground.png',
      // OPTIONAL: Background image (alternative to backgroundColor)
      backgroundImage: './assets/images/android-icon-background.png',
      // OPTIONAL: Monochrome icon for themed icons (Android 13+)
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },

    // Android edge-to-edge display (Android 15+)
    edgeToEdgeEnabled: true,

    // Predictive back gesture (Android 14+)
    predictiveBackGestureEnabled: false,

    // =========================================================================
    // Android Permissions
    // =========================================================================
    // By default, Expo includes common permissions. Use 'permissions' to be explicit.
    // REMOVE IF NOT NEEDED: Uncomment to explicitly declare permissions
    // permissions: [
    //   'CAMERA',
    //   'READ_EXTERNAL_STORAGE',
    //   'WRITE_EXTERNAL_STORAGE',
    //   'RECORD_AUDIO',
    //   'ACCESS_FINE_LOCATION',
    //   'ACCESS_COARSE_LOCATION',
    //   'READ_CONTACTS',
    //   'VIBRATE',
    // ],

    // =========================================================================
    // Firebase Configuration (Android)
    // =========================================================================
    // REMOVE IF NOT NEEDED: Uncomment if using Firebase
    // googleServicesFile:
    //   process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',

    // =========================================================================
    // Android Play Store Configuration
    // =========================================================================
    // OPTIONAL: Intent filters for deep linking
    // intentFilters: [
    //   {
    //     action: 'VIEW',
    //     autoVerify: true,
    //     data: [
    //       {
    //         scheme: 'https',
    //         host: 'example.com',
    //         pathPrefix: '/app',
    //       },
    //     ],
    //     category: ['BROWSABLE', 'DEFAULT'],
    //   },
    // ],
  },

  // ===========================================================================
  // Web Configuration
  // ===========================================================================
  web: {
    // OPTIONAL: Web output type ('static' for static hosting, 'server' for SSR)
    output: 'static',
    // TODO: CHANGE THIS - Web favicon (48x48 or 64x64 PNG)
    favicon: './assets/images/favicon.png',
    // OPTIONAL: Bundle filename for web builds
    // bundler: 'metro',
  },

  // ===========================================================================
  // Plugins
  // ===========================================================================
  plugins: [
    // File-based routing with expo-router
    'expo-router',

    // Development client for custom native modules
    'expo-dev-client',

    // Splash screen configuration
    [
      'expo-splash-screen',
      {
        // TODO: CHANGE THIS - Splash screen icon
        image: './assets/images/splash-icon.png',
        // OPTIONAL: Icon width in pixels
        imageWidth: 200,
        // OPTIONAL: Resize mode ('contain', 'cover', 'native')
        resizeMode: 'contain',
        // TODO: CHANGE THIS - Light mode background color
        backgroundColor: '#ffffff',
        // OPTIONAL: Dark mode configuration
        dark: {
          // TODO: CHANGE THIS - Dark mode background color
          backgroundColor: '#000000',
        },
      },
    ],

    // Secure storage for sensitive data
    'expo-secure-store',

    // REMOVE IF NOT NEEDED: Add other plugins as needed
    // [
    //   'expo-notifications',
    //   {
    //     icon: './assets/images/notification-icon.png',
    //     color: '#ffffff',
    //     sounds: [],
    //   },
    // ],
    // [
    //   'expo-camera',
    //   {
    //     cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera.',
    //   },
    // ],
    // [
    //   'expo-location',
    //   {
    //     locationAlwaysAndWhenInUsePermission:
    //       'Allow $(PRODUCT_NAME) to use your location.',
    //   },
    // ],
  ],

  // ===========================================================================
  // Experiments
  // ===========================================================================
  experiments: {
    // Enable typed routes for type-safe navigation
    typedRoutes: true,
    // Enable React Compiler for automatic memoization
    reactCompiler: true,
  },

  // ===========================================================================
  // Extra Configuration (Runtime Access)
  // ===========================================================================
  // Values here are accessible via Constants.expoConfig.extra
  extra: {
    // Router configuration
    router: {
      origin: false,
    },

    // EAS project configuration
    eas: {
      projectId: 'e9acf52c-64fd-4390-a7bc-fa554df3056b',
    },

    // Environment variables accessible at runtime
    // Note: EXPO_PUBLIC_* variables are automatically available
    // Add non-public environment variables here if needed:
    // apiUrl: process.env.API_URL,
    // sentryDsn: process.env.SENTRY_DSN,
  },

  // ===========================================================================
  // Owner (EAS Build)
  // ===========================================================================
  // TODO: CHANGE THIS - Your Expo account username or organization
  // Required for EAS Build
  // owner: 'your-expo-username',

  // ===========================================================================
  // Updates (EAS Update)
  // ===========================================================================
  // OPTIONAL: Over-the-air updates configuration
  // updates: {
  //   url: 'https://u.expo.dev/your-project-id',
  //   fallbackToCacheTimeout: 0,
  // },

  // ===========================================================================
  // Runtime Version
  // ===========================================================================
  // OPTIONAL: Runtime version policy for updates
  // runtimeVersion: {
  //   policy: 'appVersion',
  // },
});
