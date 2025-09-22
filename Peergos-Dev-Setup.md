# Peergos – Development Setup (Local Only)

## Quick Start Guide

1. **Install Prerequisites**
   - Install Node.js (LTS version)
   - Install Git

2. **Repository Setup**
   - Clone the repository
   - Create `.env` file from `.env.example`

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Database Setup**
   - Start PostgreSQL service
   - Run database migrations:
   ```bash
   npm run db:migrate
   ```

5. **Seed Demo Data (Optional)**
   ```bash
   npm run db:seed
   ```

6. **Launch Application**
   - Frontend: `npm run dev`
   - Backend: `npm run start`

7. **Access Points**
   - Frontend: http://localhost:5173
   - API Backend: http://localhost:3000

## Important Notes

*Note: No external APIs are integrated at this time.*

---

**Peergos UAE Tax Compliance System**  
*Development Environment Setup Guide*