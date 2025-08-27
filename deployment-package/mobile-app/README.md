# Peergos Mobile App

A cross-platform mobile application for UAE tax compliance built with React Native and Expo.

## Features

- **Dashboard**: Overview of financial metrics and tax compliance status
- **Bookkeeping**: Manage income, expenses, and transactions
- **Tax Calculators**: UAE VAT (5%) and CIT (9%) calculations with Small Business Relief
- **Reports**: Financial statements and tax reports
- **Compliance Tracking**: Monitor VAT registration, CIT filing, and deadlines
- **Profile Management**: User settings and company information

## Getting Started

### Prerequisites

- Node.js 18+ 
- Expo CLI
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. Install dependencies:
```bash
cd mobile-app
npm install
```

2. Install Expo CLI globally:
```bash
npm install -g @expo/cli
```

3. Start the development server:
```bash
npm start
```

4. Use Expo Go app on your mobile device to scan the QR code, or:
   - Press 'i' for iOS simulator
   - Press 'a' for Android emulator
   - Press 'w' for web browser

### Project Structure

```
mobile-app/
├── app/                    # App router pages
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── index.tsx      # Dashboard
│   │   ├── bookkeeping.tsx # Bookkeeping features
│   │   ├── taxes.tsx      # Tax calculators
│   │   ├── reports.tsx    # Financial reports
│   │   └── profile.tsx    # User profile
│   └── _layout.tsx        # Root layout
├── assets/                # Images and static assets
├── components/           # Reusable components
└── constants/           # App constants and themes
```

## UAE Tax Compliance Features

### VAT Calculator
- 5% UAE VAT rate calculation
- Real-time calculation as you type
- VAT exemption information

### CIT Calculator  
- 9% Corporate Income Tax calculation
- Small Business Relief (first 375,000 AED exempt)
- Annual profit-based calculations

### Compliance Tracking
- VAT registration status
- CIT registration monitoring
- E-invoicing Phase 2 readiness
- 7-year record retention tracking

### Deadline Management
- VAT return deadlines
- CIT filing deadlines
- Payment due dates
- ESR (Economic Substance Regulation) filing

## Development

### Running on Different Platforms

- **iOS**: `npm run ios`
- **Android**: `npm run android` 
- **Web**: `npm run web`

### Building for Production

```bash
npm run build
```

## Technology Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript
- **Expo Router**: File-based routing
- **React Native Paper**: Material Design components
- **Expo Vector Icons**: Comprehensive icon library

## Contributing

1. Follow UAE FTA regulations for tax calculations
2. Maintain RTL (Right-to-Left) support for Arabic
3. Use AED currency formatting
4. Follow UAE business timezone (GMT+4)

## License

Proprietary - Peergos Tax Compliance Platform