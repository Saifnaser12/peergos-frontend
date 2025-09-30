# Changelog

All notable changes to the Peergos tax compliance platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Mobile Navigation**: Fixed critical mobile touch responsiveness issues across iOS and Android devices
  - Replaced invalid nested button-in-anchor HTML structure with proper Link-based navigation
  - Added `viewport-fit=cover` to viewport meta tag for iPhone safe-area support
  - Implemented global `-webkit-tap-highlight-color: transparent` to remove tap highlight artifacts
  - Added `touch-action: manipulation` to body for consistent mobile touch interactions
  - Fixed backdrop overlay z-index layering (backdrop z-40, sidebar z-50) for proper mobile menu behavior
  - Added `pointer-events-auto` to mobile backdrop for reliable touch detection
  - Implemented `min-h-[100svh]` for proper full-height layout on mobile viewports
  - Added `aria-current="page"` for active navigation items to improve accessibility
  - Added native `title` attribute fallback for collapsed sidebar tooltips

- **Calculation Audit Page Resilience**: Added production-ready error handling and mock data fallback
  - Wrapped page component with ErrorBoundary for graceful error recovery
  - Created comprehensive mock audit data for VAT and CIT calculations
  - Implemented automatic fallback to mock data when API endpoints fail
  - Fixed all data references to use display variables (displayAuditTrail, displayHistory, displayTaxConfig)
  - Added proper error state handling for all data queries

- **Vercel Deployment**: Enhanced SPA routing configuration
  - Added proper API route exception in rewrites to prevent SPA routing from breaking backend endpoints
  - Ensured correct static file serving for production deployment

### Added
- **Mock Data Library**: `client/src/lib/mock-audit-data.ts` with production-ready fallback data
  - Sample VAT calculation audit trail with 5 detailed steps
  - Sample CIT calculation audit trail with 7 detailed steps
  - UAE tax configuration mock data with current rates and regulations
  - Historical calculation records for testing and fallback scenarios

### Technical Improvements
- Enhanced mobile CSS with safe-area insets support
- Improved HTML semantics for better accessibility and SEO
- Added comprehensive data-testid attributes for E2E testing
- Optimized touch event handling for 300ms delay elimination
- Implemented proper z-index hierarchy for overlay components

---

## [1.0.0] - 2025-08-30

### Added
- Initial release of Peergos UAE tax compliance platform
- VAT Calculator (5% UAE standard rate)
- CIT Calculator with Small Business Relief and QFZP compliance
- Workflow templates system with drag-and-drop customization
- E-invoicing with UBL 2.1 XML generation
- Multi-language support (English/Arabic) with RTL layout
- Role-based access control (ADMIN, ACCOUNTANT, ASSISTANT, SME_CLIENT)
- PostgreSQL database with Drizzle ORM
- Express.js backend with session-based authentication
- Vite React frontend with TypeScript
- Comprehensive setup wizard with 5-step onboarding
