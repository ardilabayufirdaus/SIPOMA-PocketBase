# PocketBase Admin Panel Configuration Guide

## Mengakses Admin Panel

1. Buka browser: `https://141.11.25.69/_/` (atau `http://141.11.25.69:8090/_/`)
2. Login dengan akun admin yang sudah dibuat

## Konfigurasi CORS (Cross-Origin Resource Sharing)

### Melalui Admin Panel:

1. Masuk ke Admin Panel
2. Pergi ke **Settings** → **API**
3. Pada bagian **CORS**, enable CORS
4. Tambahkan origins yang diizinkan:
   - `http://localhost:3000` (development)
   - `http://localhost:5173` (development)
   - `https://www.sipoma.site` (production)
   - `https://sipoma.site` (production)

### Atau melalui API:

```bash
curl -X PATCH https://141.11.25.69/api/settings \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cors": {
      "enabled": true,
      "origins": [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://www.sipoma.site",
        "https://sipoma.site"
      ],
      "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      "headers": ["*"]
    }
  }'
```

## Konfigurasi Domain dan URL

### Melalui Admin Panel:

1. **Settings** → **General**
2. Set **Site URL**: `https://141.11.25.69`
3. Set **Meta Site URL**: `https://141.11.25.69`

## Konfigurasi Email (Opsional)

### Untuk fitur reset password dan notifikasi:

1. **Settings** → **Mail**
2. Konfigurasi SMTP server
3. Atau gunakan layanan seperti SendGrid, Mailgun, dll.

## Konfigurasi Backup

### Otomatis backup database:

1. **Settings** → **Backups**
2. Enable auto backup
3. Set schedule (misalnya: setiap hari jam 2 pagi)

## Monitoring Logs

### Melihat logs aplikasi:

1. **Settings** → **Logs**
2. Monitor error dan aktivitas sistem

## Tips Keamanan

1. **Ganti password admin** secara berkala
2. **Enable 2FA** untuk admin account
3. **Backup database** secara teratur
4. **Monitor logs** untuk aktivitas mencurigakan
5. **Update PocketBase** ke versi terbaru

## Troubleshooting

### Jika tidak bisa akses admin panel:

- Pastikan PocketBase service sedang berjalan: `sudo systemctl status pocketbase`
- Cek logs: `sudo journalctl -u pocketbase -f`
- Verifikasi URL dan port yang benar

### Jika CORS error masih muncul:

- Pastikan origins sudah ditambahkan dengan benar
- Restart PocketBase service setelah perubahan
- Clear browser cache

### Jika HTTPS tidak berfungsi:

- Pastikan certificate dan key file ada dan memiliki permission yang benar
- Cek logs untuk error SSL/TLS
- Pastikan port 443 tidak digunakan aplikasi lain
