# Cloudflare Worker Proxy untuk SIPOMA

Worker ini bertindak sebagai proxy untuk mengakses PocketBase API dari situs HTTPS tanpa mixed content issues.

## Setup

1. Install Wrangler CLI:

```bash
npm install -g wrangler
```

2. Login ke Cloudflare:

```bash
wrangler auth login
```

3. Deploy worker:

```bash
cd cloudflare-worker
npm install
wrangler deploy
```

## Konfigurasi

Worker dikonfigurasi untuk merutekan request dari `sipoma.site/api/*` ke PocketBase di `http://141.11.25.69:8090/`.

## Testing

Setelah deploy, API bisa diakses melalui:

- `https://sipoma.site/api/collections/*`
- `https://sipoma.site/api/admins/auth-with-password`

Worker akan forward semua request ke backend HTTP dengan header CORS yang tepat.
