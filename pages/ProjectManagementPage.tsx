
import React, { useState } from 'react';
import ProjectDashboardPage from './project_management/ProjectDashboardPage';
import ProjectDetailPage from './project_management/ProjectDetailPage';
import ProjectListPage from './project_management/ProjectListPage';

interface ProjectManagementPageProps {
    activePage: string;
    t: any;
    onNavigate: (subpage: string) => void;
}

const ProjectManagementPage: React.FC<ProjectManagementPageProps> = ({ activePage, t, onNavigate }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

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