# Mixed Content Solution for SIPOMA

This document explains the solution implemented to address the mixed content issue when accessing the SIPOMA application over HTTPS while the backend server uses HTTP.

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

2. **Access the site via HTTP directly**:
   - Use http://www.sipoma.site instead of https://www.sipoma.site

## Long-term Solutions

For a more permanent solution, consider:

1. Adding SSL/TLS to the PocketBase server
2. Setting up a reverse proxy with SSL termination in front of PocketBase
3. Creating a serverless function on Vercel that proxies requests to the backend

## Notes for Developers

- The system auto-detects protocol issues and tries to fall back to HTTP when needed
- The connection monitor checks connection health periodically
- Events are used to notify components about connection changes
