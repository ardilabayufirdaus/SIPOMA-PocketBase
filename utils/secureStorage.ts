import CryptoJS from 'crypto-js';

// Generate secure encryption key from environment and browser fingerprint
const generateSecureKey = (): string => {
  // Base key from environment variable (should be set in .env)
  const envKey = import.meta.env.VITE_ENCRYPTION_SEED || 'sipoma-default-seed';

  // Add environment consistency flag - untuk konsistensi antara mode development dan production
  const isAuthRequired = import.meta.env.VITE_AUTH_REQUIRED === 'true';

  // Browser fingerprint components
  const browserFingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    // Hapus date untuk konsistensi antara mode development dan preview
    isAuthRequired ? 'auth-required' : 'auth-optional',
    window.location.origin,
  ].join('|');

  // Derive key using PBKDF2 with salt
  const salt = CryptoJS.SHA256(browserFingerprint).toString();
  const derivedKey = CryptoJS.PBKDF2(envKey, salt, {
    keySize: 256 / 32,
    iterations: 1000,
  }).toString();

  return derivedKey;
};

const ENCRYPTION_KEY = generateSecureKey();

export class SecureStorage {
  private static instance: SecureStorage;

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  }

  decrypt(encryptedData: string): string | null {
    try {
      // Validasi input terlebih dahulu
      if (!encryptedData || typeof encryptedData !== 'string') {
        console.warn('Failed to decrypt: Invalid input data');
        return null;
      }

      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);

      try {
        // Pisahkan proses toString ke dalam try-catch terpisah
        // untuk menangkap khusus error Malformed UTF-8
        const result = bytes.toString(CryptoJS.enc.Utf8);

        // Validasi hasil dekripsi adalah string valid
        if (result && result.length > 0) {
          return result;
        } else {
          console.warn('Failed to decrypt: Empty result');
          return null;
        }
      } catch (utfError) {
        // Error spesifik untuk malformed UTF-8 data
        console.warn('Failed to decrypt data: Malformed UTF-8 data', utfError);

        // Hapus data yang rusak
        this.removeCorruptedData();
        return null;
      }
    } catch (error) {
      // Error umum dalam proses dekripsi
      console.warn('Failed to decrypt data:', error);

      // Hapus data yang rusak
      this.removeCorruptedData();
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      const jsonString = JSON.stringify(value);
      const encrypted = this.encrypt(jsonString);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to store encrypted data:', error);
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = this.decrypt(encrypted);
      if (!decrypted) {
        // Jika dekripsi gagal, coba ambil data dari localStorage tanpa dekripsi
        // (fallback untuk backward compatibility)
        try {
          const plainItem = localStorage.getItem(`plain_${key}`);
          if (plainItem) {
            const parsed = JSON.parse(plainItem);

            // Jika berhasil, migrasi data ke format terenkripsi
            this.setItem(key, parsed);

            return parsed as T;
          }
        } catch (fallbackError) {
          console.warn('Fallback retrieval failed:', fallbackError);
        }
        return null;
      }

      try {
        return JSON.parse(decrypted) as T;
      } catch (parseError) {
        console.warn('Failed to parse decrypted data:', parseError);
        this.removeItem(key);
        return null;
      }
    } catch (error) {
      console.warn('Failed to retrieve encrypted data:', error);
      // Clear corrupted data
      this.removeItem(key);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  // Hapus data penting yang mungkin rusak
  removeCorruptedData(): void {
    // Hapus data autentikasi yang mungkin rusak
    localStorage.removeItem('currentUser');
    localStorage.removeItem('pb_auth');

    // Tambahkan flag untuk menandai reset
    sessionStorage.setItem('auth_reset', 'true');
  }

  clear(): void {
    // Only clear our encrypted items
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('secure_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const secureStorage = SecureStorage.getInstance();
