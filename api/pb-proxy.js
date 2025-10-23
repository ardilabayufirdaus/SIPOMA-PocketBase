// This file creates a proxy API endpoint for Vercel deployments
// It forwards requests from https://your-vercel-app.vercel.app/api/pb-proxy/*
// to your PocketBase server at http://141.11.25.69:8090/*

export default async function handler(req, res) {
  try {
    // Extract path and query from the request URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    let path = url.pathname.replace(/^\/api\/pb-proxy\/?/, '');
    if (!path.startsWith('/')) path = '/' + path;

    // Create the target URL including query params
    const targetUrl = `http://141.11.25.69:8090${path}${url.search}`;

    // Forward headers that are safe
    const headers = {};
    const safeHeaders = [
      'accept',
      'content-type',
      'authorization',
      'user-agent',
      'cookie',
      'x-requested-with',
    ];

    for (const header of safeHeaders) {
      if (req.headers[header]) {
        headers[header] = req.headers[header];
      }
    }

    // Handle different HTTP methods
    const options = {
      method: req.method,
      headers: headers,
    };

    // For methods with body content
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      // In Vercel, req.body is already parsed if content-type is application/json
      if (req.body && typeof req.body === 'object') {
        options.body = JSON.stringify(req.body);
        if (!options.headers['content-type']) {
          options.headers['content-type'] = 'application/json';
        }
      } else if (req.body) {
        // If body is a string or buffer
        options.body = req.body;
      }
    }

    // Make the request to PocketBase
    const response = await fetch(targetUrl, options);

    // Set response status code
    res.status(response.status);

    // Forward response headers (skip problematic ones)
    const responseHeaders = response.headers;
    const skipHeaders = [
      'content-encoding',
      'transfer-encoding',
      'connection',
      'keep-alive',
      'proxy-authenticate',
      'proxy-authorization',
      'te',
      'trailers',
      'upgrade',
    ];

    for (const [key, value] of responseHeaders.entries()) {
      if (!skipHeaders.includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    // Add CORS headers for production
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Process response based on content type
    const contentType = responseHeaders.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // For JSON responses
      const jsonData = await response.json();
      res.json(jsonData);
    } else {
      // For binary/text responses
      const buffer = await response.arrayBuffer();
      res.end(Buffer.from(buffer));
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Proxy error:', error);
    // Send a simplified error response
    res.status(502).json({
      error: 'Failed to proxy request to PocketBase',
      details: error.message,
    });
  }
}
