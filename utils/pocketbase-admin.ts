import PocketBase from 'pocketbase';
import { getPocketbaseUrl } from './pocketbase-simple';

let adminPbInstance: PocketBase | null = null;

/**
 * Get an authenticated Admin PocketBase instance.
 * Useful for operations requiring elevated privileges (e.g. User Management, fetching sensitive fields like email).
 */
export const getAdminPb = async (): Promise<PocketBase> => {
  // Return existing valid instance
  if (adminPbInstance?.authStore.isValid) {
    return adminPbInstance;
  }

  // Create new instance
  const pb = new PocketBase(getPocketbaseUrl());
  pb.autoCancellation(false);

  // Credentials
  const email = import.meta.env.VITE_POCKETBASE_EMAIL || 'ardila.firdaus@sig.id';
  const password = import.meta.env.VITE_POCKETBASE_PASSWORD || 'makassar@270989';

  try {
    await pb.admins.authWithPassword(email, password);
    adminPbInstance = pb;
    // eslint-disable-next-line no-console
    console.log('[AdminPB] Authenticated as Admin successfully');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[AdminPB] Failed to authenticate as Admin:', err);
    // Return unauthenticated instance as fallback (though it might fail for privileged ops)
  }

  return pb;
};
