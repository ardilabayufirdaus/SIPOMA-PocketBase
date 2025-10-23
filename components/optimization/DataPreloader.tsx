import React, { useEffect, Suspense, lazy } from 'react';
import { pb } from '../../utils/pocketbase';
import { dataCache } from '../../utils/optimization/dataCache';
import { connectionPool } from '../../utils/optimization/connectionPool';
import { logger } from '../../utils/logger';

// Lazy load the MixedContentDetector for better performance
const MixedContentDetector = lazy(() => import('../MixedContentDetector'));

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

/**
 * Komponen untuk melakukan prefetch data penting saat aplikasi dimulai
 * untuk mempercepat loading saat user mengakses data tersebut
 */
const DataPreloader: React.FC<DataPreloaderProps> = ({ children }) => {
  useEffect(() => {
    // Function untuk prefetch data
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
          (r) => r.status === 'fulfilled' && (r.value as { success: boolean }).success
        ).length;

        const failed = results.filter(
          (r) =>
            r.status === 'rejected' ||
            (r.status === 'fulfilled' && !(r.value as { success: boolean }).success)
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

  // Render children dengan MixedContentDetector
  return (
    <>
      {typeof window !== 'undefined' && window.location.protocol === 'https:' && (
        <Suspense fallback={null}>
          <MixedContentDetector />
        </Suspense>
      )}
      {children}
    </>
  );
};

export default DataPreloader;
