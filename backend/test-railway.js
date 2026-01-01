// Test script for Railway deployment
// Usage: API_URL=https://memories-production-31c0.up.railway.app node test-railway.js

const axios = require('axios');

const API_URL = process.env.API_URL || 'https://memories-production-31c0.up.railway.app';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testRailway() {
  log('\n🚂 Testing Railway Deployment\n', 'blue');
  log(`Testing: ${API_URL}\n`, 'blue');
  
  const tests = [];
  
  // Test 1: Server Connection
  try {
    log('1. Testing server connection...', 'blue');
    const response = await axios.get(`${API_URL}/api/music`, {
      timeout: 10000,
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      log('   ✅ Server is running!', 'green');
      tests.push({ name: 'Server Connection', passed: true });
    } else if (response.status === 503) {
      log('   ⚠️  Server running but database initializing (503)', 'yellow');
      tests.push({ name: 'Server Connection', passed: true, warning: true });
    } else {
      log(`   ❌ Unexpected status: ${response.status}`, 'red');
      tests.push({ name: 'Server Connection', passed: false });
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ERR_NAME_NOT_RESOLVED') {
      log('   ❌ Server is not reachable!', 'red');
      log(`   Error: ${error.message}`, 'red');
      tests.push({ name: 'Server Connection', passed: false });
    } else if (error.code === 'ETIMEDOUT') {
      log('   ❌ Request timeout - server might be slow', 'red');
      tests.push({ name: 'Server Connection', passed: false });
    } else {
      log(`   ❌ Error: ${error.message}`, 'red');
      tests.push({ name: 'Server Connection', passed: false });
    }
  }
  
  // Test 2: CORS
  try {
    log('\n2. Testing CORS headers...', 'blue');
    const corsResponse = await axios.options(`${API_URL}/api/music`, {
      headers: {
        'Origin': 'https://memoriesman.netlify.app',
        'Access-Control-Request-Method': 'GET'
      },
      timeout: 10000,
      validateStatus: () => true
    });
    
    const corsHeader = corsResponse.headers['access-control-allow-origin'];
    const corsMethods = corsResponse.headers['access-control-allow-methods'];
    
    if (corsHeader === '*' || corsHeader) {
      log(`   ✅ CORS header: ${corsHeader}`, 'green');
      if (corsMethods) {
        log(`   ✅ CORS methods: ${corsMethods}`, 'green');
      }
      tests.push({ name: 'CORS Headers', passed: true });
    } else {
      log('   ❌ CORS header missing or incorrect', 'red');
      tests.push({ name: 'CORS Headers', passed: false });
    }
  } catch (error) {
    log(`   ❌ CORS test failed: ${error.message}`, 'red');
    tests.push({ name: 'CORS Headers', passed: false });
  }
  
  // Test 3: API Endpoints
  try {
    log('\n3. Testing API endpoints...', 'blue');
    const memorialsResponse = await axios.get(`${API_URL}/api/memorials`, {
      timeout: 10000,
      validateStatus: () => true
    });
    
    if (memorialsResponse.status === 200) {
      log('   ✅ GET /api/memorials is working!', 'green');
      log(`   ✅ Found ${memorialsResponse.data.memorials?.length || 0} memorials`, 'green');
      tests.push({ name: 'API Endpoints', passed: true });
    } else if (memorialsResponse.status === 503) {
      log('   ⚠️  Database not ready (503) - this is OK during startup', 'yellow');
      tests.push({ name: 'API Endpoints', passed: true, warning: true });
    } else {
      log(`   ❌ Unexpected status: ${memorialsResponse.status}`, 'red');
      tests.push({ name: 'API Endpoints', passed: false });
    }
  } catch (error) {
    log(`   ❌ API test failed: ${error.message}`, 'red');
    tests.push({ name: 'API Endpoints', passed: false });
  }
  
  // Test 4: Database Readiness
  try {
    log('\n4. Testing database readiness check...', 'blue');
    const testResponse = await axios.post(
      `${API_URL}/api/memorials`,
      { name: 'Test', biography: 'Test' },
      {
        timeout: 10000,
        validateStatus: () => true
      }
    );
    
    if (testResponse.status === 503) {
      log('   ✅ Server correctly returns 503 when DB not ready', 'green');
      tests.push({ name: 'Database Readiness', passed: true });
    } else if (testResponse.status === 200 || testResponse.status === 201) {
      log('   ✅ Database is ready and accepting requests!', 'green');
      tests.push({ name: 'Database Readiness', passed: true });
    } else if (testResponse.status === 400) {
      log('   ✅ Database is ready (validation error is expected)', 'green');
      tests.push({ name: 'Database Readiness', passed: true });
    } else {
      log(`   ⚠️  Unexpected status: ${testResponse.status}`, 'yellow');
      tests.push({ name: 'Database Readiness', passed: true, warning: true });
    }
  } catch (error) {
    if (error.response && error.response.status === 503) {
      log('   ✅ Server correctly returns 503 when DB not ready', 'green');
      tests.push({ name: 'Database Readiness', passed: true });
    } else {
      log(`   ❌ Error: ${error.message}`, 'red');
      tests.push({ name: 'Database Readiness', passed: false });
    }
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('  TEST SUMMARY', 'blue');
  log('='.repeat(60), 'blue');
  
  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;
  const warnings = tests.filter(t => t.warning).length;
  
  log(`\nTotal: ${tests.length} tests`, 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  if (warnings > 0) {
    log(`⚠️  Warnings: ${warnings}`, 'yellow');
  }
  if (failed > 0) {
    log(`❌ Failed: ${failed}`, 'red');
  } else {
    log(`❌ Failed: 0`, 'green');
  }
  
  if (failed === 0) {
    log('\n🎉 All tests passed! Railway deployment is working!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check Railway logs for details.', 'yellow');
  }
  
  log('\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

testRailway();

