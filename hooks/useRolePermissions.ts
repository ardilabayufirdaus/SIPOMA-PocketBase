import { useState, useCallback, useEffect } from 'react';
import { pb } from '../utils/pocketbase-simple';
import { UserRole, PermissionMatrix } from '../types';
import useErrorHandler from './useErrorHandler';

// Merepresentasikan satu baris data dari tabel `role_permissions`
export interface RolePermission extends PermissionMatrix {
  id: number;
  role: UserRole;
}

/**
 * Hook untuk mengelola izin default untuk setiap peran pengguna.
 * Berinteraksi dengan tabel `role_permissions`.
 */
export const useRolePermissions = () => {
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  const fetchRolePermissions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await pb.collection('role_permissions').getFullList({
        sort: 'role',
      });

      setRolePermissions((result || []) as unknown as RolePermission[]);
    } catch (err) {
      handleError(err, 'Error fetching role permissions');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    fetchRolePermissions();
  }, [fetchRolePermissions]);

  const updateRolePermission = useCallback(
    async (role: UserRole, updates: Partial<PermissionMatrix>) => {
      setLoading(true);
      try {
        const existing = await pb.collection('role_permissions').getFirstListItem(`role="${role}"`);

        if (existing) {
          await pb.collection('role_permissions').update(existing.id, updates);
        }

        // Ambil ulang data untuk memastikan UI sinkron
        await fetchRolePermissions();
      } catch (err) {
        handleError(err, `Error updating permissions for role: ${role}`);
        // Lemparkan kembali error agar UI bisa menanganinya (misal: menampilkan notifikasi gagal)
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [handleError, fetchRolePermissions]
  );

  return {
    rolePermissions,
    loading,
    updateRolePermission,
    refresh: fetchRolePermissions,
  };
};

