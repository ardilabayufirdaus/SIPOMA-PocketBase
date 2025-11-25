import React, { useState } from 'react';
import { User } from '../types';
import { Language } from '../App';
import CogIcon from '../components/icons/CogIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import LanguageIcon from '../components/icons/LanguageIcon';
import BellIcon from '../components/icons/BellIcon';
import { supabase } from '../utils/pocketbaseClient';

// Import Enhanced Components
import {
  EnhancedButton,
  EnhancedCard,
  useAccessibility,
} from '../components/ui/EnhancedComponents';

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
}> = ({ title, icon, children }) => (
  <EnhancedCard className="w-full">
    <div className="flex items-center gap-3 p-4 border-b border-slate-200">
      <div className="text-slate-500">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
    </div>
    <div className="p-6 space-y-6">{children}</div>
  </EnhancedCard>
);

const SettingsPage: React.FC<SettingsPageProps> = ({
  t,
  user,
  onOpenProfileModal,
  currentLanguage,
  onLanguageChange,
}) => {
  // Permission check removed - Settings now accessible to all users

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    projectUpdates: false,
  });

  // Enhanced accessibility hooks
  const { announceToScreenReader } = useAccessibility();

  // Load notification preferences from localStorage
  React.useEffect(() => {
    const savedPrefs = localStorage.getItem('sipoma_notification_prefs');
    if (savedPrefs) {
      try {
        setNotificationPrefs(JSON.parse(savedPrefs));
      } catch {
        // Error logging removed for production
      }
    }
  }, []);

  // Save notification preferences to localStorage
  const saveNotificationPrefs = (prefs: typeof notificationPrefs) => {
    setNotificationPrefs(prefs);
    localStorage.setItem('sipoma_notification_prefs', JSON.stringify(prefs));
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      alert(t.password_no_match);
      return;
    }
    try {
      // PocketBase requires the current password for password change
      const result = await supabase.collection('users').update(user.id, {
        password: passwordData.new,
        passwordConfirm: passwordData.confirm, // PocketBase requires password confirmation
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
      <div className="p-6 lg:p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-900">{t.header_settings}</h1>
          <p className="mt-2 text-slate-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="h-full p-4 lg:p-6 xl:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8 lg:mb-12">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent mb-3">
                {t.header_settings}
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0">
                {t.settings_page_subtitle}
              </p>
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Profile Information */}
            <div className="xl:col-span-2">
              <SettingsCard title={t.profile_information} icon={<CogIcon className="w-6 h-6" />}>
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    {user.avatar_url ? (
                      <div className="relative">
                        <img
                          className="h-24 w-24 lg:h-32 lg:w-32 rounded-full object-cover ring-4 ring-white shadow-xl"
                          src={user.avatar_url}
                          alt="User avatar"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                    ) : (
                      <div className="h-24 w-24 lg:h-32 lg:w-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                        <CogIcon className="h-12 w-12 lg:h-16 lg:w-16 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm lg:text-base">
                      <div className="space-y-3">
                        <div>
                          <span className="font-semibold text-slate-500 block text-xs uppercase tracking-wide">
                            {t.full_name_label}
                          </span>
                          <span className="text-slate-900 font-medium">{user.full_name}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500 block text-xs uppercase tracking-wide">
                            {t.username_label || 'Username'}
                          </span>
                          <span className="text-slate-900 font-medium">{user.username}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="font-semibold text-slate-500 block text-xs uppercase tracking-wide">
                            {t.role_label}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {user.role}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500 block text-xs uppercase tracking-wide">
                            Status
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-6 pt-6 border-t border-slate-200">
                  <EnhancedButton
                    variant="primary"
                    size="md"
                    onClick={onOpenProfileModal}
                    aria-label={t.edit_profile || 'Edit profile'}
                    className="shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {t.edit_profile}
                  </EnhancedButton>
                </div>
              </SettingsCard>
            </div>

            {/* Change Password */}
            <SettingsCard title={t.change_password} icon={<ShieldCheckIcon className="w-6 h-6" />}>
              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {t.current_password}
                    </label>
                    <input
                      type="password"
                      value={passwordData.current}
                      onChange={(e) => setPasswordData((p) => ({ ...p, current: e.target.value }))}
                      autoComplete="current-password"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {t.new_password}
                      </label>
                      <input
                        type="password"
                        value={passwordData.new}
                        onChange={(e) => setPasswordData((p) => ({ ...p, new: e.target.value }))}
                        autoComplete="new-password"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {t.confirm_password}
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirm}
                        onChange={(e) =>
                          setPasswordData((p) => ({ ...p, confirm: e.target.value }))
                        }
                        autoComplete="new-password"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <EnhancedButton
                    variant="primary"
                    size="md"
                    type="submit"
                    aria-label={t.save_password || 'Save password'}
                    className="shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {t.save_password}
                  </EnhancedButton>
                </div>
              </form>
            </SettingsCard>

            {/* Language Settings */}
            <SettingsCard title={t.language_settings} icon={<LanguageIcon className="w-6 h-6" />}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="language-select"
                    className="block text-sm font-semibold text-slate-700 mb-3"
                  >
                    {t.language}
                  </label>
                  <div className="relative">
                    <select
                      id="language-select"
                      value={currentLanguage}
                      onChange={(e) => onLanguageChange(e.target.value as Language)}
                      className="w-full px-4 py-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white appearance-none"
                    >
                      <option value="en">🇺🇸 English</option>
                      <option value="id">🇮🇩 Bahasa Indonesia</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 text-blue-600 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Language Settings</h4>
                      <p className="text-sm text-blue-700">
                        Choose your preferred language for the application interface.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SettingsCard>

            {/* Notifications */}
            <div className="xl:col-span-2">
              <SettingsCard title={t.notifications} icon={<BellIcon className="w-6 h-6" />}>
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-2">
                          {t.push_notifications_project}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {t.push_notifications_project_desc}
                        </p>
                      </div>
                      <div className="ml-6">
                        <EnhancedButton
                          variant={notificationPrefs.projectUpdates ? 'primary' : 'outline'}
                          size="md"
                          onClick={() => {
                            const newPrefs = {
                              ...notificationPrefs,
                              projectUpdates: !notificationPrefs.projectUpdates,
                            };
                            saveNotificationPrefs(newPrefs);
                            announceToScreenReader(
                              `Project deadline reminders ${
                                newPrefs.projectUpdates ? 'enabled' : 'disabled'
                              }`
                            );
                          }}
                          aria-label={`${
                            notificationPrefs.projectUpdates ? t.disable : t.enable
                          } ${t.push_notifications_project}`}
                          aria-pressed={notificationPrefs.projectUpdates}
                          className="shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          {notificationPrefs.projectUpdates
                            ? t.enabled || 'Enabled'
                            : t.disabled || 'Disabled'}
                        </EnhancedButton>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-900 mb-1">Notifications Active</h4>
                        <p className="text-sm text-green-700">
                          Your notification preferences have been saved successfully.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </SettingsCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;



