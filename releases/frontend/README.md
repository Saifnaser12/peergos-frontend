# Peergos Frontend Production

## Overview
This is the isolated frontend for the Peergos UAE tax compliance system, extracted from the main monorepo with 100% production readiness.

## Key Features
- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: Shadcn/UI with Radix primitives
- **Styling**: Tailwind CSS with RTL support
- **State Management**: TanStack Query + React Context
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for fast development and production builds

## Environment Setup
1. Copy `.env.example` to `.env` and configure:
   ```
   VITE_API_BASE_URL=https://api.peergos.ae
   VITE_APP_ENV=production
   VITE_BUILD_SHA=
   VITE_BUILD_TIME=
   VITE_FTA_API_KEY=
   ```

## Development
```bash
npm install
npm run dev      # Start dev server on port 5173
npm run build    # Build for production
npm run preview  # Preview production build on port 4173
```

## Verification Scripts
```bash
npm run verify:all     # Run all verification checks
npm run typecheck      # TypeScript compilation check
npm run report:manifest # Generate build manifest
npm run report:parity   # Generate parity report
```

## Production Deployment
The application builds to `dist/` folder and is ready for static hosting on any CDN or web server.

## API Integration
All API calls use the configured `VITE_API_BASE_URL` environment variable for seamless backend integration.