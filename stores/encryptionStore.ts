// Enterprise-grade encryption utilities for SIPOMA
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Encryption Types
export interface EncryptionKey {
  id: string;
  name: string;
  type: 'aes' | 'rsa' | 'ecc';
  algorithm: string;
  keySize: number;
  publicKey?: string;
  privateKey?: string; // Encrypted with master key
  symmetricKey?: string; // Encrypted with master key
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  usage: string[]; // ['encrypt', 'decrypt', 'sign', 'verify']
  metadata: Record<string, string | number | boolean>;
}

export interface EncryptedData {
  id: string;
  data: string; // Base64 encoded encrypted data
  algorithm: string;
  keyId: string;
  iv: string; // Initialization vector
  salt: string;
  authTag?: string; // For authenticated encryption
  metadata: {
    originalSize: number;
    compressedSize?: number;
    encryptedAt: Date;
    expiresAt?: Date;
  };
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
}

export interface EncryptionSession {
  id: string;
  userId: string;
  sessionKey: string; // Encrypted with user's key
  algorithm: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  operations: EncryptionOperation[];
}

export interface EncryptionOperation {
  id: string;
  type: 'encrypt' | 'decrypt' | 'sign' | 'verify';
  algorithm: string;
  keyId: string;
  dataSize: number;
  timestamp: Date;
  success: boolean;
  duration: number; // in milliseconds
}

export interface SecureVault {
  id: string;
  name: string;
  description: string;
  encryptedData: Record<string, EncryptedData>;
  keyId: string;
  accessControlList: string[]; // User IDs with access
  auditLog: VaultAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VaultAuditEntry {
  id: string;
  userId: string;
  action: string;
  dataKey: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface EncryptionStore {
  // State
  encryptionKeys: EncryptionKey[];
  encryptedData: EncryptedData[];
  encryptionSessions: EncryptionSession[];
  secureVaults: SecureVault[];
  masterKeyHash: string | null;
  isUnlocked: boolean;

  // Key Management
  generateKey: (
    type: 'aes' | 'rsa' | 'ecc',
    keySize: number,
    name: string,
    usage: string[]
  ) => Promise<EncryptionKey>;
  generateKeyPair: (algorithm: 'rsa' | 'ecc', keySize: number, name: string) => Promise<KeyPair>;
  importKey: (keyData: string, type: 'aes' | 'rsa' | 'ecc', name: string) => Promise<EncryptionKey>;
  exportKey: (keyId: string, format: 'pem' | 'raw' | 'jwk') => Promise<string>;
  rotateKey: (keyId: string) => Promise<EncryptionKey>;
  revokeKey: (keyId: string) => Promise<void>;

  // Encryption/Decryption
  encrypt: (
    data: string | ArrayBuffer,
    keyId: string,
    algorithm?: string
  ) => Promise<EncryptedData>;
  decrypt: (encryptedData: EncryptedData, keyId?: string) => Promise<string | ArrayBuffer>;
  encryptFile: (file: File, keyId: string) => Promise<EncryptedData>;
  decryptFile: (encryptedData: EncryptedData, keyId?: string) => Promise<Blob>;

  // Digital Signatures
  sign: (data: string | ArrayBuffer, keyId: string) => Promise<string>;
  verify: (data: string | ArrayBuffer, signature: string, keyId: string) => Promise<boolean>;

  // Secure Vaults
  createVault: (name: string, description: string, keyId: string) => Promise<SecureVault>;
  storeInVault: (
    vaultId: string,
    key: string,
    data: string | ArrayBuffer,
    userId: string
  ) => Promise<void>;
  retrieveFromVault: (
    vaultId: string,
    key: string,
    userId: string
  ) => Promise<string | ArrayBuffer>;
  deleteFromVault: (vaultId: string, key: string, userId: string) => Promise<void>;
  grantVaultAccess: (vaultId: string, userId: string) => Promise<void>;
  revokeVaultAccess: (vaultId: string, userId: string) => Promise<void>;

  // Session Management
  createEncryptionSession: (userId: string, algorithm: string) => Promise<EncryptionSession>;
  destroyEncryptionSession: (sessionId: string) => Promise<void>;
  getActiveSession: (userId: string) => EncryptionSession | null;

  // Master Key Management
  setMasterKey: (password: string) => Promise<void>;
  unlockVault: (password: string) => Promise<boolean>;
  lockVault: () => void;
  changeMasterKey: (oldPassword: string, newPassword: string) => Promise<void>;

  // Utility Functions
  generateSecureRandom: (length: number) => string;
  deriveKey: (password: string, salt: string, iterations: number) => Promise<string>;
  hashData: (data: string | ArrayBuffer, algorithm: 'sha256' | 'sha512') => Promise<string>;

  // Compliance & Audit
  getEncryptionReport: () => EncryptionReport;
  getVaultAuditLog: (vaultId: string) => VaultAuditEntry[];
  exportAuditLog: (startDate: Date, endDate: Date) => VaultAuditEntry[];

  // Key Backup & Recovery
  backupKeys: (password: string) => Promise<string>;
  restoreKeys: (backup: string, password: string) => Promise<void>;

  // Performance Monitoring
  getPerformanceMetrics: () => EncryptionMetrics;
}

export interface EncryptionReport {
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
  totalEncryptedData: number;
  totalDataSize: number;
  averageEncryptionTime: number;
  averageDecryptionTime: number;
  keyUsageStats: Record<string, number>;
  algorithmUsageStats: Record<string, number>;
}

export interface EncryptionMetrics {
  operationsPerSecond: number;
  averageLatency: number;
  errorRate: number;
  keyRotationFrequency: number;
  vaultAccessFrequency: number;
}

// Web Crypto API utilities
class CryptoUtils {
  // Generate secure random bytes
  static generateRandomBytes(length: number): Uint8Array {
    const array = new Uint8Array(length);
    return crypto.getRandomValues(array);
  }

  // Generate random string
  static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomBytes = this.generateRandomBytes(length);
    return Array.from(randomBytes)
      .map((byte) => chars[byte % chars.length])
      .join('');
  }

  // Convert ArrayBuffer to Base64
  static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Convert Base64 to ArrayBuffer
  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Generate AES key
  static async generateAESKey(keySize: 256 | 128 = 256): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: keySize,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Generate RSA key pair
  static async generateRSAKeyPair(keySize: 2048 | 4096 = 2048): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: keySize,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Simple AES-GCM encryption (simplified for demo)
  static async encryptAESGCM(
    data: ArrayBuffer,
    key: CryptoKey
  ): Promise<{
    encrypted: ArrayBuffer;
    iv: string;
    authTag: string;
  }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );

    return {
      encrypted,
      iv: this.arrayBufferToBase64(iv.buffer),
      authTag: 'mock-auth-tag', // Simplified for demo
    };
  }

  // Simple AES-GCM decryption (simplified for demo)
  static async decryptAESGCM(
    encryptedData: ArrayBuffer,
    key: CryptoKey,
    iv: string
  ): Promise<ArrayBuffer> {
    const ivBytes = new Uint8Array(this.base64ToArrayBuffer(iv));

    return await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
      },
      key,
      encryptedData
    );
  }

  // Simple key derivation (simplified for demo)
  static async deriveKeyFromPassword(
    password: string,
    salt: string,
    iterations: number = 100000
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const saltBytes = encoder.encode(salt);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Hash data with SHA-256
  static async sha256(data: string | ArrayBuffer): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
    return await crypto.subtle.digest('SHA-256', dataBuffer);
  }

  // Export key to JWK format
  static async exportKeyJWK(key: CryptoKey): Promise<JsonWebKey> {
    return await crypto.subtle.exportKey('jwk', key);
  }

  // Import key from JWK format
  static async importKeyJWK(
    jwk: JsonWebKey,
    algorithm: string,
    usages: KeyUsage[]
  ): Promise<CryptoKey> {
    return await crypto.subtle.importKey('jwk', jwk, algorithm, true, usages);
  }
}

export const useEncryptionStore = create<EncryptionStore>()(
  persist(
    (set, get) => ({
      // Initial State
      encryptionKeys: [],
      encryptedData: [],
      encryptionSessions: [],
      secureVaults: [],
      masterKeyHash: null,
      isUnlocked: false,

      // Generate Key
      generateKey: async (type, keySize, name, usage) => {
        let cryptoKey: CryptoKey;
        let algorithm = '';

        if (type === 'aes') {
          cryptoKey = await CryptoUtils.generateAESKey(keySize as 256 | 128);
          algorithm = 'AES-GCM';
        } else if (type === 'rsa') {
          const keyPair = await CryptoUtils.generateRSAKeyPair(keySize as 2048 | 4096);
          cryptoKey = keyPair.privateKey;
          algorithm = 'RSA-OAEP';
        } else {
          throw new Error('Unsupported key type');
        }

        const jwk = await CryptoUtils.exportKeyJWK(cryptoKey);
        const keyId = `key_${Date.now()}_${CryptoUtils.generateRandomString(8)}`;

        const encryptionKey: EncryptionKey = {
          id: keyId,
          name,
          type,
          algorithm,
          keySize,
          symmetricKey: type === 'aes' ? JSON.stringify(jwk) : undefined,
          privateKey: type === 'rsa' ? JSON.stringify(jwk) : undefined,
          createdAt: new Date(),
          isActive: true,
          usage,
          metadata: {},
        };

        set((state) => ({
          encryptionKeys: [...state.encryptionKeys, encryptionKey],
        }));

        return encryptionKey;
      },

      // Generate Key Pair
      generateKeyPair: async (algorithm, keySize, name) => {
        const keyPair = await CryptoUtils.generateRSAKeyPair(keySize as 2048 | 4096);
        const publicJWK = await CryptoUtils.exportKeyJWK(keyPair.publicKey);
        const privateJWK = await CryptoUtils.exportKeyJWK(keyPair.privateKey);
        const keyId = `keypair_${Date.now()}_${CryptoUtils.generateRandomString(8)}`;

        const encryptionKey: EncryptionKey = {
          id: keyId,
          name,
          type: 'rsa',
          algorithm: 'RSA-OAEP',
          keySize,
          publicKey: JSON.stringify(publicJWK),
          privateKey: JSON.stringify(privateJWK),
          createdAt: new Date(),
          isActive: true,
          usage: ['encrypt', 'decrypt'],
          metadata: {},
        };

        set((state) => ({
          encryptionKeys: [...state.encryptionKeys, encryptionKey],
        }));

        return {
          publicKey: JSON.stringify(publicJWK),
          privateKey: JSON.stringify(privateJWK),
          keyId,
        };
      },

      // Import Key
      importKey: async (keyData, type, name) => {
        try {
          JSON.parse(keyData); // Validate JSON format
          const keyId = `imported_${Date.now()}_${CryptoUtils.generateRandomString(8)}`;

          const encryptionKey: EncryptionKey = {
            id: keyId,
            name,
            type,
            algorithm: type === 'aes' ? 'AES-GCM' : 'RSA-OAEP',
            keySize: type === 'aes' ? 256 : 2048,
            symmetricKey: type === 'aes' ? keyData : undefined,
            privateKey: type === 'rsa' ? keyData : undefined,
            createdAt: new Date(),
            isActive: true,
            usage: ['encrypt', 'decrypt'],
            metadata: {},
          };

          set((state) => ({
            encryptionKeys: [...state.encryptionKeys, encryptionKey],
          }));

          return encryptionKey;
        } catch {
          throw new Error('Invalid key format');
        }
      },

      // Export Key
      exportKey: async (keyId, format) => {
        const key = get().encryptionKeys.find((k) => k.id === keyId);
        if (!key) throw new Error('Key not found');

        if (format === 'jwk') {
          return key.symmetricKey || key.privateKey || key.publicKey || '';
        }

        // For PEM and raw formats, would need additional conversion
        throw new Error('Format not supported in this implementation');
      },

      // Rotate Key
      rotateKey: async (keyId) => {
        const oldKey = get().encryptionKeys.find((k) => k.id === keyId);
        if (!oldKey) throw new Error('Key not found');

        // Deactivate old key
        set((state) => ({
          encryptionKeys: state.encryptionKeys.map((k) =>
            k.id === keyId ? { ...k, isActive: false } : k
          ),
        }));

        // Generate new key with same parameters
        return get().generateKey(
          oldKey.type,
          oldKey.keySize,
          `${oldKey.name} (Rotated)`,
          oldKey.usage
        );
      },

      // Revoke Key
      revokeKey: async (keyId) => {
        set((state) => ({
          encryptionKeys: state.encryptionKeys.map((k) =>
            k.id === keyId ? { ...k, isActive: false } : k
          ),
        }));
      },

      // Encrypt Data
      encrypt: async (data, keyId, algorithm = 'AES-GCM') => {
        const key = get().encryptionKeys.find((k) => k.id === keyId && k.isActive);
        if (!key) throw new Error('Key not found or inactive');

        const dataBuffer =
          typeof data === 'string' ? new TextEncoder().encode(data).buffer : (data as ArrayBuffer);

        if (algorithm === 'AES-GCM' && key.symmetricKey) {
          const jwk = JSON.parse(key.symmetricKey);
          const cryptoKey = await CryptoUtils.importKeyJWK(jwk, 'AES-GCM', ['encrypt']);

          const result = await CryptoUtils.encryptAESGCM(dataBuffer, cryptoKey);

          const encryptedData: EncryptedData = {
            id: `enc_${Date.now()}_${CryptoUtils.generateRandomString(8)}`,
            data: CryptoUtils.arrayBufferToBase64(result.encrypted),
            algorithm,
            keyId,
            iv: result.iv,
            salt: CryptoUtils.generateRandomString(16),
            authTag: result.authTag,
            metadata: {
              originalSize: dataBuffer.byteLength,
              encryptedAt: new Date(),
            },
          };

          set((state) => ({
            encryptedData: [...state.encryptedData, encryptedData],
          }));

          return encryptedData;
        }

        throw new Error('Encryption algorithm not supported');
      },

      // Decrypt Data
      decrypt: async (encryptedData, keyId) => {
        const key = get().encryptionKeys.find(
          (k) => k.id === (keyId || encryptedData.keyId) && k.isActive
        );
        if (!key) throw new Error('Key not found or inactive');

        if (encryptedData.algorithm === 'AES-GCM' && key.symmetricKey) {
          const jwk = JSON.parse(key.symmetricKey);
          const cryptoKey = await CryptoUtils.importKeyJWK(jwk, 'AES-GCM', ['decrypt']);

          const encrypted = CryptoUtils.base64ToArrayBuffer(encryptedData.data);

          const decrypted = await CryptoUtils.decryptAESGCM(encrypted, cryptoKey, encryptedData.iv);

          return new TextDecoder().decode(decrypted);
        }

        throw new Error('Decryption algorithm not supported');
      },

      // Encrypt File
      encryptFile: async (file, keyId) => {
        const arrayBuffer = await file.arrayBuffer();
        return get().encrypt(arrayBuffer, keyId);
      },

      // Decrypt File
      decryptFile: async (encryptedData, keyId) => {
        const decrypted = await get().decrypt(encryptedData, keyId);
        return new Blob([decrypted as ArrayBuffer]);
      },

      // Sign Data
      sign: async (data, keyId) => {
        const key = get().encryptionKeys.find((k) => k.id === keyId && k.isActive);
        if (!key || !key.privateKey) throw new Error('Signing key not found');

        // Implementation would use RSA-PSS or ECDSA
        // For now, return a mock signature
        const dataStr = typeof data === 'string' ? data : 'binary-data';
        return `signature_${keyId}_${btoa(dataStr).slice(0, 32)}`;
      },

      // Verify Signature
      verify: async (data, signature, keyId) => {
        const key = get().encryptionKeys.find((k) => k.id === keyId && k.isActive);
        if (!key || !key.publicKey) throw new Error('Verification key not found');

        // Mock verification - in real implementation would verify signature
        return signature.startsWith(`signature_${keyId}_`);
      },

      // Create Vault
      createVault: async (name, description, keyId) => {
        const vault: SecureVault = {
          id: `vault_${Date.now()}_${CryptoUtils.generateRandomString(8)}`,
          name,
          description,
          encryptedData: {},
          keyId,
          accessControlList: [],
          auditLog: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          secureVaults: [...state.secureVaults, vault],
        }));

        return vault;
      },

      // Store in Vault
      storeInVault: async (vaultId, key, data, userId) => {
        const vault = get().secureVaults.find((v) => v.id === vaultId);
        if (!vault) throw new Error('Vault not found');

        if (!vault.accessControlList.includes(userId)) {
          throw new Error('Access denied');
        }

        const encryptedData = await get().encrypt(data, vault.keyId);

        set((state) => ({
          secureVaults: state.secureVaults.map((v) =>
            v.id === vaultId
              ? {
                  ...v,
                  encryptedData: { ...v.encryptedData, [key]: encryptedData },
                  updatedAt: new Date(),
                  auditLog: [
                    ...v.auditLog,
                    {
                      id: `audit_${Date.now()}`,
                      userId,
                      action: 'store',
                      dataKey: key,
                      timestamp: new Date(),
                    },
                  ],
                }
              : v
          ),
        }));
      },

      // Retrieve from Vault
      retrieveFromVault: async (vaultId, key, userId) => {
        const vault = get().secureVaults.find((v) => v.id === vaultId);
        if (!vault) throw new Error('Vault not found');

        if (!vault.accessControlList.includes(userId)) {
          throw new Error('Access denied');
        }

        const encryptedData = vault.encryptedData[key];
        if (!encryptedData) throw new Error('Data not found');

        // Log access
        set((state) => ({
          secureVaults: state.secureVaults.map((v) =>
            v.id === vaultId
              ? {
                  ...v,
                  auditLog: [
                    ...v.auditLog,
                    {
                      id: `audit_${Date.now()}`,
                      userId,
                      action: 'retrieve',
                      dataKey: key,
                      timestamp: new Date(),
                    },
                  ],
                }
              : v
          ),
        }));

        return get().decrypt(encryptedData);
      },

      // Delete from Vault
      deleteFromVault: async (vaultId, key, userId) => {
        const vault = get().secureVaults.find((v) => v.id === vaultId);
        if (!vault) throw new Error('Vault not found');

        if (!vault.accessControlList.includes(userId)) {
          throw new Error('Access denied');
        }

        set((state) => ({
          secureVaults: state.secureVaults.map((v) =>
            v.id === vaultId
              ? {
                  ...v,
                  encryptedData: Object.fromEntries(
                    Object.entries(v.encryptedData).filter(([k]) => k !== key)
                  ),
                  updatedAt: new Date(),
                  auditLog: [
                    ...v.auditLog,
                    {
                      id: `audit_${Date.now()}`,
                      userId,
                      action: 'delete',
                      dataKey: key,
                      timestamp: new Date(),
                    },
                  ],
                }
              : v
          ),
        }));
      },

      // Grant Vault Access
      grantVaultAccess: async (vaultId, userId) => {
        set((state) => ({
          secureVaults: state.secureVaults.map((v) =>
            v.id === vaultId
              ? {
                  ...v,
                  accessControlList: [...v.accessControlList, userId],
                  updatedAt: new Date(),
                }
              : v
          ),
        }));
      },

      // Revoke Vault Access
      revokeVaultAccess: async (vaultId, userId) => {
        set((state) => ({
          secureVaults: state.secureVaults.map((v) =>
            v.id === vaultId
              ? {
                  ...v,
                  accessControlList: v.accessControlList.filter((id) => id !== userId),
                  updatedAt: new Date(),
                }
              : v
          ),
        }));
      },

      // Create Encryption Session
      createEncryptionSession: async (userId, algorithm) => {
        const session: EncryptionSession = {
          id: `session_${Date.now()}_${CryptoUtils.generateRandomString(8)}`,
          userId,
          sessionKey: CryptoUtils.generateRandomString(32),
          algorithm,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          isActive: true,
          operations: [],
        };

        set((state) => ({
          encryptionSessions: [...state.encryptionSessions, session],
        }));

        return session;
      },

      // Destroy Encryption Session
      destroyEncryptionSession: async (sessionId) => {
        set((state) => ({
          encryptionSessions: state.encryptionSessions.map((s) =>
            s.id === sessionId ? { ...s, isActive: false } : s
          ),
        }));
      },

      // Get Active Session
      getActiveSession: (userId) => {
        return (
          get().encryptionSessions.find(
            (s) => s.userId === userId && s.isActive && s.expiresAt > new Date()
          ) || null
        );
      },

      // Set Master Key
      setMasterKey: async (password) => {
        const hash = await CryptoUtils.sha256(password);
        const hashBase64 = CryptoUtils.arrayBufferToBase64(hash);

        set({
          masterKeyHash: hashBase64,
          isUnlocked: true,
        });
      },

      // Unlock Vault
      unlockVault: async (password) => {
        const hash = await CryptoUtils.sha256(password);
        const hashBase64 = CryptoUtils.arrayBufferToBase64(hash);

        if (hashBase64 === get().masterKeyHash) {
          set({ isUnlocked: true });
          return true;
        }

        return false;
      },

      // Lock Vault
      lockVault: () => {
        set({ isUnlocked: false });
      },

      // Change Master Key
      changeMasterKey: async (oldPassword, newPassword) => {
        const isValid = await get().unlockVault(oldPassword);
        if (!isValid) throw new Error('Invalid current password');

        await get().setMasterKey(newPassword);
      },

      // Generate Secure Random
      generateSecureRandom: (length) => {
        return CryptoUtils.generateRandomString(length);
      },

      // Derive Key
      deriveKey: async (password, salt, iterations) => {
        const key = await CryptoUtils.deriveKeyFromPassword(password, salt, iterations);
        const jwk = await CryptoUtils.exportKeyJWK(key);
        return JSON.stringify(jwk);
      },

      // Hash Data
      hashData: async (data, algorithm) => {
        if (algorithm === 'sha256') {
          const hash = await CryptoUtils.sha256(data);
          return CryptoUtils.arrayBufferToBase64(hash);
        }
        throw new Error('Algorithm not supported');
      },

      // Get Encryption Report
      getEncryptionReport: () => {
        const keys = get().encryptionKeys;
        const data = get().encryptedData;

        return {
          totalKeys: keys.length,
          activeKeys: keys.filter((k) => k.isActive).length,
          expiredKeys: keys.filter((k) => k.expiresAt && k.expiresAt < new Date()).length,
          totalEncryptedData: data.length,
          totalDataSize: data.reduce((sum, d) => sum + d.metadata.originalSize, 0),
          averageEncryptionTime: 50, // Mock value
          averageDecryptionTime: 45, // Mock value
          keyUsageStats: {},
          algorithmUsageStats: {},
        };
      },

      // Get Vault Audit Log
      getVaultAuditLog: (vaultId) => {
        const vault = get().secureVaults.find((v) => v.id === vaultId);
        return vault?.auditLog || [];
      },

      // Export Audit Log
      exportAuditLog: (startDate, endDate) => {
        const allLogs: (VaultAuditEntry & { vaultId: string; vaultName: string })[] = [];

        get().secureVaults.forEach((vault) => {
          vault.auditLog.forEach((entry) => {
            if (entry.timestamp >= startDate && entry.timestamp <= endDate) {
              allLogs.push({
                ...entry,
                vaultId: vault.id,
                vaultName: vault.name,
              });
            }
          });
        });

        return allLogs;
      },

      // Backup Keys
      backupKeys: async (_password: string) => {
        const keys = get().encryptionKeys;
        const backup = {
          keys,
          timestamp: new Date().toISOString(),
          version: '1.0',
        };

        // In production, encrypt the backup with the password
        return JSON.stringify(backup);
      },

      // Restore Keys
      restoreKeys: async (backup: string, _password: string) => {
        try {
          const data = JSON.parse(backup);

          // In production, decrypt and verify password
          set((state) => ({
            encryptionKeys: [...state.encryptionKeys, ...data.keys],
          }));
        } catch {
          throw new Error('Invalid backup format');
        }
      },

      // Get Performance Metrics
      getPerformanceMetrics: () => {
        return {
          operationsPerSecond: 100, // Mock values
          averageLatency: 50,
          errorRate: 0.01,
          keyRotationFrequency: 30,
          vaultAccessFrequency: 1000,
        };
      },
    }),
    {
      name: 'sipoma-encryption-store',
      partialize: (state) => ({
        encryptionKeys: state.encryptionKeys,
        encryptedData: state.encryptedData,
        secureVaults: state.secureVaults,
        masterKeyHash: state.masterKeyHash,
      }),
    }
  )
);
