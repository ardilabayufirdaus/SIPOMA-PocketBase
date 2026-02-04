import React, { useMemo, useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { useProjectManagementAccess } from '../../hooks/useProjectManagementAccess';
import { formatDate, formatBudgetCompact } from '../../utils/formatters';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ProjectForm from '../../components/ProjectForm';
import PlusIcon from '../../components/icons/PlusIcon';
import EditIcon from '../../components/icons/EditIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import { Project } from '../../types';

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from '../../components/ui/EnhancedComponents';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

interface ProjectListPageProps {
  t: any;
  onNavigateToDetail: (projectId: string) => void;
}

const ProjectListPage: React.FC<ProjectListPageProps> = ({ t, onNavigateToDetail }) => {
  const { canWrite } = useProjectManagementAccess();
  const { projects, tasks, loading, addProject, updateProject, deleteProject } = useProjects();
  const [isProjectFormModalOpen, setProjectFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  // Enhanced accessibility hooks
  const { announceToScreenReader } = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  const projectsData = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = tasks.filter((t) => t.project_id === project.id);
      if (projectTasks.length === 0) {
        return {
          ...project,
          progress: 0,
          status: t.proj_status_on_track,
          statusKey: 'on_track',
          startDate: '-',
          endDate: '-',
          totalTasks: 0,
        };
      }

      const tasksWithDurations = projectTasks.map((task) => {
        const duration =
          (new Date(task.planned_end).getTime() - new Date(task.planned_start).getTime()) /
            (1000 * 3600 * 24) +
          1;
        return { ...task, duration };
      });

      const totalWeight = tasksWithDurations.reduce((sum, task) => sum + task.duration, 0);
      const overallProgress =
        totalWeight > 0
          ? tasksWithDurations.reduce((sum, task) => {
              const weight = task.duration / totalWeight;
              return sum + (task.percent_complete / 100) * weight;
            }, 0) * 100
          : 0;

      const startDates = projectTasks.map((t) => new Date(t.planned_start).getTime());
      const endDates = projectTasks.map((t) => new Date(t.planned_end).getTime());
      const projectStartDate = new Date(Math.min(...startDates));
      const projectEndDate = new Date(Math.max(...endDates));

      let status = t.proj_status_on_track;
      let statusKey = 'on_track';
      if (overallProgress >= 100) {
        status = t.proj_status_completed;
        statusKey = 'completed';
      } else if (new Date() > projectEndDate && overallProgress < 100) {
        status = t.proj_status_delayed;
        statusKey = 'delayed';
      }

      return {
        ...project,
        progress: overallProgress,
        status,
        statusKey,
        startDate: formatDate(projectStartDate),
        endDate: formatDate(projectEndDate),
        totalTasks: projectTasks.length,
      };
    });
  }, [projects, tasks, t]);

  const {
    paginatedData: paginatedProjects,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination(projectsData, 10);

  const handleSaveProject = (project: Omit<Project, 'id'> | Project) => {
    if ('id' in project) {
      updateProject(project as Project);
    } else {
      addProject(project as Omit<Project, 'id'>);
    }
    setProjectFormModalOpen(false);
    setEditingProject(null);
  };

  const handleOpenDeleteModal = (projectId: string) => {
    setDeletingProjectId(projectId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingProjectId) {
      deleteProject(deletingProjectId);
    }
    setDeleteModalOpen(false);
    setDeletingProjectId(null);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectFormModalOpen(true);
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setProjectFormModalOpen(true);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <LoadingSpinner />
      </div>
    );
  }

  const statusColorMap: { [key: string]: string } = {
    on_track: 'bg-success-50 text-success-700 border border-success-200',
    delayed: 'bg-primary-50 text-primary-600 border border-primary-200', // Ubuntu Orange
    completed: 'bg-blue-50 text-blue-700 border border-blue-200',
  };

  const tableHeaders = [
    t.task_no,
    t.project_name,
    t.proj_budget,
    t.status,
    t.overall_progress,
    t.task_planned_start,
    t.task_planned_end,
    t.proj_total_tasks,
    t.actions,
  ];

  return (
    <>
      <div className="bg-neutral-50 min-h-screen p-6 sm:p-8 font-sans">
        <div className="max-w-[1400px] mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-display font-bold text-secondary-900 tracking-tight">
                {t.proj_list || 'Project Management'}
              </h2>
              <p className="text-slate-500 mt-2 text-lg">
                Manage your projects, track progress, and monitor deadlines effectively.
              </p>
            </div>
            {canWrite && (
              <EnhancedButton
                variant="custom"
                size="lg"
                onClick={handleAddProject}
                className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 hover:shadow-primary-600/40 transition-all rounded-xl px-6 py-2.5 flex items-center font-medium"
                aria-label={t.add_project || 'Add new project'}
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                {t.add_project || 'Add Project'}
              </EnhancedButton>
            )}
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl shadow-medium border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-secondary-900">
                  <tr>
                    {tableHeaders.map((header, index) => (
                      <th
                        key={index}
                        scope="col"
                        className="px-6 py-5 text-left text-xs font-bold text-white uppercase tracking-wider last:text-right first:pl-8"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {paginatedProjects.map((p, index) => (
                    <tr
                      key={p.id}
                      className="hover:bg-primary-50/30 transition-colors duration-200 group"
                    >
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-500 font-medium first:pl-8">
                        {(currentPage - 1) * 10 + index + 1}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-base font-bold text-secondary-900 group-hover:text-primary-600 transition-colors">
                          {p.title}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600 font-medium bg-slate-50/50 rounded-lg mx-2 my-1">
                        {formatBudgetCompact(p.budget || 0)}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                            statusColorMap[p.statusKey] ||
                            'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-500">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-secondary-100 rounded-full h-2 overflow-hidden shadow-inner">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                p.statusKey === 'delayed' ? 'bg-primary-600' : 'bg-success-600'
                              } shadow-sm`}
                              style={{ width: `${p.progress}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-secondary-900 text-xs">
                            {p.progress.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-500 font-medium">
                        {p.startDate}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-500 font-medium">
                        {p.endDate}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-500 text-center font-bold">
                        {p.totalTasks}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          {canWrite && (
                            <EnhancedButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProject(p)}
                              className="text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg p-2"
                              aria-label={`${t.edit || 'Edit'} ${p.title}`}
                            >
                              <EditIcon className="w-4 h-4" />
                            </EnhancedButton>
                          )}
                          <EnhancedButton
                            variant="custom"
                            size="sm"
                            onClick={() => onNavigateToDetail(p.id)}
                            className="bg-secondary-50 hover:bg-secondary-100 text-secondary-700 hover:text-secondary-900 font-semibold rounded-lg px-3 py-1"
                            aria-label={`${t.view_details_button} for ${p.title}`}
                          >
                            {t.view_details_button}
                          </EnhancedButton>
                          {canWrite && (
                            <EnhancedButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDeleteModal(p.id)}
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-2"
                              aria-label={`${t.delete || 'Delete'} ${p.title}`}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </EnhancedButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 p-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>

        {/* Project Form Modal - Ubuntu Styled */}
        <Modal
          isOpen={isProjectFormModalOpen}
          onClose={() => setProjectFormModalOpen(false)}
          title={editingProject ? t.edit_project || 'Edit Project' : t.add_project || 'Add Project'}
          // Note: Modal component might need its own styling updates, but passing props is limited here.
        >
          <div className="p-1">
            <ProjectForm
              t={t}
              onSave={handleSaveProject}
              onCancel={() => setProjectFormModalOpen(false)}
              project={editingProject}
            />
          </div>
        </Modal>

        {/* Delete Confirmation Modal - Ubuntu Styled */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title={t.confirm_delete || 'Confirm Delete'}
        >
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
              <div className="p-2 bg-white rounded-full text-red-600 shadow-sm shrink-0">
                <TrashIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-red-900 text-lg">{t.warning || 'Warning'}</h4>
                <p className="text-sm text-red-800/80 leading-relaxed">
                  {t.confirm_delete_project_message ||
                    'Are you sure you want to delete this project? This action cannot be undone and will also delete all associated tasks completely from the system.'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <EnhancedButton
                variant="secondary"
                size="lg"
                onClick={() => setDeleteModalOpen(false)}
                className="hover:bg-slate-100 text-slate-700 border-slate-200"
                aria-label={t.cancel || 'Cancel delete'}
              >
                {t.cancel || 'Cancel'}
              </EnhancedButton>
              <EnhancedButton
                variant="error"
                size="lg"
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                aria-label={t.delete || 'Confirm delete'}
              >
                {t.delete || 'Delete Project'}
              </EnhancedButton>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default ProjectListPage;
