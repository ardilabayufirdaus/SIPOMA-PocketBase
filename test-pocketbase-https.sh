#!/bin/bash

# Quick Test: Run PocketBase HTTPS as root (temporary)
echo "=== Testing PocketBase HTTPS as root ==="

# Stop existing service
sudo systemctl stop pocketbase 2>/dev/null || true
pkill -f "pocketbase serve" 2>/dev/null || true

# Create SSL cert if needed
sudo mkdir -p /etc/pocketbase/ssl
if [ ! -f /etc/pocketbase/ssl/cert.pem ]; then
    echo "Generating SSL certificate..."
    sudo openssl req -x509 -newkey rsa:4096 -keyout /etc/pocketbase/ssl/key.pem -out /etc/pocketbase/ssl/cert.pem -days 365 -nodes -subj "/C=ID/ST=Jakarta/L=Jakarta/O=SIPOMA/CN=141.11.25.69"
fi

# Test run as root
echo "Starting PocketBase HTTPS as root for testing..."
sudo /usr/local/bin/pocketbase serve --https=0.0.0.0:443 --dir=/var/lib/pocketbase --cert=/etc/pocketbase/ssl/cert.pem --key=/etc/pocketbase/ssl/key.pem &
sleep 5

# Check if it's running
if pgrep -f "pocketbase serve" > /dev/null; then
    echo "✅ PocketBase HTTPS started successfully"
    echo "Test the connection now, then press Ctrl+C to stop"

    # Wait for user to test
    trap 'echo "Stopping test..."; pkill -f "pocketbase serve"; exit 0' INT
    wait
else
    echo "❌ PocketBase HTTPS failed to start"
    echo "Check the error messages above"
fi