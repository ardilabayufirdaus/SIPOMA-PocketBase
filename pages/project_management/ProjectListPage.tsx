import React, { useMemo, useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
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
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
  </div>
);

interface ProjectListPageProps {
  t: any;
  onNavigateToDetail: (projectId: string) => void;
}

const ProjectListPage: React.FC<ProjectListPageProps> = ({ t, onNavigateToDetail }) => {
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
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <LoadingSpinner />
      </div>
    );
  }

  const statusColorMap: { [key: string]: string } = {
    on_track: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    delayed: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
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
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {t.proj_list}
          </h2>
          <EnhancedButton
            variant="primary"
            size="sm"
            onClick={handleAddProject}
            aria-label={t.add_project || 'Add new project'}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            {t.add_project || 'Add Project'}
          </EnhancedButton>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                {tableHeaders.map((header, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedProjects.map((p, index) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {(currentPage - 1) * 10 + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {p.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {formatBudgetCompact(p.budget || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusColorMap[p.statusKey] ||
                        'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div
                          className="bg-red-600 h-2.5 rounded-full"
                          style={{ width: `${p.progress}%` }}
                        ></div>
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {p.progress.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {p.startDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {p.endDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 text-center">
                    {p.totalTasks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <EnhancedButton
                        variant="ghost"
                        size="xs"
                        onClick={() => handleEditProject(p)}
                        aria-label={`${t.edit || 'Edit'} ${p.title}`}
                      >
                        <EditIcon className="w-4 h-4" />
                      </EnhancedButton>
                      <EnhancedButton
                        variant="ghost"
                        size="xs"
                        onClick={() => onNavigateToDetail(p.id)}
                        aria-label={`${t.view_details_button} for ${p.title}`}
                      >
                        {t.view_details_button}
                      </EnhancedButton>
                      <EnhancedButton
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenDeleteModal(p.id)}
                        aria-label={`${t.delete || 'Delete'} ${p.title}`}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </EnhancedButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Project Form Modal */}
      <Modal
        isOpen={isProjectFormModalOpen}
        onClose={() => setProjectFormModalOpen(false)}
        title={editingProject ? t.edit_project || 'Edit Project' : t.add_project || 'Add Project'}
      >
        <ProjectForm
          t={t}
          onSave={handleSaveProject}
          onCancel={() => setProjectFormModalOpen(false)}
          project={editingProject}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t.confirm_delete || 'Confirm Delete'}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t.confirm_delete_project_message ||
              'Are you sure you want to delete this project? This action cannot be undone and will also delete all associated tasks.'}
          </p>
          <div className="flex justify-end gap-3">
            <EnhancedButton
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              rounded="lg"
              elevation="sm"
              aria-label={t.cancel || 'Cancel delete'}
            >
              {t.cancel || 'Cancel'}
            </EnhancedButton>
            <EnhancedButton
              variant="warning"
              size="sm"
              onClick={handleDeleteConfirm}
              rounded="lg"
              elevation="sm"
              aria-label={t.delete || 'Confirm delete'}
            >
              {t.delete || 'Delete'}
            </EnhancedButton>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProjectListPage;

