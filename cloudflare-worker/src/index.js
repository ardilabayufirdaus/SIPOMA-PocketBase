/**
 * Cloudflare Worker untuk proxy API PocketBase
 * Mengalihkan request dari HTTPS ke HTTP backend
 */

const POCKETBASE_HOST = 'http://141.11.25.69:8090';

export default {
  async fetch(request, _env, _ctx) {
    // Ambil path dari request
    const url = new URL(request.url);
    const path = url.pathname.replace('/api', ''); // Hapus /api prefix

    // Buat URL target ke PocketBase
    const targetUrl = `${POCKETBASE_HOST}${path}${url.search}`;

    // Siapkan headers untuk forward
    const headers = new Headers(request.headers);

    // Hapus headers yang tidak boleh di-forward
    headers.delete('host');
    headers.delete('cf-ray');
    headers.delete('cf-connecting-ip');
    headers.delete('cf-ipcountry');
    headers.delete('cf-visitor');

    // Set host header ke PocketBase
    headers.set('host', '141.11.25.69:8090');

    // Buat request baru ke PocketBase
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: 'manual',
    });

    try {
      // Kirim request ke PocketBase
      const response = await fetch(proxyRequest);

      // Siapkan response headers
      const responseHeaders = new Headers(response.headers);

      // Set CORS headers
      responseHeaders.set('Access-Control-Allow-Origin', 'https://www.sipoma.site');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      responseHeaders.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-PocketBase-Auth'
      );
      responseHeaders.set('Access-Control-Allow-Credentials', 'true');

      // Jika OPTIONS request, return CORS preflight response
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: responseHeaders,
        });
      }

      // Return response dari PocketBase
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      // Return error response
      return new Response(
        JSON.stringify({
          error: 'Proxy error',
          message: error.message,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://www.sipoma.site',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-PocketBase-Auth',
            'Access-Control-Allow-Credentials': 'true',
          },
        }
      );
    }
  },
};

