import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

function checkRtlSupport() {
  const referencePath = path.join(__dirname, 'REFERENCE_RTL_RULES.json');
  let referenceRules = { enabled: true, requiredClasses: [], requiredElements: [] };
  
  if (fs.existsSync(referencePath)) {
    referenceRules = JSON.parse(fs.readFileSync(referencePath, 'utf-8'));
  }
  
  if (!referenceRules.enabled) {
    console.log('RTL_SUPPORT=PASS');
    return true;
  }
  
  let hasRtlSupport = false;
  let hasDirectionSupport = false;
  
  // Check CSS files for RTL classes
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
        scanDirectory(filePath);
      } else if (file.match(/\.(css|tsx|ts|jsx|js)$/)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for RTL classes
        if (content.includes('rtl:') || content.includes('[dir="rtl"]')) {
          hasRtlSupport = true;
        }
        
        // Check for direction support
        if (content.includes('dir=') || content.includes('direction:')) {
          hasDirectionSupport = true;
        }
      }
    }
  }
  
  scanDirectory(path.join(projectRoot, 'src'));
  
  const status = hasRtlSupport && hasDirectionSupport ? 'PASS' : 'FAIL';
  console.log(`RTL_SUPPORT=${status}`);
  
  return hasRtlSupport && hasDirectionSupport;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(checkRtlSupport() ? 0 : 1);
}