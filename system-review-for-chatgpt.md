# Peergos Tax Platform - System Review Request

## Overview
This is a comprehensive UAE SME tax compliance SaaS platform built with React/TypeScript frontend and Node.js/Express backend. We've been experiencing deployment issues and need a thorough system review.

## Current Architecture

### Frontend Stack
- React 18 with TypeScript 5
- Vite 5 for build and development
- Shadcn/UI components with Radix UI primitives
- Tailwind CSS for styling
- Wouter for routing
- TanStack Query for server state management
- React Hook Form with Zod validation

### Backend Stack
- Node.js with Express.js
- TypeScript with ES modules
- PostgreSQL with Drizzle ORM
- Neon serverless PostgreSQL
- Session-based authentication
- RESTful API design

### Key Features Implemented
- Corporate Income Tax (CIT) calculations with Small Business Relief
- VAT calculations (5% UAE rate)
- E-Invoicing with UBL 2.1 XML generation
- QR code generation for invoices
- Multi-language support (English/Arabic RTL)
- Financial reporting and KPI dashboards
- Transaction management
- Tax filing submissions
- Notification system

## Deployment Issues Encountered

### Issue 1: Missing test:e2e Script
**Problem**: Build command failed because 'test:e2e' script is missing from package.json
**Attempted Fix**: Created package-scripts.js and simple-test.js to handle E2E testing

### Issue 2: Multiple Port Configurations
**Problem**: Multiple port configurations in .replit file conflict with Autoscale's single port requirement
**Attempted Fix**: Server configured to use PORT environment variable with fallbacks

### Issue 3: pnpm Command Unavailability
**Problem**: pnpm command not available but build command uses pnpm
**Attempted Fix**: Created pnpm wrapper script with npm fallback

### Issue 4: ES Module Compatibility
**Problem**: Scripts failing due to CommonJS/ES module conflicts
**Attempted Fix**: Converted all scripts to use ES module syntax

## Current File Structure

```
/
├── client/src/           # React frontend
├── server/              # Express backend
├── shared/              # Shared schemas and types
├── dist/                # Build output
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── drizzle.config.ts    # Database configuration
├── tailwind.config.ts   # Styling configuration
├── simple-test.js       # E2E test script
├── package-scripts.js   # Script handler
├── pnpm                 # Package manager wrapper
├── server.js            # Production server wrapper
├── deploy-compat.js     # Deployment compatibility
└── replit.md           # Project documentation
```

## Current Deployment Configuration

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
```

### .replit Configuration
```toml
[deployment]
deploymentTarget = "autoscale"
build = ["sh", "-c", "pnpm run build && pnpm run test:e2e"]
run = ["sh", "-c", "node dist/index.js"]

[[ports]]
localPort = 5000
externalPort = 80
```

## Server Configuration
The server is configured to use PORT environment variable:
```typescript
const port = parseInt(process.env.PORT || (process.env.NODE_ENV === "production" ? "3000" : "5000"), 10);
server.listen({
  port,
  host: "0.0.0.0",
  reusePort: true,
});
```

## Database Schema
We use Drizzle ORM with PostgreSQL. Key tables include:
- users (authentication)
- companies (multi-tenant structure)
- transactions (financial data)
- tax_filings (compliance records)
- invoices (e-invoicing)
- notifications (system alerts)
- kpi_data (analytics)

## Known Issues and Concerns

1. **Build Timeouts**: The build process sometimes times out during the Vite build step
2. **Package Manager Conflicts**: Inconsistency between pnpm and npm usage
3. **ES Module Compatibility**: Scripts need to work with "type": "module" in package.json
4. **Deployment Pipeline**: Multiple attempts to fix deployment have created complexity
5. **Port Configuration**: Need to ensure single external port for Autoscale
6. **Test Script Missing**: E2E tests not properly integrated into package.json

## Environment Variables Required
- DATABASE_URL (PostgreSQL connection)
- PORT (deployment port)
- NODE_ENV (environment mode)

## Questions for Review

1. **Architecture**: Is the current tech stack appropriate for a UAE tax compliance platform?
2. **Deployment**: What's the cleanest way to fix the deployment pipeline issues?
3. **Build Process**: How can we optimize the build process to avoid timeouts?
4. **Package Management**: Should we standardize on npm or pnpm?
5. **Testing**: What's the proper way to integrate E2E tests for deployment?
6. **Performance**: Are there any performance concerns with the current setup?
7. **Security**: Any security considerations for a tax compliance platform?
8. **Scalability**: Will this architecture scale for multiple UAE SMEs?

## Specific Help Needed

1. **Clean up deployment configuration** - Remove redundant scripts and files
2. **Optimize build process** - Fix timeout issues
3. **Standardize package management** - Choose npm or pnpm consistently
4. **Proper E2E test integration** - Follow best practices
5. **Performance optimization** - Identify bottlenecks
6. **Code review** - General code quality assessment

## Current Status
The platform is functional in development mode but struggles with deployment. We need a clean, production-ready deployment strategy that works reliably with Replit's Autoscale.

Please provide:
1. Root cause analysis of deployment issues
2. Recommended fixes with step-by-step implementation
3. Best practices for this tech stack
4. Performance and security recommendations
5. Long-term architectural suggestions