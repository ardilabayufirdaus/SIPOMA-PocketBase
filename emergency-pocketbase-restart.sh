#!/bin/bash

# Emergency: Restart PocketBase on HTTP port 8090
echo "=== Emergency PocketBase HTTP Restart ==="

# Stop all pocketbase processes
sudo systemctl stop pocketbase 2>/dev/null || true
pkill -f "pocketbase serve" 2>/dev/null || true
sleep 2

# Create user if needed
if ! id -u pocketbase > /dev/null 2>&1; then
    sudo useradd -r -s /bin/false pocketbase 2>/dev/null || true
fi

# Create directories
sudo mkdir -p /var/lib/pocketbase
sudo chown pocketbase:pocketbase /var/lib/pocketbase 2>/dev/null || sudo chmod 755 /var/lib/pocketbase

# Update systemd service to use HTTP on port 8090
cat << EOF | sudo tee /etc/systemd/system/pocketbase.service
[Unit]
Description=PocketBase Server
After=network.target

[Service]
Type=simple
User=pocketbase
WorkingDirectory=/var/lib/pocketbase
ExecStart=/usr/local/bin/pocketbase serve --http=0.0.0.0:8090 --dir=/var/lib/pocketbase
Environment=POCKETBASE_ENCRYPTION_KEY=your-encryption-key-change-this-in-production
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start
sudo systemctl daemon-reload
sudo systemctl enable pocketbase
sudo systemctl start pocketbase

# Wait and check status
sleep 3
sudo systemctl status pocketbase --no-pager

echo ""
echo "=== PocketBase should now be running on HTTP port 8090 ==="