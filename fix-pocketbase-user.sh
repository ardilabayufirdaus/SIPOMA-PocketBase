#!/bin/bash

# Fix PocketBase User and Permissions
echo "=== Fixing PocketBase User and Permissions ==="

# Create pocketbase user if it doesn't exist
if ! id -u pocketbase > /dev/null 2>&1; then
    echo "Creating pocketbase user..."
    sudo useradd -r -s /bin/false pocketbase
else
    echo "PocketBase user already exists"
fi

# Create directories with correct permissions
echo "Setting up directories..."
sudo mkdir -p /opt/pocketbase /var/lib/pocketbase /etc/pocketbase/ssl
sudo chown pocketbase:pocketbase /opt/pocketbase /var/lib/pocketbase
sudo chown pocketbase:pocketbase /etc/pocketbase/ssl

# Generate SSL certificate if not exists
if [ ! -f /etc/pocketbase/ssl/cert.pem ]; then
    echo "Generating SSL certificate..."
    sudo openssl req -x509 -newkey rsa:4096 -keyout /etc/pocketbase/ssl/key.pem -out /etc/pocketbase/ssl/cert.pem -days 365 -nodes -subj "/C=ID/ST=Jakarta/L=Jakarta/O=SIPOMA/CN=141.11.25.69"
fi

# Set certificate permissions
sudo chown pocketbase:pocketbase /etc/pocketbase/ssl/*.pem
sudo chmod 600 /etc/pocketbase/ssl/*.pem

# Test manual run as pocketbase user
echo "Testing manual run..."
sudo -u pocketbase /usr/local/bin/pocketbase serve --https=0.0.0.0:443 --dir=/var/lib/pocketbase --cert=/etc/pocketbase/ssl/cert.pem --key=/etc/pocketbase/ssl/key.pem &
sleep 3

# Check if process is running
if pgrep -f "pocketbase serve" > /dev/null; then
    echo "✅ PocketBase started successfully on HTTPS"
    pkill -f "pocketbase serve"
else
    echo "❌ PocketBase failed to start"
fi

echo "=== User and permissions fixed ==="