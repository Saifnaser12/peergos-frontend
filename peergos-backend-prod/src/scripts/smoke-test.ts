#!/usr/bin/env node

import http from 'http';

interface TestResult {
  endpoint: string;
  status: number;
  passed: boolean;
  error?: string;
}

/**
 * Simple HTTP request helper
 */
function httpRequest(options: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode || 0, data: parsedData });
        } catch {
          resolve({ status: res.statusCode || 0, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => reject(new Error('Request timeout')));
    req.end();
  });
}

/**
 * Run smoke tests against the API
 */
async function smokeTest(): Promise<boolean> {
  console.log('🔥 Running smoke tests...');
  
  const baseUrl = 'localhost';
  const port = 8080;
  
  const tests: TestResult[] = [];
  
  try {
    // Test 1: Health check
    console.log('🏥 Testing health endpoint...');
    try {
      const healthResult = await httpRequest({
        hostname: baseUrl,
        port: port,
        path: '/health',
        method: 'GET'
      });
      
      const healthPassed = healthResult.status === 200;
      tests.push({
        endpoint: '/health',
        status: healthResult.status,
        passed: healthPassed
      });
      
      console.log(`   ${healthPassed ? '✅' : '❌'} Health check: ${healthResult.status}`);
      
    } catch (error) {
      tests.push({
        endpoint: '/health',
        status: 0,
        passed: false,
        error: (error as Error).message
      });
      console.log('   ❌ Health check: Failed to connect');
    }
    
    // Test 2: API health
    console.log('🩺 Testing API health endpoint...');
    try {
      const apiHealthResult = await httpRequest({
        hostname: baseUrl,
        port: port,
        path: '/api/health',
        method: 'GET'
      });
      
      const apiHealthPassed = apiHealthResult.status === 200;
      tests.push({
        endpoint: '/api/health',
        status: apiHealthResult.status,
        passed: apiHealthPassed
      });
      
      console.log(`   ${apiHealthPassed ? '✅' : '❌'} API health: ${apiHealthResult.status}`);
      
    } catch (error) {
      tests.push({
        endpoint: '/api/health',
        status: 0,
        passed: false,
        error: (error as Error).message
      });
      console.log('   ❌ API health: Failed to connect');
    }
    
    // Test 3: COA count endpoint
    console.log('📊 Testing COA count endpoint...');
    try {
      const coaResult = await httpRequest({
        hostname: baseUrl,
        port: port,
        path: '/admin/coa/count',
        method: 'GET'
      });
      
      const coaPassed = coaResult.status === 200 && 
                       coaResult.data && 
                       coaResult.data.count > 0;
      
      tests.push({
        endpoint: '/admin/coa/count',
        status: coaResult.status,
        passed: coaPassed
      });
      
      const count = coaResult.data?.count || 0;
      console.log(`   ${coaPassed ? '✅' : '❌'} COA count: ${coaResult.status} (${count} accounts)`);
      
    } catch (error) {
      tests.push({
        endpoint: '/admin/coa/count',
        status: 0,
        passed: false,
        error: (error as Error).message
      });
      console.log('   ❌ COA count: Failed to connect');
    }
    
    // Test 4: Sample API endpoint
    console.log('🔧 Testing sample API endpoint...');
    try {
      const workflowResult = await httpRequest({
        hostname: baseUrl,
        port: port,
        path: '/api/workflow-status',
        method: 'GET'
      });
      
      const workflowPassed = workflowResult.status === 200;
      tests.push({
        endpoint: '/api/workflow-status',
        status: workflowResult.status,
        passed: workflowPassed
      });
      
      console.log(`   ${workflowPassed ? '✅' : '❌'} Workflow API: ${workflowResult.status}`);
      
    } catch (error) {
      tests.push({
        endpoint: '/api/workflow-status',
        status: 0,
        passed: false,
        error: (error as Error).message
      });
      console.log('   ❌ Workflow API: Failed to connect');
    }
    
    // Summary
    const passedTests = tests.filter(t => t.passed).length;
    const totalTests = tests.length;
    const allPassed = passedTests === totalTests;
    
    console.log('\n📋 SMOKE TEST SUMMARY:');
    console.log(`   Passed: ${passedTests}/${totalTests}`);
    console.log(`   Score: ${Math.round((passedTests/totalTests)*100)}%`);
    console.log(`   Result: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Smoke test suite failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  smokeTest().then(passed => {
    process.exit(passed ? 0 : 1);
  }).catch(error => {
    console.error('💥 Fatal smoke test error:', error);
    process.exit(1);
  });
}

export { smokeTest };