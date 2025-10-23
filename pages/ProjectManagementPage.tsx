import React, { useState } from 'react';
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoadingSkeleton from '../components/LoadingSkeleton';

// Lazy load sub-pages
const ProjectDashboardPage = lazy(() => import('./project_management/ProjectDashboardPage'));
const ProjectDetailPage = lazy(() => import('./project_management/ProjectDetailPage'));
const ProjectListPage = lazy(() => import('./project_management/ProjectListPage'));

// ...existing code...

// Import permission utilities
import { usePermissions } from '../utils/permissions';
import { PermissionLevel } from '../types';
import { useCurrentUser } from '../hooks/useCurrentUser';

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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Permission check
  const { currentUser } = useCurrentUser();
  const permissionChecker = usePermissions(currentUser);
  const hasProjectManagementAccess = permissionChecker.hasPermission('project_management', 'READ');

  // Check permission before rendering
  if (!hasProjectManagementAccess) {
    return null;
  }

  const handleSelectProjectAndNavigate = (projectId: string) => {
    setSelectedProjectId(projectId);
    onNavigate('proj_detail');
  };

  switch (activePage) {
    case 'proj_dashboard':
      return <ProjectDashboardPage t={t} onNavigateToDetail={handleSelectProjectAndNavigate} />;
    case 'proj_list':
      return <ProjectListPage t={t} onNavigateToDetail={handleSelectProjectAndNavigate} />;
    case 'proj_detail':
      if (selectedProjectId) {
        return <ProjectDetailPage t={t} projectId={selectedProjectId} />;
      }
      // If no project is selected, default to showing the list page.
      return <ProjectListPage t={t} onNavigateToDetail={handleSelectProjectAndNavigate} />;
    default:
      return <ProjectDashboardPage t={t} onNavigateToDetail={handleSelectProjectAndNavigate} />;
  }
};

export default ProjectManagementPage;


