#!/bin/bash

# Alternative: Use HTTP on port 443 (temporary solution)
echo "=== PocketBase HTTP on Port 443 Setup ==="

# Stop existing service
sudo systemctl stop pocketbase 2>/dev/null || true

# Update systemd service to use HTTP on port 443
cat << EOF | sudo tee /etc/systemd/system/pocketbase.service
[Unit]
Description=PocketBase Server
After=network.target

[Service]
Type=simple
User=pocketbase
WorkingDirectory=/opt/pocketbase
ExecStart=/usr/local/bin/pocketbase serve --http=0.0.0.0:443 --dir=/var/lib/pocketbase
Environment=POCKETBASE_ENCRYPTION_KEY=your-encryption-key-change-this-in-production
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Reload and start
sudo systemctl daemon-reload
sudo systemctl enable pocketbase
sudo systemctl start pocketbase

echo ""
echo "=== Setup Complete ==="
echo "PocketBase is now running on HTTP port 443"
echo "Admin panel: http://141.11.25.69:443/_/"
echo ""
echo "Note: This uses HTTP on port 443 - not true HTTPS"
echo "For proper HTTPS, we need to debug the SSL certificate issue"