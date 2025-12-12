import React, { useState, useEffect } from 'react';
import { Page } from '../App';

// Import component components
import { DashboardHeader } from '../components/dashboard/Dashboard';
import { MetricCard } from '../components/dashboard/Dashboard';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { useTranslation } from '../hooks/useTranslation';

// Import UI components
import Modal from '../components/Modal';
import Button from '../components/ui/Button';

// Import hooks for permissions
import { useCurrentUser } from '../hooks/useCurrentUser';
import { usePermissions } from '../utils/permissions';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useUsers } from '../hooks/useUsers';
import { usePresenceTracker } from '../hooks/usePresenceTracker';
import { PermissionMatrix, User } from '../types';

// Import icons
import ChartBarIcon from '../components/icons/ChartBarIcon';
import PresentationChartLineIcon from '../components/icons/PresentationChartLineIcon';
import ClipboardDocumentListIcon from '../components/icons/ClipboardDocumentListIcon';
import EditIcon from '../components/icons/EditIcon';
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';
import BuildingLibraryIcon from '../components/icons/BuildingLibraryIcon';
import ArchiveBoxIcon from '../components/icons/ArchiveBoxIcon';
import ClipboardCheckIcon from '../components/icons/ClipboardCheckIcon';
import ChartPieIcon from '../components/icons/ChartPieIcon';
import Bars4Icon from '../components/icons/Bars4Icon';
import UserGroupIcon from '../components/icons/UserGroupIcon';
import ClockIcon from '../components/icons/ClockIcon';
import CogIcon from '../components/icons/CogIcon';
import UserIcon from '../components/icons/UserIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';

// SubMenu Modal Component
interface SubMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subMenus: { key: string; label: string; icon: React.ReactNode }[];
  onSelect: (subPage: string) => void;
  language: 'en' | 'id';
}

// QuickCard Component Props
interface QuickCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  language: 'en' | 'id';
}

