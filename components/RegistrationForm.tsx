import React, { useState } from 'react';
import { api } from '../utils/api';
import { EnhancedButton, useAccessibility } from './ui/EnhancedComponents';

interface RegistrationFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onClose, onSuccess }) => {
  const { announceToScreenReader } = useAccessibility();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validasi input
    if (!formData.name.trim()) {
      setError('Nama lengkap wajib diisi');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Email wajib diisi');
      setLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Format email tidak valid');
      setLoading(false);
      return;
    }

    // Validate reCAPTCHA
    if (!recaptchaToken) {
      setError('Silakan verifikasi bahwa Anda bukan robot');
      setLoading(false);
      return;
    }

    try {
      await api.users.requestRegistration({
        email: formData.email.trim().toLowerCase(),
        name: formData.name.trim(),
      });

      setSuccess(true);
      announceToScreenReader('Registration request submitted successfully');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message?.includes('already exists')) {
        setError('Email sudah terdaftar atau sedang dalam proses verifikasi');
      } else if (error.message?.includes('rate limit')) {
        setError('Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit.');
      } else {
        setError('Gagal mengirim permintaan registrasi. Silakan coba lagi.');
      }
      announceToScreenReader('Registration request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
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
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Permintaan Registrasi Berhasil!
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Permintaan registrasi Anda telah dikirim. Admin akan memproses permintaan Anda dalam
              1-2 hari kerja.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Permintaan Registrasi
          </h2>
          <EnhancedButton
            onClick={() => {
              onClose();
              announceToScreenReader('Registration form closed');
            }}
            variant="ghost"
            size="sm"
            ariaLabel="Close registration form"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </EnhancedButton>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Masukkan nama lengkap"
              aria-describedby="name-error"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Masukkan alamat email"
              aria-describedby="email-error"
            />
          </div>

          {/* reCAPTCHA placeholder - integrate with actual reCAPTCHA service */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="recaptcha"
              checked={!!recaptchaToken}
              onChange={(e) => setRecaptchaToken(e.target.checked ? 'verified' : null)}
              className="w-4 h-4 text-red-600 bg-slate-100 border-slate-300 rounded focus:ring-red-500"
            />
            <label htmlFor="recaptcha" className="text-sm text-slate-700 dark:text-slate-300">
              Saya bukan robot
            </label>
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center" role="alert">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <EnhancedButton
              type="button"
              onClick={() => {
                onClose();
                announceToScreenReader('Registration form cancelled');
              }}
              variant="outline"
              size="md"
              ariaLabel="Cancel registration request"
            >
              Batal
            </EnhancedButton>
            <EnhancedButton
              type="submit"
              disabled={loading}
              variant="primary"
              size="md"
              ariaLabel="Submit registration request"
            >
              {loading ? 'Mengirim...' : 'Kirim Permintaan'}
            </EnhancedButton>
          </div>
        </form>

        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
          Setelah mengirim permintaan, admin akan memverifikasi dan membuat akun untuk Anda.
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
