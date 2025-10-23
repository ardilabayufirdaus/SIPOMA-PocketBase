// check-ccr-data.js
const https = require('https');
const http = require('http');
const readline = require('readline');

// URL PocketBase
const PB_URL = 'http://141.11.25.69:8090';

// Create interface for command-line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper untuk fetch
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({
              ok: true,
              status: res.statusCode,
              json: () => Promise.resolve(JSON.parse(data)),
              text: () => Promise.resolve(data)
            });
          } catch (e) {
            reject(new Error(`Invalid JSON: ${e.message}`));
          }
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Autentikasi dengan username dan password
async function authenticate(username, password) {
  const url = `${PB_URL}/api/collections/users/auth-with-password`;
  const body = JSON.stringify({
    identity: username,
    password: password
  });
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body
    });
    
    const data = await response.json();
    console.log('✓ Login berhasil!');
    return data.token;
  } catch (error) {
    console.error('✗ Login gagal:', error.message);
    return null;
  }
}

// Ambil data CCR Silo
async function getCcrSiloData(token, filter = '') {
  const url = `${PB_URL}/api/collections/ccr_silo_data/records?sort=-created&filter=${encodeURIComponent(filter)}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: token ? {
        'Authorization': token
      } : {}
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching CCR Silo data:', error.message);
    return { items: [] };
  }
}

// Ambil data Plant Units
async function getPlantUnits(token) {
  const url = `${PB_URL}/api/collections/plant_units/records`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: token ? {
        'Authorization': token
      } : {}
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Plant Units:', error.message);
    return { items: [] };
  }
}

// Main function
async function main() {
  console.log('=== DIAGNOSA DATA CCR SILO ===\n');
  
  try {
    // Coba ambil data tanpa autentikasi terlebih dahulu
    console.log('Mencoba mengambil data tanpa login...');
    const publicData = await getCcrSiloData();
    
    if (publicData.items && publicData.items.length > 0) {
      console.log(`✓ Berhasil! ${publicData.items.length} data ditemukan tanpa autentikasi.`);
      console.log('Data pertama:', JSON.stringify(publicData.items[0], null, 2));
      rl.close();
      return;
    } else {
      console.log('✗ Tidak bisa mengambil data tanpa autentikasi. Mencoba login...\n');
    }
  } catch (error) {
    console.log('✗ Tidak bisa mengambil data tanpa autentikasi. Mencoba login...\n');
  }
  
  // Minta kredensial
  rl.question('Username: ', (username) => {
    rl.question('Password: ', async (password) => {
      // Autentikasi
      const token = await authenticate(username, password);
      
      if (!token) {
        console.error('Tidak bisa melanjutkan tanpa token autentikasi.');
        rl.close();
        return;
      }
      
      // Ambil data silo dengan token
      const data = await getCcrSiloData(token);
      if (data.items && data.items.length > 0) {
        console.log(`\n✓ ${data.items.length} data CCR Silo ditemukan.`);
        console.log('Data pertama:', JSON.stringify(data.items[0], null, 2));
      } else {
        console.log('\n✗ Tidak ada data CCR Silo yang ditemukan.');
      }
      
      // Ambil plant units
      const units = await getPlantUnits(token);
      if (units.items && units.items.length > 0) {
        console.log(`\n✓ ${units.items.length} Plant Units ditemukan:`);
        
        // Untuk setiap unit, cek apakah ada data CCR Silo
        const today = new Date().toISOString().split('T')[0];
        
        for (const unit of units.items) {
          console.log(`- ${unit.name} (ID: ${unit.id})`);
          
          // Cek data untuk unit ini dan tanggal hari ini
          const filter = `date="${today}" && unit_id="${unit.id}"`;
          const unitData = await getCcrSiloData(token, filter);
          
          if (unitData.items && unitData.items.length > 0) {
            console.log(`  ✓ ${unitData.items.length} data ditemukan untuk tanggal ${today}`);
          } else {
            console.log(`  ✗ Tidak ada data untuk tanggal ${today}`);
            
            // Cek apakah ada data untuk unit ini dengan tanggal apapun
            const anyDateData = await getCcrSiloData(token, `unit_id="${unit.id}"`);
            if (anyDateData.items && anyDateData.items.length > 0) {
              console.log(`    Namun ada ${anyDateData.items.length} data untuk tanggal lain`);
              console.log(`    Tanggal terakhir: ${anyDateData.items[0].date}`);
            } else {
              console.log(`    Tidak ada data sama sekali untuk unit ini`);
            }
          }
        }
      } else {
        console.log('\n✗ Tidak ada Plant Units yang ditemukan.');
      }
      
      rl.close();
    });
  });
}

main();