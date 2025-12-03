# 05. Environment Variables Guide (ENVIRONMENT.md)

**Priority**: 🟡 Medium
**Status**: Pending

## Overview

Document environment variable configuration for local development and EAS Build, ensuring sensitive information never gets hardcoded into source code.

## Background

Proper environment variable management is critical for security and flexibility. This guide prevents accidental exposure of API keys and credentials.

## File Location

```
/docs/ENVIRONMENT.md
```

## Required Sections

### 1. Overview

Explain:
- Why environment variables are necessary
- Security implications of hardcoding secrets
- Difference between local and build-time variables

### 2. Local Development Setup

#### .env.local Configuration

```bash
# Copy template
cp .env.example .env.local

# Edit with your values
# .env.local is gitignored and never committed
```

#### Example .env.local Structure

```bash
# RevenueCat (Required)
REVENUECAT_API_KEY_IOS=rcb_xxx
REVENUECAT_API_KEY_ANDROID=rcb_xxx

# Firebase (Optional)
GOOGLE_SERVICES_JSON=./google-services.json
GOOGLE_SERVICES_PLIST=./GoogleService-Info.plist

# EAS Project (Auto-generated)
EAS_PROJECT_ID=your-project-id
```

### 3. EAS Build Configuration

#### Setting Secrets

```bash
# Login to EAS
eas login

# Create secrets
eas secret:create --name REVENUECAT_API_KEY_IOS --value "rcb_xxx" --type string
eas secret:create --name REVENUECAT_API_KEY_ANDROID --value "rcb_xxx" --type string

# List all secrets
eas secret:list

# Delete a secret (if needed)
eas secret:delete --name REVENUECAT_API_KEY_IOS
```

#### eas.json Integration

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

Note: The `@` prefix references EAS Secrets.

### 4. app.config.ts Integration

#### Reading Environment Variables

```typescript
export default ({ config }) => ({
  ...config,
  extra: {
    // RevenueCat
    revenueCatApiKeyIos: process.env.REVENUECAT_API_KEY_IOS ?? '',
    revenueCatApiKeyAndroid: process.env.REVENUECAT_API_KEY_ANDROID ?? '',

    // EAS
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
```

#### Accessing in App Code

```typescript
import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.revenueCatApiKeyIos;
```

### 5. Environment Variables Reference

Complete table of all environment variables:

| Variable Name | Required | Purpose | Where to Get |
|--------------|----------|---------|--------------|
| `REVENUECAT_API_KEY_IOS` | Yes | RevenueCat iOS integration | [RevenueCat Dashboard](https://app.revenuecat.com/) > Settings > API Keys |
| `REVENUECAT_API_KEY_ANDROID` | Yes | RevenueCat Android integration | [RevenueCat Dashboard](https://app.revenuecat.com/) > Settings > API Keys |
| `EAS_PROJECT_ID` | Auto | EAS project identifier | Auto-generated after `eas build:configure` |
| `GOOGLE_SERVICES_JSON` | Optional | Firebase Android config | [Firebase Console](https://console.firebase.google.com/) > Project Settings > Android |
| `GOOGLE_SERVICES_PLIST` | Optional | Firebase iOS config | [Firebase Console](https://console.firebase.google.com/) > Project Settings > iOS |

### 6. Security Best Practices

#### Never Commit Secrets

Ensure `.gitignore` includes:
```
.env*
!.env.example
google-services.json
GoogleService-Info.plist
service-account.json
```

#### Environment-Specific Values

| Environment | Configuration Method |
|-------------|---------------------|
| Local Development | `.env.local` |
| EAS Build | EAS Secrets |
| CI/CD | GitHub Secrets (or equivalent) |

#### Rotation Strategy

- Rotate API keys periodically
- Use different keys for development/production
- Revoke compromised keys immediately
- Document key rotation in team procedures

### 7. Troubleshooting

#### Variables Not Available in App

**Problem**: `Constants.expoConfig?.extra` is undefined

**Solutions**:
1. Clear Metro cache: `pnpm start --clear`
2. Verify `app.config.ts` exports `extra` correctly
3. Check that environment variables are set
4. Restart dev server

#### EAS Build Fails Due to Missing Secrets

**Problem**: Build fails with "Missing environment variable"

**Solutions**:
1. Verify secrets exist: `eas secret:list`
2. Check `eas.json` references secrets correctly
3. Ensure secret names match exactly (case-sensitive)

#### Local Development Can't Find .env.local

**Problem**: Environment variables not loading locally

**Solutions**:
1. Ensure `.env.local` exists in project root
2. Restart dev server after creating/editing `.env.local`
3. Check file is not named `.env.local.txt` (hidden extension)

## Platform-Specific Notes

### iOS

- RevenueCat API Key used for App Store purchases
- Requires Apple Developer Program membership ($99/year)
- Keys available after creating app in RevenueCat

### Android

- RevenueCat API Key used for Google Play purchases
- Requires Google Play Developer account ($25 one-time)
- Keys available after creating app in RevenueCat

### Firebase (Optional)

- `google-services.json` and `GoogleService-Info.plist` contain Firebase configuration
- These files should NOT be committed to Git
- Can be stored as EAS Secrets for builds
- See `docs/FIREBASE.md` for detailed setup

## Template Files

### .env.example

Create this file for new developers:

```bash
# RevenueCat API Keys
# Get these from: https://app.revenuecat.com/ > Settings > API Keys
REVENUECAT_API_KEY_IOS=rcb_your_ios_key_here
REVENUECAT_API_KEY_ANDROID=rcb_your_android_key_here

# Firebase Configuration (Optional)
# Get these from: https://console.firebase.google.com/ > Project Settings
GOOGLE_SERVICES_JSON=./google-services.json
GOOGLE_SERVICES_PLIST=./GoogleService-Info.plist

# EAS Project ID (Auto-generated, don't edit)
EAS_PROJECT_ID=
```

## Acceptance Criteria

- [ ] Overview section explains why environment variables matter
- [ ] Local development setup documented with `.env.local`
- [ ] EAS Secrets configuration commands provided
- [ ] app.config.ts integration explained
- [ ] Complete environment variables reference table
- [ ] Security best practices documented
- [ ] Troubleshooting section covers common issues
- [ ] Platform-specific notes included
- [ ] `.env.example` template created
- [ ] All secrets properly documented with retrieval instructions

## Related Documentation

- `docs/SETUP.md` - Initial project setup
- `docs/FIREBASE.md` - Firebase-specific configuration
- `docs/RELEASE_CHECKLIST.md` - Pre-release environment checks

## References

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [EAS Secrets](https://docs.expo.dev/build-reference/variables/)
- [expo-constants](https://docs.expo.dev/versions/latest/sdk/constants/)
