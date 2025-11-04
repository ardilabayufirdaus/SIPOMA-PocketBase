const PocketBase = require('pocketbase/cjs');

async function checkMoistureDataForUnit() {
  const pb = new PocketBase('https://api.sipoma.site/');
  await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

  const moistureParams = [
    'dkylkeiv004fz80',
    '7pk1wace5cdfqfn',
    't9dj8wzkv9lldou',
    'uy78x8g7az7m5kn', // H2O Gypsum
    'b6sw07wl4zw7svp',
    'n58i1v6nz4czrwl',
    '2nfpzyucwy9ux5i', // H2O Trass
    '03wu2dk5p6ky2m0',
    '785zfrng4uqypdq',
    '3hac99xbfq7wyoj',
    'e2wg6jl3qo0ac1e', // H2O Limestone
    '13l52aw1o79f1xu',
    '6pxjlym8203rd5m',
    '6bkm9m05gs4f9nl',
    'fvmap861va2xumk', // Set Gypsum
    'rzsjhcgo0d75cz9',
    '563ao0f2ggqdofp',
    '0dvr8ck4f39ociq',
    'tfp3j1qh0e5ynjz', // Set Trass
    'iv8qkbleeqg88v4',
    '9nbxw6zi0k0zmhu',
    'nugceithu0zekiw',
    '2awmivmc3x2tdbc', // Set Limestone
  ];

  console.log('Checking moisture data for Cement Mill 220 on 2025-10-27...');

  const data = await pb.collection('ccr_parameter_data').getFullList({
    filter: `parameter_id ?~ "${moistureParams.join('|')}" && date = "2025-10-27" && plant_unit = "Cement Mill 220"`,
    limit: 20,
  });

  console.log(`Found ${data.length} moisture parameter records for Cement Mill 220`);

  if (data.length > 0) {
    console.log('Sample records:');
    data.slice(0, 5).forEach((record, i) => {
      console.log(
        `${i + 1}. Parameter: ${record.parameter_id}, Hour1: ${record.hour1}, Hour2: ${record.hour2}`
      );
    });
  } else {
    console.log('No moisture data found for Cement Mill 220 on 2025-10-27');
  }
}

checkMoistureDataForUnit();
