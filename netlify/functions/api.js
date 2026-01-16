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
  
  // Log ALL headers IMMEDIATELY - check for Authorization
  console.log('📋📋📋 ALL HEADERS KEYS:', Object.keys(event.headers || {}).join(', '));
  const authHeaderValue = event.headers?.['authorization'] || event.headers?.['Authorization'] || event.headers?.['AUTHORIZATION'];
  console.log('🔑🔑🔑 Authorization header value:', authHeaderValue ? `FOUND (${authHeaderValue.length} chars)` : 'NOT FOUND');
  
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
  // According to Netlify docs: when using :splat in redirects, event.path contains
  // the original client path (e.g., /api/memorials/user/my)
  // event.path might also be "/.netlify/functions/api/memorials/user/my" in some cases
  let path = event.path || '';
  console.log('📍 event.path:', event.path);
  console.log('📍 event.rawPath:', event.rawPath);
  console.log('📍 event.rawUrl:', event.rawUrl);
  
  // Remove function path prefix if present (some Netlify setups include it)
  if (path.startsWith('/.netlify/functions/api')) {
    path = path.replace('/.netlify/functions/api', '');
    console.log('📍 After removing function prefix:', path);
  }
  
  // Ensure path starts with /api
  // If path doesn't start with /api, it might be the splat value without /api prefix
  if (path && !path.startsWith('/api')) {
    if (path.startsWith('/')) {
      // Path like "/memorials/user/my" -> "/api/memorials/user/my"
      path = `/api${path}`;
      console.log('📍 After adding /api prefix:', path);
    } else {
      // Path like "memorials/user/my" -> "/api/memorials/user/my"
      path = `/api/${path}`;
      console.log('📍 After adding /api/ prefix:', path);
    }
  }
  
  // Fallback: if path is still empty, try to extract from rawUrl
  if (!path || path === '/api' || path === '/api/') {
    if (event.rawUrl) {
      try {
        const url = new URL(event.rawUrl);
        path = url.pathname;
        console.log('📍 Extracted from rawUrl:', path);
        // Ensure it starts with /api
        if (path && !path.startsWith('/api')) {
          path = path.startsWith('/') ? `/api${path}` : `/api/${path}`;
        }
      } catch (e) {
        console.log('⚠️ Could not parse rawUrl:', e.message);
      }
    }
    
    // Last resort: try headers
    if (!path || path === '/api' || path === '/api/') {
      const originalUri = event.headers['x-original-uri'] || event.headers['x-forwarded-uri'] || '';
      console.log('📍 Trying headers:', originalUri);
      
      if (originalUri && originalUri.includes('/api/')) {
        const match = originalUri.match(/\/api\/[^?\s]*/);
        if (match) {
          path = match[0];
          console.log('📍 Found in headers:', path);
        }
      }
    }
    
    if (!path || path === '/api' || path === '/api/') {
      console.log('⚠️ No valid path found');
      return {
        statusCode: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Invalid API path', debug: { eventPath: event.path, rawPath: event.rawPath, rawUrl: event.rawUrl } })
      };
    }
  }
  
  // Clean up path - remove trailing slashes (except for /api itself)
  if (path !== '/api' && path.endsWith('/')) {
    path = path.slice(0, -1);
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
    
    // Forward ALL important headers from client to Railway
    // Netlify Functions normalize headers to lowercase
    const headerMap = {
      'content-type': 'Content-Type',
      'content-length': 'Content-Length',
      'authorization': 'Authorization'
    };
    
    // Log all incoming headers for debugging
    console.log('📋 Incoming headers:', Object.keys(event.headers).join(', '));
    
    // Forward each header
    for (const [lowerKey, properKey] of Object.entries(headerMap)) {
      const value = event.headers[lowerKey];
      if (value) {
        options.headers[properKey] = value;
        if (lowerKey === 'authorization') {
          console.log('🔑✅ Authorization header FOUND! Length:', value.length);
        }
      }
    }
    
    // If Authorization not found, try all headers
    if (!options.headers['Authorization']) {
      Object.keys(event.headers).forEach(key => {
        if (key.toLowerCase() === 'authorization') {
          options.headers['Authorization'] = event.headers[key];
          console.log('🔑✅ Authorization found via loop!');
        }
      });
    }
    
    if (!options.headers['Authorization']) {
      console.log('❌❌❌ NO Authorization header in request!');
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
