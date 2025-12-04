# EAS Secrets Configuration

This document provides guidance on managing environment variables and secrets for EAS Build.

## Overview

EAS Secrets are encrypted environment variables that are injected during the build process. They are managed via the EAS CLI and are never stored in your codebase.

## Common Secrets

### RevenueCat API Keys

For subscription monetization using RevenueCat:

```bash
# iOS API Key
eas secret:create --scope project --name REVENUECAT_API_KEY_IOS --value your_ios_api_key_here

# Android API Key
eas secret:create --scope project --name REVENUECAT_API_KEY_ANDROID --value your_android_api_key_here
```

Then reference them in `eas.json`:

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

### Other Common Secrets

```bash
# API URLs
eas secret:create --scope project --name API_URL --value https://api.example.com

# Analytics Keys
eas secret:create --scope project --name ANALYTICS_KEY --value your_analytics_key

# Firebase Configuration
eas secret:create --scope project --name FIREBASE_API_KEY --value your_firebase_api_key
```

## Managing Secrets

### Create a Secret
```bash
eas secret:create --scope project --name SECRET_NAME --value secret_value
```

### List Secrets
```bash
eas secret:list
```

### Delete a Secret
```bash
eas secret:delete --name SECRET_NAME
```

## Submit Configuration

Before using `eas submit`, you need to configure credentials:

### iOS (App Store Connect)

Update `eas.json` submit.production.ios section:
- `appleId`: Your Apple ID email
- `ascAppId`: App Store Connect App ID (10-digit number)
- `appleTeamId`: Your Apple Developer Team ID

### Android (Google Play)

1. Create a service account in Google Play Console
2. Download the JSON key file
3. Update `eas.json` submit.production.android section:
   - `serviceAccountKeyPath`: Path to the JSON file
   - `track`: Distribution track (internal, alpha, beta, production)

## References

- [EAS Build Environment Variables](https://docs.expo.dev/build-reference/variables/)
- [EAS Secrets](https://docs.expo.dev/build-reference/variables/#using-secrets-in-environment-variables)
- [EAS Submit Configuration](https://docs.expo.dev/submit/eas-json/)
