// --- SERVER STATS & HARDWARE HEALTH ---
routerAdd('GET', '/api/server/stats', (c) => {
  const record = c.get('authRecord');

  if (!record || record.id === '') {
    return c.json(403, { error: 'Forbidden - Authentication required' });
  }

  if (record.get('role') !== 'Super Admin') {
    return c.json(403, { error: 'Forbidden - Super Admin only' });
  }

  try {
    // CPU Load
    const loadBytes = $os.cmd('cat', '/proc/loadavg').output();
    const load = String.fromCharCode(...loadBytes);

    // Memory
    const memoryBytes = $os.cmd('free', '-m').output();
    const memory = String.fromCharCode(...memoryBytes);

    // Disk Usage
    const diskBytes = $os.cmd('df', '-h', '/').output();
    const disk = String.fromCharCode(...diskBytes);

    // Uptime
    const uptimeBytes = $os.cmd('uptime', '-p').output();
    const uptime = String.fromCharCode(...uptimeBytes);

    // CPU Temperature
    let temp = 'N/A';
    try {
      const tempBytes = $os.cmd('cat', '/sys/class/thermal/thermal_zone0/temp').output();
      const tempVal = parseInt(String.fromCharCode(...tempBytes).trim());
      if (!isNaN(tempVal)) {
        temp = (tempVal / 1000).toFixed(1) + '°C';
      }
    } catch (e) {
      /* Ignore */
    }

    // Battery Status
    let battery = 'AC Power';
    try {
      const capBytes = $os.cmd('cat', '/sys/class/power_supply/BAT0/capacity').output();
      const statusBytes = $os.cmd('cat', '/sys/class/power_supply/BAT0/status').output();
      const cap = String.fromCharCode(...capBytes).trim();
      const status = String.fromCharCode(...statusBytes).trim();
      if (cap && status) battery = `${cap}% (${status})`;
    } catch (e) {
      /* Ignore */
    }

    // --- NEW METRICS FOR DASHBOARD ENHANCEMENT ---

    // 1. Disk I/O (Read/Write bytes from /proc/diskstats)
    let diskIO = { read_bytes: 0, write_bytes: 0 };
    try {
      const diskStatsBytes = $os.cmd('cat', '/proc/diskstats').output();
      const diskStats = String.fromCharCode(...diskStatsBytes).split('\n');
      for (const line of diskStats) {
        const p = line.trim().split(/\s+/);
        if (
          p.length > 13 &&
          (p[2].indexOf('sda') === 0 ||
            p[2].indexOf('nvme0n1') === 0 ||
            p[2].indexOf('vda') === 0) &&
          !p[2].match(/\d$/)
        ) {
          diskIO.read_bytes += parseInt(p[5]) * 512;
          diskIO.write_bytes += parseInt(p[9]) * 512;
        }
      }
    } catch (e) {
      /* Ignore */
    }

    // 2. Top 3 Resource Hogs (Summary)
    let topProcesses = [];
    try {
      const topProcBytes = $os
        .cmd('bash', '-c', 'ps -eo comm,pcpu,pmem --sort=-pcpu | head -n 4')
        .output();
      const topProcLines = String.fromCharCode(...topProcBytes).split('\n');
      for (let i = 1; i < topProcLines.length; i++) {
        const parts = topProcLines[i].trim().split(/\s+/);
        if (parts.length >= 3) {
          topProcesses.push({
            name: parts[0],
            cpu: parseFloat(parts[1]),
            mem: parseFloat(parts[2]),
          });
        }
      }
    } catch (e) {
      /* Ignore */
    }

    // 3. Service Health Check
    let services = { internet: false, database: true, web: false };
    try {
      services.internet = true; // Placeholder to avoid hanging
    } catch (e) {}

    // Online Users Count (Real)
    let onlineUserCount = 0;
    try {
      const result = new DynamicModel({ count: 0 });
      $app.dao().db().newQuery('SELECT count(*) as count FROM user_online').one(result);
      onlineUserCount = result.count;
    } catch (e) {
      /* Ignore */
    }

    return c.json(200, {
      uptime: uptime.trim(),
      load: load.trim(),
      memory: memory.trim(),
      disk: disk.trim(),
      temp: temp,
      battery: battery,
      disk_io: diskIO,
      top_processes: topProcesses,
      services: services,
      user_online_count: onlineUserCount,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    return c.json(500, { error: e.message });
  }
});

// --- SYSTEM LOGS ---
routerAdd('GET', '/api/server/logs', (c) => {
  const record = c.get('authRecord');

  if (!record || record.id === '') return c.json(403, { error: 'Forbidden' });
  if (record.get('role') !== 'Super Admin') return c.json(403, { error: 'Super Admin only' });

  try {
    const logsBytes = $os.cmd('tail', '-n', '100', 'pb.log').output();
    const bytes = logsBytes;
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    return c.json(200, { content: str });
  } catch (e) {
    return c.json(500, { error: e.message });
  }
});

// --- BACKUP MANAGEMENT ---
routerAdd('GET', '/api/server/backups', (c) => {
  const record = c.get('authRecord');
  if (!record || record.get('role') !== 'Super Admin') return c.json(403, { error: 'Forbidden' });

  try {
    const cmdBytes = $os.cmd('ls', '-lh', '--time-style=+%Y-%m-%d %H:%M:%S').output();
    const output = String.fromCharCode.apply(null, cmdBytes);

    const backups = [];
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('.zip') && line.includes('pb_backup_')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 8) {
          backups.push({
            size: parts[4],
            date: parts[5] + ' ' + parts[6],
            name: parts[7],
          });
        }
      }
    }
    return c.json(200, { backups });
  } catch (e) {
    return c.json(500, { error: e.message });
  }
});

