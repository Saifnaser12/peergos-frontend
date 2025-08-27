# Backend Deployment Notes

## Nginx Reverse Proxy Configuration

Add this upstream and server block to your Nginx configuration:

```nginx
upstream peergos_backend {
    server localhost:8080;
    # Add more servers for load balancing
    # server localhost:8081;
    # server localhost:8082;
}

server {
    listen 80;
    server_name api.peergos.ae;

    # Health check endpoint
    location /health {
        proxy_pass http://peergos_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Health check specific settings
        proxy_connect_timeout 5s;
        proxy_send_timeout 5s;
        proxy_read_timeout 5s;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://peergos_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Enable CORS headers if needed
        add_header 'Access-Control-Allow-Origin' 'https://app.peergos.ae' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}

# HTTPS configuration (recommended for production)
server {
    listen 443 ssl http2;
    server_name api.peergos.ae;
    
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    location / {
        proxy_pass http://peergos_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Load Balancing

For high availability, run multiple instances on different ports:

```bash
# Terminal 1
PORT=8080 npm start

# Terminal 2  
PORT=8081 npm start

# Terminal 3
PORT=8082 npm start
```

Then update the Nginx upstream block with all ports.

## Environment Variables

Required for production:
- `NODE_ENV=production`
- `PORT=8080` 
- `DATABASE_URL=postgres://...`
- `SESSION_SECRET=secure-random-string`
- `CORS_ORIGIN=https://app.peergos.ae`

## Health Monitoring

Monitor these endpoints:
- `GET /health` - Basic health check
- `GET /api/health` - API health check

Expected response: `{"status": "ok", "timestamp": "..."}`