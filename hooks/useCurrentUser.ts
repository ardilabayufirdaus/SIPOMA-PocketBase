import { useState, useEffect, useCallback } from 'react';
import { User, UserRole, PermissionMatrix } from '../types';
import { pb } from '../utils/pocketbase';
import { secureStorage } from '../utils/secureStorage';
import { safeApiCall, isNetworkConnected } from '../utils/connectionCheck';
import { logger } from '../utils/logger';

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk mengambil data pengguna saat ini
  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

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

      // Periksa koneksi jaringan terlebih dahulu
      if (!isNetworkConnected()) {
        // Gunakan data tersimpan jika offline
        const storedUser = secureStorage.getItem<User>('currentUser');
        if (storedUser && storedUser.id === userId) {
          setCurrentUser(storedUser);
          return;
        }
      }

      // Ambil data user langsung dari PocketBase dengan safeApiCall dan retry
      const dbUserRaw = await safeApiCall(
        () => pb.collection('users').getOne(userId),
        { retries: 2, retryDelay: 1000 } // Coba hingga 2 kali dengan delay 1 detik
      );

      // Jika tidak bisa mendapatkan data dari server, gunakan data tersimpan
      if (!dbUserRaw) {
        const storedUser = secureStorage.getItem<User>('currentUser');
        if (storedUser && storedUser.id === userId) {
          setCurrentUser(storedUser);
          return;
        }
        setCurrentUser(null);
        return;
      }

      // Penanganan pengguna tamu
      if (dbUserRaw.role === 'Guest' || userId === 'guest-dev-user') {
        const guestUser: User = {
          id: dbUserRaw.id,
          username: dbUserRaw.username,
          email: '',
          full_name: dbUserRaw.name || 'Guest User',
          role: dbUserRaw.role as UserRole,
          is_active: true,
          avatar_url: '',
          created_at: new Date(),
          updated_at: new Date(),
          permissions: {} as PermissionMatrix, // Empty permissions for Guest user
        };

        setCurrentUser(guestUser);
        secureStorage.setItem('currentUser', guestUser);
        return;
      }

      // Ambil izin pengguna dari koleksi user_permissions dengan safeApiCall
      const userPermissions = await safeApiCall(() =>
        pb.collection('user_permissions').getList(1, 100, {
          filter: `user_id = "${dbUserRaw.id}"`,
          expand: 'permissions',
        })
      );

      // Jika gagal mendapatkan permissions, gunakan permissions dari data tersimpan
      let permissionsData = {};
      if (userPermissions) {
        // Bangun matriks izin menggunakan data langsung dari user_permissions
        const { buildPermissionMatrix } = await import('../utils/permissionUtils');
        permissionsData = buildPermissionMatrix(userPermissions.items);
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
      // Penanganan kesalahan
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
    const unsubscribe = pb.authStore.onChange(throttledRefresh);

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
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      window.removeEventListener('refreshUser', handleRefreshUser);
      window.removeEventListener('authStateChanged', handleRefreshUser);
      window.removeEventListener('user-permissions-changed', handlePermissionsChanged);
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchCurrentUser]);

  // Function untuk logout
  const logout = useCallback(() => {
    pb.authStore.clear();
    secureStorage.removeItem('currentUser');
    setCurrentUser(null);
    setError(null);
    setLoading(false);

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('authStateChanged'));
  }, []);

  return { currentUser, loading, error, logout };
};
