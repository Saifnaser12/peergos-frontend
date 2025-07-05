# replit.md

## Overview

This is Peergos, a comprehensive web-based SaaS platform designed for UAE SME tax compliance. The application provides end-to-end tax management including Corporate Income Tax (CIT), VAT returns, accounting, and financial reporting. It features a modern React frontend with Node.js/Express backend, built using modern TypeScript and designed for the UAE market with Arabic RTL support.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript 5
- **Build Tool**: Vite 5 for fast development and optimized builds
- **UI Framework**: Shadcn/UI components with Radix UI primitives
- **Styling**: Tailwind CSS 3 with custom UAE color palette
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Context API with custom hooks
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: TanStack Query (React Query) for server state management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Session Storage**: PostgreSQL-based sessions with connect-pg-simple
- **API Design**: RESTful API with Express routes

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with type-safe queries
- **Schema Validation**: Zod schemas for runtime validation
- **Migrations**: Drizzle Kit for database migrations
- **In-Memory Storage**: Fallback memory storage for development

## Key Components

### Authentication & Authorization
- Role-based access control (ADMIN, ACCOUNTANT, ASSISTANT, SME_CLIENT)
- Simple email/password authentication (demo mode)
- Company-based multi-tenancy
- Session-based authentication with PostgreSQL storage

### Tax Compliance Modules
- **VAT Calculator**: 5% UAE VAT rate calculations with input/output VAT
- **CIT Calculator**: Corporate Income Tax with Small Business Relief (0% below AED 375k)
- **Transfer Pricing**: Placeholder module for future implementation
- **Financial Statements**: Auto-generated income statements, balance sheets, cash flow

### Core Business Logic
- **Accounting Engine**: Revenue/expense tracking with category management
- **Invoice Management**: PDF generation, VAT-compliant invoicing with QR codes
- **Financial Reporting**: KPI dashboards, trend analysis, compliance reports
- **Smart Notifications**: Deadline reminders and compliance alerts

### Internationalization
- **Multi-language Support**: English (LTR) and Arabic (RTL)
- **Currency Formatting**: AED currency with localized number formatting
- **Date Handling**: UAE timezone-aware date calculations
- **RTL Layout**: Complete right-to-left layout support for Arabic

## Data Flow

1. **User Authentication**: Login → Role verification → Company context loading
2. **Transaction Entry**: Form validation → Database storage → KPI updates
3. **Tax Calculations**: Transaction aggregation → Tax rules application → Report generation
4. **Report Generation**: Data querying → PDF/Excel export → File delivery
5. **Notification System**: Deadline monitoring → Alert generation → User notification

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-orm**: Type-safe SQL query builder
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **react-hook-form**: Form handling and validation
- **zod**: Schema validation

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-***: Replit-specific development plugins

### Future Integrations
- **FTA API**: UAE Federal Tax Authority integration
- **Payment Gateways**: For tax payment processing
- **Document Storage**: Cloud storage for tax documents
- **AI/ML Services**: For intelligent tax assistant features

## Deployment Strategy

### Development Environment
- **Platform**: Replit for cloud development
- **Hot Reload**: Vite HMR for instant feedback
- **Database**: Neon PostgreSQL development instance
- **Environment Variables**: `.env` file for local configuration

### Production Deployment
- **Frontend**: Static build deployed to CDN
- **Backend**: Node.js server deployment
- **Database**: Neon PostgreSQL production instance
- **Environment**: Production environment variables
- **Monitoring**: Application performance and error tracking

### Build Process
- **Frontend Build**: `vite build` → Static assets
- **Backend Build**: `esbuild` → Optimized Node.js bundle
- **Database Migration**: `drizzle-kit push` → Schema deployment
- **Asset Optimization**: Automatic compression and caching

## Recent Updates

### July 04, 2025 - Compliance Brief Implementation
✓ **Setup Wizard** - Auto-detects SME size & tax category with revenue tier classification
✓ **CIT Calculation Engine** - Small Business Relief (0% ≤ AED 375k), QFZP Free Zone logic
✓ **UBL 2.1 E-Invoicing** - XML generation with SHA-256 hash and QR codes per FTA spec
✓ **TRN Verification API** - Live endpoint integration for real-time validation
✓ **UAE Compliance Dashboard** - Complete regulatory monitoring and submission tracking
✓ **PostgreSQL Migration** - Full database implementation with proper seeding
✓ **CIT Testing Suite** - Validates compliance brief requirements (400k→22.5k, 250k→0)

### Core Workflows Implemented
1. **Setup Wizard Flow** - SME auto-detection, Free Zone toggle, UAE-PASS consent
2. **Bookkeeping Module** - Revenue/expense tracking with auto financial statements
3. **CIT Flow** - Revenue→CIT Engine→XML returns→FTA submission ready
4. **VAT Flow** - Transaction processing→VAT engine→return XML generation
5. **E-Invoicing Phase 2** - UBL XML + digital signatures + 7-year retention
6. **Mobile SME Hub** - One-click actions, camera scanning, real-time compliance
7. **Smart Compliance Engine** - Automated deadline tracking, tax agent integration
8. **FTA Real-time API** - Live TRN verification, direct submission capabilities
9. **End-to-End Workflow** - Complete 8-step process from data entry to FTA submission
10. **Financial Statement Generator** - Income statements and balance sheets with UAE IFRS
11. **ERP/POS Integration Framework** - SAP, Oracle, QuickBooks, Loyverse connectivity

### FTA Rules Enforced
- Small Business Relief: 0% CIT on first AED 375,000
- QFZP (Free Zone): 0% on qualifying income under AED 3M
- VAT: 5% standard rate with input/output calculations
- Records retention: 7 years with FTA read-only access via TRN

## Changelog
```
Changelog:
- July 04, 2025. Initial setup with database migration and compliance features
- July 04, 2025. Enhanced SME features: Real-time FTA API, Smart Compliance Dashboard, Mobile-optimized SME Hub with camera scanning, Pre-approved tax agent integration, Live TRN verification system
- July 04, 2025. Complete End-to-End Workflow Implementation: Added revenue/expense categories with UAE FTA chart of accounts, balance sheet generator with UAE IFRS, tax agent review system, payment processing, and complete 8-step workflow from data entry to FTA submission. Includes ERP/POS integration framework for SAP, Oracle, QuickBooks, and Loyverse systems.
- July 05, 2025. Fixed deployment configuration issues: Added pnpm compatibility wrapper, created deployment-ready build output with minimal dist/index.js, added E2E test script, ensured port configuration compatibility (PORT environment variable), and created production server with health checks.
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```