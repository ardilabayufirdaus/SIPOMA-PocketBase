import { MinimalUser } from '../hooks/useAuthSecure';
import { secureStorage } from '../utils/secureStorage';

/**
 * Service untuk login sebagai guest user tanpa menyimpan permissions di localStorage
 */
export const loginAsGuest = async (): Promise<boolean> => {
  try {
    // Generate random session ID
    const sessionId = `guest-${Date.now()}`;

    // Siapkan data user guest minimal (tanpa permissions)
    const guestUser: MinimalUser = {
      id: sessionId,
      username: 'guest',
      full_name: 'Guest User',
      role: 'Guest',
      is_active: true,
      last_active: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Simpan guest user di localStorage tanpa permissions
    secureStorage.setItem('currentUser', guestUser);

    // Buat record di server (opsional)
    // Uncomment ini jika perlu mencatat guest session di server
    /*
    try {
      await pb.collection('guest_sessions').create({
        session_id: sessionId,
        ip_address: '', // Bisa didapatkan dari service terpisah
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Silently ignore server errors for guest mode
    }
    */

    // Dispatch event untuk memberitahu komponen lain
    window.dispatchEvent(new CustomEvent('authStateChanged'));

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Guest login error:', error);
    return false;
  }
};

