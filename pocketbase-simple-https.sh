#!/bin/bash

# Simple PocketBase HTTPS Setup using built-in capabilities
echo "=== PocketBase Built-in HTTPS Setup ==="

# Stop existing PocketBase service
sudo systemctl stop pocketbase 2>/dev/null || true

# Create SSL directory
sudo mkdir -p /etc/pocketbase/ssl

# Generate self-signed certificate
echo "Generating self-signed SSL certificate..."
sudo openssl req -x509 -newkey rsa:4096 -keyout /etc/pocketbase/ssl/key.pem -out /etc/pocketbase/ssl/cert.pem -days 365 -nodes -subj "/C=ID/ST=Jakarta/L=Jakarta/O=SIPOMA/CN=141.11.25.69"

# Set permissions
sudo chown pocketbase:pocketbase /etc/pocketbase/ssl/*.pem 2>/dev/null || sudo chmod 600 /etc/pocketbase/ssl/*.pem

# Update systemd service to use HTTPS
cat << EOF | sudo tee /etc/systemd/system/pocketbase.service
[Unit]
Description=PocketBase Server
After=network.target

[Service]
Type=simple
User=pocketbase
WorkingDirectory=/opt/pocketbase
ExecStart=/usr/local/bin/pocketbase serve --https=0.0.0.0:443 --dir=/var/lib/pocketbase --cert=/etc/pocketbase/ssl/cert.pem --key=/etc/pocketbase/ssl/key.pem
Environment=POCKETBASE_ENCRYPTION_KEY=your-encryption-key-change-this-in-production
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable pocketbase
sudo systemctl start pocketbase

echo ""
echo "=== Setup Complete ==="
echo "PocketBase is now running on HTTPS port 443"
echo "Admin panel: https://141.11.25.69/_/"
echo ""
echo "Note: Using self-signed certificate - browsers will show security warning"
echo "For production use, get a proper SSL certificate from Let's Encrypt"