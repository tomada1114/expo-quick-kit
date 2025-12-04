# 04. Setup Guide (SETUP.md)

**Priority**: 🟡 Medium
**Status**: ✅ Complete

## Overview

Create a comprehensive setup guide that walks developers through creating a new project from this template, ensuring no configuration steps are missed.

## Background

First-time users of the template need clear instructions from cloning to running the app. This guide eliminates guesswork and prevents common setup mistakes.

## File Location

```
/docs/SETUP.md
```

## Required Sections

### 1. Prerequisites

Document required tools and versions:

| Tool | Version Requirement | Installation |
|------|---------------------|--------------|
| Node.js | >= 20.x | [nodejs.org](https://nodejs.org/) |
| pnpm | >= 9.x | `npm install -g pnpm` |
| Expo CLI | Latest | `npm install -g expo-cli` |
| EAS CLI | Latest | `npm install -g eas-cli` |

Additional requirements:
- iOS development: macOS with Xcode installed
- Android development: Android Studio with SDK
- Physical device or simulator/emulator

### 2. Clone or Use Template

```bash
# Option 1: Use as GitHub template
# Click "Use this template" button on GitHub

# Option 2: Clone directly
git clone https://github.com/yourusername/expo-quick-kit.git my-new-app
cd my-new-app
```

### 3. Project Name Change Checklist

Critical files that must be updated:

```markdown
## Project Naming Checklist

- [ ] `app.config.ts` > `name`: App display name
- [ ] `app.config.ts` > `slug`: URL slug (lowercase, hyphen-separated)
- [ ] `app.config.ts` > `scheme`: Deep link scheme
- [ ] `app.config.ts` > `ios.bundleIdentifier`: `com.yourcompany.appname`
- [ ] `app.config.ts` > `android.package`: `com.yourcompany.appname`
- [ ] `package.json` > `name`: Package name
- [ ] Delete `/app.json` if it exists (use app.config.ts instead)
```

### 4. Dependency Installation

```bash
pnpm install
```

### 5. Environment Variables

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
# See docs/ENVIRONMENT.md for detailed configuration
```

Required variables:
- `REVENUECAT_API_KEY_IOS`
- `REVENUECAT_API_KEY_ANDROID`

### 6. Database Initialization

```bash
# Generate Drizzle schema
pnpm db:generate

# Open Drizzle Studio (optional, for inspection)
pnpm db:studio
```

### 7. Start Development Server

```bash
# Start Expo dev server
pnpm start

# Or start directly on a platform
pnpm ios      # iOS simulator
pnpm android  # Android emulator
pnpm web      # Web browser
```

### 8. Verify Installation

Checklist for confirming successful setup:

```markdown
## Verification Checklist

- [ ] App launches without errors
- [ ] Navigate between tabs (Index, Explore, Settings)
- [ ] Database operations work (try example CRUD features)
- [ ] Theme switching works (if applicable)
- [ ] No console errors or warnings
```

## Troubleshooting Section

### Common Issues

**Metro bundler cache issues**:
```bash
pnpm start --clear
```

**Dependency issues**:
```bash
rm -rf node_modules
pnpm install
```

**iOS pod install issues**:
```bash
cd ios
pod install --repo-update
cd ..
```

**Android build issues**:
```bash
cd android
./gradlew clean
cd ..
```

**Expo Go not connecting**:
- Ensure phone and computer are on same WiFi network
- Try restarting Expo dev server
- Check firewall settings

## Optional Configuration

### Development Build (for testing native features)

```bash
# Create development build
eas build --profile development --platform ios
eas build --profile development --platform android

# Install on device
# iOS: Download from link, install via TestFlight
# Android: Download APK and install
```

### Physical Device Testing

For features requiring physical device:
- Push notifications
- Camera/Photo library
- Biometric authentication
- Geolocation
- Haptic feedback

See `docs/ENVIRONMENT.md` for configuring tunnel mode for physical device testing.

## Project Structure Orientation

Quick overview of key directories:

```
app/              # expo-router screens
components/       # Shared UI components
features/         # Feature-based modules
database/         # Drizzle ORM + SQLite
store/            # Zustand state
lib/              # Utilities
constants/        # Theme, colors
```

See `CLAUDE.md` for detailed architecture documentation.

## Next Steps

After successful setup:

1. **Customize app.config.ts**: Update all `TODO: CHANGE THIS` items
2. **Design your schema**: Edit `database/schema.ts`
3. **Review theme**: Customize `constants/theme.ts` if needed
4. **Remove example code**: Clean up `features/_example/`
5. **Plan features**: Start building your app!

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [expo-router Guide](https://docs.expo.dev/router/introduction/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [RevenueCat Integration](https://www.revenuecat.com/docs/)

## Acceptance Criteria

- [x] All prerequisite tools documented with versions
- [x] Clone/template usage instructions clear
- [x] Project naming checklist comprehensive
- [x] Installation steps in logical order
- [x] Environment setup references .env.example
- [x] Database initialization explained
- [x] Verification checklist provided
- [x] Troubleshooting section covers common issues
- [x] Optional configurations documented
- [x] Next steps guide provided

## Notes

- Keep instructions concise and actionable
- Use code blocks for all commands
- Include expected outputs where helpful
- Link to other documentation for details (don't duplicate)
- Test instructions with a fresh clone
