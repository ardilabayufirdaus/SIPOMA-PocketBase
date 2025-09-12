import React, { useState } from "react";
import { User } from "../types";
import { Language } from "../App";
import CogIcon from "../components/icons/CogIcon";
import ShieldCheckIcon from "../components/icons/ShieldCheckIcon";
import LanguageIcon from "../components/icons/LanguageIcon";
import BellIcon from "../components/icons/BellIcon";
import { supabase } from "../utils/supabase";

interface SettingsPageProps {
  t: any;
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
  <div className="bg-white rounded-lg shadow-md border border-slate-200">
    <div className="flex items-center gap-3 p-4 border-b border-slate-200">
      <div className="text-slate-500">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
    </div>
    <div className="p-6 space-y-6">{children}</div>
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
    current: "",
    new: "",
    confirm: "",
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    projectUpdates: false,
  });

  // Load notification preferences from localStorage
  React.useEffect(() => {
    const savedPrefs = localStorage.getItem("sipoma_notification_prefs");
    if (savedPrefs) {
      try {
        setNotificationPrefs(JSON.parse(savedPrefs));
      } catch (err) {
        console.error("Failed to load notification preferences:", err);
      }
    }
  }, []);

  // Save notification preferences to localStorage
  const saveNotificationPrefs = (prefs: typeof notificationPrefs) => {
    setNotificationPrefs(prefs);
    localStorage.setItem("sipoma_notification_prefs", JSON.stringify(prefs));
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      alert(t.password_no_match);
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new,
      });
      if (error) {
        alert(t.password_update_failed || "Failed to update password");
      } else {
        alert(t.password_updated);
        setPasswordData({ current: "", new: "", confirm: "" });
      }
    } catch (err) {
      alert(t.password_update_failed || "Failed to update password");
    }
  };

  if (!user) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            {t.header_settings}
          </h1>
          <p className="mt-2 text-slate-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            {t.header_settings}
          </h1>
          <p className="mt-2 text-slate-600">{t.settings_page_subtitle}</p>
        </div>

        {/* Profile Information */}
        <SettingsCard
          title={t.profile_information}
          icon={<CogIcon className="w-6 h-6" />}
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {user.avatar_url ? (
              <img
                className="h-20 w-20 rounded-full object-cover"
                src={user.avatar_url}
                alt="User avatar"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-slate-200 flex items-center justify-center">
                <CogIcon className="h-10 w-10 text-slate-500" />
              </div>
            )}
            <div className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-2 text-sm">
              <span className="font-semibold text-slate-600">
                {t.full_name_label}:
              </span>
              <span className="text-slate-800">{user.full_name}</span>
              <span className="font-semibold text-slate-600">
                {t.username_label || "Username"}:
              </span>
              <span className="text-slate-800">{user.username}</span>
              <span className="font-semibold text-slate-600">
                {t.role_label}:
              </span>
              <span className="text-slate-800">{user.role}</span>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onOpenProfileModal}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-sm hover:bg-red-700"
            >
              {t.edit_profile}
            </button>
          </div>
        </SettingsCard>

        {/* Change Password */}
        <SettingsCard
          title={t.change_password}
          icon={<ShieldCheckIcon className="w-6 h-6" />}
        >
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  {t.current_password}
                </label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) =>
                    setPasswordData((p) => ({ ...p, current: e.target.value }))
                  }
                  className="mt-1 input-style"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  {t.new_password}
                </label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) =>
                    setPasswordData((p) => ({ ...p, new: e.target.value }))
                  }
                  className="mt-1 input-style"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  {t.confirm_password}
                </label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) =>
                    setPasswordData((p) => ({ ...p, confirm: e.target.value }))
                  }
                  className="mt-1 input-style"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-sm hover:bg-red-700"
              >
                {t.save_password}
              </button>
            </div>
          </form>
        </SettingsCard>

        {/* Language */}
        <SettingsCard
          title={t.language_settings}
          icon={<LanguageIcon className="w-6 h-6" />}
        >
          <div className="max-w-xs">
            <label
              htmlFor="language-select"
              className="block text-sm font-medium text-slate-700"
            >
              {t.language}
            </label>
            <select
              id="language-select"
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="mt-1 block w-full pl-3 pr-10 py-2 input-style"
            >
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
            </select>
          </div>
        </SettingsCard>

        {/* Notifications */}
        <SettingsCard
          title={t.notifications}
          icon={<BellIcon className="w-6 h-6" />}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">
                  {t.push_notifications_project}
                </p>
                <p className="text-xs text-slate-500">
                  {t.push_notifications_project_desc}
                </p>
              </div>
              <button
                onClick={() => {
                  const newPrefs = {
                    ...notificationPrefs,
                    projectUpdates: !notificationPrefs.projectUpdates,
                  };
                  saveNotificationPrefs(newPrefs);
                }}
                className={`${
                  notificationPrefs.projectUpdates
                    ? "bg-red-600"
                    : "bg-slate-300"
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span
                  className={`${
                    notificationPrefs.projectUpdates
                      ? "translate-x-6"
                      : "translate-x-1"
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
};

export default SettingsPage;
