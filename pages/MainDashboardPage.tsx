import React, { useState, useEffect } from 'react';
import { Page } from '../App';

// Import component components
import { DashboardHeader } from '../components/dashboard/Dashboard';
import { MetricCard } from '../components/dashboard/Dashboard';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { useTranslation } from '../hooks/useTranslation';

// Import hooks for permissions
import { useCurrentUser } from '../hooks/useCurrentUser';
import { usePermissions } from '../utils/permissions';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { PermissionMatrix } from '../types';

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
  color: string;
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
  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="submenu-modal-title"
      aria-describedby="submenu-modal-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
          <h2 id="submenu-modal-title" className="text-xl font-bold">
            {title}
          </h2>
          <p id="submenu-modal-description" className="text-indigo-100 text-sm mt-1">
            {language === 'id' ? 'Pilih submenu yang ingin dibuka' : 'Choose submenu to open'}
          </p>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {subMenus.map((menu) => (
              <button
                key={menu.key}
                onClick={() => {
                  onSelect(menu.key);
                  onClose();
                }}
                className="w-full flex items-center space-x-3 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label={`${language === 'id' ? 'Buka' : 'Open'} ${menu.label}`}
              >
                <div className="flex-shrink-0 w-10 h-10 bg-slate-100 group-hover:bg-indigo-100 rounded-lg flex items-center justify-center transition-colors">
                  {menu.icon}
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium text-slate-800 group-hover:text-indigo-700 transition-colors">
                    {menu.label}
                  </span>
                </div>
                <div className="flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors"
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

        {/* Footer */}
        <div className="border-t border-slate-200 p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            aria-label={language === 'id' ? 'Tutup modal submenu' : 'Close submenu modal'}
          >
            {language === 'id' ? 'Batal' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

const QuickCard: React.FC<QuickCardProps> = ({
  title,
  description,
  icon,
  onClick,
  color,
  language,
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl border border-white/30 bg-white/95 backdrop-blur-xl shadow-xl hover:shadow-2xl p-8 cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 ${color}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${language === 'id' ? 'Buka' : 'Open'} ${title}`}
    >
      {/* Enhanced background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
        <div className="absolute top-4 right-4 w-16 h-16 border-2 border-current rounded-full animate-spin-slow"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 border-2 border-current rounded-full animate-spin-slow-reverse"></div>
      </div>

      {/* Card content */}
      <div className="relative flex items-start space-x-6">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gradient-to-br from-white/80 to-white/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110 border border-white/50 group-hover:border-white/70">
            <div className="text-slate-700 group-hover:text-slate-800 transition-colors duration-300 filter drop-shadow-sm scale-110">
              {icon}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors duration-300 mb-3 leading-tight">
            {title}
          </h3>
          <p className="text-slate-600 group-hover:text-slate-700 transition-colors duration-300 leading-relaxed text-base">
            {description}
          </p>
        </div>

        <div className="flex-shrink-0 self-center">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-indigo-100 group-hover:to-indigo-200 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-md group-hover:shadow-lg">
            <svg
              className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors duration-300"
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

      {/* Enhanced hover effect line */}
      <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 group-hover:w-full transition-all duration-500 rounded-t-full"></div>

      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-blue-500/5 transition-all duration-500 pointer-events-none"></div>
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
      <div className="flex items-center justify-center h-32">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
          <span className="text-slate-600 font-medium">
            {language === 'id' ? 'Memuat inspirasi...' : 'Loading inspiration...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <blockquote className="text-2xl lg:text-3xl font-light text-slate-800 mb-6 leading-relaxed">
        <span className="text-indigo-600 text-4xl lg:text-5xl font-serif">&ldquo;</span>
        {quote?.content}
        <span className="text-indigo-600 text-4xl lg:text-5xl font-serif">&rdquo;</span>
      </blockquote>
      <cite className="text-lg text-slate-600 font-medium">— {quote?.author}</cite>
    </div>
  );
};

// Main Dashboard Component
const MainDashboardPage: React.FC<MainDashboardPageProps> = ({ onNavigate, t }) => {
  const { language } = useTranslation();

  // Get current user and permissions
  const { currentUser } = useCurrentUser();
  const permissionChecker = usePermissions(currentUser);

  // Get dashboard metrics and activities
  const { metrics, activities, loading } = useDashboardMetrics();

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
        <svg
          className="w-6 h-6 text-slate-700"
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
      ),
      color: 'hover:border-blue-200',
      page: 'operations' as Page,
      permission: 'plant_operations' as keyof PermissionMatrix,
    },
    {
      id: 'projects',
      title: language === 'id' ? 'Manajemen Proyek' : 'Project Management',
      description:
        language === 'id' ? 'Kelola proyek dan tugas tim' : 'Manage projects and team tasks',
      icon: (
        <svg
          className="w-6 h-6 text-slate-700"
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
      ),
      color: 'hover:border-green-200',
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
        <svg
          className="w-6 h-6 text-slate-700"
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
      ),
      color: 'hover:border-purple-200',
      page: 'users' as Page,
      permission: 'user_management' as keyof PermissionMatrix,
    },
    {
      id: 'inspection',
      title: language === 'id' ? 'Inspeksi' : 'Inspection',
      description:
        language === 'id' ? 'Lakukan inspeksi dan laporan' : 'Perform inspections and reports',
      icon: (
        <svg
          className="w-6 h-6 text-slate-700"
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
      ),
      color: 'hover:border-orange-200',
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
        <svg
          className="w-6 h-6 text-slate-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
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
      color: 'hover:border-gray-200',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
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
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-4 sm:p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {language === 'id' ? 'Aksi Cepat' : 'Quick Actions'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                  <button className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 border border-blue-200/50 hover:border-blue-300/50 group">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
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
                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors text-left">
                      {language === 'id' ? 'Entry Data Baru' : 'New Data Entry'}
                    </span>
                  </button>

                  <button className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 border border-green-200/50 hover:border-green-300/50 group">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
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
                    <span className="text-sm font-medium text-slate-700 group-hover:text-green-700 transition-colors text-left">
                      {language === 'id' ? 'Buat Inspeksi' : 'Create Inspection'}
                    </span>
                  </button>

                  <button className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 transition-all duration-300 border border-purple-200/50 hover:border-purple-300/50 group">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
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
                    <span className="text-sm font-medium text-slate-700 group-hover:text-purple-700 transition-colors text-left">
                      {language === 'id' ? 'Lihat Laporan' : 'View Reports'}
                    </span>
                  </button>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-4 sm:p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {language === 'id' ? 'Status Sistem' : 'System Status'}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-600">
                      {language === 'id' ? 'Database' : 'Database'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">
                        {language === 'id' ? 'Aktif' : 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-600">
                      {language === 'id' ? 'API Server' : 'API Server'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">
                        {language === 'id' ? 'Aktif' : 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-600">
                      {language === 'id' ? 'WebSocket' : 'WebSocket'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-yellow-600 font-medium">
                        {language === 'id' ? 'Menghubungkan' : 'Connecting'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-600">
                      {language === 'id' ? 'Backup' : 'Backup'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">
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
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8 lg:p-12 text-center relative overflow-hidden mx-4 lg:mx-8">
            {/* Quote background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-4 w-20 h-20 border-2 border-indigo-300 rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-16 h-16 border-2 border-purple-300 rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-cyan-300 rounded-full"></div>
            </div>

            <div className="relative">
              <h2 className="text-xl lg:text-2xl font-bold text-slate-800 mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t.quote_of_the_day}
              </h2>
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
                color={card.color}
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
    </div>
  );
};

export default MainDashboardPage;
