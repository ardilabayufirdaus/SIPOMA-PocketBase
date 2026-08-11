import PocketBase from 'pocketbase';
import { getPocketbaseUrl } from './pocketbase-simple';
import { logger } from './logger';

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

  // Credentials from environment variables only (no hardcoded secrets in source)
  const email = import.meta.env.VITE_POCKETBASE_EMAIL;
  const password = import.meta.env.VITE_POCKETBASE_PASSWORD;

  if (email && password && !email.includes('your_email') && !password.includes('your_secure_password')) {
    try {
      await pb.admins.authWithPassword(email, password);
      adminPbInstance = pb;
      logger.info('[AdminPB] Authenticated as Admin successfully');
    } catch (err) {
      logger.error('[AdminPB] Failed to authenticate as Admin:', err);
    }
  } else {
    logger.warn('[AdminPB] Admin credentials not provided in environment variables.');
  }

  return pb;
};
