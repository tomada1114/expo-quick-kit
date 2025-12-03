# 07. Firebase Integration (Optional)

**Priority**: 🟢 Low
**Status**: Pending

## Overview

Implement optional Firebase integration for apps that need cloud services beyond local SQLite storage. This should be easy to enable or completely remove based on app requirements.

## Background

While the template focuses on local-first architecture with SQLite, some apps require cloud capabilities:
- Cross-device data synchronization
- User authentication
- Server-side subscription validation (future needs)
- Cloud backups for device migration

Firebase's free tier (Spark Plan) is sufficient for multiple indie apps:

| Service | Free Tier |
|---------|-----------|
| Firestore | 1GB storage, 50K reads/day, 20K writes/day |
| Authentication | Unlimited (except phone auth) |
| Cloud Functions | 125K invocations/month |
| Storage | 5GB storage, 1GB/day download |

## Design Principles

1. **Optional by Design**: App builds and runs without Firebase
2. **Lazy Initialization**: Don't initialize until needed
3. **Offline-First**: Enable Firestore offline persistence
4. **Environment Separation**: Support dev/prod Firebase projects

## File Structure

```
/lib/firebase/
├── index.ts           # Exports aggregation
├── config.ts          # Firebase initialization
└── firestore.ts       # Firestore utilities (optional)

/google-services.json           # Android config (.gitignore)
/GoogleService-Info.plist       # iOS config (.gitignore)
```

## Implementation Requirements

### 1. Dependencies

```bash
# Core Firebase
pnpm add @react-native-firebase/app

# Optional services (install as needed)
pnpm add @react-native-firebase/auth
pnpm add @react-native-firebase/firestore
pnpm add @react-native-firebase/storage
pnpm add @react-native-firebase/functions
```

### 2. Configuration File (lib/firebase/config.ts)

```typescript
import { FirebaseApp } from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';

let initialized = false;

export async function initializeFirebase(): Promise<FirebaseApp | null> {
  if (initialized) {
    return firebase.app();
  }

  try {
    // Firebase auto-initializes from google-services files
    const app = firebase.app();

    // Enable Firestore offline persistence
    await firestore().settings({
      persistence: true,
      cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
    });

    initialized = true;
    console.log('Firebase initialized successfully');
    return app;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    return null;
  }
}

export function isFirebaseInitialized(): boolean {
  return initialized;
}
```

### 3. app.config.ts Integration

Add Firebase configuration file paths:

```typescript
export default {
  // ... existing config
  ios: {
    // ... existing iOS config
    googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? './GoogleService-Info.plist',
  },
  android: {
    // ... existing Android config
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
}
```

### 4. Firestore Offline Configuration

Enable offline persistence for local-first approach:

```typescript
// lib/firebase/firestore.ts
import firestore from '@react-native-firebase/firestore';

export async function configureFirestore() {
  await firestore().settings({
    persistence: true, // Enable offline persistence
    cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
  });
}
```

## When to Use Firebase

### Decision Flowchart

```
Q1: Does your app need user authentication?
  → Yes: Use Firebase
  → No: Continue to Q2

Q2: Do users need to restore data after device change?
  → Yes: Consider Firebase
  → No: Continue to Q3

Q3: Do users need to sync data across multiple devices?
  → Yes: Consider Firebase
  → No: Firebase not needed (use SQLite only)
```

### Use Cases

| Use Case | Firebase? | Reason |
|----------|-----------|--------|
| Fully offline app | No | SQLite sufficient |
| Data sync needed | Yes | Firestore offline sync |
| Device migration | Yes | Cloud backup required |
| User accounts | Yes | Firebase Auth |
| Server-side processing | Yes | Cloud Functions |

## Setup Instructions (docs/FIREBASE.md)

Create separate detailed documentation at `docs/FIREBASE.md`:

### Firebase Project Creation

```markdown
## Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "myapp-prod")
4. Disable Google Analytics (unnecessary for indie apps)
5. Create project

## Add iOS App

1. Click "Add app" → iOS
2. Bundle ID: Must match `ios.bundleIdentifier` in app.config.ts
3. Download `GoogleService-Info.plist`
4. Place in project root
5. Add to `.gitignore`

## Add Android App

1. Click "Add app" → Android
2. Package name: Must match `android.package` in app.config.ts
3. Download `google-services.json`
4. Place in project root
5. Add to `.gitignore`
```

