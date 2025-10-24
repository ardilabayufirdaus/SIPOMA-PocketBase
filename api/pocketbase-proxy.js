// API Proxy untuk development environment
// File: api/pb-proxy-dev.js

export default async function handler(req, res) {
  try {
    // Dalam development, redirect ke backend HTTP langsung
    const backendUrl = 'http://141.11.25.69:8090';

    // Buat URL lengkap untuk backend
    const url = new URL(req.url, backendUrl);
    url.pathname = url.pathname.replace('/api/pb-proxy', '');

    // Forward request ke backend
    const response = await fetch(url.toString(), {
      method: req.method,
      headers: {
        ...req.headers,
        // Hapus header host agar tidak conflict
        host: new URL(backendUrl).host,
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    });

    // Copy response headers
    const responseHeaders = {};
    for (const [key, value] of response.headers.entries()) {
      // Skip beberapa header yang tidak perlu
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        responseHeaders[key] = value;
      }
    }

    // Set CORS headers untuk development
    responseHeaders['Access-Control-Allow-Origin'] = '*';
    responseHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    responseHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';

    // Return response
    res.status(response.status);
    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    const responseBody = await response.text();
    res.send(responseBody);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('API Proxy Dev error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}