const SubMenuModal: React.FC<SubMenuModalProps> = ({
  isOpen,
  onClose,
  title,
  subMenus,
  onSelect,
  language,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={language === 'id' ? 'Pilih submenu yang ingin dibuka' : 'Choose submenu to open'}
      maxWidth="md"
    >
      <div className="max-h-[60vh] overflow-y-auto -m-2 p-2">
        <div className="space-y-2">
          {subMenus.map((menu) => (
            <button
              key={menu.key}
              onClick={() => {
                onSelect(menu.key);
                onClose();
              }}
              className="w-full flex items-center space-x-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              aria-label={`${language === 'id' ? 'Buka' : 'Open'} ${menu.label}`}
            >
              <div className="flex-shrink-0 w-10 h-10 bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 rounded-lg flex items-center justify-center transition-colors">
                {menu.icon}
              </div>
              <div className="flex-1 text-left">
                <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                  {menu.label}
                </span>
              </div>
              <div className="flex-shrink-0">
                <svg
                  className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          variant="ghost"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {language === 'id' ? 'Batal' : 'Cancel'}
        </Button>
      </div>
    </Modal>
  );
};

const QuickCard: React.FC<QuickCardProps> = ({ title, description, icon, onClick, language }) => {
  return (
    <div
      onClick={onClick}
      className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/50 dark:border-slate-700/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 cursor-pointer overflow-hidden"
      role="button"
      tabIndex={0}
      aria-label={`${language === 'id' ? 'Buka' : 'Open'} ${title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      {/* Background gradient decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/10 group-hover:to-indigo-500/5 transition-all duration-500" />

      {/* Top corner decorative glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-purple-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Card content */}
      <div className="relative flex items-start space-x-5">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
            <div className="text-white scale-110">{icon}</div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-300 mb-1.5 leading-tight">
            {title}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-300 leading-relaxed text-sm line-clamp-2">
            {description}
          </p>
        </div>

        <div className="flex-shrink-0 self-center">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700/50 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-purple-600 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-500/30">
            <svg
              className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-white transition-colors duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Enhanced bottom hover effect line */}
      <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 group-hover:w-full transition-all duration-500 rounded-b-2xl" />
    </div>
  );
};

interface MainDashboardPageProps {
  language: 'en' | 'id';
  onNavigate: (page: Page, subPage?: string) => void;
  t: Record<string, string>;
}

// Daily Quote Component
const DailyQuote: React.FC = () => {
  const { t, language } = useTranslation();
  const [quote, setQuote] = useState<{ content: string; author: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get translated quotes based on current language
    const translatedQuotes = t.daily_quotes || [];

    if (translatedQuotes.length > 0) {
      // Select a random quote from the translated quotes
      const randomQuote = translatedQuotes[Math.floor(Math.random() * translatedQuotes.length)];
      setQuote(randomQuote);
    } else {
      // Fallback if translations are not available
      const fallbackQuote = {
        content:
          language === 'id'
            ? 'Keberhasilan dimulai dengan tekad untuk mencoba.'
            : 'Success begins with the will to try.',
        author: language === 'id' ? 'Anonim' : 'Anonymous',
      };
      setQuote(fallbackQuote);
    }

    setLoading(false);
  }, [t, language]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
          <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">
            {language === 'id' ? 'Memuat inspirasi...' : 'Loading inspiration...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-center px-4">
      <blockquote className="text-xl lg:text-2xl font-light text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
        <span className="text-indigo-500 dark:text-indigo-400 text-3xl font-serif mr-1">
          &ldquo;
        </span>
        {quote?.content}
        <span className="text-indigo-500 dark:text-indigo-400 text-3xl font-serif ml-1">
          &rdquo;
        </span>
      </blockquote>
      <cite className="text-base text-slate-500 dark:text-slate-400 font-medium not-italic">
        — {quote?.author}
      </cite>
    </div>
  );
};

// Online Users Modal Component
interface OnlineUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineUsers: User[];
  language: 'en' | 'id';
  presenceConnected: boolean;
}

const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({
  isOpen,
  onClose,
  onlineUsers,
  language,
  presenceConnected,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'id' ? 'Pengguna Online' : 'Online Users'}
      description={
        presenceConnected
          ? `${onlineUsers.length} ${language === 'id' ? 'pengguna aktif membuka aplikasi' : 'users actively using app'}`
          : `${onlineUsers.length} ${language === 'id' ? 'pengguna aktif (perkiraan)' : 'users active (estimated)'}`
      }
      maxWidth="md"
    >
      <div className="max-h-[60vh] overflow-y-auto -m-2 p-2">
        {onlineUsers.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {language === 'id'
                ? 'Tidak ada pengguna online saat ini'
                : 'No users online currently'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {onlineUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                  {(user.full_name || user.username).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {user.full_name || user.username}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-slate-600 dark:text-slate-300">
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          variant="ghost"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {language === 'id' ? 'Tutup' : 'Close'}
        </Button>
      </div>
    </Modal>
  );
};

// Main Dashboard Component
const MainDashboardPage: React.FC<MainDashboardPageProps> = ({ onNavigate, t }) => {
  const { language } = useTranslation();

  // Get current user and permissions
  const { currentUser } = useCurrentUser();
  const permissionChecker = usePermissions(currentUser);

  // Get dashboard metrics and activities
  const { metrics, activities } = useDashboardMetrics();

  // Get users data for fallback online users list
  const { users } = useUsers();

  // Get users data for online users list using presence tracking
  const { onlineUsers: presenceOnlineUsers, isConnected: presenceConnected } = usePresenceTracker();

  // Calculate online users list using presence tracking or fallback to last_active
  const onlineUsersList = React.useMemo(() => {
    // Use presence tracking if available and connected
    if (presenceConnected && presenceOnlineUsers.length > 0) {
      return presenceOnlineUsers.map((presenceUser) => ({
        id: presenceUser.id,
        username: presenceUser.username,
        full_name: presenceUser.full_name,
        role: presenceUser.role as User['role'],
        is_active: true,
        created_at: '',
        updated_at: '',
        last_active: presenceUser.last_seen.toISOString(),
        permissions: {} as PermissionMatrix,
      }));
    }

    // Fallback to last_active based logic if presence tracking not available
    if (!users) return [];
    const ONLINE_THRESHOLD_MINUTES = 5;
    const now = new Date();
    const thresholdTime = new Date(now.getTime() - ONLINE_THRESHOLD_MINUTES * 60 * 1000);

    return users.filter((user) => {
      if (!user.is_active) return false;
      if (!user.last_active) return false;

      const lastActive = new Date(user.last_active);
      return lastActive >= thresholdTime;
    });
  }, [presenceOnlineUsers, presenceConnected, users]);

  // Define all possible cards with their permission requirements
  const allCards = [
    {
      id: 'operations',
      title: language === 'id' ? 'Operasi Pabrik' : 'Plant Operations',
      description:
        language === 'id'
          ? 'Pantau dan kelola operasi pabrik semen'
          : 'Monitor and manage cement plant operations',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      color: 'hover:border-primary-200 dark:hover:border-primary-700',
      page: 'operations' as Page,
      permission: 'plant_operations' as keyof PermissionMatrix,
    },
    {
      id: 'projects',
      title: language === 'id' ? 'Manajemen Proyek' : 'Project Management',
      description:
        language === 'id' ? 'Kelola proyek dan tugas tim' : 'Manage projects and team tasks',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      color: 'hover:border-secondary-200 dark:hover:border-secondary-700',
      page: 'projects' as Page,
      permission: 'project_management' as keyof PermissionMatrix,
    },
    {
      id: 'users',
      title: language === 'id' ? 'Manajemen User' : 'User Management',
      description:
        language === 'id'
          ? 'Kelola pengguna dan izin akses'
          : 'Manage users and access permissions',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
      color: 'hover:border-success-200 dark:hover:border-success-700',
      page: 'users' as Page,
      permission: 'user_management' as keyof PermissionMatrix,
    },
    {
      id: 'inspection',
      title: language === 'id' ? 'Inspeksi' : 'Inspection',
      description:
        language === 'id' ? 'Lakukan inspeksi dan laporan' : 'Perform inspections and reports',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'hover:border-warning-200 dark:hover:border-warning-700',
      page: 'inspection' as Page,
      permission: 'inspection' as keyof PermissionMatrix,
    },
    {
      id: 'settings',
      title: language === 'id' ? 'Pengaturan' : 'Settings',
      description:
        language === 'id'
          ? 'Konfigurasi aplikasi dan preferensi'
          : 'Configure app settings and preferences',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      color: 'hover:border-neutral-200 dark:hover:border-neutral-700',
      page: 'settings' as Page,
      permission: 'system_settings' as keyof PermissionMatrix,
    },
  ];

  // Filter cards based on user permissions
  const quickCards = allCards.filter((card) => {
    // Super Admin can access everything
    if (currentUser?.role === 'Super Admin') return true;

    // Check permission for each card
    return permissionChecker.hasPermission(card.permission, 'READ');
  });

  // Submenu data structure based on navigationData from Sidebar.tsx
  const submenuData = {
    operations: [
      {
        key: 'op_dashboard',
        label: language === 'id' ? 'Dashboard Operasi' : 'Operations Dashboard',
        icon: <ChartBarIcon className="w-5 h-5" />,
      },
      {
        key: 'op_optimized_dashboard',
        label: language === 'id' ? 'Dashboard Optimal' : 'Optimized Dashboard',
        icon: <PresentationChartLineIcon className="w-5 h-5" />,
      },
      {
        key: 'op_report',
        label: language === 'id' ? 'Laporan' : 'Reports',
        icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
      },
      {
        key: 'op_wag_report',
        label: language === 'id' ? 'Laporan WAG' : 'WAG Report',
        icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
      },
      {
        key: 'op_ccr_data_entry',
        label: language === 'id' ? 'Entry Data CCR' : 'CCR Data Entry',
        icon: <EditIcon className="w-5 h-5" />,
      },
      {
        key: 'op_autonomous_data_entry',
        label: language === 'id' ? 'Entry Data Otonom' : 'Autonomous Data Entry',
        icon: <EditIcon className="w-5 h-5" />,
      },
      {
        key: 'op_monitoring',
        label: language === 'id' ? 'Monitoring' : 'Monitoring',
        icon: <PresentationChartLineIcon className="w-5 h-5" />,
      },
      {
        key: 'op_cop_analysis',
        label: language === 'id' ? 'Analisis COP' : 'COP Analysis',
        icon: <CurrencyDollarIcon className="w-5 h-5" />,
      },
      {
        key: 'op_work_instruction_library',
        label: language === 'id' ? 'Perpustakaan Instruksi Kerja' : 'Work Instruction Library',
        icon: <BuildingLibraryIcon className="w-5 h-5" />,
      },
      {
        key: 'op_master_data',
        label: language === 'id' ? 'Data Master' : 'Master Data',
        icon: <ArchiveBoxIcon className="w-5 h-5" />,
      },
    ],
    inspection: [
      {
        key: 'insp_dashboard',
        label: language === 'id' ? 'Dashboard Inspeksi' : 'Inspection Dashboard',
        icon: <ClipboardCheckIcon className="w-5 h-5" />,
      },
      {
        key: 'insp_form',
        label: language === 'id' ? 'Form Inspeksi' : 'Inspection Form',
        icon: <EditIcon className="w-5 h-5" />,
      },
      {
        key: 'insp_details',
        label: language === 'id' ? 'Detail Inspeksi' : 'Inspection Details',
        icon: <ChartBarIcon className="w-5 h-5" />,
      },
      {
        key: 'insp_reports',
        label: language === 'id' ? 'Laporan Inspeksi' : 'Inspection Reports',
        icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
      },
    ],
    projects: [
      {
        key: 'proj_dashboard',
        label: language === 'id' ? 'Dashboard Proyek' : 'Project Dashboard',
        icon: <ChartPieIcon className="w-5 h-5" />,
      },
      {
        key: 'proj_list',
        label: language === 'id' ? 'Daftar Proyek' : 'Project List',
        icon: <Bars4Icon className="w-5 h-5" />,
      },
    ],
    users: [
      {
        key: 'user_list',
        label: language === 'id' ? 'Daftar Pengguna' : 'User List',
        icon: <UserGroupIcon className="w-5 h-5" />,
      },
      {
        key: 'user_activity',
        label: language === 'id' ? 'Aktivitas Pengguna' : 'User Activity',
        icon: <ClockIcon className="w-5 h-5" />,
      },
    ],
    settings: [
      {
        key: 'settings_general',
        label: language === 'id' ? 'Pengaturan Umum' : 'General Settings',
        icon: <CogIcon className="w-5 h-5" />,
      },
      {
        key: 'settings_profile',
        label: language === 'id' ? 'Profil Pengguna' : 'User Profile',
        icon: <UserIcon className="w-5 h-5" />,
      },
      {
        key: 'settings_security',
        label: language === 'id' ? 'Keamanan' : 'Security',
        icon: <ShieldCheckIcon className="w-5 h-5" />,
      },
    ],
  };

  // State for submenu modal
  const [selectedModule, setSelectedModule] = useState<Page | null>(null);

  // State for online users modal
  const [showOnlineUsersModal, setShowOnlineUsersModal] = useState(false);

  // Handlers for submenu modal
  const handleCardClick = (page: Page) => {
    setSelectedModule(page);
  };

  const handleSubMenuSelect = (subPage: string) => {
    if (selectedModule) {
      onNavigate(selectedModule, subPage);
      setSelectedModule(null);
    }
  };

  const handleModalClose = () => {
    setSelectedModule(null);
  };

  // Handler for online users modal
  const handleOnlineUsersClick = () => {
    setShowOnlineUsersModal(true);
  };

  const handleOnlineUsersModalClose = () => {
    setShowOnlineUsersModal(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 relative overflow-hidden transition-colors duration-300">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/10 to-secondary-600/10 rounded-full blur-3xl dark:from-primary-400/5 dark:to-secondary-600/5"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary-400/10 to-primary-600/10 rounded-full blur-3xl dark:from-secondary-400/5 dark:to-primary-600/5"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary-300/5 to-secondary-300/5 rounded-full blur-3xl dark:from-primary-300/3 dark:to-secondary-300/3"></div>
      </div>

      <div className="relative w-full px-4 lg:px-8 py-6 space-y-8">
        {/* Header */}
        <DashboardHeader />

        {/* Metrics Overview Cards */}
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4 lg:px-8">
            <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
              <MetricCard
                title={language === 'id' ? 'Operasi Aktif' : 'Active Operations'}
                value={metrics.activeOperations.toString()}
                icon={
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                }
                trend={{
                  value: 12,
                  direction: 'up',
                  period: language === 'id' ? 'hari ini' : 'today',
                }}
                variant="primary"
              />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <MetricCard
                title={language === 'id' ? 'Proyek Aktif' : 'Active Projects'}
                value={metrics.activeProjects.toString()}
                icon={
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                }
                trend={{
                  value: 8,
                  direction: 'up',
                  period: language === 'id' ? 'minggu ini' : 'this week',
                }}
                variant="success"
              />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <MetricCard
                title={language === 'id' ? 'Pengguna Online' : 'Online Users'}
                value={metrics.onlineUsers.toString()}
                icon={
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                }
                trend={{
                  value: 3,
                  direction: 'down',
                  period: language === 'id' ? 'jam lalu' : 'hour ago',
                }}
                variant="warning"
                onClick={handleOnlineUsersClick}
              />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <MetricCard
                title={language === 'id' ? 'Inspeksi Hari Ini' : "Today's Inspections"}
                value={metrics.todaysInspections.toString()}
                icon={
                  <svg
                    className="w-6 h-6 text-white"
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
                }
                trend={{
                  value: 15,
                  direction: 'up',
                  period: language === 'id' ? 'hari ini' : 'today',
                }}
                variant="danger"
              />
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="w-full">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 px-4 lg:px-8">
            <div className="xl:col-span-2 order-2 xl:order-1">
              <ActivityFeed activities={activities} language={language} />
            </div>

            <div className="xl:col-span-1 order-1 xl:order-2 space-y-6">
              {/* Quick Actions */}
              <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-lg p-5 overflow-hidden">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-purple-500/5 rounded-full blur-3xl" />

                <h3 className="relative text-lg font-bold mb-5 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {language === 'id' ? 'Aksi Cepat' : 'Quick Actions'}
                  </span>
                </h3>

                <div className="relative grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                  <button className="group w-full flex items-center space-x-3 p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-500/20 dark:hover:to-purple-500/20 transition-all duration-300 border border-indigo-200/50 dark:border-indigo-500/20 hover:border-indigo-300/70 dark:hover:border-indigo-400/40 hover:shadow-md hover:shadow-indigo-500/5">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-indigo-500/30 transition-shadow">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors text-left">
                      {language === 'id' ? 'Entry Data Baru' : 'New Data Entry'}
                    </span>
                  </button>

                  <button className="group w-full flex items-center space-x-3 p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-500/20 dark:hover:to-teal-500/20 transition-all duration-300 border border-emerald-200/50 dark:border-emerald-500/20 hover:border-emerald-300/70 dark:hover:border-emerald-400/40 hover:shadow-md hover:shadow-emerald-500/5">
                    <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-emerald-500/30 transition-shadow">
                      <svg
                        className="w-4 h-4 text-white"
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
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors text-left">
                      {language === 'id' ? 'Buat Inspeksi' : 'Create Inspection'}
                    </span>
                  </button>

                  <button className="group w-full flex items-center space-x-3 p-3.5 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-500/10 hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-500/20 dark:hover:to-purple-500/20 transition-all duration-300 border border-violet-200/50 dark:border-violet-500/20 hover:border-violet-300/70 dark:hover:border-violet-400/40 hover:shadow-md hover:shadow-violet-500/5">
                    <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-violet-500/30 transition-shadow">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors text-left">
                      {language === 'id' ? 'Lihat Laporan' : 'View Reports'}
                    </span>
                  </button>
                </div>
              </div>

              {/* System Status */}
              <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-lg p-5 overflow-hidden">
                {/* Decorative background */}
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-slate-400/10 to-indigo-400/5 rounded-full blur-3xl" />

                <h3 className="relative text-lg font-bold mb-5 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600 rounded-lg flex items-center justify-center shadow-md">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                      />
                    </svg>
                  </div>
                  <span className="bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-300 dark:to-slate-400 bg-clip-text text-transparent">
                    {language === 'id' ? 'Status Sistem' : 'System Status'}
                  </span>
                </h3>

                <div className="relative space-y-2">
                  <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-colors">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {language === 'id' ? 'Database' : 'Database'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-pulse shadow-sm shadow-emerald-500/50" />
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {language === 'id' ? 'Aktif' : 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-colors">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {language === 'id' ? 'API Server' : 'API Server'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-pulse shadow-sm shadow-emerald-500/50" />
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {language === 'id' ? 'Aktif' : 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-colors">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {language === 'id' ? 'WebSocket' : 'WebSocket'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-pulse shadow-sm shadow-amber-500/50" />
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md">
                        {language === 'id' ? 'Menghubungkan' : 'Connecting'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-colors">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {language === 'id' ? 'Backup' : 'Backup'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full shadow-sm shadow-indigo-500/50" />
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
                        {language === 'id' ? 'Terjadwal' : 'Scheduled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Quote */}
        <div className="w-full">
          <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-lg p-8 lg:p-10 text-center overflow-hidden mx-4 lg:mx-8">
            {/* Enhanced decorative background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 dark:from-indigo-500/5 dark:via-transparent dark:to-purple-500/5" />

            {/* Floating decorative orbs */}
            <div className="absolute -top-8 -left-8 w-40 h-40 bg-gradient-to-br from-indigo-400/15 to-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-gradient-to-tl from-purple-400/15 to-indigo-500/10 rounded-full blur-3xl" />

            {/* Subtle decorative circles */}
            <div className="absolute inset-0">
              <div className="absolute top-6 left-8 w-16 h-16 border border-indigo-200/30 dark:border-indigo-500/10 rounded-full" />
              <div className="absolute bottom-6 right-8 w-12 h-12 border border-purple-200/30 dark:border-purple-500/10 rounded-full" />
              <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2 w-8 h-8 border border-violet-200/20 dark:border-violet-500/10 rounded-full" />
              <div className="absolute top-1/3 right-1/4 w-6 h-6 border border-indigo-200/20 dark:border-indigo-500/10 rounded-full" />
            </div>

            <div className="relative">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {t.quote_of_the_day}
                </h2>
              </div>
              <DailyQuote />
            </div>
          </div>
        </div>

        {/* Quick Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 px-4 lg:px-8">
          {quickCards.map((card, index) => (
            <div
              key={card.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <QuickCard
                title={card.title}
                description={card.description}
                icon={card.icon}
                language={language}
                onClick={() => handleCardClick(card.page)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* SubMenu Modal */}
      {selectedModule && (
        <SubMenuModal
          isOpen={!!selectedModule}
          onClose={handleModalClose}
          title={quickCards.find((card) => card.page === selectedModule)?.title || ''}
          subMenus={submenuData[selectedModule] || []}
          onSelect={handleSubMenuSelect}
          language={language}
        />
      )}

      {/* Online Users Modal */}
      <OnlineUsersModal
        isOpen={showOnlineUsersModal}
        onClose={handleOnlineUsersModalClose}
        onlineUsers={onlineUsersList}
        language={language}
        presenceConnected={presenceConnected}
      />
    </div>
  );
};

export default MainDashboardPage;
