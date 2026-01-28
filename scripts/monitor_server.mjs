import { Client } from 'ssh2';
import PocketBase from 'pocketbase';
import 'dotenv/config'; // Loads .env file if available

// CONFIGURATION
const SSH_CONFIG = {
  host: '141.11.25.69',
  port: 22,
  username: 'root',
  password: 'makassar@270989',
};

const PB_URL = process.env.VITE_POCKETBASE_URL || 'https://api.sipoma.site';
const PB_EMAIL = process.env.PB_EMAIL || 'ardila.firdaus@sig.id';
const PB_PASSWORD = process.env.PB_PASSWORD || 'makassar@270989';

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

const STATUS_COLLECTION = 'system_status';
const RECORD_ID = 'monitor_srv_001';

async function getRemoteStats() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .on('ready', () => {
        // Adjusted command for better compatibility
        // top -bn1 might output head info differently. We grab whole output.
        conn.exec('top -bn1 && echo "---SPLIT---" && free -m', (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }
          let output = '';
          stream
            .on('data', (data) => {
              output += data;
            })
            .on('close', () => {
              conn.end();
              resolve(parseStats(output));
            });
        });
      })
      .on('error', (err) => catchError(err, reject))
      .connect(SSH_CONFIG);
  });
}

function catchError(err, reject) {
  console.error('SSH Connection Error:', err);
  reject(err);
}

function parseStats(output) {
  console.log('--- RAW OUTPUT START ---');
  console.log(output);
  console.log('--- RAW OUTPUT END ---');

  try {
    const lines = output.split('\n');
    let cpu = 0;
    let memory = 0;

    // Parse CPU
    // Common pattern: %Cpu(s): 10.5 us,  3.2 sy
    const cpuLine = lines.find((l) => l.toLowerCase().includes('cpu(s)'));
    if (cpuLine) {
      // Try multiple regex patterns since output varies by locale/version
      // Pattern 1: x.x id
      const idMatch = cpuLine.match(/([\d\.,]+)\s*id/);
      if (idMatch) {
        // Replace comma with dot if locale is non-US
        const idle = parseFloat(idMatch[1].replace(',', '.'));
        if (!isNaN(idle)) cpu = 100 - idle;
      }
    }

    // Parse Memory
    // Mem: 1000 total, 500 used...
    const memLine = lines.find((l) => l.toLowerCase().startsWith('mem:') || l.includes('Mem:'));
    if (memLine) {
      const parts = memLine.split(/\s+/).filter(Boolean);
      // Usually: Mem: total used free shared buff/cache available
      // Index:    0     1    2    3     4       5         6
      // But numeric values start at index 1

      const total = parseFloat(parts[1]);
      const used = parseFloat(parts[2]);

      // Try to find available column (often last one or 6th index)
      const available = parseFloat(parts[parts.length - 1]);

      if (total > 0) {
        if (!isNaN(available) && available < total) {
          memory = ((total - available) / total) * 100;
        } else {
          memory = (used / total) * 100;
        }
      }
    }

    return { cpu: Math.round(cpu * 10) / 10, memory: Math.round(memory * 10) / 10 };
  } catch (e) {
    console.error('Parse error:', e);
    return { cpu: 0, memory: 0 };
  }
}

async function updateStats() {
  try {
    console.log(`[${new Date().toISOString()}] Connecting to ${SSH_CONFIG.host}...`);
    const stats = await getRemoteStats();
    console.log(`Stats parsed: CPU ${stats.cpu}%, Mem ${stats.memory}%`);

    // Ensure Auth as ADMIN (because updating system status usually requires high privs)
    if (!pb.authStore.isValid) {
      try {
        // Try authenticating as admin first
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
      } catch (e) {
        console.log('Admin auth failed, trying collection auth...');
        // Fallback to record auth if user table contains this email
        try {
          await pb.collection('users').authWithPassword(PB_EMAIL, PB_PASSWORD);
        } catch (e2) {
          console.error('All auth methods failed.');
          throw e2;
        }
      }
    }

    const data = {
      cpu_load: stats.cpu,
      memory_usage: stats.memory,
      last_updated: new Date().toISOString(),
      is_online: true,
    };

    try {
      await pb.collection(STATUS_COLLECTION).update(RECORD_ID, data);
      console.log('PB Update Success');
    } catch (e) {
      if (e.status === 404) {
        console.log('Record not found, creating...');
        // If ID is custom text, we set it. If UUID required, let PB generate or use 15 chars.
        // PocketBase IDs are 15 chars alphanumeric. 'monitor_server_01' is 17 chars, too long.
        // Let's use a valid ID length: 'monitor_srv_001'

        const VALID_ID = 'monitor_srv_001';

        await pb.collection(STATUS_COLLECTION).create({
          id: VALID_ID,
          ...data,
        });
        console.log('PB Create Success with ID:', VALID_ID);
      } else {
        console.error('PB Update Error:', e.message, e.data);
      }
    }
  } catch (err) {
    console.error('Monitor Error:', err.message);
  }
}

// Run immediately then interval
updateStats();
setInterval(updateStats, 10000);
