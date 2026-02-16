#!/bin/bash
echo "Installing Node.js..."
sudo apt-get update >/dev/null
sudo apt-get install -y nodejs npm >/dev/null 2>&1
echo "Node Version:"
nodejs -v || echo "nodejs not found"
echo "NPM Version:"
npm -v || echo "npm not found"
