import { pb } from './pocketbase-simple';
import { optimizedQuery, optimizedGetOne } from './optimization/queryOptimizer';
import { useCachedData } from './optimization/dataCache';
import { logger } from './logger';

/**
 * File ini berisi adapter untuk mengintegrasikan fitur optimasi ke dalam kode yang ada
 * tanpa mengubah proses bisnis aplikasi
 */

/**
 * Adapter untuk mengganti pb.collection().getList() dengan versi yang dioptimalkan
 *
 * @param collection Nama koleksi
 * @param page Nomor halaman
 * @param perPage Item per halaman
 * @param options Opsi query
 * @returns Data hasil query
 */
export async function getListOptimized(
  collection: string,
  page: number = 1,
  perPage: number = 50,
  options: Record<string, any> = {}
) {
  try {
    // Extract fields untuk optimasi
    const fields = options.fields ? options.fields.split(',') : [];

    // Generate cache key based on parameters
    const cacheKey = `${collection}_list_${page}_${perPage}_${JSON.stringify(options)}`;

    // Tentukan TTL cache berdasarkan jenis data
    // Data master yang jarang berubah dengan TTL lebih lama
    const isMasterData = [
      'parameter_settings',
      'plant_units',
      'pic_settings',
      'report_settings',
    ].includes(collection);

    const cacheTtl = isMasterData
      ? 30 * 60 * 1000 // 30 menit untuk data master
      : 5 * 60 * 1000; // 5 menit untuk data lain

    // Gunakan optimized query
    return await optimizedQuery(collection, {
      page,
      perPage,
      sort: options.sort || '',
      filter: options.filter || '',
      fields,
      expand: options.expand || '',
      cacheKey,
      cacheTtl,
    });
  } catch (error) {
    // Jika terjadi error dengan optimized query, fallback ke metode original
    logger.warn(`Optimized query error for ${collection}, falling back to original method:`, error);
    return await pb.collection(collection).getList(page, perPage, options);
  }
}

/**
 * Adapter untuk mengganti pb.collection().getOne() dengan versi yang dioptimalkan
 *
 * @param collection Nama koleksi
 * @param id ID record
 * @param options Opsi query
 * @returns Data record
 */
export async function getOneOptimized(
  collection: string,
  id: string,
  options: Record<string, any> = {}
) {
  try {
    // Extract fields untuk optimasi
    const fields = options.fields ? options.fields.split(',') : [];

    // Generate cache key based on parameters
    const cacheKey = `${collection}_one_${id}_${JSON.stringify(options)}`;

    // Tentukan TTL cache berdasarkan jenis data
    const isMasterData = [
      'parameter_settings',
      'plant_units',
      'pic_settings',
      'report_settings',
    ].includes(collection);

    const cacheTtl = isMasterData
      ? 30 * 60 * 1000 // 30 menit untuk data master
      : 5 * 60 * 1000; // 5 menit untuk data lain

    // Gunakan optimized query
    return await optimizedGetOne(collection, id, {
      fields,
      expand: options.expand || '',
      cacheKey,
      cacheTtl,
    });
  } catch (error) {
    // Jika terjadi error dengan optimized query, fallback ke metode original
    logger.warn(
      `Optimized getOne error for ${collection}/${id}, falling back to original method:`,
      error
    );
    return await pb.collection(collection).getOne(id, options);
  }
}

/**
 * Adapter untuk mengganti pb.collection().getFullList() dengan versi yang dioptimalkan
 *
 * @param collection Nama koleksi
 * @param options Opsi query
 * @returns Full list data
 */
export async function getFullListOptimized(collection: string, options: Record<string, any> = {}) {
  try {
    // Untuk getFullList, kita akan menggunakan fetch function yang membungkus pb.collection().getFullList()
    const fetchFunction = async () => {
      return await pb.collection(collection).getFullList(options);
    };

    // Generate cache key based on parameters
    const cacheKey = `${collection}_fulllist_${JSON.stringify(options)}`;

    // Tentukan TTL cache berdasarkan jenis data
    const isMasterData = [
      'parameter_settings',
      'plant_units',
      'pic_settings',
      'report_settings',
    ].includes(collection);

    const cacheTtl = isMasterData
      ? 30 * 60 * 1000 // 30 menit untuk data master
      : 5 * 60 * 1000; // 5 menit untuk data lain

    // Gunakan cached data
    return await useCachedData(fetchFunction, cacheKey, cacheTtl);
  } catch (error) {
    // Jika terjadi error dengan cached data, fallback ke metode original
    logger.warn(
      `Optimized getFullList error for ${collection}, falling back to original method:`,
      error
    );
    return await pb.collection(collection).getFullList(options);
  }
}

