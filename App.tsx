import { useNavigate } from 'react-router-dom';
import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Modal from './components/Modal';
import ProfileEditModal from './components/ProfileEditModal';
import UserForm from './features/user-management/components/UserForm';
import PasswordDisplay from './components/PasswordDisplay';
import Toast from './components/Toast';
import LoadingSkeleton, { PageLoading } from './components/LoadingSkeleton';
import { useUserStore } from './stores/userStore';
import { useCurrentUser } from './hooks/useCurrentUser';
import { useUserActivity } from './hooks/useUserActivity';
import { usePlantData } from './hooks/usePlantData';
import { useProjects } from './hooks/useProjects';
import { useIsMobile } from './hooks/useIsMobile';
import { User, ProjectStatus } from './types';
import { translations } from './translations';
import { usePlantUnits } from './hooks/usePlantUnits';

import Sidebar from './components/ModernSidebar';
import Header from './components/Header';

// Import permission utilities
import { usePermissions, PermissionGuard } from './utils/permissions';
import { PermissionLevel } from './types';

// Preload critical routes with higher priority
const preloadDashboard = () => import('./pages/ModernMainDashboardPage');
const preloadPlantOperations = () => import('./pages/PlantOperationsPage');
const preloadPackingPlant = () => import('./pages/PackingPlantPage');

// Preload secondary routes on user interaction
const preloadProjectManagement = () => import('./pages/ProjectManagementPage');
const preloadSettings = () => import('./pages/SettingsPage');

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

// Lightweight components
const SLAManagementPage = lazy(() =>
  import('./pages/SLAManagementPage').catch(() => ({
    default: () => (
      <div className="text-center p-8">Error loading SLA Management. Please refresh.</div>
    ),
  }))
);

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
const UserRolesPage = lazy(() =>
  import('./features/user-management/pages/UserRolesPage').catch(() => ({
    default: () => <div>Error loading User Roles. Please refresh.</div>,
  }))
);
const UserActivityPage = lazy(() =>
  import('./features/user-management/pages/UserActivityPage').catch(() => ({
    default: () => <div>Error loading User Activity. Please refresh.</div>,
  }))
);

// Loading component for lazy loaded pages
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
  </div>
);

export type Page =
  | 'dashboard'
  | 'users'
  | 'operations'
  | 'packing'
  | 'projects'
  | 'sla'
  | 'settings'
  | 'whatsapp-reports';
