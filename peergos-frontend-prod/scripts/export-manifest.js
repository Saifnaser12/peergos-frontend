import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

function generateManifest() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
  const envExample = fs.readFileSync(path.join(projectRoot, '.env.example'), 'utf-8');
  
  const apiBase = envExample.match(/VITE_API_BASE_URL=(.+)/)?.[1] || '';
  
  // Count routes from App.tsx
  const appPath = path.join(projectRoot, 'src', 'App.tsx');
  let routeCount = 0;
  if (fs.existsSync(appPath)) {
    const content = fs.readFileSync(appPath, 'utf-8');
    const routes = content.match(/<Route\s+path="/g);
    routeCount = routes ? routes.length : 0;
  }
  
  // Count i18n keys
  const i18nRef = path.join(__dirname, 'REFERENCE_I18N_KEYS.json');
  let i18nCounts = { en: 0, ar: 0 };
  if (fs.existsSync(i18nRef)) {
    const i18nData = JSON.parse(fs.readFileSync(i18nRef, 'utf-8'));
    i18nCounts.en = i18nData.en?.length || 0;
    i18nCounts.ar = i18nData.ar?.length || 0;
  }
  
  // Count assets
  const assetsRef = path.join(__dirname, 'REFERENCE_ASSETS.json');
  let assetCount = 0;
  if (fs.existsSync(assetsRef)) {
    const assetsData = JSON.parse(fs.readFileSync(assetsRef, 'utf-8'));
    assetCount = assetsData.length;
  }
  
  const manifest = {
    name: packageJson.name,
    version: packageJson.version,
    buildTimestamp: new Date().toISOString(),
    versions: {
      node: process.version,
      typescript: packageJson.devDependencies?.typescript || packageJson.dependencies?.typescript || 'unknown',
      vite: packageJson.devDependencies?.vite || packageJson.dependencies?.vite || 'unknown'
    },
    dependencies: Object.keys(packageJson.dependencies || {}),
    routeCount,
    i18nKeyCounts: i18nCounts,
    assetCount,
    rtl: true,
    apiBase
  };
  
  fs.writeFileSync(path.join(projectRoot, 'MANIFEST_FRONTEND.json'), JSON.stringify(manifest, null, 2));
  console.log('Generated MANIFEST_FRONTEND.json');
  
  return manifest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateManifest();
}