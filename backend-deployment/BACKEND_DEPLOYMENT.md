# Peergos Backend API Server - Deployment Guide

## Overview
This is the backend API server for the Peergos UAE Tax Compliance System. It provides RESTful APIs for tax calculations, accounting, workflow management, and compliance reporting.

## Architecture
- **Runtime**: Node.js 18+ with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with Passport.js
- **APIs**: RESTful endpoints for UAE tax compliance

## Environment Variables
Create `.env` file:
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/peergos_db

# Session
SESSION_SECRET=your-secure-session-secret-256-chars-long

# Server
NODE_ENV=production
PORT=5000

# Optional: Email notifications
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

## Quick Setup
```bash
# Install dependencies
npm install

# Setup database
npm run db:push
npm run seed

# Build server
npm run build

# Start production server
npm start
```

## API Endpoints

### Core APIs
- `GET /health` - Server health check
- `GET /api/health` - API and database health
- `POST /api/auth/login` - User authentication
- `GET /api/users/me` - Current user info

### Tax Calculation APIs
- `POST /api/calculate/vat` - VAT calculation (5% UAE rate)
- `POST /api/calculate/cit` - CIT calculation (9% with Small Business Relief)
- `GET /api/tax-filings` - Tax filing records
- `POST /api/tax-filings` - Submit tax filing

### Financial APIs
- `GET /api/transactions` - Financial transactions
- `POST /api/transactions` - Create transaction
- `GET /api/chart-of-accounts` - UAE chart of accounts
- `GET /api/kpi-data` - Key performance indicators

### Workflow APIs
- `GET /api/workflow-status` - Workflow progress
- `GET /api/notifications` - System notifications
- `GET /api/tasks` - User tasks

## Database Schema
Includes tables for:
- Companies and users (authentication)
- Chart of accounts (UAE FTA compliant)
- Financial transactions
- Tax calculations and filings
- Workflow and notifications

## Production Configuration
- Express server with security middleware (Helmet)
- PostgreSQL connection pooling
- Session store in database
- Rate limiting and CORS protection
- Comprehensive error handling
- Health monitoring endpoints

## Security Features
- Session-based authentication
- Role-based access control
- SQL injection protection via Drizzle ORM
- Request rate limiting
- Secure session storage
- Input validation with Zod schemas

## Deployment Notes
1. Ensure PostgreSQL database is accessible
2. Configure environment variables securely
3. Use HTTPS in production
4. Set up monitoring for health endpoints
5. Configure log rotation
6. Regular security updates

## Monitoring
Health check endpoints:
- `/health` - Basic server status
- `/api/health` - Database connectivity

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Support
- Port: 5000 (configurable via PORT env var)
- Logs: Console output (configure log aggregation)
- Metrics: Built-in compliance scheduler
- Documentation: OpenAPI/Swagger available at `/api/docs`