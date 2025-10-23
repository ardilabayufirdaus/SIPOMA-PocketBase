import { pb } from '../pocketbase-simple';
import { dataCache } from './dataCache';
import { logger } from '../logger';

interface QueryOptions {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  fields?: string[];
  expand?: string;
  cacheKey?: string;
  cacheTtl?: number; // Time to live dalam milidetik
  forceRefresh?: boolean;
}

/**
 * Fungsi untuk mengambil data dengan optimasi query dan caching
 * @param collection Nama koleksi
 * @param options Opsi query
 * @returns Data hasil query
 */
export async function optimizedQuery(collection: string, options: QueryOptions = {}) {
  const {
    page = 1,
    perPage = 50,
    sort = '',
    filter = '',
    fields = [],
    expand = '',
    cacheKey,
    cacheTtl = 5 * 60 * 1000, // Default 5 menit
    forceRefresh = false,
  } = options;

  // Gunakan cache jika tersedia dan tidak dipaksa refresh
  const actualCacheKey =
    cacheKey || `${collection}_${filter}_${sort}_${page}_${perPage}_${fields.join(',')}_${expand}`;

  if (!forceRefresh && cacheKey) {
    const cachedData = dataCache.get(actualCacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    // Bangun opsi query
    const queryOptions: Record<string, string> = {
      sort,
      filter,
      expand,
    };

    // Hanya sertakan fields yang diminta untuk mengurangi ukuran response
    if (fields && fields.length > 0) {
      queryOptions.fields = fields.join(',');
    }

    // Lakukan query dengan pagination
    const result = await pb.collection(collection).getList(page, perPage, queryOptions);

    // Simpan di cache
    if (cacheKey) {
      dataCache.set(actualCacheKey, result, cacheTtl);
    }

    return result;
  } catch (error) {
    logger.error(`Error saat query ke koleksi ${collection}:`, error);
    throw error;
  }
}

/**
 * Fungsi untuk mengambil satu record dengan optimasi caching
 * @param collection Nama koleksi
 * @param id ID record
 * @param options Opsi query
 * @returns Data record
 */
export async function optimizedGetOne(
  collection: string,
  id: string,
  options: Omit<QueryOptions, 'page' | 'perPage'> = {}
) {
  const {
    fields = [],
    expand = '',
    cacheKey,
    cacheTtl = 5 * 60 * 1000, // Default 5 menit
    forceRefresh = false,
  } = options;

  // Gunakan cache jika tersedia dan tidak dipaksa refresh
  const actualCacheKey = cacheKey || `${collection}_${id}_${fields.join(',')}_${expand}`;

  if (!forceRefresh && cacheKey) {
    const cachedData = dataCache.get(actualCacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    // Bangun opsi query
    const queryOptions: Record<string, string> = {
      expand,
    };

    // Hanya sertakan fields yang diminta untuk mengurangi ukuran response
    if (fields && fields.length > 0) {
      queryOptions.fields = fields.join(',');
    }

    // Lakukan query untuk satu record
    const result = await pb.collection(collection).getOne(id, queryOptions);

    // Simpan di cache
    if (cacheKey) {
      dataCache.set(actualCacheKey, result, cacheTtl);
    }

    return result;
  } catch (error) {
    logger.error(`Error saat mengambil record ${id} dari koleksi ${collection}:`, error);
    throw error;
  }
}

/**
 * Hook untuk manajemen batch operations
 * @param collection Nama koleksi
 * @param data Array data untuk operasi batch
 * @param operation Tipe operasi (create, update, delete)
 */
export async function batchOperation<T>(
  collection: string,
  data: T[],
  operation: 'create' | 'update' | 'delete'
) {
  if (!data || data.length === 0) {
    return [];
  }

  try {
    // Untuk operasi batch, kita akan memproses dalam batch kecil
    // untuk menghindari timeout atau masalah performa server
    const BATCH_SIZE = 20; // Proses maksimal 20 record sekaligus
    const results = [];

    // Proses dalam batch
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);

      // Proses sesuai dengan tipe operasi
      let batchResults;

      switch (operation) {
        case 'create':
          batchResults = await Promise.all(
            batch.map((item) => pb.collection(collection).create(item))
          );
          break;

        case 'update':
          batchResults = await Promise.all(
            batch.map((item) => {
              // @ts-expect-error - We assume item has an id property
              const id = item.id;
              if (!id) {
                throw new Error('Item does not have an id property');
              }
              return pb.collection(collection).update(id, item);
            })
          );
          break;

        case 'delete':
          batchResults = await Promise.all(
            batch.map((item) => {
              const id = typeof item === 'string' ? item : (item as any).id;
              return pb.collection(collection).delete(id);
            })
          );
          break;
      }

      results.push(...batchResults);

      // Delay kecil antara batch untuk mengurangi beban pada server
      if (i + BATCH_SIZE < data.length) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    // Clear cache untuk koleksi ini karena data telah berubah
    dataCache.removeByPattern(new RegExp(`^${collection}_`));

    return results;
  } catch (error) {
    logger.error(
      `Error saat melakukan operasi batch ${operation} pada koleksi ${collection}:`,
      error
    );
    throw error;
  }
}
