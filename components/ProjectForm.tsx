import React, { useState } from "react";
import { Project, ProjectStatus } from "../types";

interface ProjectFormProps {
  t: any;
  onSave: (project: Omit<Project, "id"> | Project) => void;
  onCancel: () => void;
  project?: Project | null;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  t,
  onSave,
  onCancel,
  project,
}) => {
  const [formData, setFormData] = useState({
    title: project?.title || "",
    budget: project?.budget || 0,
    status: project?.status || ProjectStatus.ACTIVE,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (project) {
      onSave({ ...project, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          {t.project_name || "Project Name"}
        </label>
        <input
          type="text"
          name="title"
          id="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          placeholder={t.project_name_placeholder || "Enter project name..."}
        />
      </div>
      <div>
        <label
          htmlFor="budget"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          {t.proj_budget || "Budget"} (Rp)
        </label>
        <input
          type="number"
          name="budget"
          id="budget"
          value={formData.budget}
          onChange={handleChange}
          min="0"
          step="1000"
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          placeholder="1000000"
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          {t.cancel || "Cancel"}
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          {project ? t.update || "Update" : t.add || "Add"}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;
