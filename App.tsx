import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
const SignOutConfirmModal = React.lazy(() => import('./components/SignOutConfirmModal'));
const ServerPage = React.lazy(() => import('./pages/ServerPage'));

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

import { usePresenceTracker } from './hooks/usePresenceTracker';

const App: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();
  const isMobile = useIsMobile();
  useTheme(); // Theme context is initialized

  // Initialize presence tracker globally to keep heartbeat alive
  usePresenceTracker();

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
        return t.inspection || 'Inspection';

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
        className="h-screen w-screen flex items-center justify-center bg-ubuntu-aubergine"
        data-testid="loading-indicator"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ubuntu-orange/10 rounded-full blur-[120px] animate-pulse" />
          <div
            className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-ubuntu-darkAubergine/20 rounded-full blur-[120px] animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        </div>

        <div className="relative z-10 text-center font-ubuntu">
          <div className="relative mb-10">
            <motion.div
              className="w-24 h-24 mx-auto rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl"
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <img
                src="/sipoma-logo.png"
                alt="SIPOMA Logo"
                className="w-16 h-16 object-contain brightness-0 invert opacity-90"
              />
            </motion.div>
            <div className="absolute inset-[-20px] flex items-center justify-center pointer-events-none">
              <div
                className="w-32 h-32 rounded-full border-2 border-transparent border-t-ubuntu-orange border-r-ubuntu-orange/30 animate-spin"
                style={{ animationDuration: '1s' }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white tracking-widest uppercase">SIPOMA</h2>
            <div className="flex flex-col items-center gap-1">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">
                SISTEM INFORMASI PRODUKSI & MONITORING
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-ubuntu-orange animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-ubuntu-orange animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-ubuntu-orange animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
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
              marginLeft: isMobile ? '0' : isSidebarExpanded ? '280px' : '70px',
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

                   {/* Server Module - Only for Super Admin */}
                   {currentPage === 'server' && currentUser?.role === 'Super Admin' && (
                     <ServerPage />
                   )}

                  {/* Inspection Module */}
                  <PermissionGuard
                    user={currentUser}
                    feature="inspection"
                    requiredLevel="READ"
                    fallback={null}
                  >
                    {currentPage === 'inspection' && <InspectionPage />}
                  </PermissionGuard>
                </LazyContainer>
              </div>
            </main>
          </div>
        </div>
        {/* Optimized Modals Loading */}
        <Suspense fallback={null}>
          {isUserModalOpen && (
            <UserForm
              isOpen={isUserModalOpen}
              user={editingUser as any}
              onClose={handleCloseUserModal}
            />
          )}

          {isProfileModalOpen && (
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
          )}

          {isSignOutModalOpen && (
            <SignOutConfirmModal
              isOpen={isSignOutModalOpen}
              onClose={handleSignOutCancel}
              onConfirm={handleSignOutConfirm}
            />
          )}
        </Suspense>

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
