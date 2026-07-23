#!/bin/bash

# ==========================================
# SIPOMA-PocketBase INTERNAL DEPLOY (WiFi/LAN)
# ==========================================

SERVER_USER="ardilabayufirdaus"
SERVER_IP="172.18.6.98" 
SERVER_PATH="~/project/sipoma-pocketbase"
SOURCE_PATH="/home/ardilabayufirdaus/Repository Github/SIPOMA-PocketBase"

echo "🚀 [INTERNAL] Deploy SIPOMA-PocketBase dari $SOURCE_PATH..."

# Sync source code
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude 'pb_data' \
    "$SOURCE_PATH/" $SERVER_USER@$SERVER_IP:$SERVER_PATH/

if [ $? -eq 0 ]; then
    echo "✅ Sinkronisasi Berhasil!"
else
    echo "❌ Sinkronisasi Gagal!"
    exit 1
fi

echo "🛠️ Build & Restart di Server..."
ssh -t $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && npm ci && npm run build && pm2 restart sipoma-pocketbase || systemctl restart sipoma-monitor"

echo "===================================================="
echo "🎉 DEPLOY SIPOMA-PocketBase SELESAI!"
echo "Akses: https://db.sipoma.online atau SIPOMA app"
echo "===================================================="