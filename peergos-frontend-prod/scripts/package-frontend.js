import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

function packageFrontend() {
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '').replace('T', '-');
  const tarballName = `peergos-frontend-${timestamp}.tar.gz`;
  
  console.log(`Creating frontend package: ${tarballName}`);
  
  try {
    // Create tarball with essential files only
    const filesToInclude = [
      'dist',
      'index.html', 
      'package.json',
      'vite.config.ts',
      'tsconfig.json',
      '.env.example',
      'MANIFEST_FRONTEND.json',
      'FRONTEND_PARITY_REPORT.md',
      'README.md'
    ];
    
    const existingFiles = filesToInclude.filter(file => 
      fs.existsSync(path.join(projectRoot, file))
    );
    
    execSync(`tar -czf "${tarballName}" ${existingFiles.join(' ')}`, 
      { cwd: projectRoot, stdio: 'inherit' });
    
    const stats = fs.statSync(path.join(projectRoot, tarballName));
    const fileCount = execSync(`tar -tzf "${tarballName}" | wc -l`, { cwd: projectRoot }).toString().trim();
    
    console.log(`PACKAGE_FILECOUNT=${fileCount}`);
    console.log(`PACKAGE_PATH=${path.join(projectRoot, tarballName)}`);
    console.log(`Package size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    return path.join(projectRoot, tarballName);
  } catch (error) {
    console.error('Packaging failed:', error.message);
    return null;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = packageFrontend();
  process.exit(result ? 0 : 1);
}