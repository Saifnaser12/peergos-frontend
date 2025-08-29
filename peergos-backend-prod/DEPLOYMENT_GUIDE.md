# Peergos Backend - Deployment Guide

## 🚀 Quick Start Deployment

### Prerequisites
- Node.js 18+ runtime environment
- PostgreSQL database (Neon recommended for production)
- Environment variables configured
- SSL/TLS certificates (for production)

### 1. Environment Setup

Create `.env` file from template:
```bash
cp .env.example .env
```

Configure required variables:
```bash
# Production Environment
NODE_ENV=production
PORT=8080

# Database (Neon PostgreSQL recommended)
DATABASE_URL=postgresql://user:password@host:5432/database

# Security
SESSION_SECRET=your-secure-64-character-random-string
CORS_ORIGIN=https://your-frontend-domain.com

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=200

# UAE FTA Integration
FTA_MODE=production  # or 'sandbox' for testing
```

### 2. Database Setup

```bash
# Install dependencies
npm install

# Build application
npm run build

# Setup database schema
npm run db:push

# Seed initial data (UAE Chart of Accounts, etc.)
npm run db:seed:all

# Verify setup
npm run verify:all
```

### 3. Production Deployment

#### Option A: Direct Node.js
```bash
# Start production server
npm start

# Or with PM2 for process management
npm install -g pm2
pm2 start dist/src/server.js --name peergos-backend
pm2 save
pm2 startup
```

#### Option B: Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY .env ./

EXPOSE 8080
CMD ["npm", "start"]
```

#### Option C: Cloud Platforms

**Replit Deploy**:
1. Click "Deploy" button in Replit
2. Configure environment variables
3. Set start command: `npm start`

**Heroku**:
```bash
heroku create peergos-backend
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=your-database-url
git push heroku main
```

**Railway**:
```bash
railway login
railway new peergos-backend
railway add DATABASE_URL=your-database-url
railway up
```

## 🔧 Environment Configuration

### Required Variables
```bash
DATABASE_URL=postgresql://...     # PostgreSQL connection string
NODE_ENV=production              # Environment mode
PORT=8080                       # Server port
SESSION_SECRET=secure-secret    # Session encryption key
CORS_ORIGIN=https://domain.com  # Frontend domain
```

### Optional Variables
```bash
# JWT Configuration (if enabled)
JWT_ISSUER=peergos
JWT_AUDIENCE=peergos-users
JWT_EXPIRES_IN=1d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=200

# External Services
FTA_MODE=production
NOTIFY_PROVIDER=email
G42_ENDPOINT=https://api.g42.ae
INJAZAT_ENDPOINT=https://api.injazat.ae
```

### Database Configuration

**Neon PostgreSQL (Recommended)**:
```bash
DATABASE_URL=postgresql://user:password@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Other PostgreSQL providers**:
- Supabase: `postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres`
- AWS RDS: `postgresql://user:password@rds-instance.region.rds.amazonaws.com:5432/dbname`
- Google Cloud SQL: `postgresql://user:password@/dbname?host=/cloudsql/project:region:instance`

## 🏗️ Infrastructure Setup

### Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name api.peergos.ae;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL/TLS Setup
```bash
# Using Certbot for Let's Encrypt
sudo certbot --nginx -d api.peergos.ae
```

### Load Balancer Setup
For high availability, deploy multiple instances behind a load balancer:

```yaml
# docker-compose.yml
version: '3.8'
services:
  api-1:
    build: .
    environment:
      - NODE_ENV=production
      - PORT=8080
    ports:
      - "8080:8080"
  
  api-2:
    build: .
    environment:
      - NODE_ENV=production
      - PORT=8081
    ports:
      - "8081:8080"
      
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api-1
      - api-2
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- `GET /health` - Basic health check
- `GET /api/health` - Detailed system health

### Monitoring Setup
```bash
# Add monitoring headers to responses
curl -I https://api.peergos.ae/health

# Expected response:
HTTP/1.1 200 OK
X-Response-Time: 45ms
X-Uptime: 3600
```

### Log Monitoring
```bash
# PM2 logs
pm2 logs peergos-backend