routerAdd('POST', '/api/server/backup', (c) => {
  const record = c.get('authRecord');
  if (!record || record.get('role') !== 'Super Admin') return c.json(403, { error: 'Forbidden' });

  try {
    const filename = `pb_backup_manual_${new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14)}.zip`;
    $os.cmd('zip', '-r', filename, 'pb_data').run();
    return c.json(200, { message: 'Backup started', filename });
  } catch (e) {
    return c.json(500, { error: e.message });
  }
});

// --- COMMAND RUNNER / TERMINAL ---
routerAdd('POST', '/api/server/cmd', (c) => {
  const record = c.get('authRecord');
  if (!record || record.get('role') !== 'Super Admin') return c.json(403, { error: 'Forbidden' });

  const data = new DynamicModel({ cmd: '' });
  c.bind(data);

  const cmd = data.cmd;

  if (!cmd) {
    return c.json(400, { error: 'Command (cmd) is required in JSON body' });
  }

  try {
    // Security check
    if (cmd.includes('rm ') || cmd.includes('mv ') || cmd.includes('dd ')) {
      return c.json(403, { error: 'Command not allowed for safety' });
    }

    const outputBytes = $os.cmd('bash', '-c', cmd).output();

    const bytes = outputBytes;
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
      str += String.fromCharCode(bytes[i]);
    }

    return c.json(200, { output: str });
  } catch (e) {
    return c.json(500, { error: e.message });
  }
});

// --- RESTART SERVICE ---
routerAdd('POST', '/api/server/restart', (c) => {
  const record = c.get('authRecord');
  if (!record || record.get('role') !== 'Super Admin') return c.json(403, { error: 'Forbidden' });

  try {
    $os.cmd('bash', '-c', 'sleep 2 && pkill -f pocketbase').start();
    return c.json(200, { message: 'Server restarting in 2 seconds...' });
  } catch (e) {
    return c.json(500, { error: e.message });
  }
});

// --- SOFT REBOOT ---
routerAdd('POST', '/api/server/soft-reboot', (c) => {
  const record = c.get('authRecord');
  if (!record || record.get('role') !== 'Super Admin') return c.json(403, { error: 'Forbidden' });

  try {
    $os.cmd('bash', '-c', "sleep 2 && echo '270989' | sudo -S systemctl soft-reboot").start();
    return c.json(200, { message: 'System soft-reboot initiated. Server will be back shortly.' });
  } catch (e) {
    return c.json(500, { error: e.message });
  }
});

// --- 1. NETWORK & TRAFFIC MONITOR ---
routerAdd('GET', '/api/server/network', (c) => {
  const record = c.get('authRecord');
  if (!record || record.get('role') !== 'Super Admin') return c.json(403, { error: 'Forbidden' });

  try {
    // Read /proc/net/dev for traffic stats
    const netBytes = $os.cmd('cat', '/proc/net/dev').output();
    const netStr = String.fromCharCode(...netBytes);

    const interfaces = [];
    const lines = netStr.split('\n');
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(/\s+/);
      const name = parts[0].replace(':', '');

      if (name !== 'lo') {
        interfaces.push({
          name: name,
          rx_bytes: parseInt(parts[1]),
          rx_packets: parseInt(parts[2]),
          tx_bytes: parseInt(parts[9]),
          tx_packets: parseInt(parts[10]),
        });
      }
    }

    // Active Connections Summary from /proc/net/sockstat
    const connBytes = $os.cmd('cat', '/proc/net/sockstat').output();
    const connStr = String.fromCharCode(...connBytes);

    let activeConns = 0;
    const connLines = connStr.split('\n');
    for (const l of connLines) {
      if (l.startsWith('TCP:')) {
        const parts = l.split(' ');
        activeConns = parseInt(parts[2]);
      }
    }

    return c.json(200, {
      interfaces: interfaces,
      active_connections: activeConns,
      ts: Date.now(),
    });
  } catch (e) {
    return c.json(500, { error: e.message });
  }
});

// --- 2. PROCESS MANAGER ---
routerAdd('GET', '/api/server/processes', (c) => {
  const record = c.get('authRecord');
  if (!record || record.get('role') !== 'Super Admin') return c.json(403, { error: 'Forbidden' });

  try {
    const cmdBytes = $os
      .cmd('bash', '-c', 'ps -eo pid,user,pcpu,pmem,time,comm --sort=-pcpu | head -n 16')
      .output();
    const output = String.fromCharCode(...cmdBytes);

    const processes = [];
    const lines = output.split('\n');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(/\s+/);
      if (parts.length >= 6) {
        processes.push({
          pid: parts[0],
          user: parts[1],
          cpu: parts[2],
          mem: parts[3],
          time: parts[4],
          name: parts.slice(5).join(' '),
        });
      }
    }

    return c.json(200, { processes });
  } catch (e) {
    return c.json(500, { error: e.message });
  }
});

routerAdd('POST', '/api/server/kill-process', (c) => {
  const record = c.get('authRecord');
  if (!record || record.get('role') !== 'Super Admin') return c.json(403, { error: 'Forbidden' });

  const data = new DynamicModel({ pid: '' });
  c.bind(data);
  const pid = data.pid;

  if (!pid) return c.json(400, { error: 'PID required' });

  try {
    $os.cmd('kill', '-9', pid).run();
    return c.json(200, { message: `Process ${pid} killed.` });
  } catch (e) {
    return c.json(500, { error: 'Failed to kill process: ' + e.message });
  }
});

// --- 3. SECURITY LOGS ---
routerAdd('GET', '/api/server/security', (c) => {
  const record = c.get('authRecord');
  if (!record || record.get('role') !== 'Super Admin') return c.json(403, { error: 'Forbidden' });

  try {
    const lastBytes = $os.cmd('last', '-n', '20').output();
    const lastStr = String.fromCharCode(...lastBytes);

    const logins = lastStr
      .split('\n')
      .filter((l) => l.trim().length > 0 && !l.startsWith('wtmp hangs'));

    return c.json(200, { logins: logins });
  } catch (e) {
    return c.json(500, { error: e.message });
  }
});

// --- 4. CRON JOBS ---
routerAdd('GET', '/api/server/cron', (c) => {
  const record = c.get('authRecord');
  if (!record || record.get('role') !== 'Super Admin') return c.json(403, { error: 'Forbidden' });

  try {
    const cronBytes = $os.cmd('crontab', '-l').output();
    const cronStr = String.fromCharCode(...cronBytes);
    return c.json(200, { content: cronStr });
  } catch (e) {
    return c.json(200, { content: '# No cron jobs found for current user.' });
  }
});

// --- 5. DATABASE TOOLS ---
routerAdd('POST', '/api/server/db-maintenance', (c) => {
  const record = c.get('authRecord');
  if (!record || record.get('role') !== 'Super Admin') return c.json(403, { error: 'Forbidden' });

  const data = new DynamicModel({ action: '' });
  c.bind(data);
  const action = data.action;

  try {
    if (action === 'vacuum') {
      $app.dao().db().newQuery('VACUUM').execute();
      return c.json(200, { message: 'Database VACUUM completed successfully.' });
    } else if (action === 'integrity') {
      const result = {};
      $app.dao().db().newQuery('PRAGMA integrity_check').one(result);
      return c.json(200, { message: 'Integrity Check Result: OK' });
    } else {
      return c.json(400, { error: 'Invalid action' });
    }
  } catch (e) {
    return c.json(500, { error: e.message });
  }
});