### Firestore Security Rules

```javascript
// Development rules (update for production)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Require authentication for all reads/writes
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Environment Variables

Add to `.env.local`:

```bash
# Firebase Configuration Files
GOOGLE_SERVICES_JSON=./google-services.json
GOOGLE_SERVICES_PLIST=./GoogleService-Info.plist
```

## What NOT to Include in Template

Keep template minimal by excluding:

| Excluded | Reason |
|----------|--------|
| Auth implementation | App-specific UX flow required |
| Firestore schemas | Depends on app data structure |
| Cloud Functions | Server logic is app-specific |
| Analytics | Unnecessary for indie development |
| Crashlytics | Unnecessary for indie development |
| Remote Config | Overkill for indie apps |

## Disabling Firebase

If Firebase is not needed, remove it completely:

### 1. Uninstall Packages

```bash
pnpm remove @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/auth
```

### 2. Delete Files

```bash
rm -rf lib/firebase/
rm google-services.json
rm GoogleService-Info.plist
```

### 3. Update app.config.ts

Remove `googleServicesFile` configuration:

```typescript
export default {
  ios: {
    // Remove: googleServicesFile
  },
  android: {
    // Remove: googleServicesFile
  }
}
```

### 4. Clear Cache

```bash
pnpm start --clear
```

## Documentation Structure (docs/FIREBASE.md)

The detailed Firebase guide should include:

1. **When to Use Firebase**: Decision flowchart
2. **Project Setup**: Step-by-step Firebase Console setup
3. **iOS Configuration**: GoogleService-Info.plist setup
4. **Android Configuration**: google-services.json setup
5. **Security Rules**: Firestore rules for dev and prod
6. **Authentication**: Link to Firebase Auth docs (don't implement)
7. **Firestore**: Offline persistence configuration
8. **Environment Variables**: Integration with EAS Secrets
9. **Disabling Firebase**: Complete removal instructions
10. **Cost Management**: Monitoring usage and quotas

## Acceptance Criteria

### Implementation

- [ ] `lib/firebase/` directory structure created
- [ ] Optional initialization (doesn't crash if files missing)
- [ ] Lazy initialization pattern implemented
- [ ] Firestore offline persistence configured
- [ ] Environment separation supported (dev/prod)
- [ ] Easy to disable completely
- [ ] No impact on build if not used

### Documentation (docs/FIREBASE.md)

- [ ] When to use Firebase decision guide
- [ ] Firebase project creation steps
- [ ] iOS and Android app addition instructions
- [ ] Configuration file placement explained
- [ ] Security rules provided (starter templates)
- [ ] Environment variable setup documented
- [ ] Disabling instructions complete
- [ ] Cost monitoring guidance included

## Testing Scenarios

### With Firebase Enabled

1. App builds successfully with Firebase configuration
2. Firebase initializes on first use
3. Firestore offline persistence works
4. App functions offline after initial sync

### Without Firebase

1. App builds successfully without Firebase files
2. Firebase code doesn't crash when config missing
3. App runs fully offline with SQLite only

## Cost Monitoring

Free tier limits to monitor:

| Service | Quota | Alert Threshold |
|---------|-------|-----------------|
| Firestore Reads | 50K/day | 40K/day (80%) |
| Firestore Writes | 20K/day | 16K/day (80%) |
| Firestore Storage | 1GB | 800MB (80%) |
| Functions Invocations | 125K/month | 100K/month (80%) |

Set up budget alerts in Firebase Console.

## Security Considerations

### Production Security Rules

Never deploy with development rules. Example production rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Public read-only data
    match /public/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### API Key Security

- Firebase config files contain API keys
- These keys are safe to expose (protected by security rules)
- However, still add to `.gitignore` as best practice
- Use EAS Secrets for build-time injection

## References

- [React Native Firebase Documentation](https://rnfirebase.io/)
- [Firebase Console](https://console.firebase.google.com/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [Firestore Offline Persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
