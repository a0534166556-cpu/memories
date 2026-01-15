// Netlify Function to proxy API requests to Railway backend
// SIMPLE VERSION - just to test if Function is called at all

const https = require('https');
const { URL } = require('url');

const RAILWAY_URL = 'https://memories-production-47ee.up.railway.app';

exports.handler = async (event, context) => {
  // Log immediately to see if function is called
  console.log('🔵🔵🔵 FUNCTION CALLED! 🔵🔵🔵');
  console.log('Method:', event.httpMethod);
  console.log('Path:', event.path);
  console.log('RawPath:', event.rawPath);
  console.log('Query:', event.queryStringParameters);
  // Log ALL headers immediately to debug
  console.log('📋 ALL EVENT HEADERS:', JSON.stringify(event.headers, null, 2));
  
  // Handle OPTIONS (preflight) requests immediately
  if (event.httpMethod === 'OPTIONS') {
    console.log('📋 OPTIONS request - returning CORS headers');
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }
  
  // Extract the path from the request
  // When redirected from "/api/*" to "/.netlify/functions/api/:splat",
  // event.path should be "/.netlify/functions/api/memorials" (with :splat replaced)
  let path = event.path || event.rawPath || '';
  console.log('📍 Original path from event:', path);
  console.log('📍 All event properties:', Object.keys(event));
  
  // Remove function path prefix
  if (path.startsWith('/.netlify/functions/api')) {
    path = path.replace('/.netlify/functions/api', '');
    console.log('📍 After removing function prefix:', path);
  }
  
  // Ensure path starts with /api
  if (path && !path.startsWith('/api')) {
    path = `/api${path}`;
    console.log('📍 After adding /api:', path);
  }
  
  // If path is empty or just /api, try to get from headers
  if (!path || path === '/api') {
    // Log all headers for debugging
    console.log('📍 All headers:', JSON.stringify(event.headers, null, 2));
    
    const originalUri = event.headers['x-original-uri'] || event.headers['x-forwarded-uri'] || event.headers['referer'] || '';
    console.log('📍 Trying headers:', originalUri);
    
    if (originalUri && originalUri.includes('/api/')) {
      const match = originalUri.match(/\/api\/[^?]*/);
      if (match) {
        path = match[0];
        console.log('📍 Found in headers:', path);
      }
    } else {
      path = '/api/memorials'; // Fallback
      console.log('⚠️ Using fallback path:', path);
    }
  }
  
  const targetUrl = `${RAILWAY_URL}${path}${event.rawQuery ? '?' + event.rawQuery : ''}`;
  console.log(`🚀 Proxying ${event.httpMethod} ${path} -> ${targetUrl}`);
  
  try {
    const url = new URL(targetUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: event.httpMethod,
      headers: {}
    };
    
    // Copy headers - IMPORTANT: preserve Content-Type, Authorization, and other headers
    if (event.headers['content-type']) {
      options.headers['Content-Type'] = event.headers['content-type'];
      console.log('📋 Content-Type:', event.headers['content-type']);
    }
    if (event.headers['content-length']) {
      options.headers['Content-Length'] = event.headers['content-length'];
    }
    // CRITICAL: Forward Authorization header for authentication
    if (event.headers['authorization']) {
      options.headers['Authorization'] = event.headers['authorization'];
      console.log('🔑 Authorization header found and forwarded');
    } else if (event.headers['Authorization']) {
      options.headers['Authorization'] = event.headers['Authorization'];
      console.log('🔑 Authorization header found (capitalized) and forwarded');
    } else {
      console.log('⚠️ No Authorization header in request');
    }
    
    // Handle body
    let requestBody = event.body || '';
    if (event.isBase64Encoded && requestBody) {
      requestBody = Buffer.from(requestBody, 'base64');
      options.headers['Content-Length'] = requestBody.length.toString();
      console.log('📦 Body is base64 encoded, decoded size:', requestBody.length);
    } else if (requestBody) {
      console.log('📦 Body size:', typeof requestBody === 'string' ? requestBody.length : 'unknown');
    }
    
    // Log all headers being sent
    console.log('📤 Headers being sent to Railway:', JSON.stringify(options.headers, null, 2));
    console.log('📤 Sending request to Railway...');
    
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          console.log(`✅ Got response: ${res.statusCode}`);
          console.log(`📥 Response body (first 500 chars):`, data.substring(0, 500));
          resolve({
            statusCode: res.statusCode,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
              'Content-Type': res.headers['content-type'] || 'application/json',
            },
            body: data
          });
        });
      });
      
      req.on('error', (error) => {
        console.error('❌ Request error:', error);
        resolve({
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Proxy error', message: error.message })
        });
      });
      
      if (requestBody && (event.httpMethod === 'POST' || event.httpMethod === 'PUT' || event.httpMethod === 'PATCH')) {
        if (Buffer.isBuffer(requestBody)) {
          req.write(requestBody);
        } else {
          req.write(requestBody);
        }
      }
      req.end();
    });
  } catch (error) {
    console.error('❌ Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Function error', message: error.message })
    };
  }
};
