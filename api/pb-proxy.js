// This file creates a proxy API endpoint for Vercel deployments
// It forwards requests from https://your-vercel-app.vercel.app/api/pb-proxy/*
// to your PocketBase server at http://141.11.25.69:8090/*

import { Buffer } from 'buffer';

export default async function handler(req, res) {
  // Extract the path after /api/pb-proxy
  let path = req.url.split('?')[0].replace(/^\/api\/pb-proxy\/?/, '');
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  // Preserve query parameters if any
  const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';

  // Construct target URL to the PocketBase server
  const targetUrl = `http://141.11.25.69:8090${path}${queryString}`;

  // Initialize options for fetch with clean headers
  const options = {
    method: req.method,
    headers: {},
  };

  // Copy safe headers from the original request
  const headersToForward = [
    'accept',
    'content-type',
    'authorization',
    'user-agent',
    'x-csrf-token',
    'x-requested-with',
  ];

  for (const header of headersToForward) {
    if (req.headers[header]) {
      options.headers[header] = req.headers[header];
    }
  }

  try {
    // Handle request body for methods that may have one
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      // Need to handle the body as buffer/string
      const bodyParser = new Promise((resolve) => {
        const body = [];
        req
          .on('data', (chunk) => {
            body.push(chunk);
          })
          .on('end', () => {
            const bodyBuffer = Buffer.concat(body);
            if (bodyBuffer.length > 0) {
              options.body = bodyBuffer;
            }
            resolve();
          });
      });

      await bodyParser;
    }

    // Make the request to PocketBase
    const response = await fetch(targetUrl, options);

    // Set response status
    res.status(response.status);

    // Set response headers (only safe ones)
    const safeHeaders = ['content-type', 'cache-control', 'content-disposition', 'expires'];

    for (const [key, value] of response.headers.entries()) {
      if (safeHeaders.includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    // Get response data based on content type
    const contentType = response.headers.get('content-type');

    // For files, stream the binary response
    if (contentType && !contentType.includes('application/json')) {
      const blob = await response.blob();
      const buffer = Buffer.from(await blob.arrayBuffer());
      res.send(buffer);
    } else {
      // For JSON responses
      try {
        const jsonData = await response.json();
        res.json(jsonData);
      } catch {
        // If parsing JSON fails, return as text
        const textData = await response.text();
        res.send(textData);
      }
    }
  } catch {
    // Log error but don't expose details to client
    const errorMessage = 'Failed to proxy request to PocketBase';

    // Send error response
    res.status(502).json({
      error: errorMessage,
      path: path,
      method: req.method,
    });
  }
}
