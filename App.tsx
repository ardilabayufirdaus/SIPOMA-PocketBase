import React, { useState, useCallback, useEffect, Suspense, lazy } from "react";
import Modal from "./components/Modal";
import ProfileEditModal from "./components/ProfileEditModal";
import UserForm from "./components/UserForm";
import PasswordDisplay from "./components/PasswordDisplay";
import Toast from "./components/Toast";
import LoadingSkeleton, { PageLoading } from "./components/LoadingSkeleton";
import { useUsers } from "./hooks/useUsers";
import { useCurrentUser } from "./hooks/useCurrentUser";
import { useOnlineUsers } from "./hooks/useOnlineUsers";
import { useUserActivity } from "./hooks/useUserActivity";
import { usePlantData } from "./hooks/usePlantData";
import { useProjects } from "./hooks/useProjects";
import { useIsMobile } from "./hooks/useIsMobile";
import { User, ProjectStatus } from "./types";
import { translations } from "./translations";
import { usePlantUnits } from "./hooks/usePlantUnits";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

// Enhanced lazy loading with better error boundaries and retries
const MainDashboardPage = lazy(() =>
  import("./pages/MainDashboardPage").catch(() => ({
    default: () => <div>Error loading Dashboard. Please refresh.</div>,
  }))
);
const UserManagementPage = lazy(() =>
  import("./pages/UserManagementPage").catch(() => ({
    default: () => <div>Error loading User Management. Please refresh.</div>,
  }))
);
const PlantOperationsPage = lazy(() =>
  import("./pages/PlantOperationsPage").catch(() => ({
    default: () => <div>Error loading Plant Operations. Please refresh.</div>,
  }))
);
const PackingPlantPage = lazy(() =>
  import("./pages/PackingPlantPage").catch(() => ({
    default: () => <div>Error loading Packing Plant. Please refresh.</div>,
  }))
);
const ProjectManagementPage = lazy(() =>
  import("./pages/ProjectManagementPage").catch(() => ({
    default: () => <div>Error loading Project Management. Please refresh.</div>,
  }))
);
const SLAManagementPage = lazy(() =>
  import("./pages/SLAManagementPage").catch(() => ({
    default: () => <div>Error loading SLA Management. Please refresh.</div>,
  }))
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").catch(() => ({
    default: () => <div>Error loading Settings. Please refresh.</div>,
  }))
);

// Loading component for lazy loaded pages
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
  </div>
);

export type Page =
  | "dashboard"
  | "users"
  | "operations"
  | "packing"
  | "projects"
  | "sla"
  | "settings";
export type Language = "en" | "id";
export type Theme = "light" | "dark";

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>("en");
  const t = translations[language];
  const [theme, setTheme] = useState<Theme>("light");
  const isMobile = useIsMobile();

  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  const { records: plantUnits, loading: plantUnitsLoading } = usePlantUnits();
  const {
    users,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    loading: usersLoading,
  } = useUsers();
  const { currentUser, loading: currentUserLoading } = useCurrentUser();
  const onlineUsersCount = useOnlineUsers(users);

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
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  const [activeSubPages, setActiveSubPages] = useState({
    operations: "op_dashboard",
    packing: "pack_master_data",
    projects: "proj_dashboard",
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Auto-close sidebar on mobile when screen size changes
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  // Sidebar keyboard shortcuts removed

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
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

  const handleSaveUser = useCallback(
    async (user: User | Omit<User, "id" | "created_at" | "last_active">) => {
      if ("id" in user) {
        // Editing existing user
        await updateUser(user as User);
        setToastMessage(t.user_updated_success || "User updated successfully!");
        setToastType("success");
        const result = await addUser(user, plantUnits);
        if (result.success && result.tempPassword) {
          setGeneratedPassword(result.tempPassword);
          setNewUserEmail(user.email);
          setNewUserFullName(user.full_name);
          setShowPasswordDisplay(true);
        } else {
          setToastMessage(result.error || "Failed to create user");
          setToastType("error");
          setShowToast(true);
        }
      }
      handleCloseUserModal();
    },
    [addUser, updateUser, handleCloseUserModal, plantUnits, t]
  );

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      // Find the user to be deleted
      const userToDelete = users.find((u) => u.id === userId);
      if (!userToDelete) {
        setToastMessage(t.user_not_found || "User not found");
        setToastType("error");
        setShowToast(true);
        return;
      }

      // Check if user is trying to delete a super admin
      if (userToDelete.role === "Super Admin") {
        setToastMessage(
          t.cannot_delete_super_admin || "Super Admin users cannot be deleted"
        );
        setToastType("error");
        setShowToast(true);
        return;
      }

      // Check if current user has permission to delete
      if (!currentUser || currentUser.role !== "Super Admin") {
        setToastMessage(
          t.only_super_admin_can_delete || "Only Super Admin can delete users"
        );
        setToastType("error");
        setShowToast(true);
        return;
      }

      // Confirm before deleting
      const confirmMessage =
        t.confirm_delete_user ||
        `Are you sure you want to delete ${userToDelete.full_name}? This action cannot be undone.`;
      if (
        window.confirm(confirmMessage.replace("{name}", userToDelete.full_name))
      ) {
        await deleteUser(userId);
        setToastMessage(t.user_deleted_success || "User deleted successfully");
        setToastType("success");
        setShowToast(true);
      }
    },
    [users, currentUser, deleteUser, t]
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
    setIsSignOutModalOpen(false);
    // Supabase sign out
    import("./utils/supabase").then(({ supabase }) => {
      supabase.auth.signOut().then(() => {
        window.location.href = "/login";
      });
    });
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case "dashboard":
        return t.mainDashboard;
      case "users":
        return t.userManagement;
      case "settings":
        return t.header_settings;
      case "sla":
        return t.slaManagement;
      case "operations":
        return (
          t[activeSubPages.operations as keyof typeof t] || t.plantOperations
        );
      case "packing":
        return t[activeSubPages.packing as keyof typeof t] || t.packingPlant;
      case "projects":
        if (activeSubPages.projects === "proj_detail")
          return t.project_overview_title;
        return (
          t[activeSubPages.projects as keyof typeof t] || t.projectManagement
        );
      default:
        return "SIPOMA";
    }
  };

  if (
    usersLoading ||
    plantUnitsLoading ||
    plantDataLoading ||
    currentUserLoading
  ) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="modern-spinner mx-auto mb-6"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">
              Memuat SIPOMA
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mohon tunggu sebentar...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
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
        autoHide={!isMobile} // Auto-hide hanya untuk desktop
      />

      <div
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{
          marginLeft: isMobile ? "0" : "4rem", // 64px untuk icon-only width, akan bertransisi smooth
        }}
      >
        <Header
          pageTitle={getPageTitle()}
          showAddUserButton={currentPage === "users"}
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
        <main className="flex-grow p-0 overflow-y-auto text-slate-700 dark:text-slate-300 page-transition">
          <Suspense fallback={<PageLoading />}>
            {currentPage === "dashboard" && (
              <MainDashboardPage
                t={t}
                usersCount={users.filter((u) => u.is_active).length}
                onlineUsersCount={onlineUsersCount}
                activeProjects={
                  projects.filter(
                    (p) =>
                      p.status === ProjectStatus.ACTIVE ||
                      p.status === ProjectStatus.IN_PROGRESS
                  ).length
                }
                onNavigate={handleNavigate}
              />
            )}
            {currentPage === "users" && (
              <UserManagementPage
                users={users}
                currentUser={currentUser}
                onEditUser={handleOpenEditUserModal}
                onDeleteUser={handleDeleteUser}
                onToggleUserStatus={toggleUserStatus}
                t={t}
              />
            )}
            {currentPage === "settings" && (
              <SettingsPage
                t={t}
                user={currentUser}
                onOpenProfileModal={handleOpenProfileModal}
                currentLanguage={language}
                onLanguageChange={setLanguage}
              />
            )}
            {currentPage === "sla" && <SLAManagementPage t={t} />}
            {currentPage === "operations" && (
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
            {currentPage === "packing" && (
              <PackingPlantPage activePage={activeSubPages.packing} t={t} />
            )}
            {currentPage === "projects" && (
              <ProjectManagementPage
                activePage={activeSubPages.projects}
                t={t}
                onNavigate={(subpage: string) =>
                  handleNavigate("projects", subpage)
                }
              />
            )}
          </Suspense>
        </main>
      </div>

      <Modal
        isOpen={isUserModalOpen}
        onClose={handleCloseUserModal}
        title={editingUser ? t.edit_user_title : t.add_user_title}
      >
        <UserForm
          userToEdit={editingUser}
          onSave={handleSaveUser}
          onCancel={handleCloseUserModal}
          t={t}
          plantUnits={plantUnits}
        />
      </Modal>

      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
        user={currentUser}
        onSave={(updatedUser) => {
          updateUser(updatedUser);
          setToastMessage(t.avatar_updated || "Profile updated successfully!");
          setToastType("success");
          setShowToast(true);
          handleCloseProfileModal();
        }}
        t={t}
      />

      {showPasswordDisplay && (
        <PasswordDisplay
          password={generatedPassword}
          email={newUserEmail}
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
              <p className="text-slate-600 dark:text-slate-400">
                {t.confirm_sign_out_message}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-slate-50/50 to-white/50 dark:from-slate-800/50 dark:to-slate-700/50 backdrop-blur-sm px-8 py-6 flex justify-end gap-4 border-t border-white/10 dark:border-slate-700/50">
          <button
            onClick={handleSignOutCancel}
            className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white/80 backdrop-blur-sm border border-slate-300/50 rounded-xl shadow-sm hover:bg-white/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 hover:scale-105 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-600/50 dark:hover:bg-slate-700/80"
          >
            {t.cancel_button}
          </button>
          <button
            onClick={handleSignOutConfirm}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl shadow-lg shadow-red-600/25 hover:shadow-red-600/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all duration-200 hover:scale-105"
          >
            {t.header_sign_out}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default App;
