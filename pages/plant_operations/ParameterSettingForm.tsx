import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { ParameterSetting, ParameterDataType } from '../../types';
import { Settings, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useReducedMotion,
} from '../../components/ui/EnhancedComponents';

interface FormProps {
  recordToEdit: ParameterSetting | null;
  onSave: (record: ParameterSetting | Omit<ParameterSetting, 'id'>) => void;
  onCancel: () => void;
  t: Record<string, string>;
}

const ParameterSettingForm: React.FC<FormProps> = ({ recordToEdit, onSave, onCancel, t }) => {
  // Enhanced accessibility hooks
  const announceToScreenReader = useAccessibility();
  const prefersReducedMotion = useReducedMotion();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    parameter: '',
    data_type: ParameterDataType.NUMBER,
    unit: '',
    category: '',
    min_value: undefined as number | undefined,
    max_value: undefined as number | undefined,
    opc_min_value: undefined as number | undefined,
    opc_max_value: undefined as number | undefined,
    pcc_min_value: undefined as number | undefined,
    pcc_max_value: undefined as number | undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validasi field
  const validateField = (name: string, value: string | number | undefined): string => {
    switch (name) {
      case 'parameter':
        if (!value || typeof value !== 'string' || !value.trim()) return 'Parameter wajib diisi';
        if (value.length < 2) return 'Minimal 2 karakter';
        return '';
      case 'unit':
        if (!value || typeof value !== 'string' || !value.trim()) return 'Unit wajib diisi';
        return '';
      case 'category':
        if (!value || typeof value !== 'string' || !value.trim()) return 'Kategori wajib diisi';
        return '';
      case 'min_value':
        // Allow empty values (undefined/null), only validate if both values exist
        if (
          value !== undefined &&
          value !== null &&
          typeof value === 'number' &&
          formData.max_value !== undefined &&
          formData.max_value !== null &&
          value > formData.max_value
        )
          return 'Min tidak boleh lebih dari Max';
        return '';
      case 'max_value':
        // Allow empty values (undefined/null), only validate if both values exist
        if (
          value !== undefined &&
          value !== null &&
          typeof value === 'number' &&
          formData.min_value !== undefined &&
          formData.min_value !== null &&
          value < formData.min_value
        )
          return 'Max tidak boleh kurang dari Min';
        return '';
      case 'opc_min_value':
        // Allow empty values (undefined/null), only validate if both values exist
        if (
          value !== undefined &&
          value !== null &&
          typeof value === 'number' &&
          formData.opc_max_value !== undefined &&
          formData.opc_max_value !== null &&
          value > formData.opc_max_value
        )
          return 'OPC Min tidak boleh lebih dari OPC Max';
        return '';
      case 'opc_max_value':
        // Allow empty values (undefined/null), only validate if both values exist
        if (
          value !== undefined &&
          value !== null &&
          typeof value === 'number' &&
          formData.opc_min_value !== undefined &&
          formData.opc_min_value !== null &&
          value < formData.opc_min_value
        )
          return 'OPC Max tidak boleh kurang dari OPC Min';
        return '';
      case 'pcc_min_value':
        // Allow empty values (undefined/null), only validate if both values exist
        if (
          value !== undefined &&
          value !== null &&
          typeof value === 'number' &&
          formData.pcc_max_value !== undefined &&
          formData.pcc_max_value !== null &&
          value > formData.pcc_max_value
        )
          return 'PCC Min tidak boleh lebih dari PCC Max';
        return '';
      case 'pcc_max_value':
        // Allow empty values (undefined/null), only validate if both values exist
        if (
          value !== undefined &&
          value !== null &&
          typeof value === 'number' &&
          formData.pcc_min_value !== undefined &&
          formData.pcc_min_value !== null &&
          value < formData.pcc_min_value
        )
          return 'PCC Max tidak boleh kurang dari PCC Min';
        return '';
      default:
        return '';
    }
  };

  // Validasi sebelum submit
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const value = (formData as Record<string, string | number | undefined>)[key];
      const err = validateField(key, value);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const processedValue =
      type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value;
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
    setTouched((prev: Record<string, boolean>) => ({ ...prev, [name]: true }));
    // Pass the processed value to validateField, not the raw string value
    setErrors((prev: Record<string, string>) => ({
      ...prev,
      [name]: validateField(name, processedValue),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      // Focus ke field error pertama
      const firstErrorKey = Object.keys(errors)[0];
      if (formRef.current && firstErrorKey) {
        const el = formRef.current.querySelector(`[name='${firstErrorKey}']`);
        if (el) (el as HTMLElement).focus();
      }
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      if (recordToEdit) {
        onSave({ ...recordToEdit, ...formData });
      } else {
        onSave(formData);
      }
      setIsSubmitting(false);
    }, 1000); // simulasi loading
  };

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        parameter: recordToEdit.parameter,
        data_type: recordToEdit.data_type,
        unit: recordToEdit.unit,
        category: recordToEdit.category,
        min_value: recordToEdit.min_value ?? undefined,
        max_value: recordToEdit.max_value ?? undefined,
        opc_min_value: recordToEdit.opc_min_value ?? undefined,
        opc_max_value: recordToEdit.opc_max_value ?? undefined,
        pcc_min_value: recordToEdit.pcc_min_value ?? undefined,
        pcc_max_value: recordToEdit.pcc_max_value ?? undefined,
      });
    } else {
      setFormData({
        parameter: '',
        data_type: ParameterDataType.NUMBER,
        unit: '',
        category: '',
        min_value: undefined,
        max_value: undefined,
        opc_min_value: undefined,
        opc_max_value: undefined,
        pcc_min_value: undefined,
        pcc_max_value: undefined,
      });
    }
  }, [recordToEdit]);

  const { records: plantUnits, loading: plantUnitsLoading } = usePlantUnits();

  // Get unique units and categories from plantUnits
  const unitOptions = Array.from(new Set(plantUnits.map((u) => u.unit)));
  const categoryOptions = Array.from(new Set(plantUnits.map((u) => u.category)));
  const handleInputChange = (name: string) => (value: string) => {
    const processedValue = name.includes('value')
      ? value === ''
        ? undefined
        : parseFloat(value)
      : value;
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
    setTouched((prev: Record<string, boolean>) => ({ ...prev, [name]: true }));
    setErrors((prev: Record<string, string>) => ({
      ...prev,
      [name]: validateField(name, processedValue),
    }));
  };

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
        className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4"
      >
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-white" />
          <h2 className="text-xl font-semibold text-white">
            {t.parameter_setting_title || 'Parameter Setting'}
          </h2>
        </div>
        <p className="text-red-100 text-sm mt-1">
          {t.parameter_setting_description || 'Configure parameter settings for plant operations'}
        </p>
      </motion.div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        aria-label="Parameter Setting Form"
        className="p-6"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6"
        >
          {/* Parameter Name */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="sm:col-span-2"
          >
            <div className="space-y-2">
              <label htmlFor="parameter" className="block text-sm font-medium text-slate-700">
                {t.parameter_label}
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="text"
                name="parameter"
                id="parameter"
                value={formData.parameter}
                onChange={handleChange}
                required
                aria-invalid={!!errors.parameter}
                aria-describedby={errors.parameter ? 'parameter-error' : undefined}
                placeholder={t.parameter_placeholder || 'Enter parameter name'}
                className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 sm:text-sm ${
                  errors.parameter ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              <AnimatePresence>
                {errors.parameter && touched.parameter && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    id="parameter-error"
                    className="text-sm text-red-600 flex items-center"
                    role="alert"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.parameter}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Data Type */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <label htmlFor="data_type" className="block text-sm font-medium text-slate-700 mb-2">
              {t.data_type_label}
            </label>
            <motion.select
              whileFocus={{ scale: 1.02 }}
              name="data_type"
              id="data_type"
              value={formData.data_type}
              onChange={handleChange}
              className="block w-full pl-3 pr-10 py-3 bg-white border border-slate-300 rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 sm:text-sm"
            >
              {Object.values(ParameterDataType).map((type) => (
                <motion.option
                  key={type}
                  value={type}
                  whileHover={{ backgroundColor: '#fee2e2' }}
                  className="py-2"
                >
                  {type}
                </motion.option>
              ))}
            </motion.select>
          </motion.div>

          {/* Unit */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <label htmlFor="unit" className="block text-sm font-medium text-slate-700 mb-2">
              {t.unit_label_param}
            </label>
            <motion.select
              whileFocus={{ scale: 1.02 }}
              name="unit"
              id="unit"
              value={formData.unit}
              onChange={handleChange}
              required
              className={`block w-full pl-3 pr-10 py-3 bg-white border rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 sm:text-sm ${
                errors.unit ? 'border-red-500' : 'border-slate-300'
              }`}
            >
              <option value="" disabled>
                {plantUnitsLoading ? t.loading : t.select_unit}
              </option>
              {unitOptions.map((unit) => (
                <motion.option
                  key={unit}
                  value={unit}
                  whileHover={{ backgroundColor: '#fee2e2' }}
                  className="py-2"
                >
                  {unit}
                </motion.option>
              ))}
            </motion.select>
            <AnimatePresence>
              {errors.unit && touched.unit && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  id="unit-error"
                  className="mt-2 text-sm text-red-600 flex items-center"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.unit}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="sm:col-span-2"
          >
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
              {t.category_label}
            </label>
            <motion.select
              whileFocus={{ scale: 1.02 }}
              name="category"
              id="category"
              value={formData.category}
              onChange={handleChange}
              required
              className={`block w-full pl-3 pr-10 py-3 bg-white border rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 sm:text-sm ${
                errors.category ? 'border-red-500' : 'border-slate-300'
              }`}
            >
              <option value="" disabled>
                {plantUnitsLoading ? t.loading : t.select_category}
              </option>
              {categoryOptions.map((category) => (
                <motion.option
                  key={category}
                  value={category}
                  whileHover={{ backgroundColor: '#fee2e2' }}
                  className="py-2"
                >
                  {category}
                </motion.option>
              ))}
            </motion.select>
            <AnimatePresence>
              {errors.category && touched.category && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  id="category-error"
                  className="mt-2 text-sm text-red-600 flex items-center"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.category}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Number-specific fields */}
          <AnimatePresence>
            {formData.data_type === ParameterDataType.NUMBER && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="sm:col-span-2 space-y-6"
              >
                {/* Basic Range Settings */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                  className="bg-slate-50 rounded-lg p-4"
                >
                  <h4 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-red-600" />
                    {t.basic_range_title || 'Basic Range Settings'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="min_value"
                        className="block text-sm font-medium text-slate-700"
                      >
                        {t.min_value_label}
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        type="number"
                        name="min_value"
                        id="min_value"
                        value={formData.min_value?.toString() || ''}
                        onChange={handleChange}
                        placeholder="0"
                        className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 sm:text-sm ${
                          errors.min_value ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      <AnimatePresence>
                        {errors.min_value && touched.min_value && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-sm text-red-600 flex items-center"
                            role="alert"
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.min_value}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="max_value"
                        className="block text-sm font-medium text-slate-700"
                      >
                        {t.max_value_label}
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        type="number"
                        name="max_value"
                        id="max_value"
                        value={formData.max_value?.toString() || ''}
                        onChange={handleChange}
                        placeholder="100"
                        className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 sm:text-sm ${
                          errors.max_value ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      <AnimatePresence>
                        {errors.max_value && touched.max_value && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-sm text-red-600 flex items-center"
                            role="alert"
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.max_value}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>

                {/* OPC Cement Settings */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                  className="bg-blue-50 rounded-lg p-4"
                >
                  <h4 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                    OPC Cement Settings
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="opc_min_value"
                        className="block text-sm font-medium text-slate-700"
                      >
                        OPC Min Value
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        type="number"
                        name="opc_min_value"
                        id="opc_min_value"
                        value={formData.opc_min_value?.toString() || ''}
                        onChange={handleChange}
                        placeholder="0"
                        className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 sm:text-sm ${
                          errors.opc_min_value ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      <AnimatePresence>
                        {errors.opc_min_value && touched.opc_min_value && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-sm text-red-600 flex items-center"
                            role="alert"
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.opc_min_value}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="opc_max_value"
                        className="block text-sm font-medium text-slate-700"
                      >
                        OPC Max Value
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        type="number"
                        name="opc_max_value"
                        id="opc_max_value"
                        value={formData.opc_max_value?.toString() || ''}
                        onChange={handleChange}
                        placeholder="100"
                        className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 sm:text-sm ${
                          errors.opc_max_value ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      <AnimatePresence>
                        {errors.opc_max_value && touched.opc_max_value && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-sm text-red-600 flex items-center"
                            role="alert"
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.opc_max_value}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>

                {/* PCC Cement Settings */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.3 }}
                  className="bg-green-50 rounded-lg p-4"
                >
                  <h4 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                    PCC Cement Settings
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="pcc_min_value"
                        className="block text-sm font-medium text-slate-700"
                      >
                        PCC Min Value
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        type="number"
                        name="pcc_min_value"
                        id="pcc_min_value"
                        value={formData.pcc_min_value?.toString() || ''}
                        onChange={handleChange}
                        placeholder="0"
                        className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 sm:text-sm ${
                          errors.pcc_min_value ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      <AnimatePresence>
                        {errors.pcc_min_value && touched.pcc_min_value && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-sm text-red-600 flex items-center"
                            role="alert"
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.pcc_min_value}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="pcc_max_value"
                        className="block text-sm font-medium text-slate-700"
                      >
                        PCC Max Value
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        type="number"
                        name="pcc_max_value"
                        id="pcc_max_value"
                        value={formData.pcc_max_value?.toString() || ''}
                        onChange={handleChange}
                        placeholder="100"
                        className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 sm:text-sm ${
                          errors.pcc_max_value ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      <AnimatePresence>
                        {errors.pcc_max_value && touched.pcc_max_value && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-sm text-red-600 flex items-center"
                            role="alert"
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.pcc_max_value}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0 pt-6 border-t border-slate-200"
        >
          <AnimatePresence>
            {isSubmitting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center space-x-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"
                />
                <span className="text-sm font-medium">Saving parameter settings...</span>
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
                disabled={isSubmitting}
                className="px-6 py-2 bg-red-600 hover:bg-red-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {t.save_button}
              </EnhancedButton>
            </motion.div>
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default ParameterSettingForm;
