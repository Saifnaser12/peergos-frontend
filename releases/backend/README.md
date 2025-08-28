# Peergos Backend Production

UAE Tax Compliance Backend API - Production Ready

## Overview

This is the production backend for Peergos, a comprehensive UAE tax compliance system. The backend provides:

- UAE VAT (5%) and CIT (9%) tax calculations
- UAE FTA-compliant Chart of Accounts
- REST API for frontend integration
- Database management with PostgreSQL

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Push database schema
npm run db:push

# Seed UAE Chart of Accounts
npm run seed:coa

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Required environment variables (see `.env.example`):

- `NODE_ENV` - Environment (production/development)
- `PORT` - Server port (default: 8080)
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret for session management
- `CORS_ORIGIN` - Allowed CORS origins

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Chart of Accounts
- `GET /api/coa` - Get all chart of accounts
- `GET /api/admin/coa/count` - Get count of chart accounts

### Tax Calculations
- `POST /api/tax/vat/calculate` - Calculate UAE VAT
- `POST /api/tax/cit/calculate` - Calculate UAE Corporate Income Tax

## Database Schema

The system includes:
- Chart of Accounts (UAE FTA compliant)
- Companies
- Transactions

## Development

```bash
# Development with hot reload
npm run dev

# Type checking
npm run typecheck

# Database operations
npm run db:push
npm run db:migrate
```

## Production Deployment

1. Set all required environment variables
2. Build the application: `npm run build`
3. Start the server: `npm start`
4. Monitor health at `/health`

## Testing

```bash
# Smoke test (requires running server)
npm run test:smoke
```

## Architecture

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database operations
- **PostgreSQL** - Database
- **Zod** - Schema validation

## UAE Tax Features

- VAT calculation with 5% rate
- CIT calculation with 9% rate
- Small Business Relief support
- QFZP (Qualifying Free Zone Person) support
- FTA-compliant Chart of Accounts (90+ accounts)

Built for UAE market compliance and scalability.