import React, { useState, useCallback, useEffect, Suspense } from 'react';
// ...existing code...

// Import ThemeProvider
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// using SimpleErrorBoundary
import SimpleErrorBoundary from './components/SimpleErrorBoundary';
// Lightweight components can remain synchronous
import LoadingSkeleton from './components/LoadingSkeleton';

// Lazy load heavy components to break circular dependencies
const Modal = React.lazy(() => import('./components/Modal'));
const ProfileEditModal = React.lazy(() => import('./components/ProfileEditModal'));
const UserForm = React.lazy(() => import('./features/user-management/components/UserForm'));
const PasswordDisplay = React.lazy(() => import('./components/PasswordDisplay'));
const Toast = React.lazy(() => import('./components/Toast'));
const LogoutProgress = React.lazy(() => import('./components/LogoutProgress'));
const Sidebar = React.lazy(() => import('./components/Sidebar'));
const Header = React.lazy(() => import('./components/Header'));

import { useUserStore } from './stores/userStore';
import { useCurrentUser } from './hooks/useCurrentUser';
import { usePlantData } from './hooks/usePlantData';

import { useIsMobile } from './hooks/useIsMobile';
import { User, Page } from './types';
import { usePlantUnits } from './hooks/usePlantUnits';
import { logger } from './utils/logger';
import { useTranslation } from './hooks/useTranslation';

import { PermissionGuard } from './utils/permissions';
import { LazyContainer } from './src/utils/LazyLoadingFixed';

// Import centralized lazy components
import {
  MainDashboardPage,
  PlantOperationsPage,
  ProjectManagementPage,
  SettingsPage,
  DatabasePage,
  UserListPage,
  WhatsAppReportsPage,
  InspectionPage,
} from './src/config/lazyComponents';

import { logSystemStatus } from './utils/systemStatus';
import { startBackgroundHealthCheck, monitorWebSocketConnection } from './utils/connectionMonitor';
import { registerBackgroundSync } from './utils/syncManager';

// Preload critical routes dengan higher priority - using relative paths
const preloadDashboard = () => import('./pages/MainDashboardPage');
const preloadPlantOperations = () => import('./pages/PlantOperationsPage');

const App: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();
  const isMobile = useIsMobile();
  useTheme(); // Theme context is initialized

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const { loading: plantUnitsLoading } = usePlantUnits();
  const { currentUser, loading: currentUserLoading, logout } = useCurrentUser();
  const { updateUser, isLoading: usersLoading } = useUserStore();
  const { loading: plantDataLoading } = usePlantData();

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [showPasswordDisplay, setShowPasswordDisplay] = useState(false);
  const [generatedPassword] = useState('');
  const [newUsername] = useState('');
  const [newUserFullName] = useState('');
  const [showToast, setShowToast] = useState(false);
  // Logout progress states
  const [isLogoutInProgress, setIsLogoutInProgress] = useState(false);
  const [logoutStage, setLogoutStage] = useState<
    'starting' | 'clearing' | 'completing' | 'completed'
  >('starting');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const [activeSubPages, setActiveSubPages] = useState({
    operations: 'op_dashboard',
    packing: 'pack_master_data',
    projects: 'proj_dashboard',
    users: 'user_list',
    rkc_operations: 'op_dashboard',
    inspection: 'insp_dashboard',
  });

  // Log system status on app load and start connection monitor
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logSystemStatus();
    }

    const stopConnectionMonitor = startBackgroundHealthCheck(90000); // Start with 1.5 minutes
    monitorWebSocketConnection();

    return () => {
      stopConnectionMonitor();
    };
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
          registerBackgroundSync();
        })
        .catch((error) => {
          logger.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  useEffect(() => {
    if (currentUser && !currentUserLoading) {
      preloadDashboard();
      preloadPlantOperations();
    }
  }, [currentUser, currentUserLoading]);

  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  const handleToggleExpand = useCallback(() => {
    setIsSidebarExpanded((prev) => !prev);
  }, []);

  const handleOpenAddUserModal = useCallback(() => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  }, []);

  const handleCloseUserModal = useCallback(() => {
    setIsUserModalOpen(false);
    setEditingUser(null);
  }, []);

  const handleOpenProfileModal = () => setProfileModalOpen(true);
  const handleCloseProfileModal = () => setProfileModalOpen(false);

  const handleNavigate = (page: Page, subPage?: string) => {
    setCurrentPage(page);
    if (subPage) {
      setActiveSubPages((prev) => ({ ...prev, [page]: subPage }));
    }
  };

  const handleSignOutClick = () => setIsSignOutModalOpen(true);
  const handleSignOutCancel = () => setIsSignOutModalOpen(false);
  const handleSignOutConfirm = async () => {
    setIsSignOutModalOpen(false);
    setIsLogoutInProgress(true);
    setLogoutStage('starting');

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setLogoutStage('clearing');
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLogoutStage('completing');
      await logout();
      setLogoutStage('completed');
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      logger.error('Logout error:', error);
      await logout();
    } finally {
      setIsLogoutInProgress(false);
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return t.mainDashboard;
      case 'users':
        return t[activeSubPages.users as keyof typeof t] || t.userManagement;
      case 'settings':
        return t.header_settings;
      case 'operations':
        return t[activeSubPages.operations as keyof typeof t] || t.plantOperations;
      case 'rkc_operations':
        return t[activeSubPages.rkc_operations as keyof typeof t] || t.rkcPlantOperations;
      case 'projects':
        if (activeSubPages.projects === 'proj_detail') return t.project_overview_title;
        return t[activeSubPages.projects as keyof typeof t] || t.projectManagement;
      case 'database':
        return t.database;
      case 'inspection':
        return t[activeSubPages.inspection as keyof typeof t] || 'Inspection';
      default:
        return 'SIPOMA';
    }
  };

  if (
    usersLoading ||
    plantUnitsLoading ||
    plantDataLoading ||
    (currentUserLoading && !localStorage.getItem('currentUser'))
  ) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-800"
        data-testid="loading-indicator"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-400/5 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-500/10 dark:bg-slate-400/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        </div>

        <div className="relative z-10 text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white shadow-xl shadow-slate-200 dark:shadow-slate-900/20 flex items-center justify-center animate-pulse overflow-hidden">
              <img
                src="/sipoma-logo.png"
                alt="SIPOMA Logo"
                className="w-14 h-14 object-contain drop-shadow-md"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-28 h-28 rounded-full border-2 border-transparent border-t-indigo-500 border-r-indigo-300 dark:border-t-indigo-400 dark:border-r-indigo-600 animate-spin"
                style={{ animationDuration: '1.5s' }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-slate-700 to-indigo-600 dark:from-indigo-400 dark:via-slate-200 dark:to-indigo-400 bg-clip-text text-transparent">
              SIPOMA
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Memuat sistem...
            </p>
            <div className="flex justify-center gap-1.5 pt-2">
              <span
                className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SimpleErrorBoundary
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          Terjadi error pada aplikasi. Silakan refresh halaman.
        </div>
      }
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen w-screen bg-slate-50 dark:bg-slate-900">
            <LoadingSkeleton variant="rectangular" height={400} width="90%" />
          </div>
        }
      >
        <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans compact transition-colors duration-300 flex">
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            t={t}
            isOpen={isSidebarOpen}
            onClose={handleCloseSidebar}
            currentUser={currentUser}
            isExpanded={isSidebarExpanded}
            onToggleExpand={handleToggleExpand}
          />
          <div
            className="flex flex-col flex-1 h-full min-w-0 transition-all duration-300"
            style={{
              marginLeft: isMobile ? '0' : isSidebarExpanded ? '16rem' : '6rem',
            }}
          >
            <Header
              pageTitle={getPageTitle()}
              showAddUserButton={false}
              onAddUser={handleOpenAddUserModal}
              t={t}
              onNavigate={handleNavigate}
              onSignOut={handleSignOutClick}
              currentUser={currentUser}
              onToggleSidebar={handleToggleSidebar}
              currentLanguage={language}
              onLanguageChange={setLanguage}
            />
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50/50 via-transparent to-slate-100/30 dark:from-slate-900/50 dark:via-transparent dark:to-slate-800/30 page-transition relative">
              <div className="w-full h-full pb-20">
                <LazyContainer
                  fallback={
                    <LoadingSkeleton
                      variant="rectangular"
                      height={200}
                      width="100%"
                      className="mx-auto mt-24"
                    />
                  }
                  errorFallback={
                    <div className="p-4 border border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-600 rounded text-center mt-24">
                      <p className="text-red-700 dark:text-red-400">Failed to load content</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded transition-colors"
                      >
                        Reload
                      </button>
                    </div>
                  }
                >
                  {/* Dashboard - Check permission */}
                  <PermissionGuard
                    user={currentUser}
                    feature="dashboard"
                    requiredLevel="READ"
                    fallback={null}
                  >
                    {currentPage === 'dashboard' && (
                      <MainDashboardPage language={language} onNavigate={handleNavigate} t={t} />
                    )}
                  </PermissionGuard>

                  {/* User Management - Only for Super Admin */}
                  {currentPage === 'users' && currentUser?.role === 'Super Admin' && (
                    <>{activeSubPages.users === 'user_list' && <UserListPage />}</>
                  )}

                  {/* Settings - Accessible to all users */}
                  {currentPage === 'settings' && (
                    <SettingsPage
                      t={t}
                      user={currentUser}
                      onOpenProfileModal={handleOpenProfileModal}
                      currentLanguage={language}
                      onLanguageChange={setLanguage}
                    />
                  )}

                  {/* WhatsApp Reports - Accessible to all users */}
                  {currentPage === 'whatsapp-reports' && (
                    <React.Suspense
                      fallback={
                        <LoadingSkeleton
                          variant="rectangular"
                          height={200}
                          width="100%"
                          className="mt-4"
                        />
                      }
                    >
                      <WhatsAppReportsPage />
                    </React.Suspense>
                  )}

                  {/* CM Plant Operations - Check permission */}
                  <PermissionGuard
                    user={currentUser}
                    feature="cm_plant_operations"
                    requiredLevel="READ"
                    fallback={null}
                  >
                    {currentPage === 'operations' && (
                      <PlantOperationsPage
                        section="CM"
                        activePage={activeSubPages.operations}
                        t={t}
                        plantData={{
                          loading: plantDataLoading,
                        }}
                      />
                    )}
                  </PermissionGuard>

                  {/* RKC Plant Operations - Check permission */}
                  <PermissionGuard
                    user={currentUser}
                    feature="rkc_plant_operations"
                    requiredLevel="READ"
                    fallback={null}
                  >
                    {currentPage === 'rkc_operations' && (
                      <PlantOperationsPage
                        section="RKC"
                        activePage={activeSubPages.rkc_operations}
                        t={t}
                        plantData={{
                          loading: plantDataLoading,
                        }}
                      />
                    )}
                  </PermissionGuard>

                  {/* Project Management */}
                  {currentPage === 'projects' && (
                    <ProjectManagementPage
                      activePage={activeSubPages.projects}
                      t={t}
                      onNavigate={(subpage: string) => handleNavigate('projects', subpage)}
                    />
                  )}

                  {/* Database Module */}
                  {currentPage === 'database' && <DatabasePage />}

                  {/* Inspection Module */}
                  <PermissionGuard
                    user={currentUser}
                    feature="inspection"
                    requiredLevel="READ"
                    fallback={null}
                  >
                    {currentPage === 'inspection' && (
                      <InspectionPage activePage={activeSubPages.inspection} t={t} />
                    )}
                  </PermissionGuard>
                </LazyContainer>
              </div>
            </main>
          </div>
        </div>
        <UserForm
          isOpen={isUserModalOpen}
          user={editingUser as any}
          onClose={handleCloseUserModal}
        />
        <ProfileEditModal
          isOpen={isProfileModalOpen}
          onClose={handleCloseProfileModal}
          user={currentUser}
          onSave={(updatedUser) => {
            if (currentUser) {
              import('./utils/pocketbase-simple')
                .then(({ pb }) => {
                  pb.collection('users').authRefresh();
                })
                .then(() => {
                  updateUser(currentUser.id, updatedUser);
                  window.dispatchEvent(new CustomEvent('user-profile-updated'));
                  setToastMessage(t.avatar_updated || 'Profile updated successfully!');
                  setToastType('success');
                  setShowToast(true);
                  handleCloseProfileModal();
                })
                .catch((err) => {
                  import('./utils/logger').then(({ logger }) => {
                    logger.error('Failed to refresh auth:', err);
                  });
                  setToastMessage('Profile updated but display may not refresh automatically');
                  setToastType('warning');
                  setShowToast(true);
                });
            }
          }}
          t={t}
        />
        {showPasswordDisplay && (
          <PasswordDisplay
            password={generatedPassword}
            username={newUsername}
            fullName={newUserFullName}
            onClose={() => setShowPasswordDisplay(false)}
            t={t}
          />
        )}
        <Toast
          message={toastMessage}
          type={toastType}
          isVisible={showToast}
          onClose={() => setShowToast(false)}
          duration={4000}
        />
        <Modal
          isOpen={isSignOutModalOpen}
          onClose={handleSignOutCancel}
          title={t.confirm_sign_out_title}
        >
          <div className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-slate-100 dark:from-indigo-900/50 dark:to-slate-800 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10">
                <svg
                  className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>

              <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                {t.confirm_sign_out_title || 'Konfirmasi Keluar'}
              </h4>
              <p className="text-slate-500 dark:text-slate-400">{t.confirm_sign_out_message}</p>
            </div>

            <div className="p-4 bg-gradient-to-r from-indigo-50 to-slate-50 dark:from-indigo-950/30 dark:to-slate-900/50 border border-indigo-200/50 dark:border-indigo-800/50 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                    Data yang akan dihapus
                  </p>
                  <p className="text-xs text-indigo-700/70 dark:text-indigo-300/70 mt-1">
                    Cookies & site data untuk localhost dan sipoma.site
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-800/50 dark:to-indigo-950/30 px-6 py-4 flex justify-end gap-3 border-t border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={handleSignOutCancel}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              {t.cancel_button}
            </button>
            <button
              onClick={handleSignOutConfirm}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all duration-200"
            >
              {t.header_sign_out}
            </button>
          </div>
        </Modal>

        <LogoutProgress isVisible={isLogoutInProgress} stage={logoutStage} />
      </Suspense>
    </SimpleErrorBoundary>
  );
};

const AppWithTheme: React.FC = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

export default AppWithTheme;
