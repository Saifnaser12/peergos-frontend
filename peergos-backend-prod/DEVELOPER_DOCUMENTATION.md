# Peergos Backend API - Developer Documentation

## 📋 Overview

The Peergos Backend API is a comprehensive Node.js/TypeScript REST API designed for UAE tax compliance and financial management. It provides complete tax calculation engines, document management, e-invoicing capabilities, and FTA compliance features for small to medium enterprises.

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 18+ with TypeScript 5.6
- **Framework**: Express.js 4.19
- **Database**: PostgreSQL (Neon Serverless) with Drizzle ORM
- **Session Management**: express-session with PostgreSQL storage
- **Validation**: Zod schemas for runtime validation
- **Build**: TypeScript compiler with tsx for development

### Project Structure
```
peergos-backend-prod/
├── src/
│   ├── config/          # Environment and app configuration
│   ├── db/              # Database schema and connection
│   ├── middleware/      # Express middleware (security, error handling)
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic services
│   ├── tax/             # Tax calculation engines
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── server.ts        # Main application entry point
├── scripts/             # Database seeding and verification scripts
├── dist/               # Compiled JavaScript output
└── package.json        # Dependencies and scripts
```

## 🗄️ Database Schema

### Core Tables (23 tables total)

#### User Management
- **users**: User accounts with role-based access control
- **companies**: Multi-tenant company profiles and settings

#### Financial Data
- **transactions**: Accounting transactions with VAT calculations
- **invoices**: E-invoicing with UBL 2.1 XML generation
- **credit_notes**: Credit note management
- **debit_notes**: Debit note management

#### Tax Compliance
- **tax_filings**: VAT and CIT submission records
- **tax_calculation_breakdown**: Detailed tax calculations
- **calculation_audit_trail**: Tax calculation audit logs
- **chart_of_accounts**: UAE Chart of Accounts (90+ accounts)
- **transfer_pricing_documentation**: Transfer pricing compliance

#### System Operations
- **notifications**: User notifications and alerts
- **documents**: Document management and storage
- **kpi_data**: Key performance indicators
- **webhooks**: API webhook configurations
- **webhook_deliveries**: Webhook delivery logs

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Environment variables configured

### Installation
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Build TypeScript
npm run build

# Push database schema
npm run db:push

# Seed initial data
npm run db:seed:all
```

### Development
```bash
# Start development server with hot reload
npm run dev

# Run type checking
npm run typecheck

# Verify all systems
npm run verify:all
```

### Production Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgres://user:password@host:5432/database

# Application
NODE_ENV=production
PORT=8080
SESSION_SECRET=your-secure-session-secret

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# JWT Configuration (if using JWT)
JWT_ISSUER=peergos
JWT_AUDIENCE=peergos-users
JWT_EXPIRES_IN=1d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=200

# External Integrations
FTA_MODE=sandbox  # or 'production'
NOTIFY_PROVIDER=mock  # or email provider
G42_ENDPOINT=https://api.g42.ae
INJAZAT_ENDPOINT=https://api.injazat.ae
```

## 🛣️ API Routes

### Authentication & Users
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - Session termination
- `GET /api/users/me` - Current user profile
- `GET /api/users` - List users (admin only)

### Company Management
- `GET /api/companies/:id` - Company details
- `PUT /api/companies/:id` - Update company settings
- `GET /api/companies/:id/setup-status` - Setup completion status

### Financial Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Tax Calculations
- `POST /api/vat/calculate` - VAT calculation engine
- `POST /api/cit/calculate` - CIT calculation engine
- `GET /api/tax-filings` - List tax filings
- `POST /api/tax-filings` - Submit tax filing

