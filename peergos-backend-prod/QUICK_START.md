# Peergos Backend - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Extract and Setup
```bash
# Extract the backend package
tar -xzf peergos-backend-20250828-1631-fixed.tar.gz
cd peergos-backend-prod

# Install dependencies
npm install
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your database URL
# DATABASE_URL=postgresql://user:password@host:5432/database
```

### 3. Deploy Database
```bash
# Build the application
npm run build

# Setup database schema (UAE tax compliance ready)
npm run db:push

# Seed Chart of Accounts and initial data
npm run db:seed:all
```

### 4. Start Server
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

### 5. Verify Installation
```bash
# Check health
curl http://localhost:8080/health

# Verify API endpoints
curl http://localhost:8080/api/health

# Run comprehensive verification
npm run verify:all
```

## 🧪 Test the API

### Authentication Test
```bash
# Login (creates session)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt

# Get current user
curl http://localhost:8080/api/users/me -b cookies.txt
```

### Tax Calculation Test
```bash
# VAT calculation
curl -X POST http://localhost:8080/api/vat/calculate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "items": [
      {
        "description": "Software License",
        "amount": 1000,
        "vatRate": 5
      }
    ],
    "customerType": "B2B"
  }'

# CIT calculation
curl -X POST http://localhost:8080/api/cit/calculate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "revenue": 5000000,
    "expenses": 3000000,
    "hasSmallBusinessRelief": true
  }'
```

### Database Test
```bash
# Get Chart of Accounts
curl http://localhost:8080/api/chart-of-accounts -b cookies.txt

# Get KPI data
curl http://localhost:8080/api/kpi-data -b cookies.txt
```

## 📊 What's Included

### ✅ Ready-to-Use Features
- **Complete UAE Tax Engine**: VAT (5%) and CIT (9%) calculations
- **Chart of Accounts**: 90+ UAE FTA compliant accounts pre-loaded
- **E-Invoicing**: UBL 2.1 XML generation with QR codes
- **Document Management**: File upload and document handling
- **Multi-tenant System**: Company-based data isolation
- **Authentication**: Session-based with role management
- **API Security**: CORS, rate limiting, input validation

### 🗄️ Database Schema (23 Tables)
- Users, Companies, Transactions, Invoices
- Tax Filings, Chart of Accounts, KPI Data
- Documents, Notifications, Audit Trails
- Transfer Pricing, Webhooks, Sync Jobs

### 🛡️ Security Features
- Role-based access control (ADMIN, ACCOUNTANT, ASSISTANT, SME_CLIENT)
- Company-based multi-tenancy
- Input validation with Zod schemas
- SQL injection prevention
- Session security with PostgreSQL storage

## 🔧 Configuration Options

### Environment Variables
```bash
# Required
DATABASE_URL=postgresql://...
NODE_ENV=development|production
PORT=8080
SESSION_SECRET=secure-random-string

# Optional
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_MAX=200
FTA_MODE=sandbox
```

### Database Providers
- **Neon PostgreSQL** (Recommended): Serverless, auto-scaling
- **Supabase**: PostgreSQL with real-time features
- **AWS RDS**: Managed PostgreSQL
- **Local PostgreSQL**: For development

## 📈 Monitoring

### Health Checks
- `GET /health` - Basic health status
- `GET /api/health` - Detailed system health
- `GET /api/system/status` - Comprehensive system metrics

### Verification Scripts
```bash
npm run verify:routes     # Test all API endpoints
npm run verify:schemas    # Validate database schemas
npm run verify:auth       # Test authentication system
npm run verify:all        # Complete system verification
```

### Built-in Logging
- Request/response logging with unique IDs
- Error tracking with stack traces
- Performance monitoring
- Audit trails for tax calculations

## 🚨 Troubleshooting

### Common Issues

**Database Connection Error**:
```bash
# Check database URL format
echo $DATABASE_URL

# Test connection
npm run verify:env
```

**Port Already in Use**:
```bash
# Check what's using port 8080
lsof -i :8080

# Use different port
PORT=3001 npm start
```

**Permission Errors**:
```bash
# Fix file permissions
chmod +x scripts/*.js
```

**Build Errors**:
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Getting Help

1. **Check Logs**: Application logs show detailed error information
2. **Run Verification**: `npm run verify:all` identifies most issues
3. **Review Documentation**: Complete docs in `DEVELOPER_DOCUMENTATION.md`
4. **Database Status**: Use `npm run verify:schemas` for database issues

## 🚀 Next Steps

### Development
1. **Review API Reference**: See `API_REFERENCE.md` for all endpoints
2. **Explore Database**: 23 tables with comprehensive UAE tax schema
3. **Test Tax Calculations**: VAT and CIT engines with audit trails
4. **Document Management**: File upload and storage system

### Production Deployment
1. **Read Deployment Guide**: See `DEPLOYMENT_GUIDE.md`
2. **Configure Environment**: Production environment variables
3. **Setup Monitoring**: Health checks and performance monitoring
4. **Security Hardening**: SSL, security headers, rate limiting

### Integration
1. **Frontend Integration**: API designed for React/Vue/Angular frontends
2. **Mobile Apps**: RESTful API compatible with mobile applications
3. **External Systems**: Webhook support for third-party integrations
4. **FTA Systems**: Ready for UAE FTA API integration

## 📞 Support

### Documentation
- `DEVELOPER_DOCUMENTATION.md` - Complete technical documentation
- `API_REFERENCE.md` - Detailed API endpoint reference
- `DEPLOYMENT_GUIDE.md` - Production deployment instructions

### Verification Tools
- `npm run verify:all` - Complete system check
- `npm run test:smoke` - Critical functionality tests
- Health check endpoints for monitoring

### System Status
- All 80+ API endpoints functional
- 23 database tables with seeded data
- UAE tax compliance features ready
- Production deployment tested

---

**Ready to deploy!** 🚀  
**Total Setup Time**: ~5 minutes  
**API Endpoints**: 80+ endpoints ready  
**Database**: 23 tables with UAE tax data  
**Environment**: Production ready