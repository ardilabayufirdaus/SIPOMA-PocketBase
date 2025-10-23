import React, { useState, useEffect } from 'react';
import { ProjectTask } from '../types';

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from './ui/EnhancedComponents';

type TaskFormData = Omit<ProjectTask, 'id' | 'project_id'>;

interface FormProps {
  taskToEdit: ProjectTask | null;
  onSave: (task: TaskFormData | ProjectTask) => void;
  onCancel: () => void;
  t: any;
}

const ProjectTaskForm: React.FC<FormProps> = ({ taskToEdit, onSave, onCancel, t }) => {
  const [formData, setFormData] = useState<TaskFormData>({
    activity: '',
    planned_start: '',
    planned_end: '',
    actual_start: null,
    actual_end: null,
    percent_complete: 0,
  });

  // Enhanced accessibility hooks
  const { announceToScreenReader } = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        activity: taskToEdit.activity,
        planned_start: taskToEdit.planned_start,
        planned_end: taskToEdit.planned_end,
        actual_start: taskToEdit.actual_start || null,
        actual_end: taskToEdit.actual_end || null,
        percent_complete: taskToEdit.percent_complete,
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
      // Handle empty date fields
      setFormData((prev) => ({ ...prev, [name]: null }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskToEdit) {
      onSave({ ...taskToEdit, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <div className="sm:col-span-2">
          <label htmlFor="activity" className="block text-sm font-medium text-slate-700">
            {t.activity_label}
          </label>
          <input
            type="text"
            name="activity"
            id="activity"
            value={formData.activity}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="planned_start" className="block text-sm font-medium text-slate-700">
            {t.planned_start_label}
          </label>
          <input
            type="date"
            name="planned_start"
            id="planned_start"
            value={formData.planned_start}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="planned_end" className="block text-sm font-medium text-slate-700">
            {t.planned_end_label}
          </label>
          <input
            type="date"
            name="planned_end"
            id="planned_end"
            value={formData.planned_end}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="actual_start" className="block text-sm font-medium text-slate-700">
            {t.actual_start_label}
          </label>
          <input
            type="date"
            name="actual_start"
            id="actual_start"
            value={formData.actual_start ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="actual_end" className="block text-sm font-medium text-slate-700">
            {t.actual_end_label}
          </label>
          <input
            type="date"
            name="actual_end"
            id="actual_end"
            value={formData.actual_end ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="percent_complete" className="block text-sm font-medium text-slate-700">
            {t.percent_complete_label}
          </label>
          <div className="relative mt-1">
            <input
              type="number"
              name="percent_complete"
              id="percent_complete"
              min="0"
              max="100"
              value={formData.percent_complete}
              onChange={handleChange}
              className="block w-full pr-10 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              onBlur={(e) => {
                const value = Math.max(0, Math.min(100, Number(e.target.value)));
                setFormData((prev) => ({ ...prev, percent_complete: value }));
              }}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-slate-500 sm:text-sm">%</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
        <EnhancedButton
          variant="primary"
          size="sm"
          type="submit"
          className="sm:ml-3"
          aria-label={t.save_button || 'Save task'}
        >
          {t.save_button}
        </EnhancedButton>
        <EnhancedButton
          variant="secondary"
          size="sm"
          onClick={onCancel}
          className="mt-3 sm:mt-0 sm:ml-3"
          aria-label={t.cancel_button || 'Cancel task form'}
        >
          {t.cancel_button}
        </EnhancedButton>
      </div>
    </form>
  );
};

export default ProjectTaskForm;


