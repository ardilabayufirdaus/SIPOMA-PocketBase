#!/bin/bash

# PocketBase HTTPS Setup Script
# This script helps configure HTTPS for PocketBase server

echo "=== PocketBase HTTPS Setup ==="
echo "This script will help you configure HTTPS for your PocketBase server"
echo ""

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   echo "Please do not run this script as root. Use a regular user with sudo access."
   exit 1
fi

# Update system packages
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "Installing required packages..."
sudo apt install -y nginx certbot python3-certbot-nginx ufw

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Install PocketBase if not already installed
if ! command -v pocketbase &> /dev/null; then
    echo "Installing PocketBase..."
    # Download latest PocketBase
    wget https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_linux_amd64.zip
    unzip pocketbase_linux_amd64.zip
    sudo mv pocketbase /usr/local/bin/
    rm pocketbase_linux_amd64.zip
fi

# Create PocketBase service user
sudo useradd -r -s /bin/false pocketbase

# Create directories
sudo mkdir -p /opt/pocketbase
sudo mkdir -p /var/lib/pocketbase
sudo chown pocketbase:pocketbase /opt/pocketbase
sudo chown pocketbase:pocketbase /var/lib/pocketbase

# Create systemd service
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
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Configure Nginx as reverse proxy
cat << EOF | sudo tee /etc/nginx/sites-available/pocketbase
server {
    listen 80;
    server_name 141.11.25.69;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Cache static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/pocketbase /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Start services
echo "Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable pocketbase
sudo systemctl start pocketbase
sudo systemctl enable nginx
sudo systemctl start nginx

# Get SSL certificate
echo "Obtaining SSL certificate..."
# Note: You'll need a domain name for Let's Encrypt
# For IP address, you'll need to use a self-signed certificate or commercial SSL

echo ""
echo "=== HTTPS Setup Complete ==="
echo "Your PocketBase server is now running with HTTPS through Nginx reverse proxy"
echo ""
echo "If you have a domain name, run:"
echo "sudo certbot --nginx -d yourdomain.com"
echo ""
echo "For IP address access, you may need to configure your firewall or use a VPN"
echo ""
echo "PocketBase is accessible at: https://141.11.25.69"
echo "Admin panel: https://141.11.25.69/_/"
echo ""
echo "Make sure to update your frontend to use: https://141.11.25.69"</content>
<parameter name="filePath">d:\Repository Github\sipoma-ver-2\sipoma-versi-2\pocketbase-https-setup.sh
