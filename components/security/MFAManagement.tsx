import React, { useState } from 'react';
import { useMFAStore } from '../../stores/mfaStore';
import { useAuth } from '../../hooks/useAuth';
import MFASetup from './MFASetup';
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Smartphone,
  Mail,
  Key,
  Settings,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';

const MFAManagement: React.FC = () => {
  const { user } = useAuth();
  const {
    getMFAStatus,
    mfaMethods,
    disableMFA,
    regenerateBackupCodes,
    mfaSettings,
    updateMFASettings,
  } = useMFAStore();

  const [showSetup, setShowSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [disableToken, setDisableToken] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const mfaStatus = getMFAStatus(user.id);
  const userMethods = mfaMethods[user.id] || [];

  const handleDisableMFA = async () => {
    if (!disableToken.trim()) return;

    setIsDisabling(true);
    setError('');

    try {
      await disableMFA(user.id, disableToken);
      setShowDisableForm(false);
      setDisableToken('');
    } catch {
      setError('Invalid token. Please try again.');
    } finally {
      setIsDisabling(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      await regenerateBackupCodes(user.id);
    } catch {
      setError('Failed to regenerate backup codes');
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'totp':
        return <Smartphone className="h-5 w-5" />;
      case 'sms':
        return <Mail className="h-5 w-5" />;
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'backup':
        return <Key className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getMethodLabel = (type: string) => {
    switch (type) {
      case 'totp':
        return 'Authenticator App';
      case 'sms':
        return 'SMS';
      case 'email':
        return 'Email';
      case 'backup':
        return 'Backup Codes';
      default:
        return type;
    }
  };

  if (showSetup) {
    return (
      <div className="max-w-2xl mx-auto">
        <MFASetup onComplete={() => setShowSetup(false)} onCancel={() => setShowSetup(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {mfaStatus.isEnabled ? (
              <ShieldCheck className="h-8 w-8 text-green-600" />
            ) : (
              <ShieldX className="h-8 w-8 text-red-600" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Multi-Factor Authentication
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {mfaStatus.isEnabled
                  ? 'Your account is protected with multi-factor authentication'
                  : 'Secure your account with an additional layer of protection'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* MFA Status */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Security Status
        </h2>

        <div
          className={`p-4 rounded-lg border ${
            mfaStatus.isEnabled
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {mfaStatus.isEnabled ? (
                <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <ShieldX className="h-6 w-6 text-red-600 dark:text-red-400" />
              )}
              <div>
                <h3
                  className={`font-semibold ${
                    mfaStatus.isEnabled
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}
                >
                  {mfaStatus.isEnabled ? 'MFA Enabled' : 'MFA Disabled'}
                </h3>
                <p
                  className={`text-sm ${
                    mfaStatus.isEnabled
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {mfaStatus.isEnabled
                    ? `${userMethods.filter((m) => m.isEnabled).length} active method(s)`
                    : 'Your account is vulnerable to unauthorized access'}
                </p>
              </div>
            </div>

            {!mfaStatus.isEnabled ? (
              <button
                onClick={() => setShowSetup(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Enable MFA</span>
              </button>
            ) : (
              <button
                onClick={() => setShowDisableForm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Disable MFA</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Methods */}
      {mfaStatus.isEnabled && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Methods</h2>
            <button
              onClick={() => setShowSetup(true)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add Method</span>
            </button>
          </div>

          <div className="space-y-3">
            {userMethods
              .filter((method) => method.isEnabled)
              .map((method, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getMethodIcon(method.type)}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {getMethodLabel(method.type)}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {method.identifier || 'Active'}
                        {method.lastUsed && (
                          <span className="ml-2">
                            • Last used: {new Date(method.lastUsed).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {method.type === 'backup' && (
                    <button
                      onClick={handleRegenerateBackupCodes}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                      title="Regenerate backup codes"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">MFA Settings</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Require MFA</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Require multi-factor authentication for all users
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={mfaSettings.requireMFA}
                  onChange={(e) => updateMFASettings({ requireMFA: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={mfaSettings.sessionTimeoutMinutes}
                onChange={(e) =>
                  updateMFASettings({ sessionTimeoutMinutes: parseInt(e.target.value) || 5 })
                }
                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Failed Attempts
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={mfaSettings.maxFailedAttempts}
                onChange={(e) =>
                  updateMFASettings({ maxFailedAttempts: parseInt(e.target.value) || 3 })
                }
                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Disable MFA Form */}
      {showDisableForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Disable Multi-Factor Authentication
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This will reduce your account security. Enter your authenticator code to confirm.
            </p>

            <div className="mb-4">
              <input
                type="text"
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                maxLength={6}
              />
              {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDisableForm(false);
                  setDisableToken('');
                  setError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableMFA}
                disabled={disableToken.length !== 6 || isDisabling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDisabling ? 'Disabling...' : 'Disable MFA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MFAManagement;
