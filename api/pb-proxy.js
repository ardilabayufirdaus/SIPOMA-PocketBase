// This file creates a proxy API endpoint for Vercel deployments
// It forwards requests from https://your-vercel-app.vercel.app/api/pb-proxy/*
// to your PocketBase server at http://141.11.25.69:8090/*

// Export a simple handler function compatible with Vercel serverless functions
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
    const safeHeaders = ['accept', 'content-type', 'authorization', 'user-agent', 'cookie'];

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
      if (req.body) {
        // If body is already parsed as JSON
        options.body = JSON.stringify(req.body);
        if (!options.headers['content-type']) {
          options.headers['content-type'] = 'application/json';
        }
      } else {
        // Try to get the raw body as text
        try {
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          const bodyBuffer = Buffer.concat(chunks);
          if (bodyBuffer.length > 0) {
            options.body = bodyBuffer;
          }
        } catch {
          // Failed to read request body
        }
      }
    }

    // Make the request to PocketBase
    const response = await fetch(targetUrl, options);

    // Set response status code
    res.statusCode = response.status;

    // Forward response headers
    const responseHeaders = response.headers;
    for (const [key, value] of responseHeaders.entries()) {
      res.setHeader(key, value);
    }

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
    // Send a simplified error response
    res.status(502).json({
      error: 'Failed to proxy request to PocketBase',
      details: error.message,
    });
  }
}
