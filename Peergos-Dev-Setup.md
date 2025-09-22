
# Peergos – Development Setup (Local Only)

## Prerequisites
1. **Install Node.js (LTS)** - Download from [nodejs.org](https://nodejs.org/)
2. **Install Git** - Download from [git-scm.com](https://git-scm.com/)
3. **PostgreSQL Database** - Ensure you have access to a PostgreSQL instance

## Setup Instructions

### 1. Clone Repository & Environment Setup
```bash
git clone <repository-url>
cd peergos
cp .env.example .env
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Configuration
- Start your PostgreSQL service
- Update the `DATABASE_URL` in your `.env` file
- Run database migrations:
```bash
npm run db:push
```

### 4. Seed Demo Data (Optional)
```bash
npm run db:seed
```

### 5. Launch Application
```bash
# Start the development server
npm run dev
```

### 6. Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run check` - TypeScript type checking

## Project Structure
- `/client` - React frontend application
- `/server` - Express.js backend API
- `/shared` - Shared TypeScript schemas
- `/mobile-app` - React Native mobile application

## Development Notes
- The application runs on **port 5000** in development
- Hot reload is enabled for both frontend and backend
- Database connection is required for full functionality
- No external APIs are integrated at this time

## Troubleshooting
- Ensure PostgreSQL is running before starting the application
- Check that all environment variables are properly set in `.env`
- Verify Node.js version compatibility (LTS recommended)
- Clear `node_modules` and reinstall if experiencing dependency issues

---
*Built for UAE SME Tax Compliance - Simplifying development setup*
