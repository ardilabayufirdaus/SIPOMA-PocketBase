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

1. **ConnectionHelp Component** - A user-friendly component that explains the mixed content issue and offers solutions
2. **MixedContentDetector** - Detects mixed content issues and shows the help component when needed
3. **useMixedContentDetection Hook** - A reusable hook that checks if the site is experiencing mixed content issues
4. **ConnectionStatusIndicator** - A small UI indicator showing connection status and offering help

## How It Works

1. When a user visits the SIPOMA site over HTTPS (e.g., https://www.sipoma.site), the system automatically checks for mixed content issues by attempting to connect to the HTTP backend.

2. If a mixed content issue is detected, a small indicator appears in the bottom right corner of the screen.

3. Users can click "Need Help" to see detailed instructions on how to:
   - Allow mixed content in their browser
   - Access the site directly via HTTP instead of HTTPS

4. The system also monitors connection status continuously and shows the current status to the user.

## Implementation Files

- `components/ConnectionHelp.tsx` - The main help component with user instructions
- `components/MixedContentDetector.tsx` - Detects issues and conditionally renders the help
- `components/ConnectionStatusIndicator.tsx` - Shows connection status and help link
- `hooks/useMixedContentDetection.ts` - Reusable hook for mixed content detection
- `utils/connectionMonitor.ts` - Monitors connection status to the backend

## Solutions for Users

Users experiencing mixed content issues have two main options:

1. **Allow insecure content in their browser**:
   - Look for shield/lock icon in the address bar
   - Choose to allow or load unsafe scripts
   - Refresh the page

2. **For Local Development**:
   - Run the application locally using `npm run dev` which will serve over HTTP
   - Access via http://localhost:3000 or whatever port is configured

**Note**: Vercel deployments only support HTTPS, so you cannot switch to HTTP with Vercel-hosted sites.

## Long-term Solutions

For a more permanent solution, consider:

1. **Adding SSL/TLS to the PocketBase server** (Recommended):
   - Set up a proper SSL certificate for the PocketBase server
   - Update the connection URLs to use https://141.11.25.69:8090
   - This is the most reliable solution

2. **Setting up a reverse proxy with SSL termination**:
   - Use Nginx or similar to proxy requests with HTTPS to HTTP backend
   - Example Nginx configuration in next section

3. **Creating a serverless function on Vercel**:
   - Create API routes on Vercel that proxy requests to your HTTP backend
   - Example implementation below

4. **Using a CORS proxy service**:
   - As a temporary solution, you could use a CORS proxy service
   - Not recommended for production due to security and reliability concerns

## Example Implementation of Vercel API Proxy

Create a file at `/api/pb-proxy.js` in your Vercel project:

```javascript
// /api/pb-proxy.js
import { createProxyMiddleware } from 'http-proxy-middleware';

// Create proxy instance
const apiProxy = createProxyMiddleware({
  target: 'http://141.11.25.69:8090',
  changeOrigin: true,
  pathRewrite: {
    '^/api/pb-proxy': '', // Remove the /api/pb-proxy path
  },
  secure: false,
});

export default function (req, res) {
  // Don't allow proxy requests to modify our API routes
  if (req.url.startsWith('/api/pb-proxy')) {
    return apiProxy(req, res);
  }

  return res.status(404).send('Not found');
}
```

Then update your PocketBase URL in your code to use relative URLs:

```typescript
const pocketbaseUrl = '/api/pb-proxy'; // This will be proxied through Vercel
```

## Notes for Developers

- The system auto-detects protocol issues and tries to fall back to HTTP when needed
- The connection monitor checks connection health periodically
- Events are used to notify components about connection changes
