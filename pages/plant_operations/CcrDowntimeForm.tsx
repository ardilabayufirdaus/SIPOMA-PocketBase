import React, { useState, useEffect } from 'react';
import { CcrDowntimeData } from '../../types';
import { usePicSettings } from '../../hooks/usePicSettings';

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from '../../components/ui/EnhancedComponents';

interface FormProps {
  recordToEdit: CcrDowntimeData | null;
  onSave: (record: CcrDowntimeData | Omit<CcrDowntimeData, 'id' | 'date'>) => void;
  onCancel: () => void;
  t: any;
  plantUnits: string[];
}

const CcrDowntimeForm: React.FC<FormProps> = ({
  recordToEdit,
  onSave,
  onCancel,
  t,
  plantUnits,
}) => {
  // Enhanced accessibility hooks
  const announceToScreenReader = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  const { records: picSettings } = usePicSettings();
  const [formData, setFormData] = useState({
    start_time: '00:00:00',
    end_time: '00:00:00',
    unit: plantUnits[0] || '',
    pic: picSettings[0]?.pic || '',
    problem: '',
  });

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        start_time: recordToEdit.start_time,
        end_time: recordToEdit.end_time,
        unit: recordToEdit.unit,
        pic: recordToEdit.pic,
        problem: recordToEdit.problem,
      });
    } else {
      setFormData({
        start_time: '00:00:00',
        end_time: '00:00:00',
        unit: plantUnits.length > 0 ? plantUnits[0] : '',
        pic: picSettings.length > 0 ? picSettings[0]?.pic || '' : '',
        problem: '',
      });
    }
  }, [recordToEdit, picSettings, plantUnits]);

  // Helper function to convert HH:MM:SS to HH:MM for time input
  const formatTimeForInput = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.length > 5 ? timeStr.substring(0, 5) : timeStr;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Convert time input from HH:MM to HH:MM:SS for database consistency
    if ((name === 'start_time' || name === 'end_time') && value && !value.includes(':00', 5)) {
      const timeValue = value + ':00';
      setFormData((prev) => ({ ...prev, [name]: timeValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateTimeRange = () => {
    const startTime = formData.start_time;
    const endTime = formData.end_time;

    if (startTime && endTime) {
      // Parse time format HH:MM:SS or HH:MM
      const parseTime = (timeStr: string) => {
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseInt(parts[2] || '0', 10);
        return hours * 3600 + minutes * 60 + seconds;
      };

      const startSeconds = parseTime(startTime);
      const endSeconds = parseTime(endTime);

      if (startSeconds >= endSeconds) {
        return 'End time must be after start time';
      }

      // Minimum 5 minutes duration
      if (endSeconds - startSeconds < 300) {
        return 'Minimum downtime duration is 5 minutes';
      }
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate time range
    const timeError = validateTimeRange();
    if (timeError) {
      alert(timeError);
      return;
    }

    // Validate required fields
    if (plantUnits.length === 0) {
      alert('No plant units available. Please configure plant units first.');
      return;
    }

    if (!formData.unit) {
      alert('Unit is required');
      return;
    }

    if (picSettings.length === 0) {
      alert('No PIC settings available. Please configure PIC settings first.');
      return;
    }

    if (!formData.pic) {
      alert('PIC is required');
      return;
    }

    if (!formData.problem.trim()) {
      alert('Problem description is required');
      return;
    }

    if (recordToEdit) {
      onSave({ ...recordToEdit, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-slate-700">
              {t.start_time}
            </label>
            <input
              type="time"
              name="start_time"
              id="start_time"
              value={formatTimeForInput(formData.start_time)}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm no-spinner"
            />
          </div>
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-slate-700">
              {t.end_time}
            </label>
            <input
              type="time"
              name="end_time"
              id="end_time"
              value={formatTimeForInput(formData.end_time)}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm no-spinner"
            />
          </div>
        </div>
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-slate-700">
            {t.unit}
          </label>
          <select
            name="unit"
            id="unit"
            value={formData.unit}
            onChange={handleChange}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            disabled={plantUnits.length === 0}
          >
            {plantUnits.length === 0 ? (
              <option value="">No units available</option>
            ) : (
              plantUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label htmlFor="pic" className="block text-sm font-medium text-slate-700">
            {t.pic}
          </label>
          <select
            name="pic"
            id="pic"
            value={formData.pic}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            disabled={picSettings.length === 0}
          >
            {picSettings.length === 0 ? (
              <option value="">No PIC available</option>
            ) : (
              picSettings.map((picSetting) => (
                <option key={picSetting.id} value={picSetting.pic}>
                  {picSetting.pic}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label htmlFor="problem" className="block text-sm font-medium text-slate-700">
            {t.problem}
          </label>
          <textarea
            name="problem"
            id="problem"
            value={formData.problem}
            onChange={handleChange}
            rows={3}
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          />
        </div>
      </div>
      <div className="bg-slate-50 px-4 py-2 sm:px-4 sm:flex sm:flex-row-reverse rounded-b-lg">
        <EnhancedButton
          type="submit"
          variant="primary"
          className="sm:ml-3 sm:w-auto"
          aria-label={t.save_button || 'Save downtime record'}
        >
          {t.save_button}
        </EnhancedButton>
        <EnhancedButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="mt-2 sm:mt-0 sm:ml-3 sm:w-auto"
          aria-label={t.cancel_button || 'Cancel'}
        >
          {t.cancel_button}
        </EnhancedButton>
      </div>
    </form>
  );
};

export default CcrDowntimeForm;
