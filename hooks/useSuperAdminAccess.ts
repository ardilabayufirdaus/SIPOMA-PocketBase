import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { secureStorage } from '../utils/secureStorage';
import { User, PermissionMatrix } from '../types';

/**
 * Custom hook untuk memastikan hak akses Super Admin
 * diproses dengan benar pada mode development
 */
export const useSuperAdminAccess = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    // Cek jika user adalah Super Admin
    if (user && user.role === 'Super Admin') {
      // Quiet logs for production
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log("[Development Mode] Overriding Super Admin permissions");
      }
      
      // Set hard-coded permission matrix untuk Super Admin
      // di memory tanpa perlu permisi dari database
      const completePermissions = {
        dashboard: 'ADMIN' as const,
        inspection: 'ADMIN' as const,
        project_management: 'ADMIN' as const,
        system_settings: 'ADMIN' as const,
        user_management: 'ADMIN' as const,
        packing_plant: 'ADMIN' as const,
        plant_operations: {
          'Tonasa 2/3': {
            '220': 'ADMIN' as const,
            '320': 'ADMIN' as const
          },
          'Tonasa 4': {
            '419': 'ADMIN' as const,
            '420': 'ADMIN' as const
          },
          'Tonasa 5': {
            '552': 'ADMIN' as const,
            '553': 'ADMIN' as const
          }
        }
      } as PermissionMatrix;
      
      // Override permissions user di local state
      if (user.permissions) {
        // Gabungkan dengan permissions yang sudah ada
        Object.keys(completePermissions).forEach(key => {
          // @ts-expect-error - Diperlukan untuk override permission karena typing issues
          user.permissions[key] = completePermissions[key];
        });
      } else {
        // Set permissions jika belum ada
        // @ts-expect-error - Diperlukan untuk override permission karena typing issues
        user.permissions = completePermissions;
      }
      
      // Update secureStorage currentUser juga
      const currentUser = secureStorage.getItem<User>('currentUser');
      if (currentUser) {
        currentUser.permissions = completePermissions;
        secureStorage.setItem('currentUser', currentUser);
      }
      
      // Simpan juga ke localStorage untuk persistent PocketBase auth
      try {
        const storedUser = JSON.parse(localStorage.getItem('pocketbase_auth') || '{}');
        if (storedUser.model) {
          storedUser.model.permissions = completePermissions;
          localStorage.setItem('pocketbase_auth', JSON.stringify(storedUser));
          
          // Trigger event untuk memberitahu aplikasi bahwa auth telah berubah
          window.dispatchEvent(new Event('authStateChanged'));
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error("[Development Mode] Error updating permissions:", e);
        }
      }
      
      // Log berhasil
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log("[Development Mode] Super Admin permissions override complete");
      }
    }
  }, [user]);

  return { 
    isSuperAdmin: user?.role === 'Super Admin',
    hasFullAccess: user?.role === 'Super Admin'
  };
};