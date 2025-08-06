# Deployment Guide for Peergos

## Fixed Issues

### Database Connection Pool Issues ✅
- **Issue**: `Called end on pool more than once` error causing deployment crashes
- **Fix**: 
  - Removed duplicate database pool creation in `seedChartOfAccounts.ts`
  - Updated script to use shared database instance from `db.ts`
  - Removed `pool.end()` call that was closing the shared connection
  - Added proper error handling to prevent application crashes

### Enhanced Error Handling ✅
- Added comprehensive logging during application initialization
- Added health check endpoints (`/health` and `/api/health`)
- Improved global error handler with detailed logging
- Added database connection testing on startup

## Health Check Endpoints

The application now includes health check endpoints to verify deployment status:

- `GET /health` - Simple health check
- `GET /api/health` - Detailed health check with database status

### Health Check Response Format

**Healthy Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-06T18:27:00.000Z",
  "environment": "production",
  "database": {
    "connected": true,
    "result": { "health_check": 1 }
  },
  "environment_variables": {
    "all_present": true,
    "missing": []
  }
}
```

**Unhealthy Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-08-06T18:27:00.000Z",
  "environment": "production",
  "error": "Database connection failed",
  "database": {
    "connected": false
  }
}
```

## Deployment Checklist

### Before Deployment
1. ✅ Ensure `DATABASE_URL` environment variable is set
2. ✅ Run `npm run build` to create production build
3. ✅ Test health endpoints locally: `curl http://localhost:5000/health`

### After Deployment
1. Check health endpoint: `curl https://your-domain.replit.app/health`
2. Verify database connectivity in health response
3. Check application logs for any initialization errors
4. Test main application functionality

### Troubleshooting Deployment Issues

#### Internal Server Error
1. Check health endpoint for detailed error information
2. Verify environment variables are set correctly
3. Check database connectivity
4. Review application logs for specific error messages

#### Database Connection Issues
- Ensure `DATABASE_URL` is properly configured
- Check database service is running and accessible
- Verify network connectivity to database

#### Environment-Specific Issues
- Check that all required environment variables are set in production
- Verify build artifacts are created correctly
- Ensure dependencies are installed properly

## Production Environment Variables

Required environment variables for deployment:
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to "production" for production builds

## Build Commands

- Development: `npm run dev`
- Production Build: `npm run build`
- Production Start: `npm start`

## Monitoring

Use the health endpoints for monitoring:
- Set up health check monitoring on `/health`
- Monitor for 503 responses indicating service issues
- Check database connectivity status in health responses