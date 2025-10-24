import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// MFA Types
export interface MFASecret {
  id: string;
  userId: string;
  secret: string;
  qrCode: string;
  backupCodes: string[];
  isEnabled: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

export interface MFAMethod {
  type: 'totp' | 'sms' | 'email' | 'backup';
  isEnabled: boolean;
  identifier?: string; // phone number for SMS, email for email
  lastUsed?: Date;
  isVerified: boolean;
}

export interface MFASession {
  sessionId: string;
  userId: string;
  challengeToken: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isCompleted: boolean;
  completedMethods: string[];
  requiredMethods: string[];
}

export interface MFASettings {
  requireMFA: boolean;
  allowedMethods: string[];
  backupCodesCount: number;
  sessionTimeoutMinutes: number;
  maxFailedAttempts: number;
  gracePeriodDays: number;
}

export interface MFAStore {
  // State
  mfaSecrets: MFASecret[];
  mfaMethods: Record<string, MFAMethod[]>;
  mfaSessions: MFASession[];
  mfaSettings: MFASettings;
  isSettingUpMFA: boolean;
  currentMFASession: MFASession | null;

  // Actions
  generateMFASecret: (userId: string) => Promise<MFASecret>;
  verifyMFASetup: (userId: string, token: string) => Promise<boolean>;
  enableMFA: (userId: string, secretId: string) => Promise<void>;
  disableMFA: (userId: string, token: string) => Promise<void>;

  // MFA Challenge
  initiateMFAChallenge: (userId: string) => Promise<MFASession>;
  verifyMFAToken: (sessionId: string, token: string, method: string) => Promise<boolean>;
  completeMFAChallenge: (sessionId: string) => Promise<boolean>;

  // Backup Codes
  generateBackupCodes: (userId: string) => Promise<string[]>;
  useBackupCode: (userId: string, code: string) => Promise<boolean>;
  regenerateBackupCodes: (userId: string) => Promise<string[]>;

  // SMS/Email MFA
  setupSMSMFA: (userId: string, phoneNumber: string) => Promise<void>;
  setupEmailMFA: (userId: string, email: string) => Promise<void>;
  sendSMSToken: (userId: string) => Promise<void>;
  sendEmailToken: (userId: string) => Promise<void>;

  // Settings
  updateMFASettings: (settings: Partial<MFASettings>) => void;

  // Utilities
  getMFAStatus: (userId: string) => { isEnabled: boolean; methods: MFAMethod[] };
  isMFARequired: (userId: string) => boolean;
  validateMFAToken: (token: string) => boolean;
  generateTOTPToken: (secret: string) => string;
  generateQRCode: (secret: string, username: string) => string;
}

// Utility functions
const generateSecret = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
};

const generateBackupCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const generateTOTP = (secret: string, window: number = 0): string => {
  // Simple TOTP implementation (in production, use proper TOTP library)
  const time = Math.floor(Date.now() / 1000 / 30) + window;
  const timeHex = time.toString(16).padStart(16, '0');

  // Simple hash (in production, use HMAC-SHA1)
  let hash = 0;
  for (let i = 0; i < timeHex.length; i++) {
    hash = ((hash << 5) - hash + timeHex.charCodeAt(i)) & 0xffffffff;
  }

  const otp = (hash & 0x7fffffff) % 1000000;
  return otp.toString().padStart(6, '0');
};

const validateTOTP = (token: string, secret: string): boolean => {
  // Check current time window and adjacent windows
  for (let window = -1; window <= 1; window++) {
    if (generateTOTP(secret, window) === token) {
      return true;
    }
  }
  return false;
};

