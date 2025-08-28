import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

function checkAssets() {
  const referencePath = path.join(__dirname, 'REFERENCE_ASSETS.json');
  let referenceAssets = [];
  
  if (fs.existsSync(referencePath)) {
    referenceAssets = JSON.parse(fs.readFileSync(referencePath, 'utf-8'));
  }
  
  const missing = [];
  
  for (const asset of referenceAssets) {
    const assetPath = path.join(projectRoot, 'public', asset.path);
    const srcAssetPath = path.join(projectRoot, 'src', 'assets', asset.path);
    
    if (!fs.existsSync(assetPath) && !fs.existsSync(srcAssetPath)) {
      if (asset.required) {
        missing.push(asset.path);
      }
    }
  }
  
  const status = missing.length === 0 ? 'PASS' : 'FAIL';
  console.log(`ASSET_PARITY=${status} MISSING=[${missing.join(', ')}]`);
  
  return missing.length === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(checkAssets() ? 0 : 1);
}