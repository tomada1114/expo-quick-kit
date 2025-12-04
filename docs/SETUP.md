# Setup Guide

This guide walks you through creating a new project from expo-quick-kit, from prerequisites to running your first build.

## Prerequisites

Ensure you have the following tools installed:

| Tool | Version | Installation |
|------|---------|--------------|
| Node.js | >= 20.x | [nodejs.org](https://nodejs.org/) |
| pnpm | >= 9.x | `npm install -g pnpm` |
| Expo CLI | Latest | Included with Expo SDK |
| EAS CLI | Latest | `npm install -g eas-cli` |

### Platform-Specific Requirements

**iOS Development (macOS only)**:
- Xcode (latest version recommended)
- Xcode Command Line Tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`
- iOS Simulator (installed via Xcode)

**Android Development**:
- Android Studio
- Android SDK (API Level 34 or higher recommended)
- Android Emulator or physical device

## Getting Started

### 1. Clone or Use Template

```bash
# Option 1: Use as GitHub template
# Click "Use this template" button on GitHub

# Option 2: Clone directly
git clone https://github.com/yourusername/expo-quick-kit.git my-app
cd my-app

# Remove original git history
rm -rf .git
git init
```

### 2. Project Naming Checklist

Update the following files to customize your project:

**Required Changes:**

- [ ] `package.json` > `name`: Your package name
- [ ] `app.config.ts` > `name`: App display name (shown on home screen)
- [ ] `app.config.ts` > `slug`: URL slug (lowercase, hyphen-separated)
- [ ] `app.config.ts` > `scheme`: Deep link scheme (e.g., `myapp` for `myapp://`)
- [ ] `app.config.ts` > `ios.bundleIdentifier`: `com.yourcompany.appname`
- [ ] `app.config.ts` > `android.package`: `com.yourcompany.appname`

**Optional Changes:**

- [ ] `app.config.ts` > `owner`: Your Expo account username (for EAS Build)
- [ ] `app.config.ts` > Icons and splash screen images
- [ ] `app.config.ts` > iOS/Android permission descriptions

> **Warning**: Bundle identifiers and package names cannot be changed after App Store/Play Store registration.

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Environment Variables

```bash
# Copy the environment template
cp .env.example .env.local

# Edit with your values
# See .env.example for all available variables
```

**Required Variables:**

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_REVENUE_CAT_API_KEY_APPLE` | RevenueCat iOS API key |
| `EXPO_PUBLIC_REVENUE_CAT_API_KEY_GOOGLE` | RevenueCat Android API key |

Get your RevenueCat API keys from: https://app.revenuecat.com/

**Optional Variables:**

| Variable | Description |
|----------|-------------|
| `GOOGLE_SERVICES_PLIST` | Path to iOS Firebase config |
| `GOOGLE_SERVICES_JSON` | Path to Android Firebase config |
| `EAS_PROJECT_ID` | EAS project ID |

### 5. Database Initialization

expo-quick-kit uses Drizzle ORM with expo-sqlite. Generate initial migrations:

```bash
# Generate Drizzle schema
pnpm db:generate

# Open Drizzle Studio (optional, for inspection)
pnpm db:studio
```

### 6. Start Development Server

```bash
# Start Expo dev server with interactive menu
pnpm start

# Or start directly on a platform
pnpm ios        # iOS simulator
pnpm android    # Android emulator
pnpm web        # Web browser

# For physical device with tunnel mode
pnpm dev:ios    # iOS with dev-client and tunnel
```

## Verification Checklist

After setup, verify everything works:

- [ ] App launches without errors
- [ ] Navigate between tabs (Index, Demo)
- [ ] Theme follows system dark/light mode
- [ ] No console errors or warnings
- [ ] Database operations work (check demo features)

## Troubleshooting

### Metro Bundler Cache Issues

```bash
pnpm start --clear
```

### Dependency Issues

```bash
rm -rf node_modules
pnpm install
```

### iOS Pod Install Issues

```bash
cd ios
pod install --repo-update
cd ..
```

### Android Build Issues

```bash
cd android
./gradlew clean
cd ..
```

### Expo Go Not Connecting

- Ensure phone and computer are on same WiFi network
- Try tunnel mode: `pnpm start --tunnel`
- Check firewall settings (port 19000, 19001)
- Restart Expo dev server

### TypeScript Errors

```bash
pnpm typecheck
```

### Lint Errors

```bash
pnpm lint:fix
```

## Development Build (Native Features)

Some features require a development build instead of Expo Go:

- Push notifications
- Camera/Photo library with native modules
- Biometric authentication
- RevenueCat in-app purchases

### Create Development Build

```bash
# Login to EAS
eas login

# Create development build
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Install on Device

- **iOS**: Download from EAS, install via TestFlight or ad-hoc
- **Android**: Download APK and install directly

### Run with Development Build

```bash
# Start with dev client
pnpm dev:ios
```

## Project Structure Overview

```
app/              # expo-router screens
components/       # Shared UI components
features/         # Feature-based modules
database/         # Drizzle ORM + SQLite
store/            # Zustand state
lib/              # Utilities
constants/        # Theme, colors
services/         # External service wrappers
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## Next Steps

After successful setup:

1. **Review app.config.ts**: Update all `TODO: CHANGE THIS` items
2. **Design your schema**: Edit `database/schema.ts` for your data model
3. **Customize theme**: Modify `constants/theme.ts` if needed
4. **Remove example code**: Clean up `features/_example/`
5. **Run quality checks**: `pnpm check` (format, lint, typecheck, test)
6. **Start building**: Create your first feature in `features/`

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [expo-router Guide](https://docs.expo.dev/router/introduction/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://zustand.docs.pmnd.rs/)
- [RevenueCat Docs](https://www.revenuecat.com/docs/)

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Project architecture details
- [CONVENTIONS.md](./CONVENTIONS.md) - Coding conventions
- [TESTING.md](./TESTING.md) - Testing guidelines
- [REVENUECAT_SETUP.md](./REVENUECAT_SETUP.md) - RevenueCat integration
