import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ReportSetting, ParameterSetting, ParameterDataType } from '../../types';

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from '../../components/ui/EnhancedComponents';

interface FormProps {
  recordToEdit: ReportSetting | null;
  onSave: (record: ReportSetting | Omit<ReportSetting, 'id'>) => void;
  onCancel: () => void;
  t: any;
  allParameters: ParameterSetting[];
  existingParameterIds: string[];
  selectedCategory?: string;
  selectedUnit?: string;
  maxOrder: number;
}

interface FormData {
  parameter_id: string;
  category: string;
  order: number;
}

interface ValidationErrors {
  parameter_id?: string;
  category?: string;
}

const ReportSettingForm: React.FC<FormProps> = ({
  recordToEdit,
  onSave,
  onCancel,
  t,
  allParameters,
  existingParameterIds,
  selectedCategory,
  selectedUnit,
  maxOrder,
}) => {
  // Enhanced accessibility hooks
  const announceToScreenReader = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  // State management
  const [formData, setFormData] = useState<FormData>({
    parameter_id: '',
    category: '',
    order: maxOrder,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // Available parameters calculation with memoization
  const availableParameters = useMemo(() => {
    return (
      allParameters
        // FIX: Use snake_case for data_type
        .filter((p) => p.data_type === ParameterDataType.NUMBER)
        // Filter by selected category and unit (if provided)
        .filter((p) => {
          const categoryMatch = !selectedCategory || p.category === selectedCategory;
          const unitMatch = !selectedUnit || p.unit === selectedUnit;
          return categoryMatch && unitMatch;
        })
        // FIX: Use snake_case for parameter_id
        .filter((p) => !existingParameterIds.includes(p.id) || p.id === recordToEdit?.parameter_id)
    );
  }, [
    allParameters,
    selectedCategory,
    selectedUnit,
    existingParameterIds,
    recordToEdit?.parameter_id,
  ]);

  // Validation functions
  const validateField = useCallback(
    (name: keyof FormData, value: string | number): string => {
      switch (name) {
        case 'parameter_id':
          if (!value) return 'Parameter is required';
          if (!availableParameters.find((p) => p.id === value))
            return 'Selected parameter is not available';
          return '';
        case 'category': {
          if (!value) return 'Category is required';
          const strValue = String(value);
          if (strValue.trim().length < 2) return 'Category must be at least 2 characters';
          if (strValue.trim().length > 50) return 'Category must be less than 50 characters';
          return '';
        }
        case 'order':
          // Order is auto-managed, no validation needed
          return '';
        default:
          return '';
      }
    },
    [availableParameters]
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    (Object.keys(formData) as (keyof FormData)[]).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  useEffect(() => {
    // Reset user interaction flag when modal opens
    setIsUserInteracting(false);

    if (recordToEdit) {
      setFormData({
        // FIX: Use snake_case for parameter_id
        parameter_id: recordToEdit.parameter_id,
        category: recordToEdit.category,
        order: recordToEdit.order,
      });
      setErrors({});
      setTouched({});
    } else {
      // Only set default parameter if current parameter_id is empty or invalid
      setFormData((prev) => {
        const currentParameterId = prev.parameter_id;
        const isCurrentValid = availableParameters.some((p) => p.id === currentParameterId);

        return {
          parameter_id: isCurrentValid ? currentParameterId : availableParameters[0]?.id || '',
          category: prev.category || '',
          order: prev.order,
        };
      });
      setErrors({});
      setTouched({});
    }
  }, [recordToEdit]);

  // Separate useEffect to handle availableParameters changes without resetting user selection
  useEffect(() => {
    if (!recordToEdit && !isUserInteracting && availableParameters.length > 0) {
      setFormData((prev) => {
        const currentParameterId = prev.parameter_id;
        const isCurrentValid = availableParameters.some((p) => p.id === currentParameterId);

        // Only change parameter_id if current selection is invalid AND we have available parameters
        if (!isCurrentValid) {
          return {
            ...prev,
            parameter_id: availableParameters[0].id,
          };
        }

        return prev;
      });
    }
  }, [availableParameters.length]); // Only depend on length to prevent infinite loops

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      const fieldName = name as keyof FormData;

      // Mark as user interacting to prevent automatic resets
      setIsUserInteracting(true);

      setFormData((prev) => ({ ...prev, [name]: value }));

      // Clear error when user starts typing
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      const fieldName = name as keyof FormData;

      setTouched((prev) => ({ ...prev, [name]: true }));

      // Validate field on blur
      const error = validateField(fieldName, value);
      if (error) {
        setErrors((prev) => ({ ...prev, [fieldName]: error }));
      }
    },
    [validateField]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (isSubmitting) return;

      // Mark all fields as touched
      setTouched({
        parameter_id: true,
        category: true,
      });

      if (!validateForm()) {
        return;
      }

      if (!formData.parameter_id) {
        // Handle case where no parameters are available to be selected
        onCancel();
        return;
      }

      setIsSubmitting(true);

      try {
        if (recordToEdit) {
          await onSave({ ...recordToEdit, ...formData });
        } else {
          await onSave(formData);
        }
      } catch (error) {
        console.error('Error saving report setting:', error);
        // Add user-friendly error feedback
        setErrors({
          parameter_id: 'Failed to save report setting. Please try again.',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, recordToEdit, onSave, onCancel, isSubmitting, validateForm]
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="p-6 space-y-4">
        {selectedCategory && selectedUnit && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-3 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Filter Applied:</strong> Showing parameters for {selectedCategory} -{' '}
              {selectedUnit}
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="parameter_id"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t.parameter_select_label}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            name="parameter_id"
            id="parameter_id"
            value={formData.parameter_id}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            disabled={availableParameters.length === 0 || isSubmitting}
            aria-describedby={errors.parameter_id ? 'parameter_id-error' : undefined}
            aria-invalid={!!errors.parameter_id}
            className={`mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-800 text-base border text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed ${
              errors.parameter_id
                ? 'border-red-500 dark:border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            <option value="">
              {availableParameters.length === 0
                ? 'No parameters available'
                : 'Select a parameter...'}
            </option>
            {availableParameters.map((param) => (
              <option key={param.id} value={param.id}>
                {param.parameter} - {param.category} ({param.unit})
              </option>
            ))}
          </select>
          {availableParameters.length === 0 && (
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
              No numeric parameters available for the selected category and unit. Please configure
              parameters in Master Data first.
            </p>
          )}
          {errors.parameter_id && touched.parameter_id && (
            <p
              id="parameter_id-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.parameter_id}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t.report_category_label}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            name="category"
            id="category"
            value={formData.category}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            disabled={isSubmitting}
            aria-describedby={errors.category ? 'category-error' : undefined}
            aria-invalid={!!errors.category}
            placeholder="Enter category name..."
            className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md shadow-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed ${
              errors.category
                ? 'border-red-500 dark:border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.category && touched.category && (
            <p
              id="category-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.category}
            </p>
          )}
        </div>
      </div>
      <div className="bg-slate-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg border-t border-slate-200 dark:border-slate-600">
        <EnhancedButton
          type="submit"
          variant="primary"
          disabled={
            isSubmitting ||
            (availableParameters.length === 0 && !recordToEdit) ||
            !formData.parameter_id ||
            !formData.category.trim()
          }
          loading={isSubmitting}
          loadingText={recordToEdit ? 'Updating...' : 'Saving...'}
          className="sm:ml-3 sm:w-auto"
          aria-label={recordToEdit ? t.save_button || 'Update report setting' : 'Add parameter'}
        >
          {recordToEdit ? t.save_button : 'Add Parameter'}
        </EnhancedButton>
        <EnhancedButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
          className="mt-3 sm:mt-0 sm:ml-3 sm:w-auto"
          aria-label={t.cancel_button || 'Cancel'}
        >
          {t.cancel_button}
        </EnhancedButton>
      </div>
    </form>
  );
};

export default ReportSettingForm;
