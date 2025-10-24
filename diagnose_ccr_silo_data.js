// Script diagnosa CCR Silo Data
const https = require('https');
const http = require('http');

// URL PocketBase
const PB_URL = 'https://api.sipoma.site/';

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
            reject(new Error(Invalid JSON: ));
          }
        } else {
          reject(new Error(Request failed with status : ));
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
  const url = ${PB_URL}/api/collections/users/auth-with-password;
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
    console.log(' Login berhasil!');
    return data.token;
  } catch (error) {
    console.error(' Login gagal:', error.message);
    return null;
  }
}

// Dapatkan detil koleksi dan skema
async function getCollectionSchema(token, collection) {
  const url = ${PB_URL}/api/collections/;
  
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
    console.error(Error getting  schema:, error.message);
    return null;
  }
}

// Mendapatkan data silos
async function getSiloCapacities(token) {
  const url = ${PB_URL}/api/collections/silos/records?perPage=100;
  
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
    console.error('Error fetching silos data:', error.message);
    return { items: [] };
  }
}

// Mendapatkan CCR Silo Data
async function getCcrSiloData(token, filter = '') {
  const url = ${PB_URL}/api/collections/ccr_silo_data/records?perPage=100&sort=-created&filter=;
  
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

// Main function
async function main() {
  console.log('=== DIAGNOSA LENGKAP DATA CCR SILO ===\n');
  
  // Autentikasi
  const token = await authenticate('ardila.firdaus@sig.id', 'makassar@270989');
  
  if (!token) {
    console.error('Tidak bisa melanjutkan tanpa token autentikasi.');
    return;
  }

  // 1. Periksa skema
  console.log('\n=== SKEMA CCR_SILO_DATA ===');
  const schemaInfo = await getCollectionSchema(token, 'ccr_silo_data');
  if (schemaInfo) {
    console.log('Schema:', JSON.stringify(schemaInfo, null, 2));
  } else {
    console.log('Tidak bisa mendapatkan skema.');
  }
  
  // 2. Periksa data silos (master data)
  console.log('\n=== DATA SILOS ===');
  const silosData = await getSiloCapacities(token);
  if (silosData.items && silosData.items.length > 0) {
    console.log(Ditemukan  data silos);
    console.log('Sampel data silo:', JSON.stringify(silosData.items[0], null, 2));
  } else {
    console.log('Tidak ada data silos ditemukan');
  }
  
  // 3. Periksa CCR Silo Data
  console.log('\n=== DATA CCR SILO ===');
  const today = new Date().toISOString().split('T')[0];
  const ccrSiloData = await getCcrSiloData(token, date='');
  if (ccrSiloData.items && ccrSiloData.items.length > 0) {
    console.log(Ditemukan  data CCR Silo untuk hari ini ());
    console.log('Sampel data CCR Silo:', JSON.stringify(ccrSiloData.items[0], null, 2));
    
    // Periksa relasi antara CCR Silo data dengan Silos
    const sampleCcrSilo = ccrSiloData.items[0];
    const matchedSilo = silosData.items.find(s => s.id === sampleCcrSilo.silo_id);
    
    if (matchedSilo) {
      console.log(\n CCR Silo Data dengan ID  terkait dengan silo );
    } else {
      console.log(\n CCR Silo Data dengan ID  tidak cocok dengan silo manapun);
    }
  } else {
    console.log(\n Tidak ada data CCR Silo untuk hari ini ());
    
    // Cari data dari tanggal sebelumnya
    const anyCcrSiloData = await getCcrSiloData(token);
    if (anyCcrSiloData.items && anyCcrSiloData.items.length > 0) {
      console.log(Namun, ditemukan  data CCR Silo secara keseluruhan);
      console.log('Data terbaru:', JSON.stringify(anyCcrSiloData.items[0], null, 2));
      console.log(Tanggal terakhir: );
    } else {
      console.log('Tidak ada data CCR Silo sama sekali');
    }
  }
}

main();

