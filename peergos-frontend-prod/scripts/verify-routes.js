import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

function extractRoutes() {
  const appPath = path.join(projectRoot, 'src', 'App.tsx');
  const referencePath = path.join(__dirname, 'REFERENCE_PAGES.json');
  
  let appRoutes = [];
  let referenceRoutes = [];
  
  // Read reference routes
  if (fs.existsSync(referencePath)) {
    const refData = JSON.parse(fs.readFileSync(referencePath, 'utf-8'));
    referenceRoutes = refData.map(r => r.path);
  }
  
  // Extract routes from App.tsx
  if (fs.existsSync(appPath)) {
    const content = fs.readFileSync(appPath, 'utf-8');
    const routeMatches = content.match(/<Route\s+path="([^"]+)"/g);
    if (routeMatches) {
      appRoutes = routeMatches.map(match => {
        const pathMatch = match.match(/path="([^"]+)"/);
        return pathMatch ? pathMatch[1] : null;
      }).filter(Boolean);
    }
  }
  
  // Compare routes
  const refSet = new Set(referenceRoutes);
  const appSet = new Set(appRoutes);
  
  const missing = referenceRoutes.filter(r => !appSet.has(r));
  const extra = appRoutes.filter(r => !refSet.has(r));
  
  const status = missing.length === 0 && extra.length === 0 ? 'PASS' : 'FAIL';
  console.log(`ROUTE_PARITY=${status} REF=${referenceRoutes.length} APP=${appRoutes.length} MISSING=[${missing.join(', ')}] EXTRA=[${extra.join(', ')}]`);
  
  return missing.length === 0 && extra.length === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(extractRoutes() ? 0 : 1);
}