import React, { useState } from 'react';
import { User } from '../types';
import { Language } from '../types';
import CogIcon from '../components/icons/CogIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import LanguageIcon from '../components/icons/LanguageIcon';
import { supabase } from '../utils/pocketbaseClient';
import { EnhancedButton, EnhancedCard } from '../components/ui/EnhancedComponents';

// Icons using Lucide style (approximated with existing components or SVGs)
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const GlobeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

interface SettingsPageProps {
  t: Record<string, string>;
  user: User | null;
  onOpenProfileModal: () => void;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const SettingsCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string; // Add className prop
  description?: string;
}> = ({ title, icon, children, className = '', description }) => (
  <div
    className={`glass-card overflow-hidden border-0 shadow-lg ring-1 ring-white/20 ${className}`}
  >
    <div className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-900/50 p-4 border-b border-white/20 flex items-start gap-4">
      <div className="p-2 bg-gradient-to-br from-ubuntu-orange to-pink-500 rounded-lg shadow-md text-white">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{title}</h3>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
    </div>
    <div className="p-6 space-y-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
      {children}
    </div>
  </div>
);

// Styled Input Component
const UbuntuInput = ({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div className="group">
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1 transition-colors group-focus-within:text-ubuntu-orange">
      {label}
    </label>
    <div className="relative">
      <input
        {...props}
        className="w-full px-4 py-3 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-ubuntu-orange focus:border-ubuntu-orange transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm/50"
      />
    </div>
  </div>
);

const SettingsPage: React.FC<SettingsPageProps> = ({
  t,
  user,
  onOpenProfileModal,
  currentLanguage,
  onLanguageChange,
}) => {
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      // Use a more subtle notification if possible, but keeping alert for now as per constraints
      alert(t.password_no_match);
      return;
    }
    try {
      const result = await supabase.collection('users').update(user.id, {
        password: passwordData.new,
        passwordConfirm: passwordData.confirm,
        oldPassword: passwordData.current,
      });

      if (!result) {
        alert(t.password_update_failed || 'Failed to update password');
      } else {
        alert(t.password_updated);
        setPasswordData({ current: '', new: '', confirm: '' });
      }
    } catch (err) {
      alert(t.password_update_failed || 'Failed to update password');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('https://res.cloudinary.com/practicaldev/image/fetch/s--_MFOcsk1--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_880/https://dev-to-uploads.s3.amazonaws.com/uploads/articles/bg4s1a9w6q1j2j6z2c.jpg')] bg-cover bg-fixed bg-center">
      {/* Abstract Ubuntu-like Overlay */}
      <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-xl z-0"></div>

      <div className="relative z-10 p-4 lg:p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-ubuntu-aubergine to-ubuntu-orange mb-2 tracking-tight">
              {t.header_settings}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl font-medium">
              {t.settings_page_subtitle || 'Manage your workspace preferences and profile.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Profile Information (Left Col - Span 2) */}
          <div className="xl:col-span-2 space-y-8">
            <SettingsCard
              title={t.profile_information}
              icon={<UserIcon />}
              description="View and update your personal account details."
            >
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar Section */}
                <div className="flex-shrink-0 flex flex-col items-center space-y-4 w-full md:w-auto">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-ubuntu-orange to-purple-600 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                    {user.avatar_url ? (
                      <img
                        className="relative h-32 w-32 rounded-full object-cover ring-4 ring-white dark:ring-slate-800 shadow-2xl"
                        src={user.avatar_url}
                        alt="User avatar"
                      />
                    ) : (
                      <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-ubuntu-orange to-purple-600 flex items-center justify-center shadow-2xl ring-4 ring-white dark:ring-slate-800">
                        <span className="text-4xl text-white font-bold">
                          {user.full_name?.charAt(0) || user.username?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div
                      className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 ring-1 ring-green-600 shadow-sm"
                      title="Active"
                    ></div>
                  </div>
                  <div className="text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-ubuntu-aubergine/10 text-ubuntu-aubergine dark:bg-purple-900/30 dark:text-purple-300 border border-ubuntu-aubergine/10">
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                      {t.full_name_label}
                    </span>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100 break-words">
                      {user.full_name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                      {t.username_label || 'Username'}
                    </span>
                    <p className="text-lg font-mono text-slate-800 dark:text-slate-100">
                      {user.username}
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                      Account Status
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <p className="font-medium text-green-700 dark:text-green-400">
                        Active - Full Access
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <EnhancedButton
                  variant="primary"
                  onClick={onOpenProfileModal}
                  aria-label={t.edit_profile || 'Edit profile'}
                  className="!bg-ubuntu-orange hover:!bg-orange-600 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 text-white font-semibold px-6"
                >
                  <CogIcon className="w-4 h-4 mr-2" />
                  {t.edit_profile}
                </EnhancedButton>
              </div>
            </SettingsCard>

            <SettingsCard
              title={t.language_settings}
              icon={<GlobeIcon />}
              description="Localize your application interface."
            >
              <div className="flex flex-col sm:flex-row gap-6 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30">
                <div className="flex-1">
                  <label
                    htmlFor="language-select"
                    className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2"
                  >
                    {t.language}
                  </label>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Select your preferred language for the dashboard interface. Changes apply
                    immediately.
                  </p>
                </div>
                <div className="w-full sm:w-64">
                  <div className="relative">
                    <select
                      id="language-select"
                      value={currentLanguage}
                      onChange={(e) => onLanguageChange(e.target.value as Language)}
                      className="w-full pl-4 pr-10 py-3 appearance-none bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-ubuntu-orange focus:ring-1 focus:ring-ubuntu-orange transition-all font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600"
                    >
                      <option value="en">🇺🇸 English (US)</option>
                      <option value="id">🇮🇩 Bahasa Indonesia</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </SettingsCard>
          </div>

          {/* Right Column - Password */}
          <div className="xl:col-span-1">
            <SettingsCard
              title={t.change_password}
              icon={<LockIcon />}
              className="h-full"
              description="Ensure your account stays secure."
            >
              <form onSubmit={handlePasswordUpdate} className="space-y-5">
                <div className="p-4 rounded-lg bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 mb-2">
                  <p className="text-xs text-orange-800 dark:text-orange-300 flex items-start gap-2">
                    <svg
                      className="w-4 h-4 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    Password must be at least 8 characters long and include a mix of letters and
                    numbers.
                  </p>
                </div>

                <UbuntuInput
                  label={t.current_password}
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData((p) => ({ ...p, current: e.target.value }))}
                  autoComplete="current-password"
                  placeholder="..."
                  required
                />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-slate-900 px-2 text-xs text-slate-400 uppercase">
                      New Credentials
                    </span>
                  </div>
                </div>

                <UbuntuInput
                  label={t.new_password}
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData((p) => ({ ...p, new: e.target.value }))}
                  autoComplete="new-password"
                  placeholder="..."
                  required
                />

                <UbuntuInput
                  label={t.confirm_password}
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData((p) => ({ ...p, confirm: e.target.value }))}
                  autoComplete="new-password"
                  placeholder="..."
                  required
                />

                <div className="pt-4">
                  <EnhancedButton
                    variant="primary"
                    type="submit"
                    className="w-full !bg-slate-800 hover:!bg-slate-900 dark:!bg-slate-700 dark:hover:!bg-slate-600 text-white shadow-lg py-3"
                  >
                    {t.save_password}
                  </EnhancedButton>
                </div>
              </form>
            </SettingsCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
