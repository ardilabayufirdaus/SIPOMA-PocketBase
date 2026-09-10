import React, { useState, useEffect } from 'react';
import { ProjectTask } from '../types';

// Import Enhanced Components
import { EnhancedButton } from './ui/EnhancedComponents';

type TaskFormData = Omit<ProjectTask, 'id' | 'project_id'>;

interface FormProps {
  taskToEdit: ProjectTask | null;
  onSave: (task: TaskFormData | ProjectTask) => void;
  onCancel: () => void;
  t: Record<string, string>;
}

const ProjectTaskForm: React.FC<FormProps> = ({ taskToEdit, onSave, onCancel, t }) => {
  const [formData, setFormData] = useState<TaskFormData>({
    activity: '',
    planned_start: new Date().toISOString().split('T')[0],
    planned_end: new Date().toISOString().split('T')[0],
    actual_start: null,
    actual_end: null,
    percent_complete: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        activity: taskToEdit.activity || '',
        planned_start: taskToEdit.planned_start || new Date().toISOString().split('T')[0],
        planned_end: taskToEdit.planned_end || new Date().toISOString().split('T')[0],
        actual_start: taskToEdit.actual_start || null,
        actual_end: taskToEdit.actual_end || null,
        percent_complete: taskToEdit.percent_complete || 0,
      });
    } else {
      setFormData({
        activity: '',
        planned_start: new Date().toISOString().split('T')[0],
        planned_end: new Date().toISOString().split('T')[0],
        actual_start: null,
        actual_end: null,
        percent_complete: 0,
      });
    }
  }, [taskToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'date' && !value) {
      setFormData((prev) => ({ ...prev, [name]: null }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? Math.max(0, Math.min(100, parseInt(value, 10) || 0)) : value,
      }));
    }

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
    if (!formData.activity.trim()) {
      newErrors.activity = t.activity_required || 'Activity name is required';
    }
    if (formData.planned_start && formData.planned_end) {
      if (new Date(formData.planned_end) < new Date(formData.planned_start)) {
        newErrors.planned_end =
          t.end_date_after_start || 'Planned end date cannot be earlier than start date';
      }
    }
    if (formData.actual_start && formData.actual_end) {
      if (new Date(formData.actual_end) < new Date(formData.actual_start)) {
        newErrors.actual_end =
          t.actual_end_after_start || 'Actual end date cannot be earlier than start date';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (taskToEdit) {
      onSave({ ...taskToEdit, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="text-slate-800 dark:text-slate-100">
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <div className="sm:col-span-2">
          <label
            htmlFor="task-activity"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
          >
            {t.activity_label || 'Activity'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="activity"
            id="task-activity"
            value={formData.activity}
            onChange={handleChange}
            maxLength={200}
            required
            className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border rounded-xl shadow-sm text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
              errors.activity
                ? 'border-red-500 dark:border-red-500 ring-1 ring-red-500'
                : 'border-slate-300 dark:border-slate-700'
            }`}
            placeholder={t.activity_placeholder || 'Enter task activity name...'}
          />
          {errors.activity && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium">
              {errors.activity}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="task-planned-start"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
          >
            {t.planned_start_label || 'Planned Start Date'} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="planned_start"
            id="task-planned-start"
            value={formData.planned_start}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label
            htmlFor="task-planned-end"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
          >
            {t.planned_end_label || 'Planned End Date'} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="planned_end"
            id="task-planned-end"
            value={formData.planned_end}
            onChange={handleChange}
            required
            className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border rounded-xl shadow-sm text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
              errors.planned_end
                ? 'border-red-500 dark:border-red-500 ring-1 ring-red-500'
                : 'border-slate-300 dark:border-slate-700'
            }`}
          />
          {errors.planned_end && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium">
              {errors.planned_end}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="task-actual-start"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
          >
            {t.actual_start_label || 'Actual Start Date'}
          </label>
          <input
            type="date"
            name="actual_start"
            id="task-actual-start"
            value={formData.actual_start ?? ''}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label
            htmlFor="task-actual-end"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
          >
            {t.actual_end_label || 'Actual End Date'}
          </label>
          <input
            type="date"
            name="actual_end"
            id="task-actual-end"
            value={formData.actual_end ?? ''}
            onChange={handleChange}
            className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border rounded-xl shadow-sm text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
              errors.actual_end
                ? 'border-red-500 dark:border-red-500 ring-1 ring-red-500'
                : 'border-slate-300 dark:border-slate-700'
            }`}
          />
          {errors.actual_end && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium">
              {errors.actual_end}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="task-percent-complete"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
          >
            {t.percent_complete_label || 'Percent Complete (%)'}
          </label>
          <div className="relative">
            <input
              type="number"
              name="percent_complete"
              id="task-percent-complete"
              min="0"
              max="100"
              value={formData.percent_complete}
              onChange={handleChange}
              className="w-full pr-10 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-bold">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700/60 px-6 py-4 flex flex-row-reverse gap-3 rounded-b-2xl">
        <EnhancedButton
          variant="primary"
          size="md"
          type="submit"
          className="bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/20 rounded-xl px-6 py-2.5 font-bold transition-all"
          aria-label={t.save_button || 'Save task'}
        >
          {t.save_button || 'Save Task'}
        </EnhancedButton>
        <EnhancedButton
          variant="secondary"
          size="md"
          type="button"
          onClick={onCancel}
          className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-5 py-2.5 font-medium transition-all"
          aria-label={t.cancel_button || 'Cancel task form'}
        >
          {t.cancel_button || 'Cancel'}
        </EnhancedButton>
      </div>
    </form>
  );
};

export default ProjectTaskForm;
