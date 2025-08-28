import http from 'http';
import { db, chartOfAccounts } from '../db';
import { count } from 'drizzle-orm';

interface SmokeTestResult {
  healthCheck: boolean;
  healthStatus: number;
  dbConnection: boolean;
  coaCount: number;
  success: boolean;
}

async function makeRequest(path: string, port: number = 8080): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port,
      path,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode || 0, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode || 0, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runSmokeTest(): Promise<SmokeTestResult> {
  const result: SmokeTestResult = {
    healthCheck: false,
    healthStatus: 0,
    dbConnection: false,
    coaCount: 0,
    success: false
  };

  try {
    console.log('🔥 Starting smoke test...');

    // Test 1: Health endpoint
    console.log('🏥 Testing health endpoint...');
    try {
      const healthResponse = await makeRequest('/health');
      result.healthStatus = healthResponse.status;
      result.healthCheck = healthResponse.status === 200;
      console.log(`✅ Health check: ${healthResponse.status} ${result.healthCheck ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      console.log(`❌ Health check: FAIL (${error})`);
    }

    // Test 2: Database connection and COA count
    console.log('📊 Testing database connection and COA count...');
    try {
      const coaResult = await db.select({ count: count() }).from(chartOfAccounts);
      result.coaCount = coaResult[0]?.count || 0;
      result.dbConnection = result.coaCount > 0;
      console.log(`✅ Database connection: PASS`);
      console.log(`📈 COA count: ${result.coaCount} accounts`);
    } catch (error) {
      console.log(`❌ Database connection: FAIL (${error})`);
    }

    // Test 3: COA admin endpoint
    console.log('🔧 Testing admin COA endpoint...');
    try {
      const coaResponse = await makeRequest('/api/admin/coa/count');
      if (coaResponse.status === 200 && coaResponse.data.count > 0) {
        console.log(`✅ Admin COA endpoint: PASS (${coaResponse.data.count} accounts)`);
      } else {
        console.log(`❌ Admin COA endpoint: FAIL (status: ${coaResponse.status})`);
      }
    } catch (error) {
      console.log(`❌ Admin COA endpoint: FAIL (${error})`);
    }

    // Overall success
    result.success = result.healthCheck && result.dbConnection && result.coaCount > 0;

    console.log('🎯 Smoke test completed');
    console.log(`📊 Results: Health=${result.healthCheck}, DB=${result.dbConnection}, COA=${result.coaCount}`);
    
    return result;

  } catch (error) {
    console.error('❌ Smoke test failed:', error);
    return result;
  }
}

// Run smoke test if called directly
if (require.main === module) {
  runSmokeTest()
    .then((result) => {
      console.log('\n=== SMOKE TEST RESULTS ===');
      console.log(`Health Check: ${result.healthCheck ? 'PASS' : 'FAIL'} (${result.healthStatus})`);
      console.log(`Database: ${result.dbConnection ? 'PASS' : 'FAIL'}`);
      console.log(`COA Count: ${result.coaCount}`);
      console.log(`Overall: ${result.success ? 'PASS' : 'FAIL'}`);
      
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Smoke test error:', error);
      process.exit(1);
    });
}

export default runSmokeTest;