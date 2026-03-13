// --- SMART ALERTING SYSTEM FOR SIPOMA ---

const TELEGRAM_TOKEN = '8598640994:AAHRRdTwflTdRLblenMq8alxbL1zMcZwU90';
const TELEGRAM_CHAT_ID = '630051008';

function sendTelegram(message) {
  try {
    $os
      .cmd(
        'curl',
        '-s',
        '-X',
        'POST',
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
        '-d',
        `chat_id=${TELEGRAM_CHAT_ID}`,
        '-d',
        `text=${message}`
      )
      .run();
  } catch (e) {
    console.log('[Telegram Error] ' + e.message);
  }
}

// 1. System Health Check (Setiap 5 Menit)
cronAdd('systemHealthMonitor', '*/5 * * * *', () => {
  try {
    // Cek Suhu
    const tempBytes = $os.cmd('cat', '/sys/class/thermal/thermal_zone0/temp').output();
    const temp = parseInt(String.fromCharCode(...tempBytes).trim()) / 1000;

    if (temp > 75) {
      sendTelegram(
        `🔥 WARNING: Server Temperature High! Current: ${temp}°C. Please check server room.`
      );
    }

    // Cek Disk Usage
    const dfBytes = $os.cmd('df', '-h', '/').output();
    const dfStr = String.fromCharCode(...dfBytes);
    const match = dfStr.match(/(\d+)%/);
    if (match && parseInt(match[1]) > 85) {
      sendTelegram(`🚨 CRITICAL: Disk Usage High! current usage: ${match[0]}. Free up some space.`);
    }
  } catch (e) {
    console.log('[Health Monitor Error] ' + e.message);
  }
});

// 2. Operational OEE Alert (Setiap Jam)
cronAdd('oeeOperationalAlert', '0 * * * *', () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const summaries = $app
      .dao()
      .findRecordsByFilter('oee_daily_summary', `date >= "${dateStr} 00:00:00.000Z"`);

    summaries.forEach((s) => {
      const oee = s.getFloat('oee');
      const unit = s.get('unit');
      if (oee < 60 && oee > 0) {
        sendTelegram(
          `📉 ALERT: Low OEE detected for ${unit} on ${dateStr}. OEE: ${oee.toFixed(2)}%. Please review downtime logs.`
        );
      }
    });
  } catch (e) {
    console.log('[OEE Alert Error] ' + e.message);
  }
});

// 3. Security Alert - Brute Force Detection (Setiap 15 Menit)
// PocketBase logs are stored in logs.db
cronAdd('securityMonitor', '*/15 * * * *', () => {
  try {
    const logsDbPath = 'pb_data/logs.db';
    const sql = `SELECT count(*) as count FROM _logs WHERE json_extract(data,'$.status')=401 AND created > datetime('now', '-15 minutes');`;
    const resBytes = $os.cmd('sqlite3', logsDbPath, sql).output();
    const count = parseInt(String.fromCharCode(...resBytes).trim());

    if (count > 20) {
      sendTelegram(
        `🛡️ SECURITY: Unusual number of login failures (${count}) in the last 15 minutes. Potential brute force attempt.`
      );
    }
  } catch (e) {
    /* Ignore sql errors */
  }
});
