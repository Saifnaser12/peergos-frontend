import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

function scanForEnvVars() {
  const envVars = new Set();
  const envExamplePath = path.join(projectRoot, '.env.example');
  
  // Read .env.example to get expected vars
  let expectedVars = new Set();
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=/);
      if (match) expectedVars.add(match[1]);
    });
  }
  
  // Scan source files for import.meta.env usage
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
        scanDirectory(filePath);
      } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const matches = content.match(/import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g);
        if (matches) {
          matches.forEach(match => {
            const varName = match.replace('import.meta.env.', '');
            envVars.add(varName);
          });
        }
      }
    }
  }
  
  scanDirectory(path.join(projectRoot, 'src'));
  
  // Check coverage
  const usedVars = Array.from(envVars);
  const missing = usedVars.filter(v => !expectedVars.has(v));
  
  const coverage = missing.length === 0 ? 'PASS' : 'FAIL';
  console.log(`ENV_COVERAGE=${coverage} MISSING=[${missing.join(', ')}]`);
  
  return missing.length === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(scanForEnvVars() ? 0 : 1);
}