# Peergos - UAE Tax Compliance Hub

A comprehensive web-based SaaS platform designed for UAE SME tax compliance, providing end-to-end tax management including Corporate Income Tax (CIT), VAT returns, accounting, and financial reporting.

## 🏗️ System Architecture

### Frontend
- **React 18** with TypeScript 5
- **Vite 5** for fast development and optimized builds
- **Shadcn/UI** components with Radix UI primitives
- **Tailwind CSS 3** with custom UAE color palette
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management

### Backend
- **Node.js** with Express.js framework
- **TypeScript** with ES modules
- **PostgreSQL** with Drizzle ORM
- **Neon** serverless PostgreSQL provider
- **Session-based authentication** with PostgreSQL storage

## 🚀 Key Features

### Tax Compliance Modules
- **VAT Calculator**: 5% UAE VAT rate calculations with input/output VAT
- **CIT Calculator**: Corporate Income Tax with Small Business Relief (0% below AED 375k)
- **Transfer Pricing**: Documentation and compliance requirements
- **Financial Statements**: Auto-generated income statements, balance sheets, cash flow

### UAE FTA Compliance
- **Phase 2 E-Invoicing**: UBL 2.1 XML generation with QR codes
- **TRN Verification**: Real-time validation with FTA API
- **Smart Compliance Dashboard**: Regulatory monitoring and submission tracking
- **Filing History**: Complete tracking of VAT and CIT submissions

### Business Intelligence
- **AI Tax Assistant**: 5 specialized modules for tax optimization
- **Tax Health Checker**: 100-point scoring system
- **Smart Expense Tracker**: Intelligent categorization
- **Deduction Wizard**: UAE-specific optimization guidance
- **Strategic Tax Planning**: Annual calendar and projections

### User Experience
- **Multi-language Support**: English (LTR) and Arabic (RTL)
- **Mobile-first Design**: PWA with responsive interfaces
- **Setup Wizard**: 5-step onboarding with progress saving
- **Professional Fallbacks**: Comprehensive data validation and guidance

## 🎯 Recent Updates (July 2025)

### Centralized Tax Rate Configuration
✅ Complete UAE tax rule configuration system  
✅ Dynamic rate calculation functions  
✅ Professional admin panel for rate management  
✅ Federal Law compliance references  

### Multi-Step Setup Wizard
✅ 5-step onboarding with Zod validation  
✅ Progress saving with localStorage persistence  
✅ UAE-specific data and auto-detection  
✅ Mobile/desktop responsive design  

### Comprehensive UX Fallbacks
✅ Smart data validation logic  
✅ Professional alert system  
✅ Context-aware messaging  
✅ Developer console warnings  

### Filing History & Compliance
✅ Professional table with status badges  
✅ Download functionality and filtering  
✅ Overdue detection with warnings  
✅ Tax submission modal system  

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Environment variables (DATABASE_URL, etc.)

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Database Migration
```bash
npm run db:push
```

## 🏢 UAE Tax Compliance

### Supported Tax Types
- **Corporate Income Tax**: 9% standard rate, 0% Small Business Relief
- **Value Added Tax**: 5% standard rate with registration threshold
- **Free Zone Rules**: QFZP qualification and rate structures
- **Transfer Pricing**: Documentation requirements and thresholds

### Regulatory Framework
- Federal Decree-Law No. 47 of 2022 (CIT)
- Federal Law No. 8 of 2017 (VAT)
- Cabinet Decision No. 85 of 2022 (Transfer Pricing)
- Cabinet Decision No. 86 of 2022 (Free Zone Persons)

## 📊 Core Components

### Authentication & Authorization
- Role-based access control (ADMIN, ACCOUNTANT, ASSISTANT, SME_CLIENT)
- Company-based multi-tenancy
- Session-based authentication

### Financial Management
- Revenue/expense tracking with category management
- Invoice management with PDF generation
- KPI dashboards and trend analysis
- Automated financial statement generation

### Compliance Automation
- Smart notifications and deadline reminders
- Real-time compliance monitoring
- Automated tax calculations and validations
- FTA submission preparation

## 🌐 Deployment

### Production Ready
- Static frontend build with CDN deployment
- Node.js server optimization
- PostgreSQL production instance
- Environment-specific configuration

## 📝 License

This project is proprietary software developed for UAE SME tax compliance.

## 🤝 Contributing

This is a private project. For access or contributions, please contact the development team.

---

**Built with ❤️ for UAE SMEs - Simplifying tax compliance through intelligent automation**