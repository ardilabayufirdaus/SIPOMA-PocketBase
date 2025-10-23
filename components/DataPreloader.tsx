import React, { useEffect } from 'react';
import { pb } from '../utils/pocketbase';
import { dataCache } from '../utils/dataCache';
import { connectionPool } from '../utils/connectionPool';
import { logger } from '../utils/logger';

// Daftar koleksi dan data yang sering diakses untuk di-prefetch
const PREFETCH_COLLECTIONS = [
  'parameter_settings',
  'plant_units',
  'pic_settings',
  'report_settings',
  'user_permissions',
];

// Timeout untuk setiap operasi prefetch
const PREFETCH_TIMEOUT_MS = 5000;

interface DataPreloaderProps {
  children: React.ReactNode;
}

const DataPreloader: React.FC<DataPreloaderProps> = ({ children }) => {
  useEffect(() => {
    const prefetchData = async () => {
      try {
        // Pre-connect ke server terlebih dahulu
        await connectionPool.preConnect();

        // Prefetch data dari koleksi yang sering diakses
        const prefetchPromises = PREFETCH_COLLECTIONS.map(async (collection) => {
          try {
            // Buat timeout untuk setiap permintaan
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), PREFETCH_TIMEOUT_MS);

            // Coba ambil data dengan batasan jumlah
            const data = await pb.collection(collection).getList(1, 50, {
              sort: '-created',
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Simpan di cache dengan waktu kedaluwarsa yang sesuai
            // Data master dengan TTL lebih lama (30 menit)
            const expiryTime = [
              'parameter_settings',
              'plant_units',
              'pic_settings',
              'report_settings',
            ].includes(collection)
              ? 30 * 60 * 1000 // 30 menit
              : 5 * 60 * 1000; // 5 menit

            // Simpan di cache
            dataCache.set(`prefetch_${collection}`, data, expiryTime);

            logger.info(
              `Prefetch data untuk koleksi "${collection}" berhasil (${data.items.length} item)`
            );

            return {
              collection,
              success: true,
              itemCount: data.items.length,
            };
          } catch (error) {
            logger.warn(`Prefetch data untuk koleksi "${collection}" gagal:`, error);
            return {
              collection,
              success: false,
              error,
            };
          }
        });

        // Tunggu semua prefetch selesai dengan Promise.allSettled
        // untuk menghindari kegagalan satu request menghentikan yang lain
        const results = await Promise.allSettled(prefetchPromises);

        // Hitung statistik
        const successful = results.filter(
          (r) => r.status === 'fulfilled' && (r.value as any).success
        ).length;
        const failed = results.filter(
          (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !(r.value as any).success)
        ).length;

        logger.info(`Prefetch selesai: ${successful} berhasil, ${failed} gagal`);
      } catch (error) {
        logger.error('Error saat prefetch data:', error);
      }
    };

    // Mulai prefetch dengan delay sedikit untuk memastikan
    // aplikasi sudah dirender dan siap
    const timeoutId = setTimeout(() => {
      prefetchData();
    }, 1500); // Delay 1.5 detik

    return () => clearTimeout(timeoutId);
  }, []);

  // Render children seperti biasa
  return <>{children}</>;
};

export default DataPreloader;
