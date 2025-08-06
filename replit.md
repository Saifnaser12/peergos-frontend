# replit.md

## Overview
Peergos is a web-based SaaS platform for UAE SME tax compliance, offering end-to-end tax management for Corporate Income Tax (CIT) and VAT, alongside accounting and financial reporting. Built with React and Node.js/Express, it targets the UAE market with full Arabic RTL support, aiming to simplify tax obligations for small to medium-sized enterprises. The platform provides comprehensive features from transaction entry to FTA submission readiness, including e-invoicing and smart compliance tools, with a vision to become the leading tax compliance solution in the region.

## Recent Changes (August 2025)
- **Workflow Templates System**: Complete implementation of industry-specific workflow templates with browser, customizer, and sharing capabilities
- **Template Infrastructure**: Added comprehensive server routes, shared template definitions, and navigation integration
- **Industry Templates**: Pre-built templates for retail, consulting, manufacturing, tech startups, and UAE free zone businesses
- **Template Features**: Advanced filtering, drag-drop customization, secure sharing with permissions, and usage tracking
- **Report Pages Fully Functional**: Fixed critical issues in tax reporting system including EnhancedButton component compatibility and API endpoint registration
- **Document Management System**: Resolved component errors and established proper document workflow integration
- **Database Migration Completed**: Documents table operational with full CRUD functionality
- **API Endpoint Verification**: All calculation audit, tax configuration, and KPI data endpoints confirmed working
- **Component Error Resolution**: Fixed SelectItem empty value props and removed duplicate content from enhanced layout

## User Preferences
Preferred communication style: Simple, everyday language.
UI/UX Preferences: Clean, uncluttered interfaces with minimal visual noise. Reduce tabs and options to essential functionality only. Focus on professional simplicity over feature-heavy designs.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript 5, Vite 5 for builds.
- **UI**: Shadcn/UI components, Radix UI primitives, Tailwind CSS 3 with custom UAE color palette.
- **Routing**: Wouter.
- **State Management**: React Context API with custom hooks, TanStack Query for server state.
- **Forms**: React Hook Form with Zod validation.
- **Internationalization**: English (LTR) and Arabic (RTL) multi-language support, AED currency, UAE timezone, complete RTL layout.

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database**: PostgreSQL with Drizzle ORM, hosted on Neon serverless.
- **Session Management**: PostgreSQL-based sessions with `connect-pg-simple`.
- **API Design**: RESTful API.
- **Tax Calculation System**: Secure backend API endpoints for VAT and CIT calculations, preventing client-side manipulation.

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless.
- **ORM**: Drizzle ORM for type-safe queries.
- **Schema Validation**: Zod schemas for runtime validation.
- **Migrations**: Drizzle Kit.

### Key Features & Design Decisions
- **Authentication & Authorization**: Role-based access control (ADMIN, ACCOUNTANT, ASSISTANT, SME_CLIENT), company-based multi-tenancy, session-based authentication.
- **Tax Compliance Modules**: VAT Calculator (5% UAE rate), CIT Calculator (including Small Business Relief and QFZP logic), placeholder for Transfer Pricing, auto-generated financial statements.
- **Core Business Logic**: Accounting engine, VAT-compliant invoice management with PDF and QR codes, KPI dashboards, smart notifications.
- **E-Invoicing**: UBL 2.1 XML generation with SHA-256 hash and QR codes per FTA specification.
- **Setup Wizard**: Comprehensive 5-step onboarding wizard with Zod validation, progress saving, and localStorage persistence.
- **Centralized Tax Rate Configuration**: Single source of truth for all UAE tax rules, thresholds, and regulations, with an administrative panel for management.
- **Interface Simplification**: Streamlined UI/UX for core functionalities like CIT and VAT pages, reduced visual clutter, and professional empty state handling.
- **Compliance Enforcement**: Implementation of UAE FTA rules including Small Business Relief, QFZP, VAT, and 7-year records retention.
- **Testing Framework**: Vitest unit tests, Playwright E2E tests, and CI/CD pipeline for production readiness.
- **Enhanced Visual Design System**: Comprehensive design system with consistent button styling, interactive Chart.js data visualizations (pie, line, bar, gauge charts), improved Inter font typography hierarchy, and subtle animations/micro-interactions for enhanced user engagement.
- **Advanced Navigation & Usability**: Collapsible sidebar navigation with tooltips, breadcrumb navigation for multi-step processes, contextual help system, global search functionality with keyboard shortcuts (⌘K), comprehensive keyboard navigation support, and enhanced mobile responsiveness with touch-friendly interactions.
- **Workflow Templates Infrastructure**: Complete template management system with industry-specific workflows, drag-and-drop customization, secure sharing capabilities, and integration with existing navigation structure using consistent UAE-compliant terminology.

## External Dependencies

### Core Libraries
- `@neondatabase/serverless`: Neon PostgreSQL serverless driver.
- `drizzle-orm`: Type-safe SQL query builder.
- `@tanstack/react-query`: Server state management.
- `@radix-ui/*`: Accessible UI primitives.
- `react-hook-form`: Form handling and validation.
- `zod`: Schema validation.
- `jsSHA`: For SHA-256 hash generation in e-invoicing.
- `qrcode`: For QR code generation in e-invoicing.

### Future Integrations
- FTA API for direct submissions.
- Payment Gateways for tax processing.
- Document Storage solutions.
- AI/ML Services for intelligent tax assistance.