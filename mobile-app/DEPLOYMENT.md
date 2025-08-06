# Peergos Mobile App Deployment Guide

## Development Setup

### Prerequisites
- Node.js 18 or higher
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (Mac only) or Android Studio
- Expo Go app on physical device

### Local Development
```bash
cd mobile-app
npm install
npm start
```

This will start the Expo development server. You can then:
- Scan QR code with Expo Go app (iOS/Android)
- Press 'i' for iOS Simulator
- Press 'a' for Android Emulator 
- Press 'w' for web browser

## Building for Production

### 1. Configure App for Production

Update `app.json` with production settings:
```json
{
  "expo": {
    "name": "Peergos Tax Compliance",
    "slug": "peergos-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1976d2"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.peergos.mobile"
    },
    "android": {
      "package": "com.peergos.mobile",
      "versionCode": 1
    }
  }
}
```

### 2. Create Production Builds

#### iOS Build (Requires Apple Developer Account)
```bash
npx expo build:ios
```

#### Android Build
```bash
npx expo build:android
```

### 3. Using EAS Build (Recommended)

Install EAS CLI:
```bash
npm install -g @expo/eas-cli
```

Configure EAS:
```bash
npx eas build:configure
```

Build for both platforms:
```bash
npx eas build --platform all
```

## App Store Distribution

### iOS App Store
1. Create app in App Store Connect
2. Upload build using EAS Submit:
   ```bash
   npx eas submit --platform ios
   ```
3. Complete App Store metadata
4. Submit for review

### Google Play Store
1. Create app in Google Play Console
2. Upload build using EAS Submit:
   ```bash
   npx eas submit --platform android
   ```
3. Complete Play Store listing
4. Submit for review

## Environment Configuration

### Production API Endpoints
Update API base URLs for production:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api' 
  : 'https://your-production-api.com/api';
```

### Environment Variables
Create `.env` files:
```bash
# .env.development
API_URL=http://localhost:5000/api
DEBUG=true

# .env.production  
API_URL=https://your-production-api.com/api
DEBUG=false
```

## Security Considerations

### 1. API Security
- Use HTTPS for all API calls
- Implement proper authentication tokens
- Validate all user inputs

### 2. Data Protection
- Enable SSL pinning for production
- Encrypt sensitive data stored locally
- Implement biometric authentication

### 3. Compliance
- Follow UAE data protection regulations
- Implement proper audit logging
- Ensure data sovereignty requirements

## Performance Optimization

### 1. Bundle Size
- Use Expo's selective imports
- Optimize images and assets
- Remove unused dependencies

### 2. Startup Performance
- Implement lazy loading for screens
- Optimize initial bundle size
- Use splash screen effectively

### 3. Runtime Performance
- Implement proper list virtualization
- Optimize re-renders with React.memo
- Use efficient state management

## Monitoring and Analytics

### 1. Crash Reporting
```bash
npx expo install @bugsnag/expo
```

### 2. Performance Monitoring
```bash
npx expo install @react-native-firebase/perf
```

### 3. User Analytics
```bash
npx expo install @react-native-firebase/analytics
```

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Testing with Detox
```bash
npm install -g detox-cli
npx detox build
npx detox test
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx eas build --platform all --non-interactive
```

## Troubleshooting

### Common Issues
1. **Metro bundler cache**: `npx expo start --clear`
2. **Node modules**: `rm -rf node_modules && npm install`
3. **iOS simulator**: Reset device in Simulator menu

### Performance Issues
- Check bundle analyzer: `npx expo export --web`
- Profile with Flipper
- Use React DevTools Profiler

## Support

For deployment issues:
- Check Expo documentation: https://docs.expo.dev
- UAE-specific compliance questions: Contact legal team
- Technical support: Create issue in project repository