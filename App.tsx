import React, { useState, useCallback, useEffect } from 'react';
// ...existing code...

// ...existing code...
// Using SimpleErrorBoundary instead
import SimpleErrorBoundary from './components/SimpleErrorBoundary';
import Modal from './components/Modal';
import ProfileEditModal from './components/ProfileEditModal';
import UserForm from './features/user-management/components/UserForm';
import PasswordDisplay from './components/PasswordDisplay';
import Toast from './components/Toast';
import LoadingSkeleton from './components/LoadingSkeleton';
import LogoutProgress from './components/LogoutProgress';
import { useUserStore } from './stores/userStore';
import { useCurrentUser } from './hooks/useCurrentUser';
import { usePlantData } from './hooks/usePlantData';

import { useIsMobile } from './hooks/useIsMobile';
import { User } from './types';
import { usePlantUnits } from './hooks/usePlantUnits';
import { logger } from './utils/logger';
import { useTranslation } from './hooks/useTranslation';
import ConnectionStatusIndicator from './components/ConnectionStatusIndicator';
import OfflineIndicator from './components/OfflineIndicator';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { PermissionGuard } from './utils/permissions';
import { LazyContainer } from './src/utils/LazyLoadingFixed';

// Import centralized lazy components
import {
  MainDashboardPage,
  PlantOperationsPage,
  ProjectManagementPage,
  InspectionPage,
  SettingsPage,
  UserListPage,
  WhatsAppReportsPage,
} from './src/config/lazyComponents';

import { logSystemStatus } from './utils/systemStatus';
import { startBackgroundHealthCheck, monitorWebSocketConnection } from './utils/connectionMonitor';
import { registerBackgroundSync } from './utils/syncManager';

// Preload critical routes dengan higher priority - using relative paths
const preloadDashboard = () => import('./pages/MainDashboardPage');
const preloadPlantOperations = () => import('./pages/PlantOperationsPage');

export type Page =
  | 'dashboard'
  | 'users'
  | 'operations'
  | 'packing'
  | 'inspection'
  | 'projects'
  | 'settings'
  | 'whatsapp-reports';
export type Language = 'en' | 'id';
export type Theme = 'light';

const App: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();
  const isMobile = useIsMobile();

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  const { loading: plantUnitsLoading } = usePlantUnits();
  const { currentUser, loading: currentUserLoading, logout } = useCurrentUser();
  const { updateUser, isLoading: usersLoading } = useUserStore();

  const { loading: plantDataLoading } = usePlantData();

  // Load projects data for active projects count
  // const { projects } = useProjects();

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
    inspection: 'insp_dashboard',
    projects: 'proj_dashboard',
    users: 'user_list',
  });

  // Log system status on app load and start connection monitor
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logSystemStatus();
    }

    // Start connection monitoring with adaptive intervals
    const stopConnectionMonitor = startBackgroundHealthCheck(90000); // Start with 1.5 minutes

    // Start WebSocket monitoring for real-time connectivity
    monitorWebSocketConnection();

    return () => {
      // Clean up connection monitor on unmount
      stopConnectionMonitor();
    };
  }, []);

  // Register service worker and background sync for offline support
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((_registration) => {
          // Register background sync
          registerBackgroundSync();
        })
        .catch((error) => {
          logger.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  // Preload critical routes after user authentication
  useEffect(() => {
    if (currentUser && !currentUserLoading) {
      // Preload main dashboard and common pages
      preloadDashboard();
      preloadPlantOperations();
    }
  }, [currentUser, currentUserLoading]);

  // Auto-close sidebar on mobile when screen size changes
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  // Sidebar keyboard shortcuts removed

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  // Sidebar toggle/close handlers removed

  const handleOpenAddUserModal = useCallback(() => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  }, []);

  // handleOpenEditUserModal dihapus karena tidak digunakan

  const handleCloseUserModal = useCallback(() => {
    setIsUserModalOpen(false);
    setEditingUser(null);
  }, []);

  // const handleDeleteUser = useCallback(
  //   async (userId: string) => {
  //     // Implementation commented out as not currently used
  //   },
  //   [users, currentUser, deleteUserStore, t]
  // );

  const handleOpenProfileModal = () => setProfileModalOpen(true);
  const handleCloseProfileModal = () => setProfileModalOpen(false);

  const handleNavigate = (page: Page, subPage?: string) => {
    setCurrentPage(page);
    if (subPage) {
      setActiveSubPages((prev) => ({ ...prev, [page]: subPage }));
    }
    // handleCloseSidebar(); // Removed as sidebar is always open
  };

  const handleSignOutClick = () => setIsSignOutModalOpen(true);
  const handleSignOutCancel = () => setIsSignOutModalOpen(false);
  const handleSignOutConfirm = async () => {
    // Close modal dan mulai logout progress
    setIsSignOutModalOpen(false);
    setIsLogoutInProgress(true);
    setLogoutStage('starting');

    try {
      // Stage 1: Starting logout
      await new Promise((resolve) => setTimeout(resolve, 200));
      setLogoutStage('clearing');

      // Stage 2: Clear SIPOMA domain data (optimized timing)
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLogoutStage('completing');

      // Stage 3: Complete logout
      await logout();
      setLogoutStage('completed');

      // Stage 4: Navigate (handled by logout function)
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      // Fallback jika terjadi error
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
      case 'inspection':
        return t[activeSubPages.inspection as keyof typeof t] || t.inspection || 'Inspection';
      case 'projects':
        if (activeSubPages.projects === 'proj_detail') return t.project_overview_title;
        return t[activeSubPages.projects as keyof typeof t] || t.projectManagement;
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
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="modern-spinner mx-auto mb-6"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-700">Memuat SIPOMA</h2>
            <p className="text-sm text-slate-500">Mohon tunggu sebentar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SimpleErrorBoundary
      fallback={
        <div className="flex items-center justify-center min-h-screen text-red-600">
          Terjadi error pada aplikasi. Silakan refresh halaman.
        </div>
      }
    >
      <div>
        <div className="min-h-screen bg-white font-sans compact">
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            t={t}
            isOpen={isSidebarOpen}
            onClose={handleCloseSidebar}
            currentUser={currentUser}
          />
          <div
            className="flex flex-col min-h-screen transition-all duration-300"
            style={{
              marginLeft: isMobile ? '0' : '5rem', // 80px untuk compact sidebar width (w-20)
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
            <main className="flex-grow px-3 sm:px-4 py-3 overflow-y-auto text-slate-700 page-transition bg-gradient-to-br from-slate-50/50 via-transparent to-slate-100/30">
              <div className="max-w-none w-full">
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
                    <div className="p-4 border border-red-400 bg-red-50 rounded text-center mt-24">
                      <p className="text-red-700">Failed to load content</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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

                  {/* Inspection Module - Check permission */}
                  <PermissionGuard
                    user={currentUser}
                    feature="inspection"
                    requiredLevel="READ"
                    fallback={null}
                  >
                    {currentPage === 'inspection' && (
                      <InspectionPage
                        language={language}
                        subPage={activeSubPages.inspection}
                        onNavigate={handleNavigate}
                      />
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

                  {/* Plant Operations - Check permission */}
                  <PermissionGuard
                    user={currentUser}
                    feature="plant_operations"
                    requiredLevel="READ"
                    fallback={null}
                  >
                    {currentPage === 'operations' && (
                      <PlantOperationsPage
                        activePage={activeSubPages.operations}
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
                </LazyContainer>
              </div>
            </main>
          </div>
        </div>
        <Modal
          isOpen={isUserModalOpen}
          onClose={handleCloseUserModal}
          title={editingUser ? t.edit_user_title : t.add_user_title}
        >
          <UserForm
            user={editingUser}
            onClose={handleCloseUserModal}
            onSuccess={handleCloseUserModal}
            language={language}
          />
        </Modal>
        <ProfileEditModal
          isOpen={isProfileModalOpen}
          onClose={handleCloseProfileModal}
          user={currentUser}
          onSave={(updatedUser) => {
            if (currentUser) {
              // Force a refresh of the auth record to get new avatar
              import('./utils/pocketbase-simple')
                .then(({ pb }) => {
                  pb.collection('users').authRefresh();
                })
                .then(() => {
                  // Update user in the store
                  updateUser(currentUser.id, updatedUser);

                  // Force refresh current user
                  window.dispatchEvent(new CustomEvent('user-profile-updated'));

                  setToastMessage(t.avatar_updated || 'Profile updated successfully!');
                  setToastType('success');
                  setShowToast(true);
                  handleCloseProfileModal();
                })
                .catch((err) => {
                  // Use logger instead of console.error
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
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-800">Konfirmasi Keluar</h4>
                <p className="text-slate-600">{t.confirm_sign_out_message}</p>

                {/* Info tentang data yang akan dihapus */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium text-blue-800">
                      Akan menghapus cookies & site data untuk localhost dan sipoma.site
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-slate-50/50 to-white/50 backdrop-blur-sm px-8 py-6 flex justify-end gap-4 border-t border-white/10">
            <button
              onClick={handleSignOutCancel}
              className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white/80 backdrop-blur-sm border border-slate-300/50 rounded-xl shadow-sm hover:bg-white/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 hover:scale-[1.02]"
            >
              {t.cancel_button}
            </button>
            <button
              onClick={handleSignOutConfirm}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl shadow-lg shadow-red-600/25 hover:shadow-red-600/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all duration-200 hover:scale-[1.02]"
            >
              {t.header_sign_out}
            </button>
          </div>
        </Modal>
      </div>

      {/* Logout Progress Modal */}
      <LogoutProgress isVisible={isLogoutInProgress} stage={logoutStage} />

      {/* Connection status indicator in the bottom-right corner */}
      <ConnectionStatusIndicator />
      <OfflineIndicator />
    </SimpleErrorBoundary>
  );
};

export default App;