export const useMFAStore = create<MFAStore>()(
  persist(
    (set, get) => ({
      // Initial State
      mfaSecrets: [],
      mfaMethods: {},
      mfaSessions: [],
      mfaSettings: {
        requireMFA: false,
        allowedMethods: ['totp', 'sms', 'backup'],
        backupCodesCount: 10,
        sessionTimeoutMinutes: 5,
        maxFailedAttempts: 3,
        gracePeriodDays: 7,
      },
      isSettingUpMFA: false,
      currentMFASession: null,

      // Generate MFA Secret
      generateMFASecret: async (userId: string) => {
        const secret = generateSecret();
        const qrCode = get().generateQRCode(secret, userId);
        const backupCodes = Array.from({ length: 10 }, () => generateBackupCode());

        const mfaSecret: MFASecret = {
          id: `mfa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          secret,
          qrCode,
          backupCodes,
          isEnabled: false,
          createdAt: new Date(),
        };

        set((state) => ({
          mfaSecrets: [...state.mfaSecrets, mfaSecret],
          isSettingUpMFA: true,
        }));

        return mfaSecret;
      },

      // Verify MFA Setup
      verifyMFASetup: async (userId: string, token: string) => {
        const secret = get().mfaSecrets.find((s) => s.userId === userId && !s.isEnabled);
        if (!secret) return false;

        const isValid = validateTOTP(token, secret.secret);
        if (isValid) {
          set((state) => ({
            mfaSecrets: state.mfaSecrets.map((s) =>
              s.id === secret.id ? { ...s, isEnabled: true, lastUsed: new Date() } : s
            ),
            isSettingUpMFA: false,
          }));

          // Add TOTP method
          const currentMethods = get().mfaMethods[userId] || [];
          set((state) => ({
            mfaMethods: {
              ...state.mfaMethods,
              [userId]: [
                ...currentMethods.filter((m) => m.type !== 'totp'),
                {
                  type: 'totp',
                  isEnabled: true,
                  isVerified: true,
                  lastUsed: new Date(),
                },
              ],
            },
          }));
        }

        return isValid;
      },

      // Enable MFA
      enableMFA: async (userId: string, secretId: string) => {
        set((state) => ({
          mfaSecrets: state.mfaSecrets.map((s) =>
            s.id === secretId ? { ...s, isEnabled: true } : s
          ),
        }));
      },

      // Disable MFA
      disableMFA: async (userId: string, token: string) => {
        const secret = get().mfaSecrets.find((s) => s.userId === userId && s.isEnabled);
        if (!secret) return;

        const isValid = validateTOTP(token, secret.secret);
        if (isValid) {
          set((state) => ({
            mfaSecrets: state.mfaSecrets.map((s) =>
              s.userId === userId ? { ...s, isEnabled: false } : s
            ),
            mfaMethods: {
              ...state.mfaMethods,
              [userId]: state.mfaMethods[userId]?.map((m) => ({ ...m, isEnabled: false })) || [],
            },
          }));
        }
      },

      // Initiate MFA Challenge
      initiateMFAChallenge: async (userId: string) => {
        const userMethods = get().mfaMethods[userId] || [];
        const enabledMethods = userMethods.filter((m) => m.isEnabled).map((m) => m.type);

        const session: MFASession = {
          sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          challengeToken: Math.random().toString(36).substr(2, 16),
          expiresAt: new Date(Date.now() + get().mfaSettings.sessionTimeoutMinutes * 60 * 1000),
          attempts: 0,
          maxAttempts: get().mfaSettings.maxFailedAttempts,
          isCompleted: false,
          completedMethods: [],
          requiredMethods: enabledMethods.length > 0 ? [enabledMethods[0]] : ['totp'],
        };

        set((state) => ({
          mfaSessions: [...state.mfaSessions, session],
          currentMFASession: session,
        }));

        return session;
      },

      // Verify MFA Token
      verifyMFAToken: async (sessionId: string, token: string, method: string) => {
        const session = get().mfaSessions.find((s) => s.sessionId === sessionId);
        if (!session || session.isCompleted || session.expiresAt < new Date()) {
          return false;
        }

        const userId = session.userId;
        let isValid = false;

        if (method === 'totp') {
          const secret = get().mfaSecrets.find((s) => s.userId === userId && s.isEnabled);
          if (secret) {
            isValid = validateTOTP(token, secret.secret);
          }
        } else if (method === 'backup') {
          isValid = await get().useBackupCode(userId, token);
        }

        if (isValid) {
          set((state) => ({
            mfaSessions: state.mfaSessions.map((s) =>
              s.sessionId === sessionId
                ? { ...s, completedMethods: [...s.completedMethods, method] }
                : s
            ),
          }));
        } else {
          set((state) => ({
            mfaSessions: state.mfaSessions.map((s) =>
              s.sessionId === sessionId ? { ...s, attempts: s.attempts + 1 } : s
            ),
          }));
        }

        return isValid;
      },

      // Complete MFA Challenge
      completeMFAChallenge: async (sessionId: string) => {
        const session = get().mfaSessions.find((s) => s.sessionId === sessionId);
        if (!session) return false;

        const isCompleted = session.requiredMethods.every((method) =>
          session.completedMethods.includes(method)
        );

        if (isCompleted) {
          set((state) => ({
            mfaSessions: state.mfaSessions.map((s) =>
              s.sessionId === sessionId ? { ...s, isCompleted: true } : s
            ),
            currentMFASession: null,
          }));
        }

        return isCompleted;
      },

      // Generate Backup Codes
      generateBackupCodes: async (userId: string) => {
        const codes = Array.from({ length: get().mfaSettings.backupCodesCount }, () =>
          generateBackupCode()
        );

        const secret = get().mfaSecrets.find((s) => s.userId === userId && s.isEnabled);
        if (secret) {
          set((state) => ({
            mfaSecrets: state.mfaSecrets.map((s) =>
              s.id === secret.id ? { ...s, backupCodes: codes } : s
            ),
          }));
        }

        return codes;
      },

      // Use Backup Code
      useBackupCode: async (userId: string, code: string) => {
        const secret = get().mfaSecrets.find((s) => s.userId === userId && s.isEnabled);
        if (!secret || !secret.backupCodes.includes(code)) {
          return false;
        }

        // Remove used backup code
        set((state) => ({
          mfaSecrets: state.mfaSecrets.map((s) =>
            s.id === secret.id
              ? {
                  ...s,
                  backupCodes: s.backupCodes.filter((c) => c !== code),
                  lastUsed: new Date(),
                }
              : s
          ),
        }));

        return true;
      },

      // Regenerate Backup Codes
      regenerateBackupCodes: async (userId: string) => {
        return get().generateBackupCodes(userId);
      },

      // Setup SMS MFA
      setupSMSMFA: async (userId: string, phoneNumber: string) => {
        const currentMethods = get().mfaMethods[userId] || [];
        set((state) => ({
          mfaMethods: {
            ...state.mfaMethods,
            [userId]: [
              ...currentMethods.filter((m) => m.type !== 'sms'),
              {
                type: 'sms',
                isEnabled: true,
                identifier: phoneNumber,
                isVerified: false,
              },
            ],
          },
        }));
      },

      // Setup Email MFA
      setupEmailMFA: async (userId: string, email: string) => {
        const currentMethods = get().mfaMethods[userId] || [];
        set((state) => ({
          mfaMethods: {
            ...state.mfaMethods,
            [userId]: [
              ...currentMethods.filter((m) => m.type !== 'email'),
              {
                type: 'email',
                isEnabled: true,
                identifier: email,
                isVerified: false,
              },
            ],
          },
        }));
      },

      // Send SMS Token
      sendSMSToken: async (userId: string) => {
        // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
        void userId; // Placeholder for SMS integration
      },

      // Send Email Token
      sendEmailToken: async (userId: string) => {
        // In production, integrate with email service
        void userId; // Placeholder for email integration
      },

      // Update MFA Settings
      updateMFASettings: (settings: Partial<MFASettings>) => {
        set((state) => ({
          mfaSettings: { ...state.mfaSettings, ...settings },
        }));
      },

      // Get MFA Status
      getMFAStatus: (userId: string) => {
        const methods = get().mfaMethods[userId] || [];
        const isEnabled = methods.some((m) => m.isEnabled);
        return { isEnabled, methods };
      },

      // Is MFA Required
      isMFARequired: (userId: string) => {
        return get().mfaSettings.requireMFA && get().getMFAStatus(userId).isEnabled;
      },

      // Validate MFA Token
      validateMFAToken: (token: string) => {
        return /^\d{6}$/.test(token);
      },

      // Generate TOTP Token (for testing)
      generateTOTPToken: (secret: string) => {
        return generateTOTP(secret);
      },

      // Generate QR Code
      generateQRCode: (secret: string, username: string) => {
        const issuer = 'SIPOMA';
        const otpauth = `otpauth://totp/${issuer}:${username}?secret=${secret}&issuer=${issuer}`;
        return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpauth)}&size=200x200`;
      },
    }),
    {
      name: 'sipoma-mfa-store',
      partialize: (state) => ({
        mfaSecrets: state.mfaSecrets,
        mfaMethods: state.mfaMethods,
        mfaSettings: state.mfaSettings,
      }),
    }
  )
);
