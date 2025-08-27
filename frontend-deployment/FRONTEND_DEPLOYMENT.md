# Peergos Frontend - Deployment Guide

## Overview
This is the React frontend for the Peergos UAE Tax Compliance System. It provides a modern, responsive web interface for tax calculations, accounting, and financial reporting.

## Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3 with Shadcn/UI components
- **State**: React Query for server state, React Context for app state
- **Routing**: Wouter for client-side routing

## Environment Configuration
Create `.env` file:
```env
# API Backend URL
VITE_API_BASE_URL=https://your-backend-api.com

# App Configuration
VITE_APP_NAME="Peergos Tax System"
VITE_APP_VERSION="1.0.0"

# Optional: Analytics/Monitoring
VITE_ANALYTICS_ID=
```

## Quick Setup
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview build locally (optional)
npm run preview
```

## Build Output
The build creates optimized static files in `/dist` directory:
- `index.html` - Main entry point
- `/assets/` - Optimized JS, CSS, and images
- Ready for deployment to any static hosting service

## Deployment Options

### 1. Static Hosting (Recommended)
Deploy `/dist` folder to:
- **Netlify**: Drag & drop or Git integration
- **Vercel**: Zero-config deployment
- **AWS S3 + CloudFront**: Static website hosting
- **Azure Static Web Apps**: CI/CD integration
- **GitHub Pages**: Free hosting option

### 2. CDN Configuration
For optimal performance, configure:
- **Caching**: Set long cache headers for `/assets/*`
- **Compression**: Enable gzip/brotli compression
- **HTTPS**: Always use HTTPS for security

### 3. Custom Server
If using custom web server (nginx, Apache):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Features Included
✅ **Tax Calculators**: VAT (5%) and CIT (9%) with UAE FTA compliance
✅ **Dashboard**: KPI widgets and workflow status
✅ **Financial Reports**: Balance sheet, P&L statements
✅ **Workflow Management**: Step-by-step business processes
✅ **Mobile Responsive**: Works on all device sizes
✅ **Multi-language**: English and Arabic RTL support
✅ **Dark Mode**: Theme switching capability
✅ **Real-time Updates**: Live data synchronization

## API Integration
The frontend connects to the backend API via:
- **Base URL**: Configured via `VITE_API_BASE_URL`
- **Authentication**: Session-based cookies
- **Error Handling**: Comprehensive error boundaries
- **Loading States**: Skeleton loaders and spinners

## Browser Support
- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS 14+, Android 8+)

## Performance Features
- **Code Splitting**: Automatic route-based chunking
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image compression and lazy loading
- **Bundle Size**: Optimized for fast loading

## Security Features
- **Content Security Policy**: XSS protection
- **HTTPS Only**: Secure communication
- **Input Validation**: Client-side form validation
- **Safe Routing**: Protected route navigation

## Production Checklist
- [ ] Configure `VITE_API_BASE_URL` to production backend
- [ ] Enable HTTPS for secure communication
- [ ] Set up CDN for global performance
- [ ] Configure proper cache headers
- [ ] Test all features in production environment
- [ ] Set up error monitoring (optional)
- [ ] Configure analytics tracking (optional)

## Troubleshooting
**Build Issues**: Check Node.js version (18+ required)
**API Connection**: Verify `VITE_API_BASE_URL` and CORS settings
**Routing Issues**: Ensure server handles SPA routing
**Styling Issues**: Check Tailwind CSS build process

## Support
- Built with modern web standards
- Progressive Web App ready
- Optimized for UAE business workflows
- Full Arabic RTL language support
- Mobile-first responsive design

Deploy the `/dist` folder to your preferred hosting platform!