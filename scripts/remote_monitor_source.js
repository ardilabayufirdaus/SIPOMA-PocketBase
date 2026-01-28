const https = require('https');
const os = require('os');

// CONFIG
const CONFIG = {
  pbUrl: 'api.sipoma.site',
  pbEmail: 'ardila.firdaus@sig.id',
  pbPassword: 'makassar@270989',
  collection: 'system_status',
  recordId: 'monitor_srv_001',
  interval: 1000,
};

let token = '';
let prevCpus = os.cpus();

// 1. AUTHENTICATION
function login(cb) {
  const data = JSON.stringify({
    identity: CONFIG.pbEmail,
    password: CONFIG.pbPassword,
  });

  const options = {
    hostname: CONFIG.pbUrl,
    port: 443,
    path: '/api/admins/auth-with-password',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (d) => (body += d));
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const json = JSON.parse(body);
          token = json.token;
          console.log('Login successful');
          if (cb) cb();
        } catch (e) {
          console.error('Login parse error', e);
        }
      } else {
        console.error('Admin Login failed', res.statusCode);
        loginAsUser(cb);
      }
    });
  });

  req.on('error', (e) => console.error('Login Request Error', e));
  req.write(data);
  req.end();
}

function loginAsUser(cb) {
  const data = JSON.stringify({
    identity: CONFIG.pbEmail,
    password: CONFIG.pbPassword,
  });

  const options = {
    hostname: CONFIG.pbUrl,
    port: 443,
    path: '/api/collections/users/auth-with-password',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (d) => (body += d));
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const json = JSON.parse(body);
          token = json.token;
          console.log('User Login successful');
          if (cb) cb();
        } catch (e) {
          console.error(e);
        }
      } else {
        console.error('All Login methods failed', res.statusCode);
      }
    });
  });
  req.on('error', (e) => console.error(e));
  req.write(data);
  req.end();
}

// 2. GET SYSTEM STATS (Native OS Module)
function getStats() {
  // CPU Calculation
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  for (let i = 0; i < cpus.length; i++) {
    const cpu = cpus[i];
    const prev = prevCpus[i];

    // If CPU counts change (hotplug?), reset. rare.
    if (!prev) {
      prevCpus = cpus;
      return { cpu: 0, mem: 0 };
    }

    for (let type in cpu.times) {
      totalTick += cpu.times[type] - prev.times[type];
    }
    totalIdle += cpu.times.idle - prev.times.idle;
  }

  prevCpus = cpus;

  const cpuUsage = totalTick > 0 ? ((totalTick - totalIdle) / totalTick) * 100 : 0;

  // Memory Calculation
  const totalMem = os.totalmem();
  const freeMem = os.freemem(); // Free memory
  const memUsage = ((totalMem - freeMem) / totalMem) * 100;

  return {
    cpu: Math.max(0, Math.min(100, Math.round(cpuUsage * 10) / 10)),
    mem: Math.max(0, Math.min(100, Math.round(memUsage * 10) / 10)),
    uptime: os.uptime(),
  };
}

// 3. UPDATE POCKETBASE
function sendUpdate(stats) {
  if (!token) {
    return login(() => sendUpdate(stats));
  }

  const data = JSON.stringify({
    cpu_load: stats.cpu,
    memory_usage: stats.mem,
    uptime: stats.uptime,
    last_updated: new Date().toISOString(),
    is_online: true,
  });

  const options = {
    hostname: CONFIG.pbUrl,
    port: 443,
    path: `/api/collections/${CONFIG.collection}/records/${CONFIG.recordId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      Authorization: token, // Standard header
    },
  };

  const req = https.request(options, (res) => {
    if (res.statusCode === 404) {
      console.log('Record not found (404). Creating...');
      createRecord(data);
    } else if (res.statusCode === 401 || res.statusCode === 403) {
      console.log('Token expired. Re-logging...');
      token = '';
    } else if (res.statusCode >= 400) {
      console.error('Update Error:', res.statusCode);
    }
    res.on('data', () => {}); // Consume
  });

  req.on('error', (e) => console.error('Update Request Error', e));
  req.write(data);
  req.end();
}

function createRecord(jsonData) {
  const payloadObj = JSON.parse(jsonData);
  payloadObj.id = CONFIG.recordId;
  const data = JSON.stringify(payloadObj);

  const options = {
    hostname: CONFIG.pbUrl,
    port: 443,
    path: `/api/collections/${CONFIG.collection}/records`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      Authorization: token,
    },
  };

  const req = https.request(options, (res) => {
    res.on('data', () => {});
    res.on('end', () => console.log('Create attempted:', res.statusCode));
  });
  req.on('error', console.error);
  req.write(data);
  req.end();
}

// MAIN LOOP
console.log('Starting SIPOMA Native Monitor...');
console.log(`Node ${process.version}, Platform ${process.platform}`);

function loop() {
  try {
    const stats = getStats();
    // Only log occasionally or if verbose? console.log fills up logs.
    // console.log(`Stats: CPU ${stats.cpu}%, Mem ${stats.mem}%`);
    sendUpdate(stats);
  } catch (err) {
    console.error('Loop Error:', err);
  }
}

// Start
login(() => {
  loop();
  setInterval(loop, CONFIG.interval);
});
