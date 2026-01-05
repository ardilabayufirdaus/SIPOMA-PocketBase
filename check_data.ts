import { pb } from './utils/pocketbase-simple';
(async () => {
  try {
    const m = await pb.collection('moisture_monitoring').getList(1, 5, { sort: '-created' });
    console.log('Moisture Records:', m.totalItems, m.items.length);
    if (m.items.length > 0) console.log('Sample M:', JSON.stringify(m.items[0], null, 2));
    const c = await pb
      .collection('monitoring_production_capacity')
      .getList(1, 5, { sort: '-created' });
    console.log('Capacity Records:', c.totalItems, c.items.length);
    if (c.items.length > 0) console.log('Sample C:', JSON.stringify(c.items[0], null, 2));
  } catch (e) {
    console.error(e);
  }
})();
