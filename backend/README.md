# Peergos Backend API

UAE Tax Compliance Backend Service

## Quick Start

```bash
# Install dependencies
npm ci

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Build the application
npm run build

# Start production server
npm start
```

## Environment Variables

Required environment variables:

```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgres://user:pass@host:5432/peergos
SESSION_SECRET=change_me
CORS_ORIGIN=https://app.peergos.ae
JWT_ISSUER=peergos
```

## API Endpoints

### Health Checks
- `GET /health` - Application health status
- `GET /api/health` - API health status

### Expected Response
```json
{
  "status": "ok",
  "timestamp": "2024-08-27T12:00:00.000Z",
  "environment": "production"
}
```

## Database Setup

```bash
# Push database schema
npm run db:push

# Seed UAE Chart of Accounts
npm run seed:coa
```

## Production Deployment

1. Set all required environment variables
2. Build the application: `npm run build`  
3. Start the server: `npm start`
4. Configure reverse proxy (see DEPLOYMENT_NOTES.md)
5. Monitor health endpoints

## Development

```bash
# Development server with hot reload
npm run dev
```

Development server runs on port 8080 by default.

## Architecture

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database operations
- **PostgreSQL** - Primary database
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers
- **Rate Limiting** - API protection

## Security Features

- CORS configuration for specific origins
- Helmet security headers
- Rate limiting on API endpoints
- Secure session cookies
- Input validation and sanitization