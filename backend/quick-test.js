// Quick test - no dependencies needed
const https = require('https');
const http = require('http');

const API_URL = 'https://memories-production-31c0.up.railway.app';

function test(url, callback) {
  const client = url.startsWith('https') ? https : http;
  
  const req = client.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      callback(null, {
        status: res.statusCode,
        headers: res.headers,
        data: data
      });
    });
  });
  
  req.on('error', (err) => {
    callback(err, null);
  });
  
  req.setTimeout(10000, () => {
    req.destroy();
    callback(new Error('Timeout'), null);
  });
}

console.log('\n🧪 Testing Railway Server\n');
console.log(`URL: ${API_URL}\n`);

// Test 1: Server connection
console.log('1. Testing server connection...');
test(`${API_URL}/api/music`, (err, result) => {
  if (err) {
    console.log(`   ❌ Error: ${err.message}`);
    if (err.code === 'ENOTFOUND' || err.code === 'ERR_NAME_NOT_RESOLVED') {
      console.log('   ❌ Server URL cannot be resolved - server might not be running');
    } else if (err.code === 'ECONNREFUSED') {
      console.log('   ❌ Connection refused - server is not accepting connections');
    }
  } else {
    console.log(`   ✅ Status: ${result.status}`);
    if (result.status === 200) {
      console.log('   ✅ Server is running and responding!');
    } else if (result.status === 503) {
      console.log('   ⚠️  Server is running but database is initializing (503)');
    }
    
    // Check CORS
    const corsHeader = result.headers['access-control-allow-origin'];
    if (corsHeader) {
      console.log(`   ✅ CORS header: ${corsHeader}`);
    } else {
      console.log('   ❌ CORS header missing!');
    }
  }
  
  // Test 2: API endpoint
  console.log('\n2. Testing API endpoint...');
  test(`${API_URL}/api/memorials`, (err, result) => {
    if (err) {
      console.log(`   ❌ Error: ${err.message}`);
    } else {
      console.log(`   ✅ Status: ${result.status}`);
      if (result.status === 200) {
        try {
          const json = JSON.parse(result.data);
          console.log(`   ✅ Found ${json.memorials?.length || 0} memorials`);
        } catch (e) {
          console.log('   ⚠️  Response is not valid JSON');
        }
      } else if (result.status === 503) {
        console.log('   ⚠️  Database not ready (503) - this is OK during startup');
      }
    }
    
    console.log('\n✅ Test completed!\n');
  });
});


