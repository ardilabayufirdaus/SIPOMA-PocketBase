import { useState, useCallback, useEffect } from 'react';
import { Project, ProjectTask, ProjectStatus } from '../types';
import { pb } from '../utils/pocketbase';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectsAndTasks = useCallback(async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    try {
      const projectsData = await pb.collection('projects').getFullList();
      const tasksData = await pb.collection('project_tasks').getFullList();

      // Map projects data to include required status field
      const mappedProjects = projectsData.map((project: Record<string, unknown>) => ({
        id: String(project.id),
        title: String(project.title),
        budget: project.budget ? Number(project.budget) : undefined,
        status: (project.status as ProjectStatus) || ProjectStatus.ACTIVE, // Provide default status
        description: project.description ? String(project.description) : undefined,
        start_date: project.start_date ? String(project.start_date) : undefined,
        end_date: project.end_date ? String(project.end_date) : undefined,
        created_at: project.created ? String(project.created) : undefined,
        updated_at: project.updated ? String(project.updated) : undefined,
      }));
      setProjects(mappedProjects);

      const mappedTasks = tasksData.map((task: Record<string, unknown>) => ({
        id: String(task.id),
        project_id: String(task.project_id),
        activity: String(task.activity),
        planned_start: task.planned_start ? String(task.planned_start) : undefined,
        planned_end: task.planned_end ? String(task.planned_end) : undefined,
        actual_start: task.actual_start ? String(task.actual_start) : null,
        actual_end: task.actual_end ? String(task.actual_end) : null,
        percent_complete: task.percent_complete ? Number(task.percent_complete) : 0,
      }));
      setTasks(mappedTasks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);

      // Auto-retry for network errors, up to 3 times with exponential backoff
      if (
        retryCount < 3 &&
        (errorMessage.includes('Failed to fetch') || errorMessage.includes('network'))
      ) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => fetchProjectsAndTasks(retryCount + 1), delay);
        return;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectsAndTasks();
  }, [fetchProjectsAndTasks]);

  const getTasksByProjectId = useCallback(
    (projectId: string) =>
      tasks
        .filter((task) => task.project_id === projectId)
        .sort((a, b) => new Date(a.planned_start).getTime() - new Date(b.planned_start).getTime()),
    [tasks]
  );

  const addTask = useCallback(
    async (projectId: string, taskData: Omit<ProjectTask, 'id' | 'project_id'>) => {
      const payload = {
        activity: taskData.activity,
        planned_start: taskData.planned_start,
        planned_end: taskData.planned_end,
        actual_start: taskData.actual_start,
        actual_end: taskData.actual_end,
        percent_complete: taskData.percent_complete,
        project_id: projectId,
      };
      await pb.collection('project_tasks').create(payload);
      fetchProjectsAndTasks();
    },
    [fetchProjectsAndTasks]
  );

  const updateTask = useCallback(
    async (updatedTask: ProjectTask) => {
      const { id, ...rest } = updatedTask;
      const updateData = {
        activity: rest.activity,
        planned_start: rest.planned_start,
        planned_end: rest.planned_end,
        actual_start: rest.actual_start,
        actual_end: rest.actual_end,
        percent_complete: rest.percent_complete,
        project_id: rest.project_id,
      };
      await pb.collection('project_tasks').update(id, updateData);
      fetchProjectsAndTasks();
    },
    [fetchProjectsAndTasks]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      await pb.collection('project_tasks').delete(taskId);
      fetchProjectsAndTasks();
    },
    [fetchProjectsAndTasks]
  );

  const addBulkTasks = useCallback(
    async (projectId: string, newTasks: Omit<ProjectTask, 'id' | 'project_id'>[]) => {
      const tasksToAdd = newTasks.map((task) => ({
        activity: task.activity,
        planned_start: task.planned_start,
        planned_end: task.planned_end,
        actual_start: task.actual_start,
        actual_end: task.actual_end,
        percent_complete: task.percent_complete,
        project_id: projectId,
      }));

      // Create tasks one by one since PocketBase doesn't support bulk insert in the same way
      for (const task of tasksToAdd) {
        await pb.collection('project_tasks').create(task);
      }

      fetchProjectsAndTasks();
    },
    [fetchProjectsAndTasks]
  );

  const replaceBulkTasks = useCallback(
    async (projectId: string, newTasks: Omit<ProjectTask, 'id' | 'project_id'>[]) => {
      // First, delete all existing tasks for this project
      const existingTasks = await pb.collection('project_tasks').getFullList({
        filter: `project_id="${projectId}"`,
      });

      // Delete existing tasks
      for (const task of existingTasks) {
        await pb.collection('project_tasks').delete(task.id);
      }

      // Then, add the new tasks
      const tasksToAdd = newTasks.map((task) => ({
        activity: task.activity,
        planned_start: task.planned_start,
        planned_end: task.planned_end,
        actual_start: task.actual_start,
        actual_end: task.actual_end,
        percent_complete: task.percent_complete,
        project_id: projectId,
      }));

      // Create new tasks
      for (const task of tasksToAdd) {
        await pb.collection('project_tasks').create(task);
      }

      fetchProjectsAndTasks();
    },
    [fetchProjectsAndTasks]
  );

  const addProject = useCallback(
    async (projectData: Omit<Project, 'id'>) => {
      await pb.collection('projects').create(projectData);
      fetchProjectsAndTasks();
    },
    [fetchProjectsAndTasks]
  );

  const updateProject = useCallback(
    async (updatedProject: Project) => {
      const { id, ...rest } = updatedProject;
      await pb.collection('projects').update(id, rest);
      fetchProjectsAndTasks();
    },
    [fetchProjectsAndTasks]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      // Delete all tasks first
      const existingTasks = await pb.collection('project_tasks').getFullList({
        filter: `project_id="${projectId}"`,
      });

      for (const task of existingTasks) {
        await pb.collection('project_tasks').delete(task.id);
      }

      // Then delete the project
      await pb.collection('projects').delete(projectId);
      fetchProjectsAndTasks();
    },
    [fetchProjectsAndTasks]
  );

  return {
    projects,
    tasks,
    loading,
    error,
    getTasksByProjectId,
    addTask,
    updateTask,
    deleteTask,
    addBulkTasks,
    replaceBulkTasks,
    addProject,
    updateProject,
    deleteProject,
    refetch: fetchProjectsAndTasks,
  };
};
