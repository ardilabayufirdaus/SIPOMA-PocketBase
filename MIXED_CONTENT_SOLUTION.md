# Mixed Content Solution for SIPOMA

This document explains the solution implemented to address the mixed content issue when accessing the SIPOMA application over HTTPS while the backend server uses HTTP.

## The Problem with Vercel and Mixed Content

When SIPOMA is deployed to Vercel (https://sipoma-git-main-ardilabayufirdaus-projects.vercel.app/ or https://www.sipoma.site), it is served over HTTPS. However, the backend PocketBase server at http://141.11.25.69:8090 uses HTTP. This creates a "mixed content" situation where browsers block insecure HTTP content from being loaded on an HTTPS page.

Specifically, you'll see these errors in the console:

```
Mixed Content: The page at 'https://sipoma-git-main-ardilabayufirdaus-projects.vercel.app/' was loaded over HTTPS, but requested an insecure resource 'http://141.11.25.69:8090/api/admins/auth-with-password'. This request has been blocked; the content must be served over HTTPS.
```

## What is Mixed Content?

Modern browsers block insecure HTTP content when a page is loaded over secure HTTPS. This is a security feature that prevents potential man-in-the-middle attacks. However, it can cause issues when an HTTPS site needs to communicate with an HTTP API backend.

## Solution Components

The solution consists of several components working together:

1. **API Proxy** - A serverless function that forwards requests from HTTPS to HTTP
2. **PocketBase URL Detection** - Automatically detects Vercel deployments and uses the proxy
3. **ConnectionHelp Component** - A user-friendly component that explains the mixed content issue and offers solutions
4. **MixedContentDetector** - Detects mixed content issues and shows the help component when needed
5. **ConnectionStatusIndicator** - A small UI indicator showing connection status and offering help

## How It Works: Automatic API Proxy

The primary solution is now a serverless function that automatically handles all requests:

1. When the application is deployed on Vercel (using HTTPS), all requests to PocketBase are routed through an API proxy
2. The proxy is a serverless function that forwards requests to the HTTP backend
3. This happens transparently to the user with no browser warnings or errors

### Implementation Files for API Proxy Solution

- `api/pb-proxy.js` - Serverless function that proxies requests to the PocketBase backend
- `utils/pocketbase.ts` - Auto-detects Vercel environment and routes through the proxy
- `vercel.json` - Configures API routes for the proxy

### API Proxy Implementation

Here's the implementation of the API proxy in `/api/pb-proxy.js`:

```javascript
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
      // Handle the body properly
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

    // Forward important headers
    const safeHeaders = ['content-type', 'cache-control', 'content-disposition', 'expires'];

    for (const [key, value] of response.headers.entries()) {
      if (safeHeaders.includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    // Handle response by content type
    const contentType = response.headers.get('content-type');

    if (contentType && !contentType.includes('application/json')) {
      // For files/binary, stream the response
      const blob = await response.blob();
      const buffer = Buffer.from(await blob.arrayBuffer());
      res.send(buffer);
    } else {
      // For JSON responses
      try {
        const jsonData = await response.json();
        res.json(jsonData);
      } catch {
        // If JSON parsing fails, return as text
        const textData = await response.text();
        res.send(textData);
      }
    }
  } catch {
    // Send generic error
    res.status(502).json({
      error: 'Failed to proxy request to PocketBase',
      path: path,
      method: req.method,
    });
  }
}
```

### Auto-Detection in PocketBase Utility

The `utils/pocketbase.ts` file now includes automatic detection for Vercel deployments:

```typescript
// Determine if running on Vercel deployment
const isVercelDeployment =
  process.env.VERCEL === '1' || // Vercel's environment variable
  (typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app'));

// Get appropriate URL for PocketBase
export function getPocketbaseUrl() {
  if (isVercelDeployment) {
    // Use proxy URL when on Vercel (bypasses mixed content)
    return '/api/pb-proxy';
  } else {
    // Use direct connection otherwise
    return 'http://141.11.25.69:8090';
  }
}
```

## Legacy UI Components for Mixed Content Detection

The application still includes UI components to help users who might experience mixed content issues:

- `components/ConnectionHelp.tsx` - The help component with user instructions
- `components/MixedContentDetector.tsx` - Detects issues and conditionally shows help
- `components/ConnectionStatusIndicator.tsx` - Shows connection status and help
- `hooks/useMixedContentDetection.ts` - Hook for mixed content detection
- `utils/connectionMonitor.ts` - Monitors connection status to the backend

## Manual User Solutions (Legacy)

These options are now only relevant for special cases, as the API proxy should handle most situations:

1. **Allow insecure content in browser** (only needed if API proxy isn't working):
   - Look for shield/lock icon in the address bar
   - Choose to allow or load unsafe scripts
   - Refresh the page

2. **For Local Development**:
   - Run the application locally using `npm run dev` which will serve over HTTP
   - Access via http://localhost:3000 or whatever port is configured

## Notes for Developers

- The system now uses an API proxy for all Vercel deployments
- For local development, direct HTTP connection to PocketBase is still used
- The mixed content detection components are still available but should rarely be needed
- Vercel's serverless functions have usage limits - monitor performance if expecting high traffic
