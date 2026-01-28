import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

// CONFIG
const SSH_CONFIG = {
  host: '141.11.25.69',
  port: 22,
  username: 'root',
  password: 'makassar@270989',
};

const LOCAL_SCRIPT = path.resolve('scripts/remote_monitor_source.js');
const REMOTE_PATH = '/root/sipoma_monitor.js';

const conn = new Client();

conn
  .on('ready', () => {
    console.log('Connected via SSH.');

    // 1. Upload File
    conn.sftp((err, sftp) => {
      if (err) throw err;

      console.log(`Uploading ${LOCAL_SCRIPT} to ${REMOTE_PATH}...`);
      sftp.fastPut(LOCAL_SCRIPT, REMOTE_PATH, (err) => {
        if (err) throw err;
        console.log('Upload successful.');

        // 2. Restart Process (Simple Kill + Nohup way for now)
        // Check if running
        console.log('Restarting monitor process...');
        conn.exec(
          `pkill -f sipoma_monitor.js; nohup node ${REMOTE_PATH} > /root/sipoma_monitor.log 2>&1 &`,
          (err, stream) => {
            if (err) throw err;
            stream
              .on('close', (code, signal) => {
                console.log('Monitor started in background.');
                conn.end();
              })
              .resume(); // consume stream to allow close
          }
        );
      });
    });
  })
  .on('error', (err) => {
    console.error('SSH Error:', err);
  })
  .connect(SSH_CONFIG);
