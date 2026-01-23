import { useState, useEffect, useCallback } from 'react';
import { User, UserRole, PermissionMatrix } from '../types';
import { pb } from '../utils/pocketbase-simple';
import { secureStorage } from '../utils/secureStorage';
import { safeApiCall, isNetworkConnected } from '../utils/connectionCheck';
import { logger } from '../utils/logger';
import { clearBrowserData } from '../utils/browserCacheUtils';

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk memproses dan update user data
  const updateUserData = useCallback(
    async (dbUserRaw: Record<string, unknown>, existingUser?: User) => {
      const userRaw = dbUserRaw as {
        id: string;
        username: string;
        email?: string;
        name?: string;
        role: string;
        is_active?: boolean;
        avatar?: string;
        created?: string;
        created_at?: string;
        updated?: string;
        updated_at?: string;
        last_active?: string;
      };
      // Penanganan pengguna tamu - tetap ambil permissions dari database seperti user lainnya
      // Guest users now follow the same permission loading logic as regular users

      // Ambil izin pengguna dari koleksi user_management dengan safeApiCall
      const permissionRecord = await safeApiCall(() =>
        pb.collection('user_management').getList(1, 1, {
          filter: `user_id = "${dbUserRaw.id}"`,
        })
      );

      // Jika gagal mendapatkan permissions, gunakan permissions dari data tersimpan
      let permissionsData = {};

      if (permissionRecord && permissionRecord.items.length > 0) {
        const item = permissionRecord.items[0];
        permissionsData = {
          dashboard: item.dashboard || 'NONE',
          cm_plant_operations: item.cm_plant_operations || 'NONE',
          rkc_plant_operations: item.rkc_plant_operations || 'NONE',
          project_management: item.project_management || 'NONE',
          database: item.database || 'NONE',
        };
      } else if (existingUser && existingUser.permissions) {
        permissionsData = existingUser.permissions;
      }

      // Buat objek user lengkap
      const dbUser: User = {
        id: userRaw.id,
        username: userRaw.username,
        email: userRaw.email || '',
        full_name: userRaw.name || '', // PocketBase menggunakan field 'name' bukan 'full_name'
        role: userRaw.role as UserRole,
        is_active: userRaw.is_active !== false, // Default ke true jika tidak diatur
        permissions: permissionsData as PermissionMatrix, // Type assertion for permissions data
        avatar_url: userRaw.avatar ? pb.files.getUrl(userRaw, userRaw.avatar) : undefined,
        created_at: new Date(userRaw.created || userRaw.created_at),
        updated_at: new Date(userRaw.updated || userRaw.updated_at),
        last_active: userRaw.last_active ? new Date(userRaw.last_active) : undefined,
      };

      // Periksa status aktif
      if (!dbUser.is_active) {
        // Pengguna tidak aktif, hapus sesi
        pb.authStore.clear();
        secureStorage.removeItem('currentUser');
        setCurrentUser(null);
        return;
      }

      // Simpan dan perbarui data pengguna
      secureStorage.setItem('currentUser', dbUser);
      setCurrentUser(dbUser);
    },
    []
  );

  // Fungsi untuk mengambil data pengguna saat ini
  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Validasi versi aplikasi untuk memastikan kompatibilitas data tersimpan
      const currentVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
      const storedVersion = secureStorage.getItem<string>('data_version');

      if (!storedVersion || storedVersion !== currentVersion) {
        // Data versi berbeda, clear cache lama
        secureStorage.removeItem('currentUser');
        secureStorage.setItem('data_version', currentVersion);
      }

      // Verifikasi token autentikasi
      if (!pb.authStore.isValid) {
        // Token tidak valid, coba cek di localStorage
        const storedUser = secureStorage.getItem<User>('currentUser');
        if (!storedUser || !pb.authStore.token) {
          // Tidak ada token atau user tersimpan
          secureStorage.removeItem('currentUser');
          setCurrentUser(null);
          return;
        }
      }

      // Ambil ID user dari auth store PocketBase
      const userId = pb.authStore.model?.id;
      if (!userId) {
        setCurrentUser(null);
        return;
      }

      // PRIORITAS: Gunakan data tersimpan jika tersedia dan valid
      // Ini mencegah error 404 jika user sudah berhasil login
      const storedUser = secureStorage.getItem<User>('currentUser');
      if (storedUser && storedUser.id === userId) {
        // Data tersimpan valid, gunakan ini terlebih dahulu
        setCurrentUser(storedUser);

        // Jika offline, langsung return
        if (!isNetworkConnected()) {
          return;
        }

        // Jika online, coba update data dari server di background (tidak blocking)
        try {
          const dbUserRaw = await safeApiCall(() => pb.collection('users').getOne(userId), {
            retries: 1,
            retryDelay: 500,
          });

          if (dbUserRaw) {
            // Update data jika berhasil fetch dari server
            await updateUserData(dbUserRaw, storedUser);
          }
          // Jika gagal, tetap gunakan data tersimpan (sudah di-set di atas)
        } catch {
          // Silent fail - gunakan data tersimpan
          logger.debug('Failed to refresh user data from server, using cached data');
        }
        return;
      }

      // Fallback: Jika tidak ada data tersimpan, fetch dari server menggunakan authRefresh
      // authRefresh lebih aman karena memvalidasi token sekaligus mengambil data user terbaru
      // Jangan retry jika gagal (retries: 0) karena jika 401 berarti token memang tidak valid
      const authData = await safeApiCall(() => pb.collection('users').authRefresh(), {
        retries: 0,
      });

      if (!authData || !authData.record) {
        // Jika authRefresh gagal, berarti token tidak valid
        logger.warn('Auth refresh failed, clearing auth store');
        pb.authStore.clear();
        secureStorage.removeItem('currentUser');
        setCurrentUser(null);
        return;
      }

      const dbUserRaw = authData.record;
      // Update auth store dengan data terbaru (otomatis dilakukan oleh authRefresh, tapi kita pastikan)
      if (authData.token) {
        pb.authStore.save(authData.token, authData.record);
      }

      // Process user data normally
      await updateUserData(dbUserRaw);

      // Penanganan pengguna tamu - tetap ambil permissions dari database seperti user lainnya
      // Guest users now follow the same permission loading logic as regular users

      // Ambil izin pengguna dari koleksi user_management dengan safeApiCall
      const permissionRecord = await safeApiCall(() =>
        pb.collection('user_management').getList(1, 1, {
          filter: `user_id = "${dbUserRaw.id}"`,
        })
      );

      // Jika gagal mendapatkan permissions, gunakan permissions dari data tersimpan
      let permissionsData = {};
      if (permissionRecord && permissionRecord.items.length > 0) {
        const item = permissionRecord.items[0];
        permissionsData = {
          dashboard: item.dashboard || 'NONE',
          cm_plant_operations: item.cm_plant_operations || 'NONE',
          rkc_plant_operations: item.rkc_plant_operations || 'NONE',
          project_management: item.project_management || 'NONE',
          database: item.database || 'NONE',
        };
      } else {
        const storedUser = secureStorage.getItem<User>('currentUser');
        if (storedUser && storedUser.permissions) {
          permissionsData = storedUser.permissions;
        }
      }

      // Buat objek user lengkap
      const dbUser: User = {
        id: dbUserRaw.id,
        username: dbUserRaw.username,
        email: dbUserRaw.email || '',
        full_name: dbUserRaw.name || '', // PocketBase menggunakan field 'name' bukan 'full_name'
        role: dbUserRaw.role as UserRole,
        is_active: dbUserRaw.is_active !== false, // Default ke true jika tidak diatur
        permissions: permissionsData as PermissionMatrix, // Type assertion for permissions data
        avatar_url: dbUserRaw.avatar ? pb.files.getUrl(dbUserRaw, dbUserRaw.avatar) : undefined,
        created_at: new Date(dbUserRaw.created || dbUserRaw.created_at),
        updated_at: new Date(dbUserRaw.updated || dbUserRaw.updated_at),
        last_active: dbUserRaw.last_active ? new Date(dbUserRaw.last_active) : undefined,
      };

      // Periksa status aktif
      if (!dbUser.is_active) {
        // Pengguna tidak aktif, hapus sesi
        pb.authStore.clear();
        secureStorage.removeItem('currentUser');
        setCurrentUser(null);
        return;
      }

      // Simpan dan perbarui data pengguna
      secureStorage.setItem('currentUser', dbUser);
      setCurrentUser(dbUser);
    } catch (err) {
      // Check if user not found (404) - clear auth store
      if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
        logger.warn('User not found in database, clearing auth store');
        pb.authStore.clear();
        secureStorage.removeItem('currentUser');
        setCurrentUser(null);
        setError('User account not found');
        return;
      }

      // Penanganan kesalahan lainnya
      setError(err instanceof Error ? err.message : 'Unknown error');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Variable untuk mencegah multiple refresh
    let lastRefreshTime = 0;
    const minRefreshInterval = 5000; // Minimal 5 detik antara refresh

    // Throttled refresh function with improved error handling
    const throttledRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshTime > minRefreshInterval) {
        lastRefreshTime = now;

        fetchCurrentUser().catch((err) => {
          // Handle auto-cancellation errors silently
          if (err.message?.includes('autocancelled')) {
            logger.debug('User refresh auto-cancelled, will retry later');
            return;
          }

          logger.warn('Error refreshing user data:', err);
        });
      }
    };

    // Ambil data pengguna saat komponen dimuat
    throttledRefresh();

    // Dengarkan perubahan status autentikasi
    const unsubscribeAuth = pb.authStore.onChange(throttledRefresh);

    // Dengarkan perubahan permissions secara real-time
    let unsubscribeUsers: (() => void) | null = null;
    let unsubscribePermissions: (() => void) | null = null;

    if (pb.authStore.model?.id) {
      const currentUserId = pb.authStore.model.id;

      // Subscribe ke collection users untuk perubahan field permissions
      pb.collection('users')
        .subscribe('*', (data) => {
          if (data.record && data.record.id === currentUserId) {
            logger.info('🔄 Current user permissions updated via users collection');
            throttledRefresh();
          }
        })
        .then((unsub) => {
          unsubscribeUsers = unsub;
        })
        .catch((err) => {
          logger.error('❌ Failed to subscribe to users collection:', err);
        });

      // Subscribe ke collection user_management untuk perubahan permissions
      pb.collection('user_management')
        .subscribe('*', (data) => {
          if (data.record && data.record.user_id === currentUserId) {
            logger.info('🔄 Current user permissions updated via user_management collection');
            throttledRefresh();
          }
        })
        .then((unsub) => {
          unsubscribePermissions = unsub;
        })
        .catch((err) => {
          logger.error('❌ Failed to subscribe to user_management collection:', err);
        });
    }

    // Handler untuk event refresh user
    const handleRefreshUser = throttledRefresh;

    // Handler khusus untuk perubahan permissions
    const handlePermissionsChanged = (event: CustomEvent) => {
      const { userId } = event.detail;
      // Only refresh if the permissions changed for the current user
      if (userId === pb.authStore.model?.id) {
        throttledRefresh();
      }
    };

    // Setup event listeners, hanya gunakan refreshUser untuk memaksakan refresh
    // dan authStateChanged untuk sinkronisasi login/logout
    window.addEventListener('refreshUser', handleRefreshUser);
    window.addEventListener('authStateChanged', handleRefreshUser);
    window.addEventListener('user-permissions-changed', handlePermissionsChanged);

    // Event listener untuk koneksi jaringan
    const handleOnline = () => {
      // Refresh data jika koneksi kembali
      setTimeout(throttledRefresh, 1000);
    };
    window.addEventListener('online', handleOnline);

    return () => {
      // Cleanup
      if (typeof unsubscribeAuth === 'function') {
        unsubscribeAuth();
      }
      if (unsubscribeUsers) {
        unsubscribeUsers();
      }
      if (unsubscribePermissions) {
        unsubscribePermissions();
      }
      window.removeEventListener('refreshUser', handleRefreshUser);
      window.removeEventListener('authStateChanged', handleRefreshUser);
      window.removeEventListener('user-permissions-changed', handlePermissionsChanged);
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchCurrentUser]);

  // Function untuk logout - clear SIPOMA domain data (SIMPLIFIED)
  const logout = useCallback(async () => {
    try {
      try {
        if (pb.authStore.model?.id) {
          try {
            const records = await pb.collection('user_online').getList(1, 1, {
              filter: `user_id = "${pb.authStore.model.id}"`,
            });
            if (records.items.length > 0) {
              await pb.collection('user_online').delete(records.items[0].id);
            }
          } catch (delError) {
            logger.warn('Failed to delete user_online record during logout:', delError);
          }
        }
      } catch (e) {
        // Ignore
      }

      // Clear PocketBase auth
      pb.authStore.clear();
      secureStorage.removeItem('currentUser');
      setCurrentUser(null);
      setError(null);
      setLoading(false);

      // Clear SIPOMA domain data (localhost & sipoma.site)
      await clearBrowserData();

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('authStateChanged'));
    } catch (error) {
      logger.error('Error during logout:', error);
      // Fallback - tetap lakukan logout walaupun clear cache gagal
      pb.authStore.clear();
      secureStorage.removeItem('currentUser');
      setCurrentUser(null);
      setError(null);
      setLoading(false);
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      // Navigate anyway
      window.location.href = '/login';
    }
  }, []);

  return { currentUser, loading, error, logout };
};
