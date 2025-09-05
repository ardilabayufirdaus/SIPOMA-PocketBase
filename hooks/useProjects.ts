import { useState, useCallback, useEffect } from "react";
import { Project, ProjectTask, ProjectStatus } from "../types";
import { supabase } from "../utils/supabase";

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectsAndTasks = useCallback(async () => {
    setLoading(true);
    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("*");
    const { data: tasksData, error: tasksError } = await supabase
      .from("project_tasks")
      .select("*");

    if (projectsError) console.error("Error fetching projects:", projectsError);
    else {
      // Map projects data to include required status field
      const mappedProjects = (projectsData || []).map((project: any) => ({
        id: project.id,
        title: project.title,
        budget: project.budget,
        status: project.status || ProjectStatus.ACTIVE, // Provide default status
        description: project.description,
        start_date: project.start_date,
        end_date: project.end_date,
        created_at: project.created_at,
        updated_at: project.updated_at,
      }));
      setProjects(mappedProjects);
    }

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      setTasks([]);
    } else {
      const mappedTasks = (tasksData || []).map((task: any) => ({
        id: task.id,
        project_id: task.project_id,
        activity: task.activity,
        planned_start: task.planned_start,
        planned_end: task.planned_end,
        actual_start: task.actual_start,
        actual_end: task.actual_end,
        percent_complete: task.percent_complete,
      }));
      setTasks(mappedTasks);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjectsAndTasks();
  }, [fetchProjectsAndTasks]);

  const getTasksByProjectId = useCallback(
    (projectId: string) =>
      tasks
        .filter((task) => task.project_id === projectId)
        .sort(
          (a, b) =>
            new Date(a.planned_start).getTime() -
            new Date(b.planned_start).getTime()
        ),
    [tasks]
  );

  const addTask = useCallback(
    async (
      projectId: string,
      taskData: Omit<ProjectTask, "id" | "project_id">
    ) => {
      const payload = {
        activity: taskData.activity,
        planned_start: taskData.planned_start,
        planned_end: taskData.planned_end,
        actual_start: taskData.actual_start,
        actual_end: taskData.actual_end,
        percent_complete: taskData.percent_complete,
        project_id: projectId,
      };
      const { error } = await supabase
        .from("project_tasks")
        .insert([payload as any]);
      if (error) console.error("Error adding task:", error);
      else fetchProjectsAndTasks();
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
      const { error } = await supabase
        .from("project_tasks")
        .update(updateData as any)
        .eq("id", id);
      if (error) console.error("Error updating task:", error);
      else fetchProjectsAndTasks();
    },
    [fetchProjectsAndTasks]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const { error } = await supabase
        .from("project_tasks")
        .delete()
        .eq("id", taskId);
      if (error) console.error("Error deleting task:", error);
      else fetchProjectsAndTasks();
    },
    [fetchProjectsAndTasks]
  );

  const addBulkTasks = useCallback(
    async (
      projectId: string,
      newTasks: Omit<ProjectTask, "id" | "project_id">[]
    ) => {
      const tasksToAdd = newTasks.map((task) => ({
        activity: task.activity,
        planned_start: task.planned_start,
        planned_end: task.planned_end,
        actual_start: task.actual_start,
        actual_end: task.actual_end,
        percent_complete: task.percent_complete,
        project_id: projectId,
      }));
      const { error } = await supabase
        .from("project_tasks")
        .insert(tasksToAdd as any);
      if (error) console.error("Error bulk adding tasks:", error);
      else fetchProjectsAndTasks();
    },
    [fetchProjectsAndTasks]
  );

  const replaceBulkTasks = useCallback(
    async (
      projectId: string,
      newTasks: Omit<ProjectTask, "id" | "project_id">[]
    ) => {
      // First, delete all existing tasks for this project
      const { error: deleteError } = await supabase
        .from("project_tasks")
        .delete()
        .eq("project_id", projectId);
      if (deleteError) {
        console.error("Error deleting existing tasks:", deleteError);
        return;
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

      const { error: insertError } = await supabase
        .from("project_tasks")
        .insert(tasksToAdd as any);
      if (insertError) console.error("Error replacing tasks:", insertError);
      else fetchProjectsAndTasks();
    },
    [fetchProjectsAndTasks]
  );

  const addProject = useCallback(
    async (projectData: Omit<Project, "id">) => {
      const { error } = await supabase.from("projects").insert([projectData]);
      if (error) console.error("Error adding project:", error);
      else fetchProjectsAndTasks();
    },
    [fetchProjectsAndTasks]
  );

  const updateProject = useCallback(
    async (updatedProject: Project) => {
      const { id, ...rest } = updatedProject;
      const { error } = await supabase
        .from("projects")
        .update(rest)
        .eq("id", id);
      if (error) console.error("Error updating project:", error);
      else fetchProjectsAndTasks();
    },
    [fetchProjectsAndTasks]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      // Delete all tasks first
      await supabase.from("project_tasks").delete().eq("project_id", projectId);

      // Then delete the project
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);
      if (error) console.error("Error deleting project:", error);
      else fetchProjectsAndTasks();
    },
    [fetchProjectsAndTasks]
  );

  return {
    projects,
    tasks,
    loading,
    getTasksByProjectId,
    addTask,
    updateTask,
    deleteTask,
    addBulkTasks,
    replaceBulkTasks,
    addProject,
    updateProject,
    deleteProject,
  };
};
