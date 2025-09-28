import React, { useState, useEffect } from 'react';
import { useMFAStore } from '../../stores/mfaStore';
import { Shield, Smartphone, Mail, Key, AlertTriangle, Loader } from 'lucide-react';

interface MFAVerificationProps {
  userId: string;
  onSuccess: (sessionId: string) => void;
  onCancel?: () => void;
  className?: string;
}

const MFAVerification: React.FC<MFAVerificationProps> = ({
  userId,
  onSuccess,
  onCancel,
  className = '',
}) => {
  const {
    initiateMFAChallenge,
    verifyMFAToken,
    completeMFAChallenge,
    sendSMSToken,
    sendEmailToken,
    getMFAStatus,
    currentMFASession,
  } = useMFAStore();

  const [token, setToken] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'sms' | 'email' | 'backup'>('totp');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(3);

  const mfaStatus = getMFAStatus(userId);

  useEffect(() => {
    initializeChallenge();
  }, [userId]);

  const initializeChallenge = async () => {
    try {
      const session = await initiateMFAChallenge(userId);
      setSessionId(session.sessionId);

      // Auto-select the first available method
      if (mfaStatus.methods.length > 0) {
        const enabledMethods = mfaStatus.methods.filter((m) => m.isEnabled);
        if (enabledMethods.length > 0) {
          setSelectedMethod(enabledMethods[0].type);
        }
      }
    } catch {
      setError('Failed to initialize MFA challenge');
    }
  };

  const handleMethodChange = async (method: 'totp' | 'sms' | 'email' | 'backup') => {
    setSelectedMethod(method);
    setToken('');
    setError('');

    // Send token for SMS/Email methods
    if (method === 'sms') {
      try {
        await sendSMSToken(userId);
      } catch {
        setError('Failed to send SMS token');
      }
    } else if (method === 'email') {
      try {
        await sendEmailToken(userId);
      } catch {
        setError('Failed to send email token');
      }
    }
  };

  const handleVerification = async () => {
    if (!sessionId || !token.trim()) return;

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await verifyMFAToken(sessionId, token, selectedMethod);

      if (isValid) {
        const isCompleted = await completeMFAChallenge(sessionId);
        if (isCompleted) {
          onSuccess(sessionId);
        } else {
          setError('MFA challenge not completed');
        }
      } else {
        setAttempts((prev) => prev + 1);
        setError('Invalid verification code. Please try again.');
        setToken('');

        if (attempts + 1 >= maxAttempts) {
          setError('Maximum attempts exceeded. Please try again later.');
        }
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'totp':
        return <Smartphone className="h-4 w-4" />;
      case 'sms':
        return <Mail className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'backup':
        return <Key className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'totp':
        return 'Authenticator App';
      case 'sms':
        return 'SMS';
      case 'email':
        return 'Email';
      case 'backup':
        return 'Backup Code';
      default:
        return method;
    }
  };

  const getPlaceholder = () => {
    switch (selectedMethod) {
      case 'totp':
        return 'Enter 6-digit code from authenticator app';
      case 'sms':
        return 'Enter code sent via SMS';
      case 'email':
        return 'Enter code sent via email';
      case 'backup':
        return 'Enter backup code';
      default:
        return 'Enter verification code';
    }
  };

  const availableMethods = mfaStatus.methods.filter((m) => m.isEnabled);

  if (!mfaStatus.isEnabled) {
    return (
      <div className={`p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg ${className}`}>
        <div className="text-center">
          <Shield className="mx-auto h-8 w-8 text-yellow-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            MFA Not Enabled
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Multi-factor authentication is not enabled for this account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg ${className}`}>
      <div className="text-center mb-6">
        <Shield className="mx-auto h-8 w-8 text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Multi-Factor Authentication
        </h3>
        <p className="text-gray-600 dark:text-gray-300">Please verify your identity to continue</p>
      </div>

      {/* Method Selection */}
      {availableMethods.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Verification Method
          </label>
          <div className="grid grid-cols-2 gap-2">
            {availableMethods.map((method) => (
              <button
                key={method.type}
                onClick={() => handleMethodChange(method.type)}
                className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  selectedMethod === method.type
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                disabled={isVerifying}
              >
                {getMethodIcon(method.type)}
                <span className="text-sm">{getMethodLabel(method.type)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Token Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Verification Code
        </label>
        <input
          type="text"
          value={token}
          onChange={(e) => {
            if (selectedMethod === 'backup') {
              setToken(e.target.value.toUpperCase());
            } else {
              setToken(e.target.value.replace(/\D/g, '').slice(0, 6));
            }
          }}
          placeholder={getPlaceholder()}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={selectedMethod === 'backup' ? 10 : 6}
          disabled={isVerifying || attempts >= maxAttempts}
          autoComplete="off"
        />

        {/* Resend Options */}
        {(selectedMethod === 'sms' || selectedMethod === 'email') && (
          <button
            onClick={() => handleMethodChange(selectedMethod)}
            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
            disabled={isVerifying}
          >
            Resend code
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Attempts Counter */}
      {attempts > 0 && attempts < maxAttempts && (
        <div className="mb-4 text-sm text-yellow-600 dark:text-yellow-400 text-center">
          {maxAttempts - attempts} attempt{maxAttempts - attempts !== 1 ? 's' : ''} remaining
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            disabled={isVerifying}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleVerification}
          disabled={
            !token.trim() ||
            isVerifying ||
            attempts >= maxAttempts ||
            (selectedMethod !== 'backup' && token.length !== 6)
          }
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isVerifying ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </button>
      </div>

      {/* Alternative Methods */}
      {availableMethods.some((m) => m.type === 'backup') && selectedMethod !== 'backup' && (
        <div className="mt-4 text-center">
          <button
            onClick={() => handleMethodChange('backup')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            disabled={isVerifying}
          >
            Use backup code instead
          </button>
        </div>
      )}

      {/* Session Info */}
      {currentMFASession && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Session expires in:{' '}
            {Math.max(
              0,
              Math.floor((currentMFASession.expiresAt.getTime() - Date.now()) / 1000 / 60)
            )}{' '}
            minutes
          </div>
        </div>
      )}
    </div>
  );
};

export default MFAVerification;
