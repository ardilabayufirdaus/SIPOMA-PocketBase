import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const SSH_CONFIG = {
  host: '172.18.80.101',
  port: 2222,
  username: 'ardilabayufirdaus',
  password: '270989',
};

const conn = new Client();

function runRemoteCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`\n⚙️ Executing on server: ${command}`);
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream
        .on('close', (code, signal) => {
          console.log(`[Exit Code ${code}]`);
          resolve({ code, stdout, stderr });
        })
        .on('data', (data) => {
          stdout += data;
          process.stdout.write(data);
        })
        .stderr.on('data', (data) => {
          stderr += data;
          process.stderr.write(data);
        });
    });
  });
}

async function uploadDir(sftp, localDir, remoteDir) {
  const entries = fs.readdirSync(localDir, { withFileTypes: true });
  
  // ensure remote dir exists
  try {
    await new Promise((resolve) => sftp.mkdir(remoteDir, () => resolve()));
  } catch (e) {
    // Ignore if exists
  }

  for (const entry of entries) {
    const localPath = path.join(localDir, entry.name);
    const remotePath = `${remoteDir}/${entry.name}`;

    if (entry.isDirectory()) {
      await uploadDir(sftp, localPath, remotePath);
    } else {
      await new Promise((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, (err) => {
          if (err) {
            console.error(`❌ Failed to upload ${entry.name}:`, err.message);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }
}

conn.on('ready', async () => {
  console.log('✅ Connected via SSH to 172.18.6.98');

  try {
    // 1. Check server environment & current path
    const envCheck = await runRemoteCommand('pwd; ls -la project/ || true');
    
    // Check if git pull is needed on server repo
    await runRemoteCommand('if [ -d "$HOME/project/sipoma-pocketbase" ]; then cd $HOME/project/sipoma-pocketbase && git fetch origin main && git reset --hard origin/main && git log -n 1 --oneline; fi');

    // 2. Upload local dist folder to server
    console.log('\n📦 Uploading local dist/ to server...');
    const localDistPath = path.resolve('dist');
    const remoteDistPath = '/home/ardilabayufirdaus/project/sipoma-pocketbase/dist';

    await new Promise((resolve, reject) => {
      conn.sftp(async (err, sftp) => {
        if (err) return reject(err);
        try {
          await uploadDir(sftp, localDistPath, remoteDistPath);
          console.log('✅ dist/ uploaded successfully.');
          resolve();
        } catch (uploadErr) {
          reject(uploadErr);
        }
      });
    });

    // 3. Restart PM2 / services if active
    console.log('\n🔄 Restarting services on server...');
    await runRemoteCommand('pm2 restart all || pm2 list || true');

    console.log('\n🎉 Deployment completed successfully!');
  } catch (error) {
    console.error('❌ Deployment error:', error);
  } finally {
    conn.end();
  }
}).on('error', (err) => {
  console.error('❌ SSH Connection Error:', err);
}).connect(SSH_CONFIG);
