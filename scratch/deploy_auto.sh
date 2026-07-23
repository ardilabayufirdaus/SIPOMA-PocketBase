#!/bin/bash
export SSHPASS="270989"

# ==========================================
# SCRIPT DEPLOY EKSTERNAL (Internet Luar)
# ==========================================
# Arsitektur Ultra-Safe - v3.0 (Matikan Service Selama Deploy)
# ==========================================

SERVER_USER="ardilabayufirdaus"
SSH_HOST="ssh.sipoma.online"
SERVER_PATH="~/project/sipoma-app"
SOURCE_PATH="/home/ardilabayufirdaus/Repository Github/SIPOMA-PocketBase"
PROXY_CMD="cloudflared access ssh --hostname ssh.sipoma.online"
PASSWORD="270989" # Masukkan password sudo Anda di sini

echo "🛑 [ULTRA-SAFE] Menghentikan Seluruh Service (PocketBase & Monitor) di Server..."
sshpass -e ssh -o ProxyCommand="$PROXY_CMD" $SERVER_USER@$SSH_HOST "echo '$PASSWORD' | sudo -S systemctl stop pocketbase sipoma-monitor"

if [ $? -eq 0 ]; then
    echo "✅ Semua Service Dimatikan. Memulai Snapshot Database..."
    sshpass -e ssh -o ProxyCommand="$PROXY_CMD" $SERVER_USER@$SSH_HOST "mkdir -p ~/pb/pb_data/backups_manual && cp ~/pb/pb_data/data.db ~/pb/pb_data/backups_manual/ultra_safe_snap_\$(date +%Y%m%d_%H%M%S).db"
else
    echo "❌ Gagal menghentikan service. Proses dibatalkan demi keamanan!"
    exit 1
fi

echo "🚀 [EKSTERNAL] Memulai Sinkronisasi via Cloudflare dari $SOURCE_PATH..."
sshpass -e rsync -avz --delete \
    -e "sshpass -e ssh -o ProxyCommand='$PROXY_CMD'" \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude '.env' \
    --exclude 'pb_data' \
    "$SOURCE_PATH/" $SERVER_USER@$SSH_HOST:$SERVER_PATH/

if [ $? -eq 0 ]; then
    echo "✅ Sinkronisasi Berhasil!"
else
    echo "❌ Sinkronisasi Gagal. Memulihkan Service..."
    sshpass -e ssh -o ProxyCommand="$PROXY_CMD" $SERVER_USER@$SSH_HOST "echo '$PASSWORD' | sudo -S systemctl start pocketbase sipoma-monitor"
    exit 1
fi

echo "🛠️  Memasak (Build) Aset di Server (Aplikasi dalam kondisi OFF)..."
sshpass -e ssh -o ProxyCommand="$PROXY_CMD" $SERVER_USER@$SSH_HOST "cd $SERVER_PATH && npm install && npm run build"

if [ $? -eq 0 ]; then
    echo "✅ Build Berhasil! Mengaktifkan Kembali Seluruh Service..."
else
    echo "⚠️  Build Gagal (Mungkin ada error di kode)! Mengaktifkan Service untuk tetap melayani API..."
fi

sshpass -e ssh -o ProxyCommand="$PROXY_CMD" $SERVER_USER@$SSH_HOST "echo '$PASSWORD' | sudo -S systemctl start pocketbase sipoma-monitor"

echo "===================================================="
echo "🎉 DEPLOY ULTRA-SAFE SELESAI!"
echo "Akses: https://sipoma.online"
echo "===================================================="
