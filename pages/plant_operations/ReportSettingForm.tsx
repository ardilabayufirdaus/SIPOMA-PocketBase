import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReportSetting, ParameterSetting, ParameterDataType } from '../../types';
import { FileText, AlertCircle, CheckCircle, Filter } from 'lucide-react';

// Import Enhanced Components
import { EnhancedButton } from '../../components/ui/EnhancedComponents';

interface FormProps {
  recordToEdit: ReportSetting | null;
  onSave: (record: ReportSetting | Omit<ReportSetting, 'id'>) => void;
  onCancel: () => void;
  t: Record<string, string>;
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
      } catch {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-lg overflow-hidden"
    >
      {/* Header with title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4"
      >
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-white" />
          <h2 className="text-xl font-semibold text-white">
            {t.report_settings_title || 'Report Settings'}
          </h2>
        </div>
        <p className="text-green-100 text-sm mt-1">
          {t.report_settings_description ||
            'Configure report parameter ordering and display settings'}
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} noValidate className="p-6">
        {/* Filter Info */}
        <AnimatePresence>
          {selectedCategory && selectedUnit && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Filter Applied</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Showing parameters for <strong>{selectedCategory}</strong> -{' '}
                <strong>{selectedUnit}</strong>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="space-y-6"
        >
          {/* Parameter Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <label htmlFor="parameter_id" className="block text-sm font-medium text-slate-700 mb-2">
              {t.parameter_select_label}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <motion.select
              whileFocus={{ scale: 1.02 }}
              name="parameter_id"
              id="parameter_id"
              value={formData.parameter_id}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              disabled={availableParameters.length === 0 || isSubmitting}
              className={`block w-full pl-3 pr-10 py-3 bg-white border rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500 ${
                errors.parameter_id ? 'border-red-500' : 'border-slate-300'
              }`}
            >
              <option value="">
                {availableParameters.length === 0
                  ? 'No parameters available'
                  : 'Select a parameter...'}
              </option>
              {availableParameters.map((param) => (
                <motion.option
                  key={param.id}
                  value={param.id}
                  whileHover={{ backgroundColor: '#f0fdf4' }}
                  className="py-2"
                >
                  {param.parameter} - {param.category} ({param.unit})
                </motion.option>
              ))}
            </motion.select>

            <AnimatePresence>
              {availableParameters.length === 0 && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 text-sm text-amber-600 flex items-center"
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  No numeric parameters available for the selected category and unit. Please
                  configure parameters in Master Data first.
                </motion.p>
              )}
              {errors.parameter_id && touched.parameter_id && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 text-sm text-red-600 flex items-center"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.parameter_id}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Category Input */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
              {t.report_category_label}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="text"
              name="category"
              id="category"
              value={formData.category}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              disabled={isSubmitting}
              placeholder="Enter category name..."
              className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500 ${
                errors.category ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            <AnimatePresence>
              {errors.category && touched.category && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 text-sm text-red-600 flex items-center"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.category}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0 pt-6 border-t border-slate-200"
        >
          <AnimatePresence>
            {isSubmitting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full"
                />
                <span className="text-sm font-medium">
                  {recordToEdit ? 'Updating report settings...' : 'Adding parameter...'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex space-x-3">
            <EnhancedButton
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2"
            >
              {t.cancel_button}
            </EnhancedButton>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <EnhancedButton
                type="submit"
                variant="primary"
                disabled={
                  isSubmitting ||
                  (availableParameters.length === 0 && !recordToEdit) ||
                  !formData.parameter_id ||
                  !formData.category.trim()
                }
                className="px-6 py-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {recordToEdit ? t.save_button : 'Add Parameter'}
              </EnhancedButton>
            </motion.div>
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default ReportSettingForm;