### E-Invoicing
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id/xml` - Generate UBL 2.1 XML
- `GET /api/invoices/:id/qr` - Generate QR code

### Document Management
- `GET /api/documents` - List documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Download document

### Reporting & Analytics
- `GET /api/kpi-data` - Key performance indicators
- `GET /api/calculation-audit` - Tax calculation audit trail
- `GET /api/cross-module-data` - Cross-module dashboard data

### Data Management
- `POST /api/data-export` - Export company data
- `POST /api/data-import` - Import transactions/data
- `GET /api/sync-jobs` - Data synchronization status

## 💰 Tax Calculation Engines

### VAT Calculator (`/api/vat/calculate`)
- **Rate**: 5% (UAE standard rate)
- **Zero-rated**: Exports, essential goods
- **Exempt**: Healthcare, education, residential property
- **Reverse Charge**: B2B services with overseas suppliers

**Request Example**:
```json
{
  "items": [
    {
      "description": "Software License",
      "amount": 1000,
      "vatRate": 5
    }
  ],
  "customerType": "B2B",
  "isExport": false
}
```

### CIT Calculator (`/api/cit/calculate`)
- **Standard Rate**: 9% (UAE CIT rate)
- **Small Business Relief**: 0% on profits up to AED 3M
- **QFZP Exemption**: Qualifying Free Zone Person benefits
- **Loss Carry Forward**: Up to 7 years

**Request Example**:
```json
{
  "revenue": 5000000,
  "expenses": 3000000,
  "isQFZP": false,
  "hasSmallBusinessRelief": true,
  "previousLosses": 500000
}
```

## 🔐 Security Features

### Authentication
- Session-based authentication with PostgreSQL storage
- Role-based access control (ADMIN, ACCOUNTANT, ASSISTANT, SME_CLIENT)
- Company-based multi-tenancy

### Security Middleware
- CORS protection with configurable origins
- Rate limiting (200 requests per minute by default)
- Input validation with Zod schemas
- SQL injection prevention via Drizzle ORM
- XSS protection with proper sanitization

### Data Protection
- Encrypted database connections (SSL required)
- Secure session management
- Audit trails for all tax calculations
- Document access controls

## 📊 Monitoring & Health Checks

### Health Endpoints
- `GET /health` - Basic health check
- `GET /api/health` - Detailed system health
- `GET /api/system/status` - System status and metrics

### Logging
- Structured JSON logging
- Request/response logging with unique IDs
- Error tracking with stack traces
- Performance monitoring

### Scheduled Tasks
- Compliance checks (every 30 seconds)
- Data synchronization
- Notification processing
- System maintenance tasks

## 🧪 Testing & Verification

### Available Scripts
```bash
# Verification Scripts
npm run verify:routes      # Verify all API endpoints
npm run verify:schemas     # Validate database schemas
npm run verify:auth        # Test authentication
npm run verify:env         # Check environment config
npm run verify:all         # Run all verifications

# Testing
npm run test:smoke         # Smoke tests for critical paths
```

### Database Verification
```bash
# Seed Chart of Accounts
npm run db:seed:coa

# Verify Chart of Accounts
npm run verify:coa

# Full database reset (development only)
npm run db:push --force
npm run db:seed:all
```

## 🔄 Data Synchronization

### Sync Services
- **Real-time sync**: WebSocket connections for live updates
- **Batch sync**: Scheduled data synchronization
- **Conflict resolution**: Automatic conflict detection and resolution
- **Audit trails**: Complete sync operation logging

### Cross-Module Integration
- **Dashboard data**: Unified KPI and metrics aggregation
- **Tax calculations**: Shared calculation engine across modules
- **Document management**: Centralized file storage and access
- **Notification system**: Unified alert and notification delivery

## 📋 UAE FTA Compliance

### Tax Registration Numbers (TRN)
- TRN validation and verification
- Automatic TRN formatting
- Integration with FTA systems (sandbox/production)

### Chart of Accounts
- Pre-seeded UAE Chart of Accounts (90+ accounts)
- FTA-compliant account categorization
- Automatic tax classification

### E-Invoicing Compliance
- UBL 2.1 XML generation
- SHA-256 hash calculation
- QR code generation per FTA specification
- Digital signature support (future)

### Filing Requirements
- Quarterly VAT returns
- Annual CIT submissions
- Transfer pricing documentation
- 7-year record retention compliance

## 🚨 Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "value": "invalid-email",
      "constraint": "must be valid email"
    },
    "timestamp": "2025-08-29T10:00:00Z",
    "requestId": "req_123456"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_REQUIRED`: Authentication needed
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `CALCULATION_ERROR`: Tax calculation failed
- `DATABASE_ERROR`: Database operation failed

## 📈 Performance Optimization

### Database Optimization
- Connection pooling with Neon serverless
- Indexed queries for frequent operations
- Efficient pagination for large datasets
- Query optimization for complex tax calculations

### Caching Strategy
- Session caching in PostgreSQL
- Calculated tax results caching
- Chart of Accounts caching
- API response caching for static data

### Rate Limiting
- Configurable rate limits per endpoint
- Burst handling for bulk operations
- IP-based and user-based limiting
- Graceful degradation under load

## 🔧 Maintenance & Operations

### Regular Maintenance
- Database connection monitoring
- Log rotation and cleanup
- Session cleanup for expired sessions
- Webhook delivery retry management

### Monitoring Alerts
- Database connection failures
- High error rates
- Performance degradation
- Failed tax calculations

### Backup & Recovery
- Automated database backups (Neon managed)
- Point-in-time recovery available
- Configuration backup procedures
- Disaster recovery documentation

## 📚 Additional Resources

### External Documentation
- [UAE FTA Guidelines](https://tax.gov.ae)
- [Neon PostgreSQL Documentation](https://neon.tech/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Express.js Documentation](https://expressjs.com)

### Internal Documentation
- `MANIFEST.json` - Complete system manifest
- `VERIFICATION_REPORT.md` - System verification results
- `PARITY_ACHIEVEMENT_REPORT.md` - Feature parity documentation

### Support & Contact
For technical support and questions:
- Review the verification scripts in `/scripts/`
- Check the comprehensive audit reports
- Refer to the OpenAPI documentation (generated via `npm run gen:openapi`)

---

**Last Updated**: August 29, 2025  
**Version**: 1.0.0  
**Environment**: Production Ready