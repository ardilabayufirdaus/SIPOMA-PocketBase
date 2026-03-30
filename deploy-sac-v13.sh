#!/bin/bash
# SAC V13.1 Full Deploy Script - ROG Server
# Run as rog user, input sudo password when prompted

set -e

echo "=== SAC V13.1 DEPLOY START ==="

# Install Node/npm/PM2
echo "Installing Node.js, npm, PM2..."
sudo apt update -qq
sudo apt install -y nodejs npm
sudo npm i -g pm2 -s

# Stop old service
echo "Stopping old systemd service..."
sudo systemctl stop sac-autonomous.service
sudo systemctl disable sac-autonomous.service

# PM2 cluster start
cd ~/ai-commander
pm2 kill  # Clean any old
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u rog --hp /home/rog

echo "=== PM2 STATUS ==="
pm2 status

echo "=== LOGS TAIL ==="
pm2 logs SAC-BRAIN-V13.1 --lines 10

echo "=== DEPLOY COMPLETE ==="
echo "Telegram /status for dashboard"
echo "pm2 monit for live monitor"