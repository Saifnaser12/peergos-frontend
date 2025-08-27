# Peergos UAE Tax Compliance System - Deployment Guide

## Project Overview
Peergos is a comprehensive UAE SME tax compliance platform built with React, Node.js, and PostgreSQL. The system provides end-to-end tax management for Corporate Income Tax (CIT) and VAT, along with accounting and financial reporting features.

## Architecture
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Mobile**: React Native Expo app (included)

## System Requirements
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn package manager

## Environment Variables Required
```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Session Secret
SESSION_SECRET=your-secure-session-secret

# Node Environment
NODE_ENV=production

# Optional: Email configuration
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

## Deployment Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
```bash
# Run database migrations
npm run db:push

# Seed initial data (UAE Chart of Accounts)
npm run seed
```

### 3. Build Application
```bash
# Build frontend and backend
npm run build
```

### 4. Start Production Server
```bash
# Start the production server
npm start
```

The application will run on port 5000 by default.

## Key Features Implemented
✅ **UAE Tax Compliance**: VAT (5%) and CIT (9%) calculators with FTA compliance
✅ **Workflow Management**: Step-by-step business process guidance
✅ **Chart of Accounts**: UAE-compliant accounting structure
✅ **Financial Reports**: Balance sheet, P&L, VAT returns
✅ **Mobile App**: Cross-platform React Native application
✅ **Multi-language**: English and Arabic RTL support
✅ **Security**: Session-based authentication, role management
✅ **Real-time**: Notification system and compliance monitoring

## Production Configuration
- Static files served from Express
- PostgreSQL with connection pooling
- Session store in database
- Comprehensive error handling
- Health check endpoints (/health, /api/health)

## File Structure
```
/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Application pages
│   │   ├── components/    # Reusable components
│   │   └── lib/          # Utilities and helpers
├── server/                # Express backend
│   ├── routes/           # API endpoints
│   ├── middleware/       # Express middleware
│   └── services/         # Business logic
├── shared/               # Shared types and schemas
├── mobile-app/          # React Native mobile app
└── docs/                # Documentation
```

## Database Schema
The system includes pre-configured tables for:
- Companies and users
- Chart of accounts (UAE FTA compliant)
- Transactions and financial data
- Tax calculations and filings
- Workflow and notification management

## Support
For technical support during deployment, refer to:
- `README.md` for detailed setup instructions
- `replit.md` for architectural decisions
- Component documentation in source files

## Security Notes
- Ensure DATABASE_URL is properly secured
- Use strong SESSION_SECRET for production
- Configure HTTPS for production deployment
- Regular security updates for dependencies

---
Generated for deployment on: $(date)
Version: Production Ready