// Netlify Function to proxy API requests to Railway backend
// This works for all HTTP methods including POST

const https = require('https');
const http = require('http');
const { URL } = require('url');

const RAILWAY_URL = 'https://memories-production-31c0.up.railway.app';

exports.handler = async (event, context) => {
  // Get the path from the request
  // event.path will be like "/api/memorials" when redirected from "/api/*"
  const path = event.path.startsWith('/api') ? event.path : `/api${event.path}`;
  const targetUrl = `${RAILWAY_URL}${path}${event.rawQuery ? '?' + event.rawQuery : ''}`;
  
  console.log(`Proxying ${event.httpMethod} ${path} to ${targetUrl}`);
  
  try {
    // Forward the request to Railway
    const url = new URL(targetUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: event.httpMethod,
      headers: {
        ...event.headers,
        host: url.hostname,
        'x-forwarded-for': event.headers['x-forwarded-for'] || event.headers['client-ip'] || '',
        'x-forwarded-proto': event.headers['x-forwarded-proto'] || 'https',
      }
    };
    
    // Remove headers that shouldn't be forwarded
    delete options.headers['host'];
    delete options.headers['connection'];
    delete options.headers['content-length'];
    
    // Handle request body for POST/PUT requests
    const requestBody = event.body || '';
    if (requestBody && (event.httpMethod === 'POST' || event.httpMethod === 'PUT' || event.httpMethod === 'PATCH')) {
      options.headers['content-length'] = Buffer.byteLength(requestBody);
    }
    
    return new Promise((resolve, reject) => {
      const protocol = url.protocol === 'https:' ? https : http;
      const req = protocol.request(options, (res) => {
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
              ...res.headers
            },
            body: data
          });
        });
      });
      
      req.on('error', (error) => {
        console.error('Proxy error:', error);
        reject({
          statusCode: 500,
          body: JSON.stringify({ error: 'Proxy error', message: error.message })
        });
      });
      
      // Send request body if exists
      if (requestBody && (event.httpMethod === 'POST' || event.httpMethod === 'PUT' || event.httpMethod === 'PATCH')) {
        req.write(requestBody);
      }
      
      req.end();
    });
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Function error', message: error.message })
    };
  }
};

