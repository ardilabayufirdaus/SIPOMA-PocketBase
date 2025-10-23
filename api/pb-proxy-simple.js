// Simple serverless function for API proxy without Edge Runtime constraints
// Forwards requests from https://your-vercel-app.vercel.app/api/pb-proxy-simple
// to your PocketBase server at http://141.11.25.69:8090

export default async function handler(req, res) {
  try {
    // Get the path from the request
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);

    // Extract the path and preserve query string
    let path = url.pathname.replace(/^\/api\/pb-proxy-simple\/?/, '');
    if (!path.startsWith('/')) path = '/' + path;
    const queryString = url.search || '';

    // Full target URL
    const targetUrl = `http://141.11.25.69:8090${path}${queryString}`;

    // Create fetch options
    const options = {
      method: req.method,
      headers: {},
    };

    // Forward selected headers
    const headersToCopy = ['accept', 'content-type', 'authorization', 'user-agent'];

    for (const header of headersToCopy) {
      if (req.headers[header]) {
        options.headers[header] = req.headers[header];
      }
    }

    // Handle request body
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      if (req.body) {
        // If body is already parsed as JSON or object
        options.body = JSON.stringify(req.body);
      } else if (req.rawBody) {
        // If we have access to raw body
        options.body = req.rawBody;
      } else {
        // For Vercel serverless functions, body should be available as req.body
        // If not, it's likely already been processed or is empty
      }
    }

    // Send request to PocketBase
    const response = await fetch(targetUrl, options);

    // Get response data
    const contentType = response.headers.get('content-type') || '';
    let responseData;

    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Set headers
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }

    // Send response
    res.status(response.status);

    if (contentType.includes('application/json')) {
      res.json(responseData);
    } else {
      res.send(responseData);
    }
  } catch (error) {
    // Log error for debugging
    // eslint-disable-next-line no-console
    console.error('API Proxy error:', error);

    // Send error response
    res.status(500).json({
      error: 'Failed to proxy request',
      message: error.message,
    });
  }
}

