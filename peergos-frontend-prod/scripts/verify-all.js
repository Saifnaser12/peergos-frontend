import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runAllVerifications() {
  const scripts = [
    'verify-env.js',
    'verify-api-usage.js', 
    'verify-routes.js',
    'verify-i18n.js',
    'verify-rtl.js',
    'verify-assets.js',
    'verify-links.js'
  ];
  
  let allPassed = true;
  
  for (const script of scripts) {
    try {
      execSync(`node ${path.join(__dirname, script)}`, { stdio: 'inherit' });
    } catch (error) {
      allPassed = false;
    }
  }
  
  return allPassed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runAllVerifications();
  process.exit(result ? 0 : 1);
}