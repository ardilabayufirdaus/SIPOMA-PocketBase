import { pb, Collections } from '../services/pocketbase';

// Tipe untuk collection schema
interface CollectionSchema {
  id: string;
  name: string;
  type: string;
  system: boolean;
  schema: Array<Record<string, unknown>>;
  indexes?: Array<Record<string, unknown>>;
  listRule?: string;
  viewRule?: string;
  createRule?: string;
  updateRule?: string;
  deleteRule?: string;
  options?: Record<string, unknown>;
}

/**
 * Fungsi untuk memigrasi skema database PocketBase sesuai dengan definisi schema
 * yang diberikan.
 *
 * PERHATIAN: Fungsi ini hanya untuk penggunaan admin, dan hanya boleh digunakan
 * dalam mode pengembangan (development) atau oleh super admin.
 */
export async function migrateSchemaFromDefinition(
  adminEmail: string,
  adminPassword: string,
  schema: CollectionSchema[]
) {
  try {
    // Authentikasi sebagai admin
    await pb.admins.authWithPassword(adminEmail, adminPassword);

    // Log output sebagai hasil operasi
    const results = {
      success: true,
      created: [] as string[],
      updated: [] as string[],
      failed: [] as { name: string; error: string }[],
    };

    // Iterasi melalui setiap koleksi dalam schema
    for (const collection of schema) {
      try {
        // Cek apakah koleksi sudah ada
        const existingCollection = await pb.collections.getOne(collection.id).catch(() => null);

        if (!existingCollection) {
          // Jika belum ada, buat koleksi baru
          await pb.collections.create(collection);
          results.created.push(collection.name);
        } else {
          // Jika sudah ada, update koleksi yang ada
          await pb.collections.update(collection.id, collection);
          results.updated.push(collection.name);
        }
      } catch (err) {
        results.failed.push({
          name: collection.name,
          error: (err as Error).message,
        });
      }
    }

    results.success = results.failed.length === 0;
    return {
      ...results,
      message: results.success
        ? 'Migrasi skema database berhasil.'
        : `Migrasi skema database selesai dengan ${results.failed.length} error.`,
    };
  } catch (err) {
    return {
      success: false,
      created: [],
      updated: [],
      failed: [],
      message: `Migrasi gagal: ${(err as Error).message}`,
    };
  }
}

/**
 * Fungsi untuk memvalidasi konsistensi data pada koleksi parameter dan data parameter
 */
export async function validateParameterDataConsistency() {
  try {
    // Ambil semua parameter settings
    const parameterSettings = await pb.collection(Collections.PARAMETER_SETTINGS).getFullList();

    // Ambil data parameter terbaru (misalnya 1 minggu terakhir)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    const parameterData = await pb.collection(Collections.CCR_PARAMETER_DATA).getFullList({
      filter: `date >= "${formatDate(oneWeekAgo)}"`,
    });

    // Kumpulkan semua parameter_id unik dari data parameter
    const usedParameterIds = new Set(parameterData.map((data) => data.parameter_id));

    // Validasi apakah semua parameter_id memiliki definisi di parameter settings
    const parameterSettingsIds = new Set(parameterSettings.map((param) => param.id));

    const orphanedParameterIds = [...usedParameterIds].filter(
      (id) => !parameterSettingsIds.has(id)
    );

    // Validasi min/max value pada data parameter
    const parameterValueValidation = parameterData.filter((data) => {
      // Cari parameter setting yang sesuai
      const paramSetting = parameterSettings.find((p) => p.id === data.parameter_id);
      if (!paramSetting) return false;

      // Periksa nilai pada hourly_values
      const hourlyValues = data.hourly_values || {};
      let hasInvalidValue = false;

      // Type untuk valueData
      interface HourlyValueData {
        value: number | string;
        timestamp?: string;
        is_valid?: boolean;
        comments?: string;
      }

      Object.entries(hourlyValues).forEach(([_hour, val]) => {
        // Type checking dan type casting
        const valueData = val as HourlyValueData;
        const value = Number(valueData.value);

        if (!isNaN(value)) {
          // Periksa apakah nilai berada di luar min/max value berdasarkan kategori
          if (data.plant_unit === 'OPC') {
            if (paramSetting.opc_min_value !== null && value < paramSetting.opc_min_value) {
              hasInvalidValue = true;
            }
            if (paramSetting.opc_max_value !== null && value > paramSetting.opc_max_value) {
              hasInvalidValue = true;
            }
          } else if (data.plant_unit === 'PCC') {
            if (paramSetting.pcc_min_value !== null && value < paramSetting.pcc_min_value) {
              hasInvalidValue = true;
            }
            if (paramSetting.pcc_max_value !== null && value > paramSetting.pcc_max_value) {
              hasInvalidValue = true;
            }
          } else {
            // Gunakan min/max value umum
            if (paramSetting.min_value !== null && value < paramSetting.min_value) {
              hasInvalidValue = true;
            }
            if (paramSetting.max_value !== null && value > paramSetting.max_value) {
              hasInvalidValue = true;
            }
          }
        }
      });

      return hasInvalidValue;
    });

    return {
      success: true,
      orphanedParameterIds,
      invalidValueCount: parameterValueValidation.length,
      invalidValues: parameterValueValidation.map((p) => ({
        id: p.id,
        date: p.date,
        parameter: p.name,
        plant_unit: p.plant_unit,
      })),
    };
  } catch (err) {
    return {
      success: false,
      message: `Validasi gagal: ${(err as Error).message}`,
    };
  }
}

/**
 * Fungsi untuk membuat backup dari koleksi PocketBase
 */
export async function createBackup(collectionName: string, targetFilePath: string) {
  try {
    // Ambil semua record dari koleksi
    const records = await pb.collection(collectionName).getFullList({
      sort: 'created',
    });

    // Konversi ke JSON string
    const jsonData = JSON.stringify(records, null, 2);

    // Dalam lingkungan browser, lakukan download file
    if (typeof window !== 'undefined') {
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collectionName}_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true, message: 'Backup file telah diunduh.' };
    } else {
      // Untuk Node.js, kita tidak bisa menggunakan dynamic import di file ini
      // Sebagai alternatif, return data saja dan biarkan caller handle penyimpanan file
      return {
        success: true,
        data: jsonData,
        targetFilePath,
        message: 'Data backup berhasil dibuat. Gunakan fungsi writeToFile untuk menyimpannya.',
      };
    }
  } catch (err) {
    return { success: false, message: `Gagal membuat backup: ${(err as Error).message}` };
  }
}
