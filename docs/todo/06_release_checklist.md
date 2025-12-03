# 06. Release Checklist (RELEASE_CHECKLIST.md)

**Priority**: 🟡 Medium
**Status**: Pending

## Overview

Create a comprehensive checklist for app store submission to streamline release workflows and prevent common mistakes.

## Background

Store submission involves many steps and requirements. A checklist ensures nothing is missed and makes the release process repeatable and efficient.

## File Location

```
/docs/RELEASE_CHECKLIST.md
```

## Required Sections

### 1. Pre-Release Preparation (One-Time Setup)

#### Apple Developer Account

```markdown
### Apple Developer

- [ ] Apple Developer Program registered ($99/year)
- [ ] App created in App Store Connect
- [ ] Bundle ID registered (matches `app.config.ts`)
- [ ] App Store Connect API Key created (for EAS Submit)
- [ ] Certificates and provisioning profiles configured (EAS handles automatically)
```

#### Google Play Console

```markdown
### Google Play

- [ ] Google Play Developer account registered ($25 one-time)
- [ ] App created in Google Play Console
- [ ] Package name registered (matches `app.config.ts`)
- [ ] Service account created with JSON key (for EAS Submit)
- [ ] App signing key generated (Google Play App Signing recommended)
```

#### RevenueCat Configuration

```markdown
### RevenueCat Setup

- [ ] Project created in RevenueCat Dashboard
- [ ] App Store Connect integration configured
- [ ] Google Play Console integration configured
- [ ] Products created and synced from stores
- [ ] Entitlements configured (e.g., "premium", "pro")
- [ ] Offerings created and set as current
- [ ] API Keys obtained and added to EAS Secrets
- [ ] Test purchases verified in sandbox
```

### 2. Asset Preparation

#### App Icons

```markdown
### Icons

- [ ] 1024x1024px PNG (App Store, no transparency)
- [ ] 512x512px PNG (Google Play)
- [ ] Icon follows platform design guidelines
- [ ] No transparency in iOS icon
- [ ] Android adaptive icon (if using layered design)
```

#### Screenshots

```markdown
### iOS Screenshots

Required sizes (minimum):
- [ ] 6.7" display (iPhone 15 Pro Max): 1290 x 2796px
- [ ] 6.5" display (iPhone 15 Plus): 1284 x 2778px
- [ ] 5.5" display (iPhone 8 Plus, optional): 1242 x 2208px

Notes:
- Up to 10 screenshots per size
- Order matters (first is featured)
- Use real device captures or simulator

### Android Screenshots

Required:
- [ ] Phone screenshots: minimum 1080px width
- [ ] 7" tablet (optional): 1024 x 600px minimum
- [ ] 10" tablet (optional): 1280 x 800px minimum

Notes:
- 2-8 screenshots required
- 16:9 or 9:16 aspect ratio recommended
```

#### Store Listings

```markdown
### Metadata

- [ ] App name (iOS: 30 chars, Android: 50 chars)
- [ ] Short description (Android only: 80 chars)
- [ ] Full description (iOS: 4000 chars, Android: 4000 chars)
- [ ] Keywords (iOS only: 100 chars, comma-separated)
- [ ] Category selection (both stores)
- [ ] Privacy Policy URL (required if collecting data)
- [ ] Support URL or email
- [ ] Age rating questionnaire completed
```

### 3. Pre-Build Checklist

```markdown
## Pre-Build Verification

### Version Numbers

- [ ] `app.config.ts` > `version`: Updated (e.g., "1.0.0" → "1.1.0")
- [ ] `app.config.ts` > `ios.buildNumber`: Incremented (e.g., "1" → "2")
- [ ] `app.config.ts` > `android.versionCode`: Incremented (e.g., 1 → 2)
- [ ] Version follows semantic versioning (MAJOR.MINOR.PATCH)

### Configuration Review

- [ ] Bundle Identifier / Package Name correct
- [ ] App name finalized
- [ ] All permissions justified and necessary
- [ ] Privacy descriptions accurate and clear
- [ ] App icons set correctly
- [ ] Splash screens configured

### Environment Variables

- [ ] All required EAS Secrets configured
- [ ] RevenueCat API keys set correctly
- [ ] Firebase config files present (if using Firebase)
- [ ] No hardcoded secrets in source code

### Code Quality

- [ ] All tests passing: `pnpm test`
- [ ] TypeScript checks pass: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint`
- [ ] Code formatted: `pnpm format`
- [ ] No console.logs in production code (or using proper logging library)

### Feature Testing

- [ ] Core features tested on physical device
- [ ] RevenueCat purchases work in sandbox
- [ ] Deep links work correctly
- [ ] Offline mode tested (if applicable)
- [ ] Error boundary displays correctly
- [ ] All navigation flows tested
```

### 4. Build Process

```markdown
## Building

### iOS Production Build

```bash
# Start iOS production build
eas build --platform ios --profile production

# Monitor progress
# EAS will output a build URL to track progress
```