export type Language = 'en' | 'id';
export type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];
  const [theme, setTheme] = useState<Theme>('light');
  const isMobile = useIsMobile();

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  const { records: plantUnits, loading: plantUnitsLoading } = usePlantUnits();
  const { currentUser, loading: currentUserLoading, logout } = useCurrentUser();
  const {
    users,
    createUser: addUser,
    updateUser,
    deleteUser: deleteUserStore,
    isLoading: usersLoading,
    error: usersError,
  } = useUserStore();

  // Update current user activity
  useUserActivity(currentUser?.id);

  const {
    machines,
    kpis,
    alerts,
    productionData,
    loading: plantDataLoading,
    toggleMachineStatus,
    markAllAlertsAsRead,
  } = usePlantData();

  // Load projects data for active projects count
  const { projects } = useProjects();

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [showPasswordDisplay, setShowPasswordDisplay] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const [activeSubPages, setActiveSubPages] = useState({
    operations: 'op_dashboard',
    packing: 'pack_master_data',
    projects: 'proj_dashboard',
    users: 'user_list',
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

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

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      // Find the user to be deleted
      const userToDelete = users.find((u) => u.id === userId);
      if (!userToDelete) {
        setToastMessage(t.user_not_found || 'User not found');
        setToastType('error');
        setShowToast(true);
        return;
      }

      // Check if user is trying to delete a super admin
      if (userToDelete.role === 'Super Admin') {
        setToastMessage(t.cannot_delete_super_admin || 'Super Admin users cannot be deleted');
        setToastType('error');
        setShowToast(true);
        return;
      }

      // Check if current user has permission to delete
      if (!currentUser || currentUser.role !== 'Super Admin') {
        setToastMessage(t.only_super_admin_can_delete || 'Only Super Admin can delete users');
        setToastType('error');
        setShowToast(true);
        return;
      }

      // Confirm before deleting
      const confirmMessage =
        t.confirm_delete_user ||
        `Are you sure you want to delete ${userToDelete.full_name}? This action cannot be undone.`;
      if (window.confirm(confirmMessage.replace('{name}', userToDelete.full_name))) {
        await deleteUserStore(userId);
        setToastMessage(t.user_deleted_success || 'User deleted successfully');
        setToastType('success');
        setShowToast(true);
      }
    },
    [users, currentUser, deleteUserStore, t]
  );

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
      case 'sla':
        return t.slaManagement;
      case 'operations':
        return t[activeSubPages.operations as keyof typeof t] || t.plantOperations;
      case 'packing':
        return t[activeSubPages.packing as keyof typeof t] || t.packingPlant;
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
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
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
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center min-h-screen text-red-600">
          Terjadi error pada aplikasi. Silakan refresh halaman.
        </div>
      }
    >
      <div>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 font-sans compact">
          <Sidebar
            currentPage={currentPage}
            activeSubPages={activeSubPages}
            onNavigate={handleNavigate}
            t={t}
            currentLanguage={language}
            onLanguageChange={setLanguage}
            isOpen={isSidebarOpen}
            isCollapsed={false}
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
              alerts={alerts}
              onMarkAllAsRead={markAllAlertsAsRead}
              theme={theme}
              onToggleTheme={handleToggleTheme}
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
                    fallback={
                      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md">
                          <div className="mb-4">
                            <svg
                              className="w-16 h-16 text-red-500 mx-auto"
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
                          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                            Access Denied
                          </h3>
                          <p className="text-red-600 dark:text-red-300">
                            You don&apos;t have permission to access the Dashboard.
                          </p>
                        </div>
                      </div>
                    }
                  >
                    {currentPage === 'dashboard' && (
                      <ModernMainDashboardPage language={language} onNavigate={handleNavigate} />
                    )}
                  </PermissionGuard>
                  {/* User Management */}
                  {currentPage === 'users' && (
                    <>
                      {activeSubPages.users === 'user_list' && <UserListPage />}
                      {activeSubPages.users === 'add_user' && (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 max-w-md">
                            <div className="mb-4">
                              <svg
                                className="w-16 h-16 text-blue-500 mx-auto"
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
                            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                              Add New User
                            </h3>
                            <p className="text-blue-600 dark:text-blue-300 mb-4">
                              Use the &quot;Add User&quot; button in the header to create a new
                              user.
                            </p>
                            <button
                              onClick={() => handleNavigate('users', 'user_list')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Go to User List
                            </button>
                          </div>
                        </div>
                      )}
                      {activeSubPages.users === 'user_roles' && (
                        <UserRolesPage users={users} plantUnits={plantUnits} t={t} />
                      )}
                      {activeSubPages.users === 'user_activity' && (
                        <UserActivityPage users={users} t={t} />
                      )}
                    </>
                  )}
                  {/* Settings - Check permission */}
                  <PermissionGuard
                    user={currentUser}
                    feature="system_settings"
                    requiredLevel="READ"
                    fallback={
                      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md">
                          <div className="mb-4">
                            <svg
                              className="w-16 h-16 text-red-500 mx-auto"
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
                          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                            Access Denied
                          </h3>
                          <p className="text-red-600 dark:text-red-300">
                            You don&apos;t have permission to access Settings.
                          </p>
                        </div>
                      </div>
                    }
                  >
                    {currentPage === 'settings' && (
                      <SettingsPage
                        t={t}
                        user={currentUser}
                        onOpenProfileModal={handleOpenProfileModal}
                        currentLanguage={language}
                        onLanguageChange={setLanguage}
                      />
                    )}
                  </PermissionGuard>
                  {/* WhatsApp Reports - Check permission */}
                  <PermissionGuard
                    user={currentUser}
                    feature="system_settings" // Using existing permission for now
                    requiredLevel="READ"
                    fallback={
                      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md">
                          <div className="mb-4">
                            <svg
                              className="w-16 h-16 text-red-500 mx-auto"
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
                          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                            Access Denied
                          </h3>
                          <p className="text-red-600 dark:text-red-300">
                            You don&apos;t have permission to access WhatsApp Reports.
                          </p>
                        </div>
                      </div>
                    }
                  >
                    {currentPage === 'whatsapp-reports' && (
                      <WhatsAppReportsPage groupId="default-group" />
                    )}
                  </PermissionGuard>
                  {currentPage === 'sla' && <SLAManagementPage t={t} />}
                  {/* Plant Operations - Check permission */}
                  <PermissionGuard
                    user={currentUser}
                    feature="plant_operations"
                    requiredLevel="READ"
                    fallback={
                      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md">
                          <div className="mb-4">
                            <svg
                              className="w-16 h-16 text-red-500 mx-auto"
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
                          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                            Access Denied
                          </h3>
                          <p className="text-red-600 dark:text-red-300">
                            You don&apos;t have permission to access Plant Operations.
                          </p>
                        </div>
                      </div>
                    }
                  >
                    {currentPage === 'operations' && (
                      <PlantOperationsPage
                        activePage={activeSubPages.operations}
                        t={t}
                        plantData={{
                          machines,
                          kpis,
                          alerts,
                          productionData,
                          toggleMachineStatus,
                        }}
                      />
                    )}
                  </PermissionGuard>
                  {/* Packing Plant - Check permission */}
                  <PermissionGuard
                    user={currentUser}
                    feature="packing_plant"
                    requiredLevel="READ"
                    fallback={
                      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md">
                          <div className="mb-4">
                            <svg
                              className="w-16 h-16 text-red-500 mx-auto"
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
                          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                            Access Denied
                          </h3>
                          <p className="text-red-600 dark:text-red-300">
                            You don&apos;t have permission to access Packing Plant.
                          </p>
                        </div>
                      </div>
                    }
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
  );
};

export default App;
