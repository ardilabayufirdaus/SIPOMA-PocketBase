import React, { useState, useEffect } from 'react';
import { useMFAStore } from '../../stores/mfaStore';
import { useAuth } from '../../hooks/useAuth';
import { Shield, Smartphone, Mail, Key, Copy, Download, Check, AlertTriangle } from 'lucide-react';

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const MFASetup: React.FC<MFASetupProps> = ({ onComplete, onCancel }) => {
  const { user } = useAuth();
  const { generateMFASecret, verifyMFASetup, setupSMSMFA, setupEmailMFA, mfaSettings } =
    useMFAStore();

  const [currentStep, setCurrentStep] = useState<
    'choose' | 'totp' | 'sms' | 'email' | 'backup' | 'complete'
  >('choose');
  const [, setSelectedMethod] = useState<'totp' | 'sms' | 'email'>('totp');
  const [verificationToken, setVerificationToken] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  useEffect(() => {
    if (user && currentStep === 'totp') {
      initializeTOTP();
    }
  }, [user, currentStep]);

  const initializeTOTP = async () => {
    if (!user) return;

    try {
      const mfaSecret = await generateMFASecret(user.id);
      setQrCodeUrl(mfaSecret.qrCode);
      setSecret(mfaSecret.secret);
      setBackupCodes(mfaSecret.backupCodes);
    } catch {
      setVerificationError('Failed to generate MFA secret');
    }
  };

  const handleMethodSelection = (method: 'totp' | 'sms' | 'email') => {
    setSelectedMethod(method);
    setCurrentStep(method);
  };

  const handleTOTPVerification = async () => {
    if (!user || !verificationToken) return;

    setIsVerifying(true);
    setVerificationError('');

    try {
      const isValid = await verifyMFASetup(user.id, verificationToken);
      if (isValid) {
        setCurrentStep('backup');
      } else {
        setVerificationError('Invalid verification code. Please try again.');
      }
    } catch {
      setVerificationError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSMSSetup = async () => {
    if (!user || !phoneNumber) return;

    try {
      await setupSMSMFA(user.id, phoneNumber);
      setCurrentStep('complete');
    } catch {
      setVerificationError('Failed to setup SMS MFA');
    }
  };

  const handleEmailSetup = async () => {
    if (!user || !email) return;

    try {
      await setupEmailMFA(user.id, email);
      setCurrentStep('complete');
    } catch {
      setVerificationError('Failed to setup Email MFA');
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedBackupCodes(true);
    setTimeout(() => setCopiedBackupCodes(false), 2000);
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sipoma-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    setCurrentStep('complete');
    onComplete?.();
  };

  const renderChooseMethod = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Set Up Multi-Factor Authentication
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Choose your preferred method for two-factor authentication
        </p>
      </div>

      <div className="space-y-4">
        {mfaSettings.allowedMethods.includes('totp') && (
          <button
            onClick={() => handleMethodSelection('totp')}
            className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <Smartphone className="h-6 w-6 text-blue-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">Authenticator App</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Use Google Authenticator, Authy, or similar apps
                </p>
              </div>
            </div>
          </button>
        )}

        {mfaSettings.allowedMethods.includes('sms') && (
          <button
            onClick={() => handleMethodSelection('sms')}
            className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <Mail className="h-6 w-6 text-green-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">SMS Text Message</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Receive codes via text message
                </p>
              </div>
            </div>
          </button>
        )}

        {mfaSettings.allowedMethods.includes('email') && (
          <button
            onClick={() => handleMethodSelection('email')}
            className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <Key className="h-6 w-6 text-purple-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">Email</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Receive codes via email</p>
              </div>
            </div>
          </button>
        )}
      </div>

      {onCancel && (
        <div className="flex justify-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );

  const renderTOTPSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Smartphone className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Set Up Authenticator App
        </h2>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Step 1: Install an authenticator app
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Download one of these apps on your mobile device:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
            <li>Google Authenticator</li>
            <li>Authy</li>
            <li>Microsoft Authenticator</li>
          </ul>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Step 2: Scan QR Code</h3>
          <div className="flex justify-center mb-4">
            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="QR Code for MFA setup"
                className="border border-gray-200 dark:border-gray-700 rounded"
              />
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-2">
            Or enter this code manually:
          </p>
          <div className="bg-white dark:bg-gray-900 p-2 rounded border text-center font-mono text-sm">
            {secret}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Step 3: Enter verification code
          </h3>
          <input
            type="text"
            value={verificationToken}
            onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            maxLength={6}
          />
          {verificationError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {verificationError}
            </p>
          )}
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => setCurrentStep('choose')}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleTOTPVerification}
          disabled={verificationToken.length !== 6 || isVerifying}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>
      </div>
    </div>
  );

  const renderSMSSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Mail className="mx-auto h-12 w-12 text-green-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Set Up SMS Authentication
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>
        {verificationError && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            {verificationError}
          </p>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => setCurrentStep('choose')}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSMSSetup}
          disabled={!phoneNumber.trim()}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Set Up SMS
        </button>
      </div>
    </div>
  );

  const renderEmailSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Key className="mx-auto h-12 w-12 text-purple-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Set Up Email Authentication
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>
        {verificationError && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            {verificationError}
          </p>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => setCurrentStep('choose')}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleEmailSetup}
          disabled={!email.trim()}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Set Up Email
        </button>
      </div>
    </div>
  );

  const renderBackupCodes = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Key className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Save Your Backup Codes
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Store these codes in a safe place. You can use them to access your account if you lose
          your authenticator device.
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Backup Codes</h3>
          <div className="flex space-x-2">
            <button
              onClick={copyBackupCodes}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              {copiedBackupCodes ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={downloadBackupCodes}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              title="Download as file"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {backupCodes.map((code, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 p-2 rounded border font-mono text-sm text-center"
            >
              {code}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
        <div className="flex items-center mb-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Important</h3>
        </div>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
          <li>Each backup code can only be used once</li>
          <li>Store these codes in a secure location</li>
          <li>You can generate new codes anytime from your security settings</li>
        </ul>
      </div>

      <button
        onClick={handleComplete}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Complete Setup
      </button>
    </div>
  );

  const renderComplete = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
        <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Multi-Factor Authentication Enabled
      </h2>
      <p className="text-gray-600 dark:text-gray-300">
        Your account is now protected with multi-factor authentication. You&apos;ll need to provide
        a verification code when signing in.
      </p>
      <button
        onClick={onComplete}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Done
      </button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      {currentStep === 'choose' && renderChooseMethod()}
      {currentStep === 'totp' && renderTOTPSetup()}
      {currentStep === 'sms' && renderSMSSetup()}
      {currentStep === 'email' && renderEmailSetup()}
      {currentStep === 'backup' && renderBackupCodes()}
      {currentStep === 'complete' && renderComplete()}
    </div>
  );
};

export default MFASetup;