// --- 6. ADVANCED ANALYTICS (v2 - Query logs.db Langsung) ---
// PocketBase 0.22 menyimpan request log ke pb_data/logs.db (tabel _logs),
// bukan ke pb.log (yang hanya berisi startup messages).
// Field IP asli user ada di: json_extract(data, '$.userIp')
// Field status ada di: json_extract(data, '$.status')
routerAdd('GET', '/api/server/analytics', (c) => {
  const record = c.get('authRecord');
  if (!record || record.get('role') !== 'Super Admin') return c.json(403, { error: 'Forbidden' });

  try {
    const resultAttacks = [];
    const resultUsers = [];
    const wordCloud = {};
    const reboots = [];
    let diskInfo = { total: 0, used: 0, available: 0 };

    // Path ke logs.db (relatif dari working dir PocketBase = ~/pb/)
    const logsDbPath = 'pb_data/logs.db';

    // A. ATTACK MAP DATA - Query logs.db untuk request dengan status 400/401/403/429
    try {
      const sqlAttacks = `SELECT json_extract(data,'$.userIp') as ip, count(*) as cnt FROM _logs WHERE json_extract(data,'$.type')='request' AND json_extract(data,'$.status')>=400 AND json_extract(data,'$.userIp') IS NOT NULL AND json_extract(data,'$.userIp')!='' GROUP BY ip ORDER BY cnt DESC LIMIT 15;`;
      const attackBytes = $os.cmd('sqlite3', '-separator', '|', logsDbPath, sqlAttacks).output();
      const attackStr = String.fromCharCode(...attackBytes);
      const attackLines = attackStr.split('\n');
      for (const line of attackLines) {
        const parts = line.trim().split('|');
        if (parts.length >= 2 && parts[0].length > 6) {
          resultAttacks.push({ ip: parts[0], count: parseInt(parts[1]) || 1 });
        }
      }
    } catch (e) {
      /* Ignore */
    }

    // B. USER LOCATIONS - Ambil semua unique IP dari log (semua request yang ada userIp)
    //    Prioritaskan yang 2xx (sukses), tapi juga sertakan dari koneksi aktif TCP
    try {
      const userIpSet = {};

      // B1. Query IP dari semua request yang ada (unique IPs = users yang pernah akses)
      const sqlUsers = `SELECT DISTINCT json_extract(data,'$.userIp') as ip FROM _logs WHERE json_extract(data,'$.type')='request' AND json_extract(data,'$.userIp') IS NOT NULL AND json_extract(data,'$.userIp')!='' ORDER BY created DESC LIMIT 30;`;
      const userBytes = $os.cmd('sqlite3', '-separator', '|', logsDbPath, sqlUsers).output();
      const userStr = String.fromCharCode(...userBytes);
      const userLines = userStr.split('\n');
      for (const line of userLines) {
        const ip = line.trim();
        if (ip && ip.length > 6) {
          userIpSet[ip] = true;
        }
      }

      // B2. Tambahkan koneksi TCP aktif dari ss (realtime ke port 8090)
      try {
        const ssBytes = $os
          .cmd(
            'bash',
            '-c',
            "ss -tn state established '( dport = :8090 or sport = :8090 )' 2>/dev/null | awk 'NR>1 {print $5}' | sed 's/:[0-9]*$//' | tr -d '[]' | grep -v '^$' | grep -v '::1' | grep -v '127\\.' | sort -u"
          )
          .output();
        const ssStr = String.fromCharCode(...ssBytes);
        const ssIPs = ssStr.split('\n');
        for (const rawIP of ssIPs) {
          const ip = rawIP.trim().replace(/^::ffff:/, '');
          if (ip && ip.length > 6 && !ip.startsWith('127.') && ip !== '::1') {
            userIpSet[ip] = true;
          }
        }
      } catch (e) {
        /* Ignore */
      }

      const uniqueIPs = Object.keys(userIpSet).slice(0, 15);
      for (const ip of uniqueIPs) {
        resultUsers.push({ ip });
      }
    } catch (e) {
      /* Ignore */
    }

    // C. LOG ANALYSIS (Word Cloud) - dari logs.db messages
    try {
      const sqlWords = `SELECT message FROM _logs ORDER BY created DESC LIMIT 500;`;
      const wordsBytes = $os.cmd('sqlite3', logsDbPath, sqlWords).output();
      const logStrLower = String.fromCharCode(...wordsBytes).toLowerCase();
      const keywords = [
        'error',
        'failed',
        'timeout',
        'restart',
        'connected',
        'disconnect',
        'warning',
        'success',
        'create',
        'delete',
        'update',
        'slow',
      ];

      for (const word of keywords) {
        const regex = new RegExp(word, 'g');
        const count = (logStrLower.match(regex) || []).length;
        if (count > 0) wordCloud[word] = count;
      }
    } catch (e) {
      /* Ignore */
    }

    // D. UPTIME HISTORY (Last reboots)
    try {
      const lastBytes = $os.cmd('last', 'reboot', '-n', '10').output();
      const lastStr = String.fromCharCode(...lastBytes);
      const lines = lastStr.split('\n');
      for (const line of lines) {
        if (line.includes('reboot')) {
          reboots.push(line);
        }
      }
    } catch (e) {
      /* Ignore */
    }

    // E. CAPACITY PREDICTION (Disk Trend)
    try {
      const diskBytes = $os.cmd('df', '-k', '/').output();
      const diskStr = String.fromCharCode(...diskBytes);
      const diskLines = diskStr.split('\n');
      if (diskLines.length > 1) {
        const parts = diskLines[1].trim().split(/\s+/);
        diskInfo = {
          total: parseInt(parts[1]) * 1024,
          used: parseInt(parts[2]) * 1024,
          available: parseInt(parts[3]) * 1024,
        };
      }
    } catch (e) {
      /* Ignore */
    }

    return c.json(200, {
      attacks: resultAttacks,
      users: resultUsers,
      word_cloud: wordCloud,
      reboots: reboots,
      disk_info: diskInfo,
    });
  } catch (e) {
    return c.json(500, { error: e.message });
  }
});
