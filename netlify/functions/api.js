// Netlify Function to proxy API requests to Railway backend
// This handles ALL HTTP methods including POST with FormData

const https = require('https');
const { URL } = require('url');

const RAILWAY_URL = 'https://memories-production-31c0.up.railway.app';

exports.handler = async (event, context) => {
  // Handle OPTIONS (preflight) requests immediately
  if (event.httpMethod === 'OPTIONS') {
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
  // event.path will be "/.netlify/functions/api/memorials" (with :splat replaced)
  let path = event.path;
  
  // Log everything for debugging
  console.log(`[PROXY DEBUG] Full event:`, JSON.stringify({
    path: event.path,
    rawPath: event.rawPath,
    httpMethod: event.httpMethod,
    queryStringParameters: event.queryStringParameters,
    multiValueQueryStringParameters: event.multiValueQueryStringParameters,
    headers: Object.keys(event.headers)
  }, null, 2));
  
  // Remove function path prefix
  if (path.startsWith('/.netlify/functions/api')) {
    path = path.replace('/.netlify/functions/api', '');
  }
  
  // Ensure path starts with /api
  if (!path.startsWith('/api')) {
    path = `/api${path}`;
  }
  
  console.log(`[PROXY] Extracted path: ${path}`);
  
  const targetUrl = `${RAILWAY_URL}${path}${event.rawQuery ? '?' + event.rawQuery : ''}`;
  
  console.log(`[PROXY] ${event.httpMethod} ${path} -> ${targetUrl}`);
  
  try {
    const url = new URL(targetUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: event.httpMethod,
      headers: {}
    };
    
    // Copy headers from request, but filter out problematic ones
    // Important: preserve Content-Type for FormData (multipart/form-data)
    const headersToCopy = [
      'content-type',
      'content-length',
      'authorization',
      'x-requested-with'
    ];
    
    // Copy all relevant headers
    Object.keys(event.headers).forEach(key => {
      const lowerKey = key.toLowerCase();
      // Copy important headers and custom headers
      if (headersToCopy.includes(lowerKey) || lowerKey.startsWith('x-')) {
        // Preserve original case for Content-Type (important for FormData)
        options.headers[key] = event.headers[key];
      }
    });
    
    // Remove headers that shouldn't be forwarded to Railway
    delete options.headers['host'];
    delete options.headers['connection'];
    
    // Handle request body
    let requestBody = event.body || '';
    
    // Netlify Functions encode binary data as base64
    // Check if body is base64 encoded (FormData, images, etc.)
    if (event.isBase64Encoded && requestBody) {
      // Decode base64 to buffer
      requestBody = Buffer.from(requestBody, 'base64');
      // Update content-length
      if (!options.headers['content-length']) {
        options.headers['content-length'] = requestBody.length.toString();
      }
    } else if (requestBody && (event.httpMethod === 'POST' || event.httpMethod === 'PUT' || event.httpMethod === 'PATCH')) {
      // For string bodies, calculate length
      if (typeof requestBody === 'string') {
        const bodyLength = Buffer.byteLength(requestBody);
        if (!options.headers['content-length']) {
          options.headers['content-length'] = bodyLength.toString();
        }
      }
    }
    
    // Log body info for debugging (but not the actual body to avoid spam)
    if (requestBody) {
      console.log(`[PROXY] Body size: ${Buffer.isBuffer(requestBody) ? requestBody.length : (typeof requestBody === 'string' ? requestBody.length : 'unknown')}, isBase64: ${event.isBase64Encoded || false}`);
    }
    
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
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
        console.error('[PROXY ERROR]', error);
        resolve({
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            error: 'Proxy error', 
            message: error.message 
          })
        });
      });
      
      // Send request body
      if (requestBody && (event.httpMethod === 'POST' || event.httpMethod === 'PUT' || event.httpMethod === 'PATCH')) {
        if (Buffer.isBuffer(requestBody)) {
          req.write(requestBody);
        } else if (typeof requestBody === 'string') {
          req.write(requestBody);
        } else {
          req.write(Buffer.from(requestBody));
        }
      }
      
      req.end();
    });
  } catch (error) {
    console.error('[FUNCTION ERROR]', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Function error', 
        message: error.message 
      })
    };
  }
};
