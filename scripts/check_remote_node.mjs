import { Client } from 'ssh2';

const SSH_CONFIG = {
  host: '141.11.25.69',
  port: 22,
  username: 'root',
  password: 'makassar@270989',
};

const conn = new Client();
conn
  .on('ready', () => {
    console.log('Connected via SSH. Checking Node.js version...');
    conn.exec('node -v && npm -v', (err, stream) => {
      if (err) throw err;
      stream
        .on('data', (data) => {
          console.log('Node/NPM Version:', data.toString().trim());
        })
        .on('close', () => {
          console.log('Check finished.');
          conn.end();
        });
    });
  })
  .on('error', (err) => {
    console.error('Connection failed:', err);
  })
  .connect(SSH_CONFIG);
