import { pb } from './pocketbase-simple';
import { ParameterSetting } from '../types';
import {
  calculateParameterStats,
  calculateShiftStats,
  calculateShiftCounter,
} from './calculationUtils';
import { formatDateToISO8601 } from './dateUtils';
import { logger } from './logger';
import { safeApiCall } from './connectionCheck';

/**
 * Utilitas untuk melakukan sinkronisasi data operasional masal (per bulan).
 */

const materialToParameterMap: Record<string, string> = {
  clinker: 'Counter Feeder Clinker (ton)',
  gypsum: 'Counter Feeder Gypsum (ton)',
  limestone: 'Counter Feeder Limestone (ton)',
  trass: 'Counter Feeder Trass (ton)',
  fly_ash: 'Counter Feeder Flyash (ton)',
  fine_trass: 'Counter Feeder Fine Trass (ton)',
  ckd: 'Counter Feeder CKD (ton)',
};

const shiftToCounterFieldMap: Record<string, string> = {
  shift3_cont: 'shift3_cont_counter',
  shift1: 'shift1_counter',
  shift2: 'shift2_counter',
  shift3: 'shift3_counter',
};

const SHIFTS = ['shift3_cont', 'shift1', 'shift2', 'shift3'];

const SHIFT_HOURS = {
  shift1: [8, 9, 10, 11, 12, 13, 14, 15],
  shift2: [16, 17, 18, 19, 20, 21, 22],
  shift3: [23, 24],
  shift3Cont: [1, 2, 3, 4, 5, 6, 7],
};

/**
 * Menunggu selama beberapa milidetik
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Membandingkan dua objek (shallow compare untuk properti level 1)
 */
const objectsAreEqual = (obj1: any, obj2: any, keys: string[]) => {
  if (!obj1 || !obj2) return false;
  for (const key of keys) {
    if (obj1[key] !== obj2[key]) return false;
  }
  return true;
};

/**
 * Membagi array menjadi potongan-potongan kecil (chunks)
 */
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

// Helper function to process a single day logic
const processDaySync = async (
  day: number,
  month: number,
  year: number,
  parameterSettings: ParameterSetting[]
) => {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const formattedDate = formatDateToISO8601(dateStr);

  // 1. Ambil data parameter mentah untuk tanggal ini
  const rawData = await safeApiCall(() =>
    pb.collection('ccr_parameter_data').getFullList({
      filter: `date="${formattedDate}"`,
    })
  );

  // Jika tidak ada data mentah, skip hari ini
  if (!rawData || rawData.length === 0) return;

  // Mapping raw data by parameter_id
  const dataMap = new Map();
  rawData.forEach((d) => dataMap.set(d.parameter_id, d));

  // 2. Ambil semua Footer Data yang sudah ada untuk tanggal ini
  const existingFooters = await safeApiCall(() =>
    pb.collection('ccr_footer_data').getFullList({
      filter: `date="${formattedDate}"`,
    })
  );
  const existingFooterMap = new Map();
  existingFooters?.forEach((f) => existingFooterMap.set(f.parameter_id, f));

  // 3. Hitung & Kumpulkan Footer Data
  const footerOps: any[] = [];
  parameterSettings.forEach((param) => {
    const data = dataMap.get(param.id);
    if (!data) return;

    const daily = calculateParameterStats(param, data);
    if (!daily) return;

    const s1 = calculateShiftStats(param, data, SHIFT_HOURS.shift1);
    const s2 = calculateShiftStats(param, data, SHIFT_HOURS.shift2);
    const s3 = calculateShiftStats(param, data, SHIFT_HOURS.shift3);
    const s3c = calculateShiftStats(param, data, SHIFT_HOURS.shift3Cont);

    const c1 = calculateShiftCounter(param, data, 'shift1');
    const c2 = calculateShiftCounter(param, data, 'shift2');
    const c3 = calculateShiftCounter(param, data, 'shift3');
    const c3c = calculateShiftCounter(param, data, 'shift3Cont');

    // Konstruksi payload baru
    const footerPayload: any = {
      date: formattedDate,
      parameter_id: param.id,
      plant_unit: param.category || 'CCR',
      total: Number(daily.total.toFixed(2)),
      average: Number(daily.avg.toFixed(2)),
      minimum: Number(daily.min.toFixed(2)),
      maximum: Number(daily.max.toFixed(2)),
      shift1_total: Number(s1.total.toFixed(2)),
      shift2_total: Number(s2.total.toFixed(2)),
      shift3_total: Number(s3.total.toFixed(2)),
      shift3_cont_total: Number(s3c.total.toFixed(2)),
      shift1_average: Number(s1.avg.toFixed(2)),
      shift2_average: Number(s2.avg.toFixed(2)),
      shift3_average: Number(s3.avg.toFixed(2)),
      shift3_cont_average: Number(s3c.avg.toFixed(2)),
      shift1_counter: Number(c1.toFixed(2)),
      shift2_counter: Number(c2.toFixed(2)),
      shift3_counter: Number(c3.toFixed(2)),
      shift3_cont_counter: Number(c3c.toFixed(2)),
    };

    const existingRecord = existingFooterMap.get(param.id);

    // Optimasi: Hanya update jika data berubah
    let needsUpdate = true;
    if (existingRecord) {
      // Compare keys excluding system fields
      const keysToCompare = Object.keys(footerPayload);
      if (objectsAreEqual(footerPayload, existingRecord, keysToCompare)) {
        needsUpdate = false;
      }
    }

    if (needsUpdate) {
      footerOps.push({
        payload: footerPayload,
        existingId: existingRecord?.id,
      });
    }
  });

  // Jalankan operasi footer dalam batch kecil (chunk size 5)
  if (footerOps.length > 0) {
    const footerChunks = chunkArray(footerOps, 5);
    for (const chunk of footerChunks) {
      await Promise.all(
        chunk.map((op) => {
          if (op.existingId) {
            return safeApiCall(() =>
              pb.collection('ccr_footer_data').update(op.existingId, op.payload)
            );
          } else {
            return safeApiCall(() => pb.collection('ccr_footer_data').create(op.payload));
          }
        })
      );
      await sleep(50); // Jeda kecil antar batch internal
    }
  }

  // 4. Ambil semua Material Usage yang sudah ada untuk tanggal ini
  const existingMaterials = await safeApiCall(() =>
    pb.collection('ccr_material_usage').getFullList({
      filter: `date="${formattedDate}"`,
    })
  );
  const existingMaterialMap = new Map();
  existingMaterials?.forEach((m) => {
    const key = `${m.plant_unit}-${m.shift}`;
    existingMaterialMap.set(key, m);
  });

  // 5. Ambil daftar unit & Kumpulkan Material Usage
  const units = [...new Set(parameterSettings.map((p) => p.unit))].filter(Boolean);
  const materialOps: any[] = [];

  // Gunakan fresh footer data untuk perhitungan material
  const freshFooterData = Array.from(existingFooterMap.values()).map((existing) => {
    const updateOp = footerOps.find((op) => op.existingId === existing.id);
    if (updateOp) {
      return { ...existing, ...updateOp.payload };
    }
    return existing;
  });

  footerOps
    .filter((op) => !op.existingId)
    .forEach((op) => {
      freshFooterData.push({ ...op.payload });
    });

  for (const unit of units) {
    // Find category for this unit, default to CM if not found
    // Priority: CM > RKC
    const unitParams = parameterSettings.filter((p) => p.unit === unit);
    const category = unitParams.some((p) => p.category === 'CM')
      ? 'CM'
      : unitParams.some((p) => p.category === 'RKC')
        ? 'RKC'
        : 'CM';

    SHIFTS.forEach((shift) => {
      const materialUsage: any = {
        date: formattedDate,
        plant_category: category,
        plant_unit: unit,
        shift: shift,
      };

      let totalProduction = 0;
      let hasData = false;

      Object.entries(materialToParameterMap).forEach(([materialKey, paramName]) => {
        const paramSetting = parameterSettings.find(
          (s) => s.parameter === paramName && s.unit === unit && s.category === category
        );
        if (paramSetting) {
          const footer = freshFooterData.find((f) => f.parameter_id === paramSetting.id);
          if (footer) {
            const counterField = shiftToCounterFieldMap[shift];
            const value = (footer[counterField] as number) || 0;
            const roundedValue = Number(value.toFixed(2));
            materialUsage[materialKey] = roundedValue;
            totalProduction += roundedValue;
            if (roundedValue > 0) hasData = true;
          }
        }
      });

      materialUsage.total_production = Number(totalProduction.toFixed(2));

      if (hasData) {
        const key = `${unit}-${shift}`;
        const existingRecord = existingMaterialMap.get(key);

        let needsUpdate = true;
        if (existingRecord) {
          const keysToCompare = Object.keys(materialUsage);
          if (objectsAreEqual(materialUsage, existingRecord, keysToCompare)) {
            needsUpdate = false;
          }
        }

        if (needsUpdate) {
          materialOps.push({
            payload: materialUsage,
            existingId: existingRecord?.id,
          });
        }
      }
    });
  }

  // Jalankan operasi material dalam batch kecil
  if (materialOps.length > 0) {
    const materialChunks = chunkArray(materialOps, 5);
    for (const chunk of materialChunks) {
      await Promise.all(
        chunk.map((op) => {
          if (op.existingId) {
            return safeApiCall(() =>
              pb.collection('ccr_material_usage').update(op.existingId, op.payload)
            );
          } else {
            return safeApiCall(() => pb.collection('ccr_material_usage').create(op.payload));
          }
        })
      );
      await sleep(50); // Jeda kecil
    }
  }
};

export const syncOperationalDataForMonth = async (
  month: number,
  year: number,
  onProgress?: (current: number, total: number) => void
) => {
  logger.info(`Starting operational data sync for ${month}/${year}`);

  // 1. Ambil semua parameter settings
  const parameterSettings = await safeApiCall(() =>
    pb.collection('parameter_settings').getFullList<ParameterSetting>()
  );

  if (!parameterSettings) {
    throw new Error('Failed to fetch parameter settings');
  }

  // 2. Tentukan range tanggal
  const lastDay = new Date(year, month, 0).getDate();
  const daysInMonth = Array.from({ length: lastDay }, (_, i) => i + 1);
  const totalDays = daysInMonth.length;

  // Process days in parallel chunks (Concurrency: 3 days at a time)
  // This balances speed vs network stability
  const dayChunks = chunkArray(daysInMonth, 3);
  let processedCount = 0;

  for (const chunk of dayChunks) {
    await Promise.all(
      chunk.map(async (day) => {
        try {
          await processDaySync(day, month, year, parameterSettings);
        } catch (err) {
          logger.error(`Error processing day ${day}:`, err);
        } finally {
          processedCount++;
          if (onProgress) onProgress(processedCount, totalDays);
        }
      })
    );
    // Tiny delay between chunks to let network breathe
    await sleep(100);
  }

  logger.info(`Operational data sync completed for ${month}/${year}`);
};
