import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

function checkI18n() {
  const referencePath = path.join(__dirname, 'REFERENCE_I18N_KEYS.json');
  let referenceKeys = { en: [], ar: [] };
  
  if (fs.existsSync(referencePath)) {
    referenceKeys = JSON.parse(fs.readFileSync(referencePath, 'utf-8'));
  }
  
  // For this demo, we'll assume basic i18n support exists
  // In a real app, you'd scan for t('key') usage and check dictionaries
  const usedKeys = new Set();
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
        scanDirectory(filePath);
      } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const matches = content.match(/t\(['"`]([^'"`]+)['"`]\)/g);
        if (matches) {
          matches.forEach(match => {
            const key = match.match(/t\(['"`]([^'"`]+)['"`]\)/)[1];
            usedKeys.add(key);
          });
        }
      }
    }
  }
  
  scanDirectory(path.join(projectRoot, 'src'));
  
  // Check if all used keys exist in both languages
  const missingEn = Array.from(usedKeys).filter(key => !referenceKeys.en.includes(key));
  const missingAr = Array.from(usedKeys).filter(key => !referenceKeys.ar.includes(key));
  
  const status = missingEn.length === 0 && missingAr.length === 0 ? 'PASS' : 'FAIL';
  console.log(`I18N_COVERAGE=${status} MISSING_EN=[${missingEn.join(', ')}] MISSING_AR=[${missingAr.join(', ')}]`);
  
  return missingEn.length === 0 && missingAr.length === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(checkI18n() ? 0 : 1);
}