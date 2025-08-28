# Peergos Backend Production - UAE Tax Compliance System

## Overview

This is a complete UAE tax compliance backend system extracted from the main Peergos application, containing ALL features necessary for UAE SME tax management including VAT (5%) and CIT (9%) calculations, FTA compliance, workflow management, and comprehensive business logic.

## Architecture

### Core Features
- **Complete UAE Tax Compliance**: VAT (5%) and CIT (9%) calculators with full UAE regulations
- **FTA Integration Services**: Direct integration with UAE Federal Tax Authority
- **Advanced Calculation Engines**: Comprehensive VAT and CIT calculation with audit trails
- **Chart of Accounts**: 90+ UAE FTA-compliant accounts with proper tax classifications
- **Notification Scheduler**: Automated compliance reminders and deadline monitoring
- **Workflow Management**: Multi-step business processes with progress tracking
- **Security Middleware**: Advanced authentication, rate limiting, and input validation
- **Database Management**: Complete schema with 15+ tables and relationships

### Technology Stack
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod schemas for runtime validation
- **Security**: Helmet, CORS, rate limiting, session management
- **Scheduling**: Node-cron for automated compliance tasks
- **Tax Calculations**: Advanced algorithms for UAE VAT/CIT compliance

## Database Schema

### Core Tables (15+ tables)
- `users` - User accounts with role-based access control
- `companies` - Business entities with UAE-specific data
- `transactions` - Financial transactions with tax classifications
- `tax_filings` - VAT/CIT filing records with FTA integration
- `invoices` - Invoice management with e-invoicing support
- `notifications` - Automated compliance alerts and reminders
- `calculation_audit_trail` - Complete audit history for tax calculations
- `tax_calculation_breakdown` - Detailed calculation steps and methods
- `chart_of_accounts` - UAE FTA-compliant chart of accounts (90+ accounts)
- `cit_return_calculations` - Corporate Income Tax return data
- `kpi_data` - Key performance indicators and business metrics
- `documents` - Document management with categorization
- `credit_notes` / `debit_notes` - Credit/debit note management
- `transfer_pricing_docs` - Transfer pricing documentation
- `workflow_templates` - Industry-specific workflow templates

## API Endpoints

### Authentication & Users
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/users/me` - Current user profile
- `GET /api/users` - User management (admin)

### Companies & Business Management
- `GET /api/companies/:id` - Company details
- `PUT /api/companies/:id` - Update company information
- `GET /api/companies/:id/settings` - Company tax settings

### Transactions & Financial Data
- `GET /api/transactions` - List transactions with filtering
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Tax Calculations
- `POST /api/tax/vat/calculate` - VAT calculation engine
- `POST /api/tax/cit/calculate` - CIT calculation engine
- `GET /api/tax/rates` - Current UAE tax rates
- `GET /api/tax/thresholds` - Registration thresholds

### Tax Filings & FTA Integration
- `GET /api/tax-filings` - List tax filings
- `POST /api/tax-filings` - Create new filing
- `POST /api/tax-filings/:id/submit` - Submit to FTA
- `GET /api/tax-filings/:id/status` - FTA submission status

### Invoicing & E-invoicing
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id/pdf` - Generate PDF
- `GET /api/invoices/:id/qr` - Generate QR code

### Notifications & Compliance
- `GET /api/notifications` - List notifications
- `POST /api/notifications/:id/read` - Mark as read
- `GET /api/compliance/status` - Compliance dashboard

### Calculation Audit
- `GET /api/calculation-audit` - Audit trail records
- `GET /api/calculation-audit/:id` - Detailed audit record
- `POST /api/calculation-audit/verify` - Verify calculation

### Data Management
- `GET /api/data-export` - Export business data
- `POST /api/data-import` - Import transactions/data
- `GET /api/data-sync` - Cross-module data synchronization
- `GET /api/cross-module-data` - Integrated data view

### Workflow Management
- `GET /api/workflow-status` - Current workflow status
- `POST /api/workflow/step` - Complete workflow step
- `GET /api/workflow-templates` - Available templates

### Documents & Attachments
- `GET /api/documents` - List documents
- `POST /api/documents/upload` - Upload documents
- `GET /api/documents/:id/download` - Download document

### KPI & Reporting
- `GET /api/kpi-data` - Key performance indicators
- `GET /api/reports/financial` - Financial reports
- `GET /api/reports/tax` - Tax reports

### Integrations & Webhooks
- `GET /api/integrations` - Third-party integrations
- `POST /api/webhooks` - Webhook endpoints
- `GET /api/sync-service` - Synchronization services

### System Health
- `GET /health` - System health check
- `GET /api/health` - API health status

## Services & Components

### Tax Calculation Services
- **VATCalculatorService**: Complete UAE VAT calculation with 5% standard rate
- **CITCalculatorService**: UAE Corporate Income Tax with 9% rate and Small Business Relief
- **TaxValidationUtilities**: UAE-specific validation (TRN, business entities, free zones)

### FTA Integration
- **FTAIntegrationService**: Direct integration with UAE Federal Tax Authority
- **TRN Validation**: Real-time Tax Registration Number validation
- **Filing Submission**: Electronic filing for VAT and CIT returns

### Notification System
- **NotificationScheduler**: Automated compliance reminders
- **Deadline Monitoring**: VAT/CIT filing deadline alerts
- **Compliance Tracking**: Business rule validation and warnings

### Security & Middleware
- **SecurityMiddleware**: Advanced protection with rate limiting
- **AuthenticationMiddleware**: Role-based access control
- **InputValidation**: Comprehensive request validation

### Chart of Accounts
- **90+ UAE FTA-compliant accounts** with proper VAT and CIT classifications
- **QFZP Support**: Qualifying Free Zone Person accounts
- **Transfer Pricing**: Related party transaction accounts

## UAE Tax Compliance Features

### VAT (Value Added Tax) - 5%
- Standard rate calculation and validation
- Zero-rated and exempt supply handling
- Registration threshold monitoring (AED 375,000)
- Quarterly filing automation
- Input VAT recovery calculations
- Bad debt relief provisions

### CIT (Corporate Income Tax) - 9%
- Small Business Relief (0% for income ≤ AED 3M)
- Qualifying Free Zone Person (QFZP) exemptions
- Add-back and deduction calculations
- Quarterly installment management
- Transfer pricing compliance

### UAE Free Zone Support
- QFZP qualification determination
- Free zone income segregation
- Specialized account classifications
- Qualifying activity validation

### FTA Compliance
- Electronic filing integration
- TRN validation and verification
- Regulatory reporting automation
- Audit trail maintenance

## Environment Configuration

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/peergos_backend

# Server
PORT=3001
NODE_ENV=development

# Session
SESSION_SECRET=your-session-secret-key

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5000

# FTA Integration
FTA_API_URL=https://api.tax.gov.ae
FTA_API_KEY=your-fta-api-key

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key
```

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   ```bash
   # Push schema to database
   npm run db:push --force
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Database Migration

The system uses Drizzle ORM for database management:

```bash
# Apply schema changes
npm run db:push

# Force schema changes (for breaking changes)
npm run db:push --force

# Generate migration files
npm run db:generate

# View database studio
npm run db:studio
```

## System Initialization

On startup, the system automatically:

1. **Database Connection**: Establishes PostgreSQL connection
2. **Schema Validation**: Ensures all tables are properly created
3. **Chart of Accounts Seeding**: Loads UAE FTA-compliant accounts
4. **Notification Scheduler**: Starts automated compliance monitoring
5. **Route Registration**: Initializes all API endpoints
6. **Health Checks**: Enables system monitoring

## Monitoring & Health Checks

### Health Endpoint
```
GET /health
```

Returns comprehensive system status including:
- Database connectivity
- Notification scheduler status
- Service availability
- Environment information

### System Logs
- Request/response logging
- Error tracking
- Calculation audit trails
- Compliance monitoring logs

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set proper CORS origins
4. Configure FTA API credentials
5. Set strong session secrets

### Security Considerations
- Enable HTTPS
- Configure proper firewall rules
- Set up database backups
- Monitor system logs
- Regular security updates

## API Documentation

Complete API documentation is available at `/api/docs` when running in development mode.

## Support & Integration

This backend is designed to integrate seamlessly with:
- React/Next.js frontends
- Mobile applications
- Third-party accounting systems
- UAE government systems (FTA)
- Business intelligence tools

## Compliance & Regulations

This system is built to comply with:
- UAE Federal Law No. 8 of 2017 (VAT Law)
- UAE Federal Law No. 7 of 2022 (CIT Law)
- UAE FTA electronic filing requirements
- UAE accounting standards
- Data protection regulations

## Version & Updates

Current Version: 1.0.0
Last Updated: August 2025

For updates and changelog, refer to the main Peergos repository.

---

**Note**: This backend contains the complete functionality from the main Peergos system and is production-ready for UAE tax compliance operations.