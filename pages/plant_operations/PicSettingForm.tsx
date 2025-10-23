import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PicSetting } from '../../types';
import { User, CheckCircle, AlertCircle } from 'lucide-react';

// Import Enhanced Components
import {
  EnhancedButton,
  EnhancedInput,
  useAccessibility,
  useReducedMotion,
} from '../../components/ui/EnhancedComponents';

interface FormProps {
  recordToEdit: PicSetting | null;
  onSave: (record: PicSetting | Omit<PicSetting, 'id'>) => void;
  onCancel: () => void;
  t: Record<string, string>;
}

interface FormErrors {
  pic?: string;
}

const PicSettingForm: React.FC<FormProps> = ({ recordToEdit, onSave, onCancel, t }) => {
  // Enhanced accessibility hooks
  const { announceToScreenReader } = useAccessibility();
  const prefersReducedMotion = useReducedMotion();

  const [formData, setFormData] = useState({
    pic: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ pic: boolean }>({
    pic: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (recordToEdit) {
      setFormData({ pic: recordToEdit.pic });
    } else {
      setFormData({ pic: '' });
    }
    // Reset form state when record changes
    setErrors({});
    setTouched({ pic: false });
    setIsSubmitting(false);
    setShowSuccess(false);
  }, [recordToEdit]);

  const validateField = (name: keyof typeof formData, value: string): string => {
    if (!value.trim()) {
      return t[`${name}_required`] || `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }

    if (name === 'pic' && value.length < 2) {
      return t.pic_min_length || 'PIC must be at least 2 characters';
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
    setTouched({ pic: true });

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
      announceToScreenReader('PIC setting saved successfully');

      // Reset success message after animation
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      // Error will be handled by parent component or global error boundary
      announceToScreenReader('Error saving PIC setting. Please try again.');
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
              {t.save_success || 'PIC setting saved successfully!'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* PIC Field */}
        <motion.div variants={fieldVariants}>
          <EnhancedInput
            label={t.pic_label || 'PIC Name'}
            value={formData.pic}
            onChange={handleChange('pic')}
            placeholder={t.pic_placeholder || 'Enter PIC name (e.g., John Doe, Team A)'}
            error={touched.pic ? errors.pic : undefined}
            required
            icon={<User className="w-4 h-4" />}
            iconPosition="left"
            size="md"
            variant="default"
            fullWidth
            autoComplete="off"
            ariaLabel={t.pic_label || 'PIC Name'}
            ariaDescribedBy={errors.pic ? 'pic-error' : undefined}
            maxLength={100}
          />
          {errors.pic && touched.pic && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
              id="pic-error"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.pic}
            </motion.div>
          )}
        </motion.div>

        {/* Helper Text */}
        <motion.div
          variants={fieldVariants}
          className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                {t.form_help_title || 'PIC Setting Guidelines'}
              </p>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• {t.pic_help || 'PIC should be a valid person or team name'}</li>
                <li>• {t.responsibility_help || 'PIC is responsible for the assigned tasks'}</li>
                <li>• {t.naming_help || 'Use clear, identifiable names for accountability'}</li>
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
              ? t.update_button || 'Update PIC setting'
              : t.save_button || 'Save PIC setting'
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

export default PicSettingForm;

