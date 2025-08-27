# Production Setup Instructions

## Quick Start for Deployment Company

### 1. Environment Setup
Create `.env` file with:
```env
DATABASE_URL=postgresql://user:password@host:5432/peergos_production
SESSION_SECRET=generate-a-secure-random-string-here
NODE_ENV=production
PORT=5000
```

### 2. Database Setup
```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Seed initial data
npm run seed
```

### 3. Build and Deploy
```bash
# Build the application
npm run build

# Start production server
npm start
```

### 4. Health Checks
- Application health: `GET /health`
- API health: `GET /api/health`
- Expected response: `{"status": "ok", "timestamp": "..."}`

## Production Configuration

### Nginx Configuration (recommended)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### PM2 Process Manager (recommended)
```json
{
  "name": "peergos-tax-system",
  "script": "dist/server.js",
  "instances": "max",
  "exec_mode": "cluster",
  "env": {
    "NODE_ENV": "production",
    "PORT": 5000
  }
}
```

### Docker Deployment (optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## Security Checklist
- [ ] Strong SESSION_SECRET generated
- [ ] DATABASE_URL properly secured
- [ ] HTTPS configured for production
- [ ] Firewall configured (only allow necessary ports)
- [ ] Regular security updates scheduled
- [ ] Database backups configured
- [ ] Monitoring and logging set up

## Performance Optimization
- Enable gzip compression
- Set up CDN for static assets
- Configure database connection pooling
- Implement Redis for session storage (optional)
- Set up application monitoring

## Monitoring Endpoints
- `/health` - Application status
- `/api/health` - API and database status
- Monitor these endpoints for uptime

For support, contact the development team.