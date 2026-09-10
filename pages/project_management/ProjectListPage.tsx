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
import ClipboardDocumentListIcon from '../../components/icons/ClipboardDocumentListIcon';
import MagnifyingGlassIcon from '../../components/icons/MagnifyingGlassIcon';
import { Project } from '../../types';

// Import Enhanced Components
import { EnhancedButton } from '../../components/ui/EnhancedComponents';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[300px] p-10">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading projects...</p>
  </div>
);

interface ProjectListPageProps {
  t: Record<string, string>;
  onNavigateToDetail: (projectId: string) => void;
}

const ProjectListPage: React.FC<ProjectListPageProps> = ({ t, onNavigateToDetail }) => {
  const { canWrite } = useProjectManagementAccess();
  const { projects, tasks, loading, addProject, updateProject, deleteProject } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isProjectFormModalOpen, setProjectFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const projectsData = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = tasks.filter((task) => task.project_id === project.id);
      if (projectTasks.length === 0) {
        return {
          ...project,
          progress: 0,
          status: t.proj_status_on_track || 'On Track',
          statusKey: 'on_track',
          startDate: '-',
          endDate: '-',
          totalTasks: 0,
        };
      }

      const tasksWithDurations = projectTasks.map((task) => {
        const start = task.planned_start ? new Date(task.planned_start).getTime() : 0;
        const end = task.planned_end ? new Date(task.planned_end).getTime() : 0;
        const duration = Math.max(1, (end - start) / (1000 * 3600 * 24) + 1);
        return { ...task, duration };
      });

      const totalWeight = tasksWithDurations.reduce((sum, task) => sum + task.duration, 0);
      const overallProgress =
        totalWeight > 0
          ? tasksWithDurations.reduce((sum, task) => {
              const weight = task.duration / totalWeight;
              return sum + ((task.percent_complete || 0) / 100) * weight;
            }, 0) * 100
          : 0;

      const validStartDates = projectTasks
        .map((t_task) => (t_task.planned_start ? new Date(t_task.planned_start).getTime() : 0))
        .filter((d) => d > 0);
      const validEndDates = projectTasks
        .map((t_task) => (t_task.planned_end ? new Date(t_task.planned_end).getTime() : 0))
        .filter((d) => d > 0);

      const projectStartDate =
        validStartDates.length > 0 ? new Date(Math.min(...validStartDates)) : null;
      const projectEndDate = validEndDates.length > 0 ? new Date(Math.max(...validEndDates)) : null;

      let status = t.proj_status_on_track || 'On Track';
      let statusKey = 'on_track';
      if (overallProgress >= 100) {
        status = t.proj_status_completed || 'Completed';
        statusKey = 'completed';
      } else if (projectEndDate && new Date() > projectEndDate && overallProgress < 100) {
        status = t.proj_status_delayed || 'Delayed';
        statusKey = 'delayed';
      }

      return {
        ...project,
        progress: overallProgress,
        status,
        statusKey,
        startDate: projectStartDate ? formatDate(projectStartDate) : '-',
        endDate: projectEndDate ? formatDate(projectEndDate) : '-',
        totalTasks: projectTasks.length,
      };
    });
  }, [projects, tasks, t]);

  const filteredProjects = useMemo(() => {
    return projectsData.filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description &&
          project.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || project.statusKey === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projectsData, searchTerm, statusFilter]);

  const {
    paginatedData: paginatedProjects,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination(filteredProjects, 10);

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

  const handleResetFilter = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 sm:p-8 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 w-full max-w-md">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const statusBadgeMap: Record<string, string> = {
    on_track:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    delayed:
      'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    completed:
      'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
    ahead:
      'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
  };

  const tableHeaders = [
    t.task_no || 'No.',
    t.project_name || 'Project Name',
    t.proj_budget || 'Budget',
    t.project_status || 'Status',
    t.overall_progress || 'Progress',
    t.task_planned_start || 'Start Date',
    t.task_planned_end || 'End Date',
    t.proj_total_tasks || 'Tasks',
    t.actions || 'Actions',
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen p-4 sm:p-6 lg:p-8 font-sans transition-colors">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.proj_list || 'Project Management'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
              {t.project_overview_subtitle ||
                'Manage your projects, track progress, and monitor deadlines effectively.'}
            </p>
          </div>
          {canWrite && (
            <EnhancedButton
              variant="primary"
              size="md"
              onClick={handleAddProject}
              className="bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/20 rounded-xl px-5 py-2.5 flex items-center font-bold transition-all shrink-0"
              aria-label={t.add_project || 'Add new project'}
            >
              <PlusIcon className="w-5 h-5 mr-2" aria-hidden="true" />
              {t.add_project || 'Add Project'}
            </EnhancedButton>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder={t.search_projects || 'Search projects...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
            <div className="pointer-events-none absolute left-3 top-2.5 text-slate-400 dark:text-slate-500">
              <MagnifyingGlassIcon className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>

          <div className="flex w-full sm:w-auto gap-3 items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer font-medium"
            >
              <option value="all">{t.all_statuses || 'All Status'}</option>
              <option value="on_track">{t.proj_status_on_track || 'On Track'}</option>
              <option value="delayed">{t.proj_status_delayed || 'Delayed'}</option>
              <option value="completed">{t.proj_status_completed || 'Completed'}</option>
            </select>

            {(searchTerm || statusFilter !== 'all') && (
              <EnhancedButton
                variant="secondary"
                size="sm"
                onClick={handleResetFilter}
                className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs rounded-xl whitespace-nowrap"
                aria-label={t.reset_filter || 'Reset search and status filters'}
              >
                {t.reset_filter || 'Reset'}
              </EnhancedButton>
            )}
          </div>
        </div>

        {/* Table Container or Empty State */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {paginatedProjects.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                  <thead className="bg-slate-800 dark:bg-slate-950 border-b border-slate-700 dark:border-slate-800">
                    <tr>
                      {tableHeaders.map((header, index) => (
                        <th
                          key={index}
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider last:text-right first:pl-8"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedProjects.map((p, index) => (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors duration-150 group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-medium first:pl-8">
                          {(currentPage - 1) * 10 + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className="text-sm font-bold text-slate-900 dark:text-white max-w-xs md:max-w-md truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                            title={p.title}
                          >
                            {p.title}
                          </div>
                          {p.description && (
                            <p
                              className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs md:max-w-md mt-0.5"
                              title={p.description}
                            >
                              {p.description}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 font-semibold">
                          {formatBudgetCompact(p.budget || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                              statusBadgeMap[p.statusKey] ||
                              'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  p.statusKey === 'delayed'
                                    ? 'bg-rose-500'
                                    : p.statusKey === 'completed'
                                      ? 'bg-indigo-600'
                                      : 'bg-emerald-500'
                                }`}
                                style={{ width: `${p.progress}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {p.progress.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 font-medium">
                          {p.startDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 font-medium">
                          {p.endDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-200 text-center font-bold">
                          {p.totalTasks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1.5">
                            {canWrite && (
                              <EnhancedButton
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProject(p)}
                                className="min-w-[38px] min-h-[38px] p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                aria-label={`${t.edit || 'Edit'} ${p.title}`}
                                title={t.edit || 'Edit'}
                              >
                                <EditIcon className="w-4 h-4" aria-hidden="true" />
                              </EnhancedButton>
                            )}
                            <EnhancedButton
                              variant="custom"
                              size="sm"
                              onClick={() => onNavigateToDetail(p.id)}
                              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold rounded-xl px-3.5 py-1.5 text-xs transition-all shadow-sm"
                              aria-label={`${t.view_details_button || 'View Details'} for ${p.title}`}
                            >
                              {t.view_details_button || 'View Details'}
                            </EnhancedButton>
                            {canWrite && (
                              <EnhancedButton
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDeleteModal(p.id)}
                                className="min-w-[38px] min-h-[38px] p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                aria-label={`${t.delete || 'Delete'} ${p.title}`}
                                title={t.delete || 'Delete'}
                              >
                                <TrashIcon className="w-4 h-4" aria-hidden="true" />
                              </EnhancedButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          ) : (
            /* Interactive Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 shadow-inner">
                <ClipboardDocumentListIcon className="w-8 h-8" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {searchTerm || statusFilter !== 'all'
                  ? t.no_results_found || 'No Projects Match Filters'
                  : t.no_projects_found || 'No Projects Registered'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6 text-sm">
                {searchTerm || statusFilter !== 'all'
                  ? t.no_results_message ||
                    'Try modifying your search keywords or resetting the status filter to see available projects.'
                  : t.no_projects_message ||
                    'There are currently no projects recorded. Create a new project to start tracking activities and schedules.'}
              </p>
              <div className="flex gap-3">
                {searchTerm || statusFilter !== 'all' ? (
                  <EnhancedButton
                    variant="secondary"
                    size="md"
                    onClick={handleResetFilter}
                    className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-5 py-2.5 font-medium"
                    aria-label={t.reset_filter || 'Reset Filter'}
                  >
                    {t.reset_filter || 'Reset Filter'}
                  </EnhancedButton>
                ) : (
                  canWrite && (
                    <EnhancedButton
                      variant="primary"
                      size="md"
                      onClick={handleAddProject}
                      className="bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/20 rounded-xl px-6 py-2.5 font-bold flex items-center"
                      aria-label={t.add_project || 'Add New Project'}
                    >
                      <PlusIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                      {t.add_project || 'Add New Project'}
                    </EnhancedButton>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Form Modal */}
      <Modal
        isOpen={isProjectFormModalOpen}
        onClose={() => setProjectFormModalOpen(false)}
        title={editingProject ? t.edit_project || 'Edit Project' : t.add_project || 'Add Project'}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t.confirm_delete || 'Confirm Delete'}
      >
        <div className="space-y-6 text-slate-800 dark:text-slate-100">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-full text-rose-600 dark:text-rose-400 shadow-sm shrink-0">
              <TrashIcon className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-rose-900 dark:text-rose-200 text-base">
                {t.warning || 'Warning'}
              </h3>
              <p className="text-sm text-rose-800/90 dark:text-rose-300/80 leading-relaxed">
                {t.confirm_delete_project_message ||
                  'Are you sure you want to delete this project? This action cannot be undone and will also delete all associated tasks completely from the system.'}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <EnhancedButton
              variant="secondary"
              size="md"
              onClick={() => setDeleteModalOpen(false)}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-5 py-2.5 font-medium"
              aria-label={t.cancel || 'Cancel delete'}
            >
              {t.cancel || 'Cancel'}
            </EnhancedButton>
            <EnhancedButton
              variant="error"
              size="md"
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 rounded-xl px-5 py-2.5 font-bold"
              aria-label={t.delete || 'Confirm delete'}
            >
              {t.delete || 'Delete Project'}
            </EnhancedButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectListPage;
