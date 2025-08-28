import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

function generateParityReport() {
  let report = '# FRONTEND PARITY REPORT\n\n';
  report += `**Generated**: ${new Date().toISOString()}\n\n`;
  
  // Run all verifications and capture output
  const verifications = {};
  
  try {
    const envResult = execSync('node scripts/verify-env.js', { cwd: projectRoot }).toString();
    verifications.env = envResult.trim();
  } catch (e) {
    verifications.env = 'ENV_COVERAGE=FAIL';
  }
  
  try {
    const apiResult = execSync('node scripts/verify-api-usage.js', { cwd: projectRoot }).toString();
    verifications.api = apiResult.trim();
  } catch (e) {
    verifications.api = 'API_BASE_USAGE=FAIL';
  }
  
  try {
    const routeResult = execSync('node scripts/verify-routes.js', { cwd: projectRoot }).toString();
    verifications.routes = routeResult.trim();
  } catch (e) {
    verifications.routes = 'ROUTE_PARITY=FAIL';
  }
  
  try {
    const i18nResult = execSync('node scripts/verify-i18n.js', { cwd: projectRoot }).toString();
    verifications.i18n = i18nResult.trim();
  } catch (e) {
    verifications.i18n = 'I18N_COVERAGE=FAIL';
  }
  
  try {
    const rtlResult = execSync('node scripts/verify-rtl.js', { cwd: projectRoot }).toString();
    verifications.rtl = rtlResult.trim();
  } catch (e) {
    verifications.rtl = 'RTL_SUPPORT=FAIL';
  }
  
  try {
    const assetResult = execSync('node scripts/verify-assets.js', { cwd: projectRoot }).toString();
    verifications.assets = assetResult.trim();
  } catch (e) {
    verifications.assets = 'ASSET_PARITY=FAIL';
  }
  
  try {
    const linkResult = execSync('node scripts/verify-links.js', { cwd: projectRoot }).toString();
    verifications.links = linkResult.trim();
  } catch (e) {
    verifications.links = 'LINKS_OK=FAIL';
  }
  
  // Add results to report
  report += '## Verification Results\n\n';
  report += `- **Environment Variables**: ${verifications.env}\n`;
  report += `- **API Usage**: ${verifications.api}\n`;
  report += `- **Route Parity**: ${verifications.routes}\n`;
  report += `- **I18N Coverage**: ${verifications.i18n}\n`;
  report += `- **RTL Support**: ${verifications.rtl}\n`;
  report += `- **Asset Parity**: ${verifications.assets}\n`;
  report += `- **Link Checks**: ${verifications.links}\n\n`;
  
  // Determine final verdict
  const allPassed = Object.values(verifications).every(result => result.includes('PASS'));
  report += `## Final Verdict\n\n**FRONTEND_PARITY_FINAL**: ${allPassed ? 'PASS' : 'FAIL'}\n\n`;
  
  if (allPassed) {
    report += 'All verification checks passed. Frontend is ready for deployment.\n';
  } else {
    report += 'Some verification checks failed. Please address the issues before deployment.\n';
  }
  
  fs.writeFileSync(path.join(projectRoot, 'FRONTEND_PARITY_REPORT.md'), report);
  console.log('Generated FRONTEND_PARITY_REPORT.md');
  
  return allPassed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const passed = generateParityReport();
  process.exit(passed ? 0 : 1);
}