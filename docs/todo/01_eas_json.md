# 01. EAS Build Configuration (eas.json)

**Priority**: 🔴 High
**Status**: ✅ Completed

## Overview

Create `eas.json` to enable building and submitting apps via EAS Build. This is required for production builds.

## Background

EAS Build is the standard approach for Expo production builds. Separating development, preview, and production environments ensures smooth test distribution and store submission workflows.

## File Location

```
/eas.json
```

## Requirements

### Build Profiles

| Profile | Purpose | Distribution | Notes |
|---------|---------|--------------|-------|
| `development` | Development client | `internal` | `developmentClient: true` |
| `preview` | TestFlight / Internal testing | `internal` | For QA testing |
| `production` | Store submission | `store` | App Store / Google Play |

### Configuration Structure

The file should include:

- `cli.version`: Minimum EAS CLI version requirement
- `build.development`: Development client build settings
- `build.preview`: Internal distribution build settings
- `build.production`: Store submission build settings
- `submit.production`: EAS Submit configuration (App Store Connect / Google Play)

### Environment Variables

Use the `env` field to inject EAS Secrets:

```json
{
  "build": {
    "production": {
      "env": {
        "REVENUECAT_API_KEY_IOS": "@revenuecat-api-key-ios",
        "REVENUECAT_API_KEY_ANDROID": "@revenuecat-api-key-android"
      }
    }
  }
}
```

Comment examples should be included for common secrets.

### Important Notes

- `production` builds must NOT include `developmentClient`
- Platform-specific settings should use `ios`/`android` fields
- Credentials (App Store Connect API Key, etc.) must be managed via EAS Secrets

## Example Structure

```json
{
  "cli": {
    "version": ">= 13.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      },
      "android": {
        "serviceAccountKeyPath": "./service-account.json",
        "track": "internal"
      }
    }
  }
}
```

## Acceptance Criteria

- [x] `eas.json` exists at project root
- [x] Three profiles defined: development, preview, production
- [x] Each profile has correct distribution settings
- [x] Environment variable injection is documented with comments
- [x] Can successfully run `eas build --platform all --profile production`

## Implementation Notes

- Created `eas.json` with all required profiles and configurations
- Created `docs/eas-secrets.md` for detailed EAS Secrets management guide
- Used `_comment` fields in JSON for inline documentation (note: these are ignored by EAS CLI)
- Submit configuration includes placeholder values that need to be replaced with actual credentials

## References

- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)
- [EAS Submit Configuration](https://docs.expo.dev/submit/eas-json/)
- [Environment Variables in EAS Build](https://docs.expo.dev/build-reference/variables/)
