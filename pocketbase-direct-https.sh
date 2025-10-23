#!/bin/bash

# PocketBase Direct HTTPS Setup
echo "=== PocketBase Direct HTTPS Setup ==="

# Install PocketBase if not already installed
if ! command -v pocketbase &> /dev/null; then
    echo "Installing PocketBase..."
    wget https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_linux_amd64.zip
    unzip pocketbase_linux_amd64.zip
    chmod +x pocketbase
    sudo mv pocketbase /usr/local/bin/
fi

# Create PocketBase user and directories
sudo useradd -r -s /bin/false pocketbase 2>/dev/null || true
sudo mkdir -p /opt/pocketbase /var/lib/pocketbase
sudo chown pocketbase:pocketbase /opt/pocketbase /var/lib/pocketbase

# Create self-signed certificate for testing
echo "Creating self-signed SSL certificate..."
sudo mkdir -p /etc/pocketbase/ssl
sudo openssl req -x509 -newkey rsa:4096 -keyout /etc/pocketbase/ssl/key.pem -out /etc/pocketbase/ssl/cert.pem -days 365 -nodes -subj "/C=ID/ST=Jakarta/L=Jakarta/O=SIPOMA/CN=141.11.25.69"

# Set proper permissions
sudo chown pocketbase:pocketbase /etc/pocketbase/ssl/*.pem

# Create systemd service for HTTPS
cat << EOF | sudo tee /etc/systemd/system/pocketbase-https.service
[Unit]
Description=PocketBase HTTPS Server
After=network.target

[Service]
Type=simple
User=pocketbase
WorkingDirectory=/opt/pocketbase
ExecStart=/usr/local/bin/pocketbase serve --http=0.0.0.0:443 --https=0.0.0.0:443 --dir=/var/lib/pocketbase --encryptionEnv=POCKETBASE_ENCRYPTION_KEY --cert=/etc/pocketbase/ssl/cert.pem --key=/etc/pocketbase/ssl/key.pem
Environment=POCKETBASE_ENCRYPTION_KEY=your-encryption-key-here
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Stop existing PocketBase service if running
sudo systemctl stop pocketbase 2>/dev/null || true

# Start HTTPS service
sudo systemctl daemon-reload
sudo systemctl enable pocketbase-https
sudo systemctl start pocketbase-https

echo ""
echo "=== PocketBase HTTPS Setup Complete ==="
echo "PocketBase is now running on HTTPS port 443"
echo "Admin panel: https://141.11.25.69/_/"
echo ""
echo "Note: Using self-signed certificate - browsers will show security warning"
echo "For production, use Let's Encrypt or commercial SSL certificate"