import React, { useState } from "react";
import ProjectDashboardPage from "./project_management/ProjectDashboardPage";
import ProjectDetailPage from "./project_management/ProjectDetailPage";
import ProjectListPage from "./project_management/ProjectListPage";

// Import permission utilities
import { usePermissions } from "../utils/permissions";
import { PermissionLevel } from "../types";
import { useCurrentUser } from "../hooks/useCurrentUser";

interface ProjectManagementPageProps {
  activePage: string;
  t: any;
  onNavigate: (subpage: string) => void;
}

const ProjectManagementPage: React.FC<ProjectManagementPageProps> = ({
  activePage,
  t,
  onNavigate,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  // Permission check
  const { currentUser } = useCurrentUser();
  const permissionChecker = usePermissions(currentUser);
  const hasProjectManagementAccess = permissionChecker.hasPermission(
    "project_management",
    "READ"
  );

  // Check permission before rendering
  if (!hasProjectManagementAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md text-center">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
            Access Denied
          </h3>
          <p className="text-red-600 dark:text-red-300">
            You don't have permission to access project management features.
          </p>
        </div>
      </div>
    );
  }

  const handleSelectProjectAndNavigate = (projectId: string) => {
    setSelectedProjectId(projectId);
    onNavigate("proj_detail");
  };

  switch (activePage) {
    case "proj_dashboard":
      return (
        <ProjectDashboardPage
          t={t}
          onNavigateToDetail={handleSelectProjectAndNavigate}
        />
      );
    case "proj_list":
      return (
        <ProjectListPage
          t={t}
          onNavigateToDetail={handleSelectProjectAndNavigate}
        />
      );
    case "proj_detail":
      if (selectedProjectId) {
        return <ProjectDetailPage t={t} projectId={selectedProjectId} />;
      }
      // If no project is selected, default to showing the list page.
      return (
        <ProjectListPage
          t={t}
          onNavigateToDetail={handleSelectProjectAndNavigate}
        />
      );
    default:
      return (
        <ProjectDashboardPage
          t={t}
          onNavigateToDetail={handleSelectProjectAndNavigate}
        />
      );
  }
};

export default ProjectManagementPage;
