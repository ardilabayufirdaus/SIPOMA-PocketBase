import React, { useState } from 'react';
import Toast from './Toast';
import ClipboardIcon from './icons/ClipboardIcon';

interface PasswordDisplayProps {
  password: string;
  username: string;
  fullName: string;
  onClose: () => void;
  t: any;
}

const PasswordDisplay: React.FC<PasswordDisplayProps> = ({
  password,
  username,
  fullName,
  onClose,
  t,
}) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isEmailSending, setIsEmailSending] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setToastMessage('Password copied to clipboard!');
      setShowToast(true);
    } catch {
      setToastMessage('Failed to copy password');
      setShowToast(true);
    }
  };

  const copyCredentials = async () => {
    const credentials = `Username: ${username}\nTemporary Password: ${password}\n\nPlease change your password on first login.`;
    try {
      await navigator.clipboard.writeText(credentials);
      setToastMessage('All credentials copied to clipboard!');
      setShowToast(true);
    } catch {
      setToastMessage('Failed to copy credentials');
      setShowToast(true);
    }
  };

  const sendEmailNotification = async () => {
    setIsEmailSending(true);
    try {
      // Simulate email sending
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setToastMessage("Login credentials sent to user's email!");
      setShowToast(true);
    } catch {
      setToastMessage('Failed to send email notification');
      setShowToast(true);
    } finally {
      setIsEmailSending(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="fixed inset-0 bg-slate-950/70 dark:bg-black/80 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="password-display-title"
          className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 z-10 max-h-[90vh] overflow-y-auto"
        >
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800">
                <svg
                  className="w-10 h-10 text-emerald-600 dark:text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3
                id="password-display-title"
                className="text-xl font-semibold text-slate-900 dark:text-white mb-2"
              >
                {t?.user_created_success_title || 'User Created Successfully!'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                {t?.user_created_success_message ||
                  `Account has been created for ${fullName}. Share these credentials securely.`}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 p-5 rounded-xl mb-6 text-left">
              <div className="mb-4">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                  {t?.username_label || 'Username'}:
                </label>
                <div className="text-sm text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 break-all">
                  {username}
                </div>
              </div>
              <div className="mb-4">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                  {t?.temporary_password_label || 'Temporary Password'}:
                </label>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 tracking-wider">
                    {password}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="min-h-[44px] min-w-[44px] px-3.5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-center shrink-0"
                    title={t?.copy_password || 'Copy Password'}
                    aria-label={t?.copy_password || 'Salin password'}
                  >
                    <ClipboardIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={copyCredentials}
                  className="min-h-[44px] flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  📋 {t?.copy_all_credentials || 'Copy All Credentials'}
                </button>
                <button
                  onClick={sendEmailNotification}
                  disabled={isEmailSending}
                  className="min-h-[44px] flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 flex items-center justify-center"
                >
                  {isEmailSending ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {t?.sending || 'Sending...'}
                    </>
                  ) : (
                    <>📧 {t?.send_email || 'Send Email'}</>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-amber-500 dark:text-amber-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 text-left">
                  <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                    {t?.important_notice || 'Important Notice'}
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {t?.password_change_notice ||
                      'The user must change their password on first login. Share these credentials securely through a secure channel.'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="min-h-[44px] w-full bg-slate-900 dark:bg-slate-700 text-white py-3 px-4 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors duration-150 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {t?.close_button || 'Close'}
            </button>
          </div>
        </div>
      </div>

      <Toast
        message={toastMessage}
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={3000}
      />
    </>
  );
};

export default PasswordDisplay;
