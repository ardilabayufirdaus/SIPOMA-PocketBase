import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus } from '../types';

// Import Enhanced Components
import { EnhancedButton } from './ui/EnhancedComponents';

interface ProjectFormProps {
  t: Record<string, string>;
  onSave: (project: Omit<Project, 'id'> | Project) => void;
  onCancel: () => void;
  project?: Project | null;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ t, onSave, onCancel, project }) => {
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    budget: project?.budget || 0,
    status: project?.status || ProjectStatus.ACTIVE,
    start_date: project?.start_date || new Date().toISOString().split('T')[0],
    end_date: project?.end_date || new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        budget: project.budget || 0,
        status: project.status || ProjectStatus.ACTIVE,
        start_date: project.start_date || new Date().toISOString().split('T')[0],
        end_date: project.end_date || new Date().toISOString().split('T')[0],
      });
    }
  }, [project]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Math.max(0, parseFloat(value) || 0) : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = t.project_name_required || 'Project name is required';
    }
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        newErrors.end_date =
          t.end_date_after_start || 'Target end date cannot be earlier than start date';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (project) {
      onSave({ ...project, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-slate-800 dark:text-slate-100">
      <div>
        <label
          htmlFor="project-title"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
        >
          {t.project_name || 'Project Name'} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          id="project-title"
          value={formData.title}
          onChange={handleChange}
          maxLength={100}
          required
          className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border rounded-xl shadow-sm text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
            errors.title
              ? 'border-red-500 dark:border-red-500 ring-1 ring-red-500'
              : 'border-slate-300 dark:border-slate-700'
          }`}
          placeholder={t.project_name_placeholder || 'Enter project name...'}
        />
        {errors.title && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium">{errors.title}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="project-description"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
        >
          {t.project_description || 'Project Description'}
        </label>
        <textarea
          name="description"
          id="project-description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          maxLength={500}
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
          placeholder={t.project_description_placeholder || 'Enter project description...'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="project-budget"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
          >
            {t.proj_budget || 'Budget'} (Rp)
          </label>
          <input
            type="number"
            name="budget"
            id="project-budget"
            value={formData.budget}
            onChange={handleChange}
            min="0"
            step="100000"
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="0"
          />
        </div>

        <div>
          <label
            htmlFor="project-status"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
          >
            {t.project_status_label || 'Project Status'}
          </label>
          <select
            name="status"
            id="project-status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
          >
            <option value={ProjectStatus.ACTIVE}>
              {t.proj_status_on_track || 'Active / On Track'}
            </option>
            <option value={ProjectStatus.ON_HOLD}>{t.status_in_progress || 'In Progress'}</option>
            <option value={ProjectStatus.COMPLETED}>
              {t.proj_status_completed || 'Completed'}
            </option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="project-start-date"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
          >
            {t.project_start_date || 'Start Date'}
          </label>
          <input
            type="date"
            name="start_date"
            id="project-start-date"
            value={formData.start_date}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label
            htmlFor="project-end-date"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
          >
            {t.project_target_date || 'Target Completion Date'}
          </label>
          <input
            type="date"
            name="end_date"
            id="project-end-date"
            value={formData.end_date}
            onChange={handleChange}
            className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border rounded-xl shadow-sm text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
              errors.end_date
                ? 'border-red-500 dark:border-red-500 ring-1 ring-red-500'
                : 'border-slate-300 dark:border-slate-700'
            }`}
          />
          {errors.end_date && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium">
              {errors.end_date}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/60 mt-6">
        <EnhancedButton
          variant="secondary"
          size="md"
          type="button"
          onClick={onCancel}
          className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-5 py-2.5 font-medium transition-all"
          aria-label={t.cancel || 'Cancel project form'}
        >
          {t.cancel || 'Cancel'}
        </EnhancedButton>
        <EnhancedButton
          variant="primary"
          size="md"
          type="submit"
          className="bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/20 rounded-xl px-6 py-2.5 font-bold transition-all"
          aria-label={project ? t.update || 'Update project' : t.add || 'Add project'}
        >
          {project ? t.update || 'Update' : t.add || 'Add'}
        </EnhancedButton>
      </div>
    </form>
  );
};

export default ProjectForm;
