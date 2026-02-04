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
    console.log('Connected via SSH. Running monitor directly...');
    // Run for 10 seconds then kill
    const stream = conn.exec('node /opt/sipoma-monitor/monitor.js', (err, stream) => {
      if (err) throw err;
      stream
        .on('close', (code, signal) => {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          conn.end();
        })
        .on('data', (data) => {
          console.log('STDOUT: ' + data);
        })
        .stderr.on('data', (data) => {
          console.log('STDERR: ' + data);
        });
    });

    setTimeout(() => {
      console.log('Timeout reached, closing connection.');
      conn.end();
    }, 10000);
  })
  .on('error', (err) => {
    console.error('SSH Error:', err);
  })
  .connect(SSH_CONFIG);
