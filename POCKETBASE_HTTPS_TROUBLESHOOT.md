# Troubleshooting PocketBase HTTPS Setup

## Step 1: Check Service Status

```bash
sudo systemctl status pocketbase
```

## Step 2: Check Service Logs

```bash
sudo journalctl -u pocketbase -f
# Or for recent logs:
sudo journalctl -u pocketbase --since "1 hour ago"
```

## Step 3: Check if Port 443 is in Use

```bash
sudo netstat -tlnp | grep :443
# Or
sudo ss -tlnp | grep :443
```

## Step 4: Test Certificate Files

```bash
ls -la /etc/pocketbase/ssl/
sudo openssl x509 -in /etc/pocketbase/ssl/cert.pem -text -noout
```

## Step 5: Manual Test PocketBase HTTPS

```bash
# Stop service first
sudo systemctl stop pocketbase

# Try running manually
sudo -u pocketbase /usr/local/bin/pocketbase serve --https=0.0.0.0:443 --dir=/var/lib/pocketbase --cert=/etc/pocketbase/ssl/cert.pem --key=/etc/pocketbase/ssl/key.pem
```

## Step 6: Alternative - Use HTTP on Different Port

Jika HTTPS bermasalah, gunakan HTTP pada port 443 sementara:

```bash
# Edit service file
sudo nano /etc/systemd/system/pocketbase.service

# Change ExecStart to:
ExecStart=/usr/local/bin/pocketbase serve --http=0.0.0.0:443 --dir=/var/lib/pocketbase

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart pocketbase
```

## Step 7: Firewall Check

```bash
sudo ufw status
sudo ufw allow 443
```

## Common Issues:

1. **Certificate permission**: `sudo chown pocketbase:pocketbase /etc/pocketbase/ssl/*`
2. **Port already in use**: Kill process using port 443
3. **SSL certificate invalid**: Regenerate certificate
4. **PocketBase version**: Pastikan support HTTPS flag
