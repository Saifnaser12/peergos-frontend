# Backend Production Setup

## Environment Variables Required
```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgres://user:pass@host:5432/peergos
SESSION_SECRET=change_me
CORS_ORIGIN=https://app.peergos.ae
JWT_ISSUER=peergos
```

## Build & Start Commands
```bash
npm ci
npm run build
npm start
```

## Health Endpoint
- URL: `/health`
- Expected Response: `{"status": "ok"}`

## Expected Public URL
- https://api.peergos.ae

## Database Migration Steps
```bash
npm run db:push
npm run seed:coa
```