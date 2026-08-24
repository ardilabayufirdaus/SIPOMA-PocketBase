import PocketBase from 'pocketbase';

const pb = new PocketBase('http://172.18.6.98:8090');

async function test() {
  await pb.admins.authWithPassword('ardila.firdaus@sig.id', 'makassar@270989');

  const params = await pb.collection('derivative_parameter_settings').getFullList();
  const param = params[0];
  console.log('Testing param:', param.id, param.parameter, 'unit:', param.unit);

  const existing = await pb.collection('derivative_ccr_parameter_data').getList(1, 1, {
    filter: `date="2026-08-12" && parameter_id="${param.id}"`,
  });
  console.log('Existing count:', existing.items.length);

  if (existing.items.length > 0) {
    const rec = existing.items[0];
    console.log('Record ID:', rec.id, 'plant_unit:', rec.plant_unit);
    const res = await pb
      .collection('derivative_ccr_parameter_data')
      .update(rec.id, { hour12: '29.1', hour12_user: 'Test User' });
    console.log('Update result hour12:', res.hour12);
  } else {
    const res = await pb.collection('derivative_ccr_parameter_data').create({
      date: '2026-08-12',
      parameter_id: param.id,
      plant_unit: param.unit,
      name: param.parameter,
      hour12: '29.1',
      hour12_user: 'Test User',
    });
    console.log('Create result ID:', res.id, 'hour12:', res.hour12);
  }

  const list = await pb.collection('derivative_ccr_parameter_data').getFullList({
    filter: `date="2026-08-12" && plant_unit="${param.unit}"`,
  });
  console.log('FullList count:', list.length);
  const found = list.find((r) => r.parameter_id === param.id);
  console.log(
    'Found in FullList query:',
    found ? { id: found.id, hour12: found.hour12, plant_unit: found.plant_unit } : 'NOT FOUND'
  );
}

test();
