import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

function checkApiUsage() {
  const hardcodedHosts = [];
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
        scanDirectory(filePath);
      } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for hardcoded hosts
        const patterns = [
          /https?:\/\/localhost[:\d]*/g,
          /https?:\/\/127\.0\.0\.1[:\d]*/g,
          /https?:\/\/\d+\.\d+\.\d+\.\d+[:\d]*/g,
          /"http[^"]*localhost[^"]*/g,
          /'http[^']*localhost[^']*/g
        ];
        
        patterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              hardcodedHosts.push(`${filePath}: ${match}`);
            });
          }
        });
      }
    }
  }
  
  scanDirectory(path.join(projectRoot, 'src'));
  
  const status = hardcodedHosts.length === 0 ? 'PASS' : 'FAIL';
  console.log(`API_BASE_USAGE=${status} HARDCODED=[${hardcodedHosts.join(', ')}]`);
  
  return hardcodedHosts.length === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(checkApiUsage() ? 0 : 1);
}