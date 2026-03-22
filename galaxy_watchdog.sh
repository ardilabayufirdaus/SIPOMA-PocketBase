#!/bin/bash
# GALAXY GOD V14.3 - SECURE WATCHDOG
# Script ringan yang menggantikan loop Python yang boros memori.

# LOAD CONFIG VIA JSON (V14.3)
CONFIG="/data/data/com.termux/files/home/config.json"
if [[ ! -f "$CONFIG" ]]; then
    exit 1
fi

TELEGRAM_TOKEN=$(grep -oP '"TELEGRAM_TOKEN":\s*"\K[^"]+' $CONFIG)
CHAT_ID=$(grep -oP '"CHAT_ID":\s*"\K[^"]+' $CONFIG)

function tg() {
    curl -s -4 -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
         -d chat_id="${CHAT_ID}" -d text="[WATCHDOG V14.3 - SECURE] $1" >/dev/null 2>&1
}

tg "Pembersihan total... Patroli Sinyal Aktif."
termux-wake-lock

while true; do
    # 1. Cek kesehatan Load Average
    LOAD=$(uptime | awk -F'load average:' '{ print $2 }' | awk '{ print $1 }' | tr -d ',')
    if [[ -n "$LOAD" ]] && (($(echo "$LOAD > 5.0" | bc -l 2>/dev/null || echo 0))); then
        tg "Load Tinggi (${LOAD}). Istirahat Paksa 3 Menit."
        sleep 300
        continue
    fi
    
    # 2. Matikan ADB lama
    pkill -9 -f adb 2>/dev/null
    sleep 2
    
    # 3. Jalankan Eksekusi Python (Single Instance Run - V14.3)
    # Python akan otomatis mencari PORT melalui Radar NMAP
    python3 ~/galaxy_run_once.py
    
    # 4. Istirahat Sehat (180 detik)
    sleep 180
done
