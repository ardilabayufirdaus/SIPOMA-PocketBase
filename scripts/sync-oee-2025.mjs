import PocketBase from 'pocketbase';
import 'dotenv/config';

const PB_URL = process.env.VITE_POCKETBASE_URL || 'https://db.sipoma.online';
const PB_EMAIL = process.env.PB_EMAIL || 'ardila.firdaus@sig.id';
const PASSWORDS = [process.env.PB_PASSWORD, 'makassar@270989', '270989'].filter(Boolean);

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

async function syncOeeFull2025() {
  console.log('--- OEE Historical Sync Start (FULL YEAR 2025) ---');
  
  try {
    let authenticated = false;
    for (const password of PASSWORDS) {
      try {
        await pb.admins.authWithPassword(PB_EMAIL, password);
        authenticated = true;
        break;
      } catch (e) {}
    }
    if (!authenticated) throw new Error('Authentication failed');

    const units = await pb.collection('plant_units').getFullList();
    const parameterSettings = await pb.collection('parameter_settings').getFullList();

    // Define Range: Jan 1st 2025 to Dec 31st 2025
    const start = new Date(2025, 0, 1);
    const end = new Date(2025, 11, 31);
    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }

    console.log(`Processing ${dates.length} days for ${units.length} units...`);

    for (const date of dates) {
      const filter = `date = "${date}"`;
      
      // Batch fetch for the day
      const [allParams, allDowntime, allCapacity] = await Promise.all([
        pb.collection('ccr_parameter_data').getFullList({ filter }),
        pb.collection('ccr_downtime_data').getFullList({ filter }),
        pb.collection('monitoring_production_capacity').getFullList({ filter }),
      ]);

      // Only proceed if there's any data for this day
      if (allParams.length === 0 && allDowntime.length === 0 && allCapacity.length === 0) {
        continue;
      }

      console.log(`\nProcessing Date: ${date}`);

      for (const unit of units) {
        const unitId = unit.unit;
        const unitParams = parameterSettings.filter(p => p.unit === unitId);
        
        const feeder = unitParams.find(p => p.is_oee_feeder) || unitParams.find(p => {
           const n = (p.parameter || '').toLowerCase();
           const u = (p.unit || '').toLowerCase();
           return (n.includes('feeder') || n.includes('feed')) && 
                  (n.includes('clinker') || n.includes('raw') || u.includes('tph'));
        });

        if (!feeder) continue;

        const unitDowntime = allDowntime.filter(d => d.plant_unit === unitId);
        const totalDowntimeMin = unitDowntime.reduce((sum, d) => sum + (parseFloat(d.duration) || 0), 0);
        const availability = Math.max(0, ((1440 - totalDowntimeMin) / 1440) * 100);

        const unitProd = allCapacity.find(c => c.plant_unit === unitId);
        const actualOutput = unitProd ? (unitProd.wet || 0) : 0;
        const designCap = feeder.max_value || 100;
        const operatingMin = 1440 - totalDowntimeMin;
        const targetOutput = (operatingMin / 60) * designCap;
        const performance = targetOutput > 0 ? Math.min((actualOutput / targetOutput) * 100, 100) : 0;

        const qualityParams = unitParams.filter(p => p.is_oee_quality).length > 0 
          ? unitParams.filter(p => p.is_oee_quality) 
          : unitParams.filter(p => p.unit !== 'ton' && (p.min_value != null || p.max_value != null));

        const qualityChecks = [];
        qualityParams.forEach(p => {
          const rec = allParams.find(r => r.parameter_id === p.id && r.plant_unit === unitId);
          if (rec) {
            for (let i = 1; i <= 24; i++) {
              const val = parseFloat(rec[`hour${i}`]);
              if (!isNaN(val)) qualityChecks.push({ val, min: p.min_value, max: p.max_value });
            }
          }
        });
        const inSpec = qualityChecks.filter(c => {
          const min = c.min ?? -Infinity;
          const max = c.max ?? Infinity;
          return c.val >= min && c.val <= max;
        }).length;
        const quality = qualityChecks.length > 0 ? (inSpec / qualityChecks.length) * 100 : 100;

        const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

        if (oee > 0) {
          try {
            const existing = await pb.collection('oee_daily_summary').getList(1, 1, {
              filter: `date = "${date} 00:00:00.000Z" && unit = "${unitId}"`
            });

            const data = {
              date: `${date} 00:00:00.000Z`,
              unit: unitId,
              availability,
              performance,
              quality,
              oee,
              total_production: actualOutput,
              design_capacity: designCap
            };

            if (existing.items.length > 0) {
              await pb.collection('oee_daily_summary').update(existing.items[0].id, data);
              process.stdout.write(` [${unitId}: UPD]`);
            } else {
              await pb.collection('oee_daily_summary').create(data);
              process.stdout.write(` [${unitId}: NEW]`);
            }
          } catch (e) {
            console.error(`\nError saving ${unitId} on ${date}:`, e.message);
          }
        }
      }
    }

    console.log('\n\n--- 2025 Sync Completed Successfully ---');
  } catch (err) {
    console.error('Final Sync Error:', err);
  }
}

syncOeeFull2025();
