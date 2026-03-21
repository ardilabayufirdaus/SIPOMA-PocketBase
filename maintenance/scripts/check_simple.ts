import { pb } from './utils/pocketbase-simple';
(async () => {
  try {
    const m = await pb.collection('moisture_monitoring').getList(1, 1);
    console.log('Moisture Count:', m.totalItems);
    const c = await pb.collection('monitoring_production_capacity').getList(1, 1);
    console.log('Capacity Count:', c.totalItems);
  } catch (e) {
    console.log('Error:', e.message);
  }
})();
