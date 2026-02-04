import React, { useState, useEffect, useRef } from 'react';
import { CcrDowntimeData } from '../../types';
import { usePicSettings } from '../../hooks/usePicSettings';

// Import Enhanced Components
import { EnhancedButton, EnhancedInput } from '../../components/ui/EnhancedComponents';
import { RcaAnalysisButton } from '@features/ai-advisor/presentation/components/RcaAnalysisButton';

interface FormProps {
  recordToEdit: CcrDowntimeData | null;
  onSave: (record: CcrDowntimeData | Omit<CcrDowntimeData, 'id' | 'date'>) => void;
  onCancel: () => void;
  t: Record<string, string>;
  plantUnits: string[];
  selectedUnit: string;
  readOnly?: boolean;
}

const CcrDowntimeForm: React.FC<FormProps> = ({
  recordToEdit,
  onSave,
  onCancel,
  t,
  plantUnits,
  selectedUnit,
  readOnly = false,
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
          newErrors[name] = t.error_time_required || 'Time is required';
        } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
          newErrors[name] = t.error_invalid_time_format || 'Invalid time format (HH:MM)';
        } else {
          delete newErrors[name];
        }
        break;
      case 'unit':
        if (!value) {
          newErrors.unit = t.error_unit_required || 'Unit is required';
        } else {
          delete newErrors.unit;
        }
        break;
      case 'pic':
        if (!value) {
          newErrors.pic = t.error_pic_required || 'PIC is required';
        } else {
          delete newErrors.pic;
        }
        break;
      case 'problem':
        if (!value.trim()) {
          newErrors.problem = t.error_problem_required || 'Problem description is required';
        } else if (value.trim().length < 10) {
          newErrors.problem =
            t.error_problem_min_length || 'Problem description must be at least 10 characters';
        } else {
          delete newErrors.problem;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (name: string, value: string) => {
    // Use HH:MM format directly for time values
    if (name === 'start_time' || name === 'end_time') {
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
          end_time:
            t.error_end_time_before_start || 'End time must be after or equal to start time',
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
      alert(
        t.error_no_plant_units || 'No plant units available. Please configure plant units first.'
      );
      return;
    }

    if (picSettings.length === 0) {
      alert(
        t.error_no_pic_settings || 'No PIC settings available. Please configure PIC settings first.'
      );
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
    <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/40">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Time Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-[#E95420] rounded-full"></div>
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              {t.time_period || 'Time Period'}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <EnhancedInput
              type="time"
              label={t.start_time}
              required
              value={formatTimeForInput(formData.start_time)}
              onChange={(val) => handleInputChange('start_time', val)}
              error={isFieldInvalid('start_time') ? errors.start_time : undefined}
              className="bg-white/50"
              readOnly={readOnly}
            />

            <EnhancedInput
              type="time"
              label={t.end_time}
              required
              value={formatTimeForInput(formData.end_time)}
              onChange={(val) => handleInputChange('end_time', val)}
              error={isFieldInvalid('end_time') ? errors.end_time : undefined}
              className="bg-white/50"
              readOnly={readOnly}
            />
          </div>
        </div>

        {/* Assignment Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-[#772953] rounded-full"></div>
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              {t.assignment || 'Assignment'}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <EnhancedInput
              type="text"
              label={t.unit}
              required
              value={formData.unit}
              readOnly={true}
              onChange={() => {}} // ReadOnly
              className="bg-slate-100/50"
            />

            <div className="space-y-2">
              <label htmlFor="pic" className="block text-sm font-medium text-slate-700">
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
                  className={`w-full px-4 py-3 bg-white/50 border rounded-xl shadow-sm text-slate-900 focus:outline-none focus:ring-2 appearance-none transition-all duration-200 ${
                    isFieldInvalid('pic')
                      ? 'border-orange-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-slate-300 focus:ring-[#772953] focus:border-[#772953] hover:border-[#E95420]'
                  }`}
                  disabled={picSettings.length === 0 || readOnly}
                >
                  {picSettings.length === 0 ? (
                    <option value="">{t.no_pic_available || 'No PIC available'}</option>
                  ) : (
                    <>
                      <option value="">{t.choose_pic || 'Choose PIC'}</option>
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
            <div className="w-2 h-2 bg-[#E95420] rounded-full"></div>
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              {t.details || 'Details'}
            </h4>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="problem" className="block text-sm font-medium text-slate-700">
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
                  placeholder={
                    t.placeholder_problem_description || 'Describe the problem that occurred...'
                  }
                  className={`w-full px-4 py-3 bg-white/50 border rounded-xl shadow-sm text-slate-900 focus:outline-none focus:ring-2 resize-none transition-all duration-200 ${
                    isFieldInvalid('problem')
                      ? 'border-orange-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-slate-300 focus:ring-[#772953] focus:border-[#772953] hover:border-[#E95420]'
                  }`}
                  disabled={readOnly}
                />
                {isFieldInvalid('problem') && (
                  <div className="absolute -bottom-6 left-0 text-blue-600 text-xs">
                    {errors.problem}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="action" className="block text-sm font-medium text-slate-700">
                  {t.action}
                </label>
                <div className="scale-90 origin-right">
                  <RcaAnalysisButton
                    currentDowntime={formData}
                    onAnalysisComplete={(analysis) => {
                      // Append analysis to action field
                      const newAction = formData.action
                        ? `${formData.action}\n\n[AI Analysis]\n${analysis}`
                        : `[AI Analysis]\n${analysis}`;
                      handleInputChange('action', newAction);
                    }}
                    disabled={readOnly}
                  />
                </div>
              </div>
              <textarea
                name="action"
                id="action"
                value={formData.action}
                onChange={handleChange}
                rows={6}
                placeholder={
                  t.placeholder_action_description ||
                  "Describe the actions taken or click 'AI RCA' for suggestions..."
                }
                className="w-full px-4 py-3 bg-white/50 border border-slate-300 rounded-xl shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#772953] focus:border-[#772953] hover:border-[#E95420] resize-none transition-all duration-200 font-mono text-sm"
                disabled={readOnly}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-row justify-end space-x-3 pt-6 border-t border-slate-200">
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
          {!readOnly && (
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
          )}
        </div>
      </form>
    </div>
  );
};

export default CcrDowntimeForm;
