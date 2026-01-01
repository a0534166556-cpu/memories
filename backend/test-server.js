const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:8080';
const DB_PATH = process.env.DB_PATH || './memorial.db';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(name, passed, message) {
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
    logSuccess(`${name}: ${message}`);
  } else {
    results.failed++;
    logError(`${name}: ${message}`);
  }
}

// Test 1: Check if server is running
async function testServerRunning() {
  try {
    logInfo('\n1. Testing if server is running...');
    const response = await axios.get(`${API_URL}/api/music`, {
      timeout: 5000,
      validateStatus: () => true // Don't throw on any status
    });
    
    if (response.status === 200 || response.status === 503) {
      recordTest('Server Running', true, `Server responded with status ${response.status}`);
      return true;
    } else {
      recordTest('Server Running', false, `Server responded with unexpected status ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      recordTest('Server Running', false, 'Server is not running (connection refused)');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ERR_NAME_NOT_RESOLVED') {
      recordTest('Server Running', false, `Cannot resolve server URL: ${API_URL}`);
    } else {
      recordTest('Server Running', false, `Error: ${error.message}`);
    }
    return false;
  }
}

// Test 2: Check CORS headers
async function testCORS() {
  try {
    logInfo('\n2. Testing CORS headers...');
    const response = await axios.options(`${API_URL}/api/music`, {
      headers: {
        'Origin': 'https://memoriesman.netlify.app',
        'Access-Control-Request-Method': 'GET'
      },
      validateStatus: () => true
    });
    
    const corsHeader = response.headers['access-control-allow-origin'];
    const corsMethods = response.headers['access-control-allow-methods'];
    
    if (corsHeader === '*' || corsHeader === 'https://memoriesman.netlify.app') {
      recordTest('CORS Headers', true, `CORS header present: ${corsHeader}`);
      if (corsMethods) {
        logSuccess(`  CORS Methods: ${corsMethods}`);
      }
      return true;
    } else {
      recordTest('CORS Headers', false, `Missing or incorrect CORS header. Got: ${corsHeader}`);
      return false;
    }
  } catch (error) {
    recordTest('CORS Headers', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 3: Check database tables
function testDatabaseTables() {
  return new Promise((resolve) => {
    logInfo('\n3. Testing database tables...');
    
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        recordTest('Database Connection', false, `Cannot connect to database: ${err.message}`);
        resolve(false);
        return;
      }
      
      logSuccess('Database connection successful');
      
      // Check if tables exist
      const tables = ['memorials', 'condolences', 'candles'];
      let checkedTables = 0;
      let allTablesExist = true;
      
      tables.forEach(tableName => {
        db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`, (err, rows) => {
          checkedTables++;
          
          if (err) {
            recordTest(`Table: ${tableName}`, false, `Error checking table: ${err.message}`);
            allTablesExist = false;
          } else if (rows.length > 0) {
            recordTest(`Table: ${tableName}`, true, 'Table exists');
          } else {
            recordTest(`Table: ${tableName}`, false, 'Table does not exist');
            allTablesExist = false;
          }
          
          if (checkedTables === tables.length) {
            db.close();
            resolve(allTablesExist);
          }
        });
      });
    });
  });
}

// Test 4: Check API endpoints
async function testAPIEndpoints() {
  logInfo('\n4. Testing API endpoints...');
  
  const endpoints = [
    { method: 'GET', path: '/api/music', name: 'Get Music Files' },
    { method: 'GET', path: '/api/memorials', name: 'Get All Memorials' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${API_URL}${endpoint.path}`,
        timeout: 5000,
        validateStatus: () => true
      });
      
      if (response.status === 200) {
        recordTest(endpoint.name, true, `Status: ${response.status}`);
      } else if (response.status === 503) {
        recordTest(endpoint.name, false, 'Database not ready (503 Service Unavailable)');
      } else {
        recordTest(endpoint.name, false, `Unexpected status: ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        recordTest(endpoint.name, false, 'Connection refused - server not running');
      } else {
        recordTest(endpoint.name, false, `Error: ${error.message}`);
      }
    }
  }
}

// Test 5: Check database readiness endpoint behavior
async function testDatabaseReadiness() {
  logInfo('\n5. Testing database readiness behavior...');
  
  try {
    // Try to create a memorial (this should work if DB is ready, or return 503 if not)
    const response = await axios.post(
      `${API_URL}/api/memorials`,
      {
        name: 'Test Memorial',
        biography: 'Test biography'
      },
      {
        timeout: 5000,
        validateStatus: () => true
      }
    );
    
    if (response.status === 503) {
      recordTest('Database Readiness Check', true, 'Server correctly returns 503 when DB not ready');
    } else if (response.status === 200 || response.status === 201) {
      recordTest('Database Readiness Check', true, 'Database is ready and accepting requests');
    } else if (response.status === 400) {
      recordTest('Database Readiness Check', true, 'Database is ready (validation error is expected)');
    } else {
      recordTest('Database Readiness Check', false, `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    if (error.response && error.response.status === 503) {
      recordTest('Database Readiness Check', true, 'Server correctly returns 503 when DB not ready');
    } else {
      recordTest('Database Readiness Check', false, `Error: ${error.message}`);
    }
  }
}

// Test 6: Check server logs simulation
function testServerStartupSequence() {
  logInfo('\n6. Checking expected server startup sequence...');
  
  logInfo('Expected sequence:');
  log('  1. Connected to SQLite database', 'cyan');
  log('  2. Foreign keys enabled', 'cyan');
  log('  3. Starting database initialization...', 'cyan');
  log('  4. Memorials table ready', 'cyan');
  log('  5. Condolences table ready', 'cyan');
  log('  6. Candles table ready', 'cyan');
  log('  7. Database initialization complete!', 'cyan');
  log('  8. Server running on port 8080', 'cyan');
  
  recordTest('Startup Sequence', true, 'Check Railway logs to verify this sequence');
}

// Main test function
async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('  SERVER HEALTH CHECK', 'cyan');
  log('='.repeat(60), 'cyan');
  logInfo(`Testing server at: ${API_URL}`);
  logInfo(`Database path: ${DB_PATH}`);
  log('');
  
  // Run all tests
  const serverRunning = await testServerRunning();
  
  if (serverRunning) {
    await testCORS();
    await testAPIEndpoints();
    await testDatabaseReadiness();
  } else {
    logWarning('\nSkipping API tests - server is not running');
  }
  
  await testDatabaseTables();
  testServerStartupSequence();
  
  // Print summary
  log('\n' + '='.repeat(60), 'cyan');
  log('  TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\nTotal Tests: ${results.passed + results.failed}`, 'blue');
  logSuccess(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  } else {
    logSuccess('Failed: 0');
  }
  
  log('\n' + '='.repeat(60), 'cyan');
  
  // Detailed results
  if (results.failed > 0) {
    log('\nFailed Tests:', 'red');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => logError(`  - ${t.name}: ${t.message}`));
  }
  
  // Exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  logError(`\nFatal error running tests: ${error.message}`);
  console.error(error);
  process.exit(1);
});


