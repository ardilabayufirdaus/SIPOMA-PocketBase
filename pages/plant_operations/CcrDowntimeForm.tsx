import React, { useState, useEffect, useRef } from 'react';
import { CcrDowntimeData } from '../../types';
import { usePicSettings } from '../../hooks/usePicSettings';

// Import Enhanced Components
import { EnhancedButton } from '../../components/ui/EnhancedComponents';

interface FormProps {
  recordToEdit: CcrDowntimeData | null;
  onSave: (record: CcrDowntimeData | Omit<CcrDowntimeData, 'id' | 'date'>) => void;
  onCancel: () => void;
  t: Record<string, string>;
  plantUnits: string[];
  selectedUnit: string;
}

const CcrDowntimeForm: React.FC<FormProps> = ({
  recordToEdit,
  onSave,
  onCancel,
  t,
  plantUnits,
  selectedUnit,
}) => {
  const { records: picSettings } = usePicSettings();

  // Track if we've set initial defaults to avoid overriding user changes
  const hasSetDefaults = useRef(false);

  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form data only once when component mounts
  const [formData, setFormData] = useState(() => ({
    start_time: '00:00',
    end_time: '00:00',
    unit: '',
    pic: '',
    problem: '',
    action: '',
  }));

  // Effect for editing mode - only reset when recordToEdit changes
  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        start_time: recordToEdit.start_time,
        end_time: recordToEdit.end_time,
        unit: recordToEdit.unit,
        pic: recordToEdit.pic,
        problem: recordToEdit.problem,
        action: recordToEdit.action || '',
      });
      hasSetDefaults.current = true; // Mark as set for editing mode
      setErrors({});
      setTouched({});
    }
  }, [recordToEdit]);

  // Effect for add mode - set default values only once when data becomes available
  useEffect(() => {
    if (
      !recordToEdit &&
      !hasSetDefaults.current &&
      (picSettings.length > 0 || plantUnits.length > 0)
    ) {
      setFormData((prev) => ({
        ...prev,
        unit: selectedUnit,
      }));
      hasSetDefaults.current = true;
    }
  }, [recordToEdit, picSettings, plantUnits, selectedUnit]);

  // Helper function to ensure time is always in HH:MM format
  const formatTimeForInput = (timeStr: string) => {
    if (!timeStr) return '';

    // Handle various time formats that might exist in the database
    if (timeStr.includes(':')) {
      // Format HH:MM:SS or HH:MM
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        return parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
      }
    }

    // For unrecognized formats, return as is (limited to 5 characters for HH:MM)
    return timeStr.length > 5 ? timeStr.substring(0, 5) : timeStr;
  };

  // Validation functions
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'start_time':
      case 'end_time':
        if (!value) {
          newErrors[name] = 'Time is required';
        } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
          newErrors[name] = 'Invalid time format (HH:MM)';
        } else {
          delete newErrors[name];
        }
        break;
      case 'unit':
        if (!value) {
          newErrors.unit = 'Unit is required';
        } else {
          delete newErrors.unit;
        }
        break;
      case 'pic':
        if (!value) {
          newErrors.pic = 'PIC is required';
        } else {
          delete newErrors.pic;
        }
        break;
      case 'problem':
        if (!value.trim()) {
          newErrors.problem = 'Problem description is required';
        } else if (value.trim().length < 10) {
          newErrors.problem = 'Problem description must be at least 10 characters';
        } else {
          delete newErrors.problem;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Use HH:MM format directly for time values - don't add seconds
    if (name === 'start_time' || name === 'end_time') {
      // Ensure time is in HH:MM format
      const formattedTime = value.split(':').slice(0, 2).join(':');
      setFormData((prev) => ({ ...prev, [name]: formattedTime }));
      if (touched[name]) {
        validateField(name, formattedTime);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (touched[name]) {
        validateField(name, value);
      }
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateTimeRange = () => {
    const startTime = formData.start_time;
    const endTime = formData.end_time;

    if (startTime && endTime && !errors.start_time && !errors.end_time) {
      // Parse time format ensuring HH:MM format for database consistency
      const parseTime = (timeStr: string) => {
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        // Skip seconds for consistency with database format
        return hours * 60 + minutes; // Calculate in minutes instead
      };

      const startSeconds = parseTime(startTime);
      const endSeconds = parseTime(endTime);

      if (startSeconds > endSeconds) {
        setErrors((prev) => ({
          ...prev,
          end_time: 'End time must be after or equal to start time',
        }));
        return false;
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.end_time;
          return newErrors;
        });
      }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allFields = ['start_time', 'end_time', 'unit', 'pic', 'problem'];
    const newTouched: Record<string, boolean> = {};
    allFields.forEach((field) => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    // Validate all fields
    allFields.forEach((field) => {
      validateField(field, formData[field as keyof typeof formData] as string);
    });

    // Validate time range
    const timeRangeValid = validateTimeRange();

    // Check for any errors
    const hasErrors = Object.keys(errors).length > 0 || !timeRangeValid;

    if (hasErrors) {
      return;
    }

    // Validate required fields
    if (plantUnits.length === 0) {
      alert('No plant units available. Please configure plant units first.');
      return;
    }

    if (picSettings.length === 0) {
      alert('No PIC settings available. Please configure PIC settings first.');
      return;
    }

    // Ensure time format is consistent as HH:MM
    const formattedData = {
      ...formData,
      // Explicitly format times to HH:MM
      start_time: formData.start_time.split(':').slice(0, 2).join(':'),
      end_time: formData.end_time.split(':').slice(0, 2).join(':'),
    };

    if (recordToEdit) {
      onSave({ ...recordToEdit, ...formattedData });
    } else {
      onSave(formattedData);
    }
  };

  const isFieldInvalid = (fieldName: string) => {
    return touched[fieldName] && errors[fieldName];
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Time Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Time Period
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="start_time"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t.start_time}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  name="start_time"
                  id="start_time"
                  value={formatTimeForInput(formData.start_time)}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-xl shadow-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ${
                    isFieldInvalid('start_time')
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500'
                  }`}
                />
                {isFieldInvalid('start_time') && (
                  <div className="absolute -bottom-6 left-0 text-red-600 text-xs">
                    {errors.start_time}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="end_time"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t.end_time}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  name="end_time"
                  id="end_time"
                  value={formatTimeForInput(formData.end_time)}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-xl shadow-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ${
                    isFieldInvalid('end_time')
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500'
                  }`}
                />
                {isFieldInvalid('end_time') && (
                  <div className="absolute -bottom-6 left-0 text-red-600 text-xs">
                    {errors.end_time}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Assignment
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="unit"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t.unit}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="unit"
                  id="unit"
                  value={formData.unit}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm text-slate-900 dark:text-slate-100 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="pic"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t.pic}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <select
                  name="pic"
                  id="pic"
                  value={formData.pic}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-xl shadow-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 appearance-none ${
                    isFieldInvalid('pic')
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500'
                  }`}
                  disabled={picSettings.length === 0}
                >
                  {picSettings.length === 0 ? (
                    <option value="">No PIC available</option>
                  ) : (
                    <>
                      <option value="">Pilih PIC</option>
                      {picSettings.map((picSetting) => (
                        <option key={picSetting.id} value={picSetting.pic}>
                          {picSetting.pic}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                {isFieldInvalid('pic') && (
                  <div className="absolute -bottom-6 left-0 text-red-600 text-xs">{errors.pic}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Details
            </h4>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="problem"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t.problem}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <textarea
                  name="problem"
                  id="problem"
                  value={formData.problem}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows={4}
                  required
                  placeholder="Describe the problem that occurred..."
                  className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-xl shadow-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 resize-none ${
                    isFieldInvalid('problem')
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500'
                  }`}
                />
                {isFieldInvalid('problem') && (
                  <div className="absolute -bottom-6 left-0 text-red-600 text-xs">
                    {errors.problem}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="action"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t.action}
              </label>
              <textarea
                name="action"
                id="action"
                value={formData.action}
                onChange={handleChange}
                rows={4}
                placeholder="Describe the actions taken to resolve the issue..."
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-row justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700">
          <EnhancedButton
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="w-28 px-6 py-2.5 flex items-center justify-center"
            rounded="xl"
            elevation="sm"
            aria-label={t.cancel_button || 'Cancel'}
          >
            {t.cancel_button}
          </EnhancedButton>
          <EnhancedButton
            type="submit"
            variant="primary"
            className="w-28 px-6 py-2.5 flex items-center justify-center"
            rounded="xl"
            elevation="sm"
            aria-label={t.save_button || 'Save downtime record'}
          >
            {t.save_button}
          </EnhancedButton>
        </div>
      </form>
    </div>
  );
};

export default CcrDowntimeForm;

