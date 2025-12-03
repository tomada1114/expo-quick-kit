# 02. Store Submission Configuration (app.config.ts)

**Priority**: 🔴 High
**Status**: Pending

## Overview

Enhance `app.config.ts` with clear placeholders and comments to guide developers on what needs to be changed when creating a new app from this template. This prevents configuration mistakes during store submission.

## Background

App Store and Google Play submissions require extensive metadata. Rather than looking up requirements every time, we'll use placeholders and comments to make "what to change" explicit.

## File Location

```
/app.config.ts
```

## Required Configuration Sections

### Basic Information

| Section | Fields | Notes |
|---------|--------|-------|
| Basic Info | `name`, `slug`, `scheme` | App name, URL slug, deep link scheme |
| Version | `version`, `ios.buildNumber`, `android.versionCode` | Semantic versioning |
| Identifiers | `ios.bundleIdentifier`, `android.package` | **Cannot be changed after registration** |
| Permissions | `ios.infoPlist.*UsageDescription` | Required for App Store review |
| Icons | `icon`, `ios.icon`, `android.adaptiveIcon` | Platform-specific sizes |
| Splash | `splash`, `ios.splash`, `android.splash` | Launch screen |

### Environment Variables

Example for RevenueCat API Keys:

```typescript
extra: {
  revenueCatApiKeyIos: process.env.REVENUECAT_API_KEY_IOS,
  revenueCatApiKeyAndroid: process.env.REVENUECAT_API_KEY_ANDROID,
}
```

### iOS Permission Descriptions (InfoPlist.strings)

| Permission | Key | Example Description |
|------------|-----|---------------------|
| Camera | `NSCameraUsageDescription` | "Used to take profile photos" |
| Photo Library | `NSPhotoLibraryUsageDescription` | "Used to select images" |
| Notifications | `NSUserNotificationsUsageDescription` | "Used to send reminders" |

### Placeholder Format

Use comment markers to indicate what needs to be changed:

- **Required changes**: `TODO: CHANGE THIS` comment
- **Optional changes**: `OPTIONAL:` comment
- **Can be removed**: `REMOVE IF NOT NEEDED:` comment

Example:

```typescript
export default {
  name: "My App", // TODO: CHANGE THIS - Your app's display name
  slug: "my-app", // TODO: CHANGE THIS - URL-friendly slug (lowercase, hyphens)
  scheme: "myapp", // TODO: CHANGE THIS - Deep link scheme
  ios: {
    bundleIdentifier: "com.yourcompany.appname", // TODO: CHANGE THIS - Cannot change after store registration
    infoPlist: {
      // OPTIONAL: Remove permissions you don't need
      NSCameraUsageDescription: "Used to take photos", // REMOVE IF NOT NEEDED
      NSPhotoLibraryUsageDescription: "Used to select images", // REMOVE IF NOT NEEDED
    }
  },
  android: {
    package: "com.yourcompany.appname", // TODO: CHANGE THIS - Cannot change after store registration
  }
}
```

### Firebase Configuration (Optional)

```typescript
ios: {
  googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? './GoogleService-Info.plist',
},
android: {
  googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
}
```

## Important Notes

- `bundleIdentifier` and `package` **cannot be changed** after store registration
- `buildNumber`/`versionCode` must be incremented with each build
- Inappropriate permission descriptions will cause App Store rejection
- Current `app.config.ts` at `app.config.ts:1-96` should be reviewed and enhanced

## Acceptance Criteria

- [ ] All required fields have `TODO: CHANGE THIS` comments
- [ ] Optional fields clearly marked with `OPTIONAL:` or `REMOVE IF NOT NEEDED:`
- [ ] Environment variable loading is documented
- [ ] Permission description templates provided for common use cases
- [ ] Version fields (`version`, `buildNumber`, `versionCode`) clearly marked for updates
- [ ] Firebase configuration included with comments

## Current Configuration Review Needed

Check existing configuration at `app.config.ts:1-96` and add appropriate placeholders and comments.

## References

- [Expo App Configuration](https://docs.expo.dev/versions/latest/config/app/)
- [iOS Info.plist Keys](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/CocoaKeys.html)
- [Android Package Naming](https://developer.android.com/studio/build/application-id)
