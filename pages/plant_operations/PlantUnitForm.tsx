import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlantUnit } from '../../types';
import { Building2, Tag, CheckCircle, AlertCircle } from 'lucide-react';

// Import Enhanced Components
import {
  EnhancedButton,
  EnhancedInput,
  useAccessibility,
  useReducedMotion,
} from '../../components/ui/EnhancedComponents';

interface FormProps {
  recordToEdit: PlantUnit | null;
  onSave: (record: PlantUnit | Omit<PlantUnit, 'id'>) => void;
  onCancel: () => void;
  t: Record<string, string>;
}

interface FormErrors {
  unit?: string;
  category?: string;
}

const PlantUnitForm: React.FC<FormProps> = ({ recordToEdit, onSave, onCancel, t }) => {
  // Enhanced accessibility hooks
  const { announceToScreenReader } = useAccessibility();
  const prefersReducedMotion = useReducedMotion();

  const [formData, setFormData] = useState({
    unit: '',
    category: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ unit: boolean; category: boolean }>({
    unit: false,
    category: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        unit: recordToEdit.unit,
        category: recordToEdit.category,
      });
    } else {
      setFormData({
        unit: '',
        category: '',
      });
    }
    // Reset form state when record changes
    setErrors({});
    setTouched({ unit: false, category: false });
    setIsSubmitting(false);
    setShowSuccess(false);
  }, [recordToEdit]);

  const validateField = (name: keyof typeof formData, value: string): string => {
    if (!value.trim()) {
      return t[`${name}_required`] || `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }

    if (name === 'unit' && value.length < 2) {
      return t.unit_min_length || 'Unit must be at least 2 characters';
    }

    if (name === 'category' && value.length < 3) {
      return t.category_min_length || 'Category must be at least 3 characters';
    }

    // Check for special characters that might cause issues
    const specialCharsRegex = /[<>"'&]/;
    if (specialCharsRegex.test(value)) {
      return t.invalid_characters || 'Invalid characters detected';
    }

    return '';
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(formData).forEach((key) => {
      const fieldKey = key as keyof typeof formData;
      const error = validateField(fieldKey, formData[fieldKey]);
      if (error) {
        newErrors[fieldKey] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (field: keyof typeof formData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Mark all fields as touched
    setTouched({ unit: true, category: true });

    if (!validateForm()) {
      setIsSubmitting(false);
      announceToScreenReader('Form has validation errors. Please correct them and try again.');
      return;
    }

    try {
      if (recordToEdit) {
        onSave({ ...recordToEdit, ...formData });
      } else {
        onSave(formData);
      }

      setShowSuccess(true);
      announceToScreenReader('Plant unit saved successfully');

      // Reset success message after animation
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      // Error will be handled by parent component or global error boundary
      announceToScreenReader('Error saving plant unit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
        staggerChildren: 0.1,
      },
    },
  };

  const fieldVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.2 },
    },
  };

  const successVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 20,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="relative"
      variants={formVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            variants={successVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3"
            role="alert"
            aria-live="polite"
          >
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="text-green-800 dark:text-green-200 font-medium">
              {t.save_success || 'Plant unit saved successfully!'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Unit Field */}
        <motion.div variants={fieldVariants}>
          <EnhancedInput
            label={t.unit_label || 'Unit Name'}
            value={formData.unit}
            onChange={handleChange('unit')}
            placeholder={t.unit_placeholder || 'Enter unit name (e.g., 220, 320)'}
            error={touched.unit ? errors.unit : undefined}
            required
            icon={<Tag className="w-4 h-4" />}
            iconPosition="left"
            size="md"
            variant="default"
            fullWidth
            autoComplete="off"
            ariaLabel={t.unit_label || 'Unit Name'}
            ariaDescribedBy={errors.unit ? 'unit-error' : undefined}
            maxLength={50}
          />
          {errors.unit && touched.unit && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
              id="unit-error"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.unit}
            </motion.div>
          )}
        </motion.div>

        {/* Category Field */}
        <motion.div variants={fieldVariants}>
          <EnhancedInput
            label={t.plant_category_label || 'Plant Category'}
            value={formData.category}
            onChange={handleChange('category')}
            placeholder={
              t.category_placeholder || 'Enter plant category (e.g., Cement Mill, Raw Mill)'
            }
            error={touched.category ? errors.category : undefined}
            required
            icon={<Building2 className="w-4 h-4" />}
            iconPosition="left"
            size="md"
            variant="default"
            fullWidth
            autoComplete="off"
            ariaLabel={t.plant_category_label || 'Plant Category'}
            ariaDescribedBy={errors.category ? 'category-error' : undefined}
            maxLength={100}
          />
          {errors.category && touched.category && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
              id="category-error"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.category}
            </motion.div>
          )}
        </motion.div>

        {/* Helper Text */}
        <motion.div
          variants={fieldVariants}
          className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                {t.form_help_title || 'Plant Unit Guidelines'}
              </p>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• {t.unit_help || 'Unit should be unique within its category'}</li>
                <li>• {t.category_help || 'Category groups related production units'}</li>
                <li>• {t.naming_help || 'Use clear, descriptive names for easy identification'}</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Form Actions */}
      <motion.div
        variants={fieldVariants}
        className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg border-t border-gray-200 dark:border-gray-700"
      >
        <EnhancedButton
          type="submit"
          variant="primary"
          className="sm:ml-3 sm:w-auto"
          disabled={isSubmitting}
          aria-label={
            recordToEdit
              ? t.update_button || 'Update plant unit'
              : t.save_button || 'Save plant unit'
          }
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
            />
          ) : null}
          {isSubmitting
            ? t.saving || 'Saving...'
            : recordToEdit
              ? t.update_button || 'Update'
              : t.save_button || 'Save'}
        </EnhancedButton>

        <EnhancedButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
          className="mt-3 sm:mt-0 sm:ml-3 sm:w-auto"
          aria-label={t.cancel_button || 'Cancel'}
        >
          {t.cancel_button || 'Cancel'}
        </EnhancedButton>
      </motion.div>
    </motion.form>
  );
};

export default PlantUnitForm;

