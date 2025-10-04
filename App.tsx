import { useNavigate } from 'react-router-dom';
import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Modal from './components/Modal';
import ProfileEditModal from './components/ProfileEditModal';
import UserForm from './features/user-management/components/UserForm';
import PasswordDisplay from './components/PasswordDisplay';
import Toast from './components/Toast';
import LoadingSkeleton from './components/LoadingSkeleton';
import { useUserStore } from './stores/userStore';
import { useCurrentUser } from './hooks/useCurrentUser';
import { useUserActivity } from './hooks/useUserActivity';
import { usePlantData } from './hooks/usePlantData';

import { useIsMobile } from './hooks/useIsMobile';
import { User } from './types';
import { usePlantUnits } from './hooks/usePlantUnits';
import { useTranslation } from './hooks/useTranslation';

import Sidebar from './components/ModernSidebar';
import Header from './components/Header';

// Import permission utilities
import { PermissionGuard } from './utils/permissions';

import { logSystemStatus } from './utils/systemStatus';

// Import ThemeProvider for dark mode support
import { ThemeProvider } from './components/ThemeProvider';

// Preload critical routes with higher priority
const preloadDashboard = () => import('./pages/ModernMainDashboardPage');
const preloadPlantOperations = () => import('./pages/PlantOperationsPage');
const preloadPackingPlant = () => import('./pages/PackingPlantPage');

// Preload secondary routes on user interaction
// Preload functions removed as they were unused

// Enhanced lazy loading with better error boundaries and retries
const ModernMainDashboardPage = lazy(() =>
  import('./pages/ModernMainDashboardPage').catch(() => {
    return {
      default: () =>
        React.createElement(
          'div',
          { className: 'text-center p-8' },
          'Error loading Dashboard. Please refresh.'
        ),
    };
  })
);

// Heavy components with preload hints and dynamic imports
const PlantOperationsPage = lazy(() =>
  import('./pages/PlantOperationsPage').catch(() => ({
    default: () => (
      <div className="text-center p-8">Error loading Plant Operations. Please refresh.</div>
    ),
  }))
);

const PackingPlantPage = lazy(() =>
  import('./pages/PackingPlantPage').catch(() => ({
    default: () => (
      <div className="text-center p-8">Error loading Packing Plant. Please refresh.</div>
    ),
  }))
);

const ProjectManagementPage = lazy(() =>
  import('./pages/ProjectManagementPage').catch(() => ({
    default: () => (
      <div className="text-center p-8">Error loading Project Management. Please refresh.</div>
    ),
  }))
);

// Inspection Page
const InspectionPage = lazy(() =>
  import('./pages/InspectionPage').catch(() => ({
    default: () => <div className="text-center p-8">Error loading Inspection. Please refresh.</div>,
  }))
);

// Lightweight components
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').catch(() => ({
    default: () => <div className="text-center p-8">Error loading Settings. Please refresh.</div>,
  }))
);

// WhatsApp Reports Page
const WhatsAppReportsPage = lazy(() =>
  import('./src/presentation/views/WhatsAppGroupReportContainer')
    .then((module) => ({
      default: module.WhatsAppGroupReportContainer,
    }))
    .catch(() => ({
      default: () => (
        <div className="text-center p-8">Error loading WhatsApp Reports. Please refresh.</div>
      ),
    }))
);

// User Management Pages - Load on demand
const UserListPage = lazy(() =>
  import('./features/user-management/pages/UserListPage').catch(() => ({
    default: () => <div>Error loading User List. Please refresh.</div>,
  }))
);

const UserActivityPage = lazy(() =>
  import('./features/user-management/pages/UserActivityPage').catch(() => ({
    default: () => <div>Error loading User Activity. Please refresh.</div>,
  }))
);

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
export type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useTranslation();
  const isMobile = useIsMobile();

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  const { loading: plantUnitsLoading } = usePlantUnits();
  const { currentUser, loading: currentUserLoading, logout } = useCurrentUser();
  const {
    users,
    createUser,
    updateUser,
    deleteUser: deleteUserStore,
    isLoading: usersLoading,
    error,
  } = useUserStore();

  // Update current user activity
  useUserActivity(currentUser?.id);

  const { loading: plantDataLoading } = usePlantData();

  // Load projects data for active projects count
  // const { projects } = useProjects();

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [showPasswordDisplay, setShowPasswordDisplay] = useState(false);
  // const [generatedPassword, setGeneratedPassword] = useState('');
  // const [newUsername, setNewUsername] = useState('');
  // const [newUserFullName, setNewUserFullName] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const [activeSubPages, setActiveSubPages] = useState({
    operations: 'op_dashboard',
    packing: 'pack_master_data',
    inspection: 'insp_dashboard',
    projects: 'proj_dashboard',
    users: 'user_list',
  });

  // Log system status on app load
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logSystemStatus();
    }
  }, []);

  // Preload critical routes after user authentication
  useEffect(() => {
    if (currentUser && !currentUserLoading) {
      // Preload main dashboard and common pages
      preloadDashboard();
      preloadPlantOperations();
      preloadPackingPlant();
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

  const handleOpenEditUserModal = useCallback((user: User) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  }, []);

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
  const handleSignOutConfirm = () => {
    logout();
    navigate('/login');
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
      case 'packing':
        return t[activeSubPages.packing as keyof typeof t] || t.packingPlant;
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
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
          <div className="modern-spinner mx-auto mb-6"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">
              Memuat SIPOMA
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Mohon tunggu sebentar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ErrorBoundary
        fallback={
          <div className="flex items-center justify-center min-h-screen text-red-600">
            Terjadi error pada aplikasi. Silakan refresh halaman.
          </div>
        }
      >
        <div>
          <div className="min-h-screen bg-white dark:bg-slate-900 font-sans compact">
            <Sidebar
              currentPage={currentPage}
              onNavigate={handleNavigate}
              t={t}
              currentLanguage={language}
              onLanguageChange={setLanguage}
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
              />
              <main className="flex-grow px-3 sm:px-4 py-3 overflow-y-auto text-slate-700 dark:text-slate-300 page-transition bg-gradient-to-br from-slate-50/50 via-transparent to-slate-100/30 dark:from-slate-900/50 dark:to-slate-800/30">
                <div className="max-w-none w-full">
                  <Suspense
                    fallback={
                      <LoadingSkeleton
                        variant="rectangular"
                        height={48}
                        width={48}
                        className="mx-auto mt-24"
                      />
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
                        <ModernMainDashboardPage language={language} onNavigate={handleNavigate} />
                      )}

                      {/* Inspection Module */}
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
                      <>
                        {activeSubPages.users === 'user_list' && <UserListPage />}

                        {activeSubPages.users === 'user_activity' && (
                          <UserActivityPage users={users} t={t} />
                        )}
                      </>
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
                      <WhatsAppReportsPage groupId="default-group" />
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
                    {/* Packing Plant - Check permission */}
                    <PermissionGuard
                      user={currentUser}
                      feature="packing_plant"
                      requiredLevel="READ"
                      fallback={null}
                    >
                      {currentPage === 'packing' && (
                        <PackingPlantPage activePage={activeSubPages.packing} t={t} />
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
                  </Suspense>
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
                updateUser(currentUser.id, updatedUser);
                setToastMessage(t.avatar_updated || 'Profile updated successfully!');
                setToastType('success');
                setShowToast(true);
                handleCloseProfileModal();
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
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
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
                  <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    Konfirmasi Keluar
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">{t.confirm_sign_out_message}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-slate-50/50 to-white/50 dark:from-slate-800/50 dark:to-slate-700/50 backdrop-blur-sm px-8 py-6 flex justify-end gap-4 border-t border-white/10 dark:border-slate-700/50">
              <button
                onClick={handleSignOutCancel}
                className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white/80 backdrop-blur-sm border border-slate-300/50 rounded-xl shadow-sm hover:bg-white/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 hover:scale-[1.02] dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-600/50 dark:hover:bg-slate-700/80"
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
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
