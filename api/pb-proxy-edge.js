// This file creates a proxy API endpoint for Vercel deployments using Edge Runtime
// It forwards requests from https://your-vercel-app.vercel.app/api/pb-proxy/*
// to your PocketBase server at http://141.11.25.69:8090/*

export const config = {
  runtime: 'edge',
};

/**
 * API Proxy handler using Edge Runtime for better performance and compatibility
 * @param {Request} request - The incoming request
 * @returns {Response} The proxied response
 */
export default async function handler(request) {
  try {
    // Parse the URL
    const url = new URL(request.url);

    // Extract the path (remove /api/pb-proxy/ prefix)
    let path = url.pathname.replace(/^\/api\/pb-proxy\/?/, '');
    if (!path.startsWith('/')) path = '/' + path;

    // Create target URL to the PocketBase server
    const targetUrl = new URL(`http://141.11.25.69:8090${path}`);

    // Copy query parameters
    url.searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });

    // Create options for the fetch request
    const options = {
      method: request.method,
      headers: new Headers(),
    };

    // Copy allowed headers from the request
    const headersToForward = [
      'accept',
      'content-type',
      'authorization',
      'user-agent',
      'x-csrf-token',
      'content-length',
    ];

    for (const key of headersToForward) {
      const value = request.headers.get(key);
      if (value) {
        options.headers.set(key, value);
      }
    }

    // For methods that may have a body
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      try {
        const contentType = request.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          // Handle JSON body
          const body = await request.json();
          options.body = JSON.stringify(body);
        } else {
          // Handle other body types (form data, text, etc.)
          const body = await request.arrayBuffer();
          options.body = body;
        }
      } catch {
        // Request might not have a body, continue without it
      }
    }

    // Make the request to PocketBase
    const response = await fetch(targetUrl.toString(), options);

    // Create a new response with the same status and headers
    const responseHeaders = new Headers();

    // Copy headers from the response
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    // Get the response body
    const body = await response.arrayBuffer();

    // Return the response
    return new Response(body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Failed to proxy request to PocketBase',
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
