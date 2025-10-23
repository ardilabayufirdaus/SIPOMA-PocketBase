#!/bin/bash

# Simple Caddy Setup for PocketBase HTTPS
echo "=== Setting up Caddy for PocketBase HTTPS ==="

# Install Caddy
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy -y

# Copy Caddyfile
sudo cp Caddyfile /etc/caddy/Caddyfile

# Start PocketBase (assuming it's already installed)
# If not installed, download and install PocketBase first
if ! command -v pocketbase &> /dev/null; then
    echo "Installing PocketBase..."
    wget https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_linux_amd64.zip
    unzip pocketbase_linux_amd64.zip
    sudo mv pocketbase /usr/local/bin/
    sudo useradd -r -s /bin/false pocketbase
    sudo mkdir -p /opt/pocketbase /var/lib/pocketbase
    sudo chown pocketbase:pocketbase /opt/pocketbase /var/lib/pocketbase
fi

# Create systemd service for PocketBase
cat << EOF | sudo tee /etc/systemd/system/pocketbase.service
[Unit]
Description=PocketBase
After=network.target

[Service]
Type=simple
User=pocketbase
WorkingDirectory=/opt/pocketbase
ExecStart=/usr/local/bin/pocketbase serve --http=127.0.0.1:8090 --dir=/var/lib/pocketbase
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start services
sudo systemctl daemon-reload
sudo systemctl enable pocketbase
sudo systemctl start pocketbase
sudo systemctl enable caddy
sudo systemctl start caddy

echo ""
echo "=== Setup Complete ==="
echo "PocketBase is now accessible at: https://141.11.25.69"
echo "Caddy will automatically obtain and renew SSL certificates"
echo ""
echo "Update your frontend to use: https://141.11.25.69"</content>
<parameter name="filePath">d:\Repository Github\sipoma-ver-2\sipoma-versi-2\setup-caddy-https.sh