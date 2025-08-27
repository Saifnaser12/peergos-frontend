# Frontend Production Setup

## Environment Variables Required
```env
VITE_API_BASE_URL=https://api.peergos.ae
VITE_APP_ENV=production
```

## Build & Start Commands
```bash
npm ci
npm run build
npm run preview
```

## Health Endpoint
- Built-in application health monitoring
- Verifies API connectivity

## Expected Public URL
- https://app.peergos.ae

## Static Hosting
Deploy the `dist/` folder to any static hosting service.