import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// CONFIG
const SSH_CONFIG = {
  host: '141.11.25.69',
  port: 22,
  username: 'root',
  password: 'makassar@270989',
};

const REMOTE_DIR = '/opt/sipoma-monitor';
const SERVICE_NAME = 'sipoma-monitor';
const LOCAL_SOURCE_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'remote_monitor_source.js'
);

async function deploy() {
  console.log('🚀 Starting Deployment to ' + SSH_CONFIG.host);

  // 1. Read Source Code
  if (!fs.existsSync(LOCAL_SOURCE_FILE)) {
    console.error('❌ Source file not found:', LOCAL_SOURCE_FILE);
    process.exit(1);
  }
  const sourceCode = fs.readFileSync(LOCAL_SOURCE_FILE, 'utf8');

  // 2. Connect SSH
  const conn = new Client();

  await new Promise((resolve, reject) => {
    conn.on('ready', resolve).on('error', reject).connect(SSH_CONFIG);
  });
  console.log('✅ SSH Connected');

  try {
    // 3. Check for Node.js
    const nodeVer = await execCommand(conn, 'node -v');
    console.log('ℹ️  Node Version on Server:', nodeVer.trim() || 'Not Found');

    if (!nodeVer.includes('v')) {
      console.log('⚠️  Node.js not detected. Attempting to install (Ubuntu/Debian)...');
      await execCommand(
        conn,
        'curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs'
      );
    }

    // 4. Create Directory
    await execCommand(conn, `mkdir -p ${REMOTE_DIR}`);
    console.log('✅ Directory Created');

    // 5. Upload File
    // We use a simple echo/cat method to avoid setting up SFTP logic for one file,
    // but SFTP is safer for special chars. Let's use sftp.
    await new Promise((resolve, reject) => {
      conn.sftp((err, sftp) => {
        if (err) return reject(err);
        const remotePath = `${REMOTE_DIR}/monitor.js`;
        const writeStream = sftp.createWriteStream(remotePath);
        writeStream.on('close', () => {
          console.log('✅ File Uploaded to', remotePath);
          sftp.end();
          resolve();
        });
        writeStream.on('error', reject);
        writeStream.write(sourceCode);
        writeStream.end();
      });
    });

    // 6. Create Systemd Service
    const serviceFileContent = `[Unit]
Description=Sipoma System Monitor
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${REMOTE_DIR}
ExecStart=/usr/bin/env node ${REMOTE_DIR}/monitor.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
`;

    // Write service file
    await execCommand(
      conn,
      `echo "${serviceFileContent.replace(/"/g, '\\"')}" > /etc/systemd/system/${SERVICE_NAME}.service`
    );
    console.log('✅ Service File Created');

    // 7. Reload and Start
    await execCommand(conn, 'systemctl daemon-reload');
    await execCommand(conn, `systemctl enable ${SERVICE_NAME}`);
    await execCommand(conn, `systemctl restart ${SERVICE_NAME}`);

    console.log('✅ Service Started & Enabled');
    console.log('🎉 Deployment Complete! Monitor is running on server.');
  } catch (e) {
    console.error('❌ Deployment Failed:', e);
  } finally {
    conn.end();
  }
}

function execCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let output = '';
      stream.on('data', (d) => (output += d.toString()));
      stream.on('close', () => resolve(output));
    });
  });
}

deploy();