# Docker logs
docker logs container-name

# File logs (if configured)
tail -f /var/log/peergos/access.log
tail -f /var/log/peergos/error.log
```

## 🔒 Security Checklist

### Pre-Deployment Security
- [ ] Environment variables are secure
- [ ] Database uses SSL connections
- [ ] Session secret is cryptographically secure
- [ ] CORS origins are restricted to your domains
- [ ] Rate limiting is enabled
- [ ] API endpoints require authentication

### Production Security
- [ ] HTTPS enabled with valid certificates
- [ ] Database backups are automated
- [ ] Security headers are configured
- [ ] Input validation is enabled
- [ ] Error messages don't expose internals
- [ ] Audit logging is enabled

### Security Headers (Nginx)
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

## 🚨 Troubleshooting

### Common Issues

**Database Connection Failed**:
```bash
# Check database connectivity
npm run verify:env

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Port Already in Use**:
```bash
# Find process using port
lsof -i :8080

# Kill process
kill -9 <PID>
```

**Memory Issues**:
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 dist/src/server.js
```

**SSL Certificate Issues**:
```bash
# Verify certificate
openssl s_client -connect api.peergos.ae:443

# Renew Let's Encrypt certificate
certbot renew
```

### Performance Issues

**Slow Database Queries**:
```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM transactions WHERE company_id = 1;

-- Check database connections
SELECT count(*) FROM pg_stat_activity;
```

**High Memory Usage**:
```bash
# Monitor memory usage
top -p $(pgrep node)

# Enable Node.js profiling
node --inspect dist/src/server.js
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=express:* npm start

# Or set in environment
export DEBUG=peergos:*
npm start
```

## 📈 Scaling & Performance

### Database Optimization
- Enable connection pooling (already configured with Neon)
- Index frequent query columns
- Use read replicas for reporting queries
- Implement query caching

### Application Scaling
- Deploy multiple instances behind load balancer
- Implement session store clustering
- Use CDN for static assets
- Enable gzip compression

### Performance Monitoring
```bash
# Add performance monitoring
npm install newrelic
# Configure with New Relic license key

# Or use built-in metrics
curl https://api.peergos.ae/api/health
```

## 🔄 Deployment Pipeline

### Automated Deployment
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run build
      - run: npm run verify:all
      
      - name: Deploy to production
        run: |
          # Your deployment commands here
          ssh user@server 'cd /app && git pull && npm install && npm run build && pm2 restart peergos-backend'
```

### Rolling Updates
```bash
# Zero-downtime deployment with PM2
pm2 reload peergos-backend

# Or with multiple instances
pm2 start ecosystem.config.js
```

## 📋 Post-Deployment Checklist

### Immediate Verification
- [ ] Health check endpoints respond
- [ ] Database connection is working
- [ ] Authentication system is functional
- [ ] Tax calculation engines respond correctly
- [ ] All API endpoints return expected responses

### Functional Testing
```bash
# Run smoke tests
npm run test:smoke

# Test critical endpoints
curl -X POST https://api.peergos.ae/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

curl https://api.peergos.ae/api/health
```

### Performance Testing
```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 https://api.peergos.ae/health

# Or with Artillery
artillery quick --count 10 --num 100 https://api.peergos.ae/health
```

## 📞 Support & Maintenance

### Regular Maintenance
- Monitor database performance weekly
- Update dependencies monthly
- Review security logs daily
- Backup database daily
- Test disaster recovery quarterly

### Support Contacts
- **Technical Issues**: Check logs and health endpoints
- **Database Issues**: Monitor Neon dashboard
- **Performance Issues**: Review monitoring metrics
- **Security Issues**: Check audit logs

### Emergency Procedures
1. **Database Down**: Switch to read-only mode
2. **High CPU**: Scale horizontally or restart
3. **Memory Leaks**: Monitor and restart if needed
4. **Security Breach**: Rotate secrets and review logs

---

**Last Updated**: August 29, 2025  
**Deployment Version**: 1.0.0  
**Environment**: Production Ready