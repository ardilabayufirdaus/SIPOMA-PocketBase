import CryptoJS from 'crypto-js';

// Simple encryption key - in production, this should be derived from user-specific data
const ENCRYPTION_KEY = 'sipoma-session-key-2024';

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
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.warn('Failed to decrypt data:', error);
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
      if (!decrypted) return null;

      return JSON.parse(decrypted) as T;
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
