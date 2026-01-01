// Quick local test script - run this to test your local server
// Usage: node test-local.js

const axios = require('axios');

const API_URL = 'http://localhost:8080';

async function quickTest() {
  console.log('\n🧪 Quick Server Test\n');
  
  try {
    // Test 1: Server running
    console.log('1. Testing server connection...');
    const response = await axios.get(`${API_URL}/api/music`, {
      timeout: 3000,
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      console.log('   ✅ Server is running!');
      console.log(`   ✅ CORS header: ${response.headers['access-control-allow-origin'] || 'Not found'}`);
    } else if (response.status === 503) {
      console.log('   ⚠️  Server is running but database is not ready (503)');
    } else {
      console.log(`   ❌ Unexpected status: ${response.status}`);
    }
    
    // Test 2: CORS
    console.log('\n2. Testing CORS...');
    const corsResponse = await axios.options(`${API_URL}/api/music`, {
      headers: {
        'Origin': 'https://memoriesman.netlify.app',
        'Access-Control-Request-Method': 'GET'
      },
      validateStatus: () => true
    });
    
    const corsHeader = corsResponse.headers['access-control-allow-origin'];
    if (corsHeader === '*' || corsHeader) {
      console.log(`   ✅ CORS is working! (${corsHeader})`);
    } else {
      console.log('   ❌ CORS header missing');
    }
    
    // Test 3: API endpoint
    console.log('\n3. Testing API endpoint...');
    const memorialsResponse = await axios.get(`${API_URL}/api/memorials`, {
      timeout: 3000,
      validateStatus: () => true
    });
    
    if (memorialsResponse.status === 200) {
      console.log('   ✅ API endpoint is working!');
      console.log(`   ✅ Found ${memorialsResponse.data.memorials?.length || 0} memorials`);
    } else if (memorialsResponse.status === 503) {
      console.log('   ⚠️  Database not ready yet (503)');
    } else {
      console.log(`   ❌ Unexpected status: ${memorialsResponse.status}`);
    }
    
    console.log('\n✅ All tests completed!\n');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('   ❌ Server is not running!');
      console.log('   💡 Start the server with: npm start');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   ❌ Server timeout - server might be slow or not responding');
    } else {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('\n');
  }
}

quickTest();