Wait for build to complete (~15-30 minutes).

### Android Production Build

```bash
# Start Android production build
eas build --platform android --profile production

# Monitor progress
```

Wait for build to complete (~15-30 minutes).

### Build Both Platforms

```bash
# Build both platforms simultaneously
eas build --platform all --profile production
```

### Build Verification

- [ ] Build completed successfully
- [ ] Download and install on test device
- [ ] App launches without crashes
- [ ] Core features work as expected
- [ ] App version displays correctly
```

### 5. Submission Process

```markdown
## App Store Submission (iOS)

### Prepare App Store Connect

- [ ] App information completed
- [ ] Screenshots uploaded (all required sizes)
- [ ] Privacy details filled out
- [ ] Age rating set
- [ ] Pricing and availability configured

### Submit Build

```bash
# Submit to App Store Connect
eas submit --platform ios --latest

# Or specify build ID
eas submit --platform ios --id [BUILD_ID]
```

### Post-Submission

- [ ] Build appears in App Store Connect (may take a few minutes)
- [ ] Select build for release
- [ ] Add "What's New" text
- [ ] Submit for review
- [ ] Monitor review status in App Store Connect

## Google Play Submission (Android)

### Prepare Play Console

- [ ] App information completed
- [ ] Screenshots uploaded
- [ ] Privacy policy URL added
- [ ] Content rating questionnaire completed
- [ ] Pricing and availability set
- [ ] Target audience selected

### Submit Build

```bash
# Submit to Google Play (Internal Testing track by default)
eas submit --platform android --latest --track internal

# Or submit to other tracks
eas submit --platform android --latest --track beta
eas submit --platform android --latest --track production
```

### Release Process

- [ ] Build uploaded to Internal Testing
- [ ] Test with internal testers
- [ ] Promote to Beta (optional)
- [ ] Promote to Production
- [ ] Set rollout percentage (optional: start at 10-20%)
- [ ] Monitor crash reports and user feedback
```

### 6. RevenueCat Production Verification

```markdown
## RevenueCat Production Checks

Pre-Launch:
- [ ] Products synced from App Store / Google Play
- [ ] Entitlements configured correctly
- [ ] Offerings published and set as "Current"
- [ ] Sandbox testing completed
- [ ] Webhook URLs configured (if using server-side validation)

Post-Launch:
- [ ] Monitor RevenueCat Dashboard for purchase events
- [ ] Verify entitlements are being granted correctly
- [ ] Check for any API errors in logs
- [ ] Test production purchase on real device
```

### 7. Post-Submission Monitoring

```markdown
## After Submission

### App Store Review (iOS)

Typical timeline: 1-3 days

- [ ] Monitor App Store Connect for review status
- [ ] Respond to any rejection reasons promptly
- [ ] Update build if required
- [ ] Resubmit if rejected

Common rejection reasons:
- Incomplete information
- Missing privacy descriptions
- Broken functionality
- Inappropriate content
- Misleading metadata

### Google Play Review (Android)

Typical timeline: Few hours to 1 day

- [ ] Monitor Play Console for review status
- [ ] Respond to any policy violations
- [ ] Update build if required

### Post-Release

- [ ] Monitor crash reports (if using crash reporting)
- [ ] Check user reviews and ratings
- [ ] Verify analytics are being collected
- [ ] Test real production purchases
- [ ] Update documentation with release notes
```

### 8. Rollback Procedure

```markdown
## If Issues Are Found

### iOS

- Remove from sale in App Store Connect
- Work on fix
- Submit new version

### Android

- Halt rollout in Play Console
- Or decrease rollout percentage
- Work on fix
- Upload new version
```

### 9. Release Notes Template

```markdown
## Version History Template

### Version X.Y.Z (YYYY-MM-DD)

**New Features**
- Feature description

**Improvements**
- Improvement description

**Bug Fixes**
- Bug fix description

**Known Issues**
- Issue description (if any)
```

## Quick Command Reference

```bash
# Version bump (manual in app.config.ts)

# Build
eas build --platform ios --profile production
eas build --platform android --profile production
eas build --platform all --profile production

# Submit
eas submit --platform ios --latest
eas submit --platform android --latest --track internal

# Check build status
eas build:list

# View build details
eas build:view [BUILD_ID]
```

## Acceptance Criteria

- [ ] One-time setup checklist for both platforms
- [ ] Asset preparation requirements documented
- [ ] Pre-build verification checklist comprehensive
- [ ] Build commands provided for all scenarios
- [ ] Submission process documented step-by-step
- [ ] RevenueCat verification steps included
- [ ] Post-submission monitoring guidance
- [ ] Rollback procedures documented
- [ ] Quick command reference provided
- [ ] Common rejection reasons noted

## Related Documentation

- `docs/SETUP.md` - Initial project setup
- `docs/ENVIRONMENT.md` - Environment variable configuration
- `app.config.ts` - App configuration file
- `eas.json` - Build profiles

## References

- [App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)
