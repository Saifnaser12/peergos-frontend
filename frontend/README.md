# Peergos Frontend

UAE Tax Compliance Frontend Application

## Quick Start

```bash
# Install dependencies
npm ci

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Required environment variables:

```env
VITE_API_BASE_URL=https://api.peergos.ae
VITE_APP_ENV=production
```

## Development

```bash
# Development server with hot reload
npm run dev
```

Development server runs on port 5173.

## Build Output

The build creates optimized static files in the `dist/` directory:

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
└── [static files]
```

## Production Deployment

### Option 1: Static Hosting (Recommended)
Deploy the `dist/` folder to any static hosting service:
- Vercel
- Netlify  
- AWS S3 + CloudFront
- Azure Static Web Apps
- GitHub Pages

### Option 2: Docker with Nginx
```bash
# Build Docker image
docker build -t peergos-frontend .

# Run container
docker run -p 80:80 peergos-frontend
```

### Option 3: Serve with Node.js
```bash
# Install serve globally
npm install -g serve

# Serve the dist folder
serve -s dist -l 80
```

## Configuration

### API Integration
The frontend communicates with the backend via the API base URL specified in `VITE_API_BASE_URL`.

### Features
- **React 18** with TypeScript
- **Vite** for fast builds and HMR
- **Tailwind CSS** for styling
- **Radix UI** components
- **React Query** for API state management
- **React Hook Form** for form handling
- **Chart.js** for data visualization

### Browser Support
- Modern browsers with ES2020 support
- Chrome 80+
- Firefox 72+
- Safari 13.1+
- Edge 80+

## Health Checks

The application includes built-in health monitoring that verifies:
- API connectivity
- Authentication status
- Core functionality

Access at: `https://app.peergos.ae/health` (configure as needed)

## UAE Tax Features

- VAT Calculator (5% UAE rate)
- CIT Calculator (9% with Small Business Relief)
- Chart of Accounts management
- Financial reporting
- FTA compliance workflows
- Multi-language support (English/Arabic)

## Architecture

- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Query** - Server state management
- **Wouter** - Client-side routing