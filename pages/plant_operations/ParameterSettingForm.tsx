import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { PlantUnit, ParameterSetting, ParameterDataType } from '../../types';
import { Settings, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';

// Import Enhanced Components
import { EnhancedButton } from '../../components/ui/EnhancedComponents';

interface FormProps {
  recordToEdit: ParameterSetting | null;
  onSave: (record: ParameterSetting | Omit<ParameterSetting, 'id'>) => void;
  onCancel: () => void;
  t: Record<string, string>;
  plantUnits?: PlantUnit[];
  loading?: boolean;
  hideCementSettings?: boolean;
}

const ParameterSettingForm: React.FC<FormProps> = ({
  recordToEdit,
  onSave,
  onCancel,
  t,
  plantUnits: providedPlantUnits,
  loading: providedLoading,
  hideCementSettings = false,
}) => {
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
    is_oee_feeder: false,
    is_oee_quality: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validasi field
  const validateField = (name: string, value: any): string => {
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
        if (hideCementSettings) return '';
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
        if (hideCementSettings) return '';
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
        if (hideCementSettings) return '';
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
        if (hideCementSettings) return '';
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const value = (formData as Record<string, any>)[key];
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
    setErrors((prev: Record<string, string>) => ({
      ...prev,
      [name]: validateField(name, processedValue),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
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
    }, 1000);
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
        is_oee_feeder: recordToEdit.is_oee_feeder ?? false,
        is_oee_quality: recordToEdit.is_oee_quality ?? false,
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
        is_oee_feeder: false,
        is_oee_quality: false,
      });
    }
  }, [recordToEdit]);

  const { records: hookPlantUnits, loading: hookPlantUnitsLoading } = usePlantUnits();
  const plantUnits = providedPlantUnits || hookPlantUnits;
  const plantUnitsLoading = providedLoading !== undefined ? providedLoading : hookPlantUnitsLoading;

  const unitOptions = Array.from(new Set(plantUnits.map((u) => u.unit)));
  const categoryOptions = Array.from(new Set(plantUnits.map((u) => u.category)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-lg overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-gradient-to-r from-[#772953] to-[#2C001E] px-6 py-4"
      >
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-white" />
          <h2 className="text-xl font-semibold text-white">
            {t.parameter_setting_title || 'Parameter Setting'}
          </h2>
        </div>
        <p className="text-white/80 text-sm mt-1">
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
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="sm:col-span-2"
          >
            <div className="space-y-2">
              <label htmlFor="parameter" className="block text-sm font-medium text-[#333333]">
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
                placeholder={t.parameter_placeholder || 'Enter parameter name'}
                className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] transition-all duration-200 sm:text-sm ${
                  errors.parameter ? 'border-[#C7162B]' : 'border-[#AEA79F]/50'
                }`}
              />
              <AnimatePresence>
                {errors.parameter && touched.parameter && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-[#C7162B] flex items-center"
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
            <label htmlFor="data_type" className="block text-sm font-medium text-[#333333] mb-2">
              {t.data_type_label}
            </label>
            <motion.select
              whileFocus={{ scale: 1.02 }}
              name="data_type"
              id="data_type"
              value={formData.data_type}
              onChange={handleChange}
              className="block w-full pl-3 pr-10 py-3 bg-white border border-[#AEA79F]/50 rounded-lg shadow-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] transition-all duration-200 sm:text-sm"
            >
              {Object.values(ParameterDataType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </motion.select>
          </motion.div>

          {/* Unit */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <label htmlFor="unit" className="block text-sm font-medium text-[#333333] mb-2">
              {t.unit_label_param}
            </label>
            <motion.select
              whileFocus={{ scale: 1.02 }}
              name="unit"
              id="unit"
              value={formData.unit}
              onChange={handleChange}
              required
              className={`block w-full pl-3 pr-10 py-3 bg-white border rounded-lg shadow-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] transition-all duration-200 sm:text-sm ${
                errors.unit ? 'border-[#C7162B]' : 'border-[#AEA79F]/50'
              }`}
            >
              <option value="" disabled>
                {plantUnitsLoading ? t.loading : t.select_unit}
              </option>
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </motion.select>
            <AnimatePresence>
              {errors.unit && touched.unit && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 text-sm text-[#C7162B] flex items-center"
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
            <label htmlFor="category" className="block text-sm font-medium text-[#333333] mb-2">
              {t.category_label}
            </label>
            <motion.select
              whileFocus={{ scale: 1.02 }}
              name="category"
              id="category"
              value={formData.category}
              onChange={handleChange}
              required
              className={`block w-full pl-3 pr-10 py-3 bg-white border rounded-lg shadow-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] transition-all duration-200 sm:text-sm ${
                errors.category ? 'border-[#C7162B]' : 'border-[#AEA79F]/50'
              }`}
            >
              <option value="" disabled>
                {plantUnitsLoading ? t.loading : t.select_category}
              </option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </motion.select>
            <AnimatePresence>
              {errors.category && touched.category && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 text-sm text-[#C7162B] flex items-center"
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
                <div className="bg-[#F9F9F9] rounded-lg p-4 border border-[#AEA79F]/20">
                  <h4 className="text-lg font-medium text-[#772953] mb-4 flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-[#E95420]" />
                    {t.basic_range_title || 'Basic Range Settings'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="min_value"
                        className="block text-sm font-medium text-[#333333]"
                      >
                        {t.min_value_label}
                      </label>
                      <input
                        type="number"
                        name="min_value"
                        id="min_value"
                        value={formData.min_value?.toString() || ''}
                        onChange={handleChange}
                        placeholder="0"
                        className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] transition-all duration-200 sm:text-sm ${
                          errors.min_value ? 'border-[#C7162B]' : 'border-[#AEA79F]/50'
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="max_value"
                        className="block text-sm font-medium text-[#333333]"
                      >
                        {t.max_value_label}
                      </label>
                      <input
                        type="number"
                        name="max_value"
                        id="max_value"
                        value={formData.max_value?.toString() || ''}
                        onChange={handleChange}
                        placeholder="100"
                        className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] transition-all duration-200 sm:text-sm ${
                          errors.max_value ? 'border-[#C7162B]' : 'border-[#AEA79F]/50'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {!hideCementSettings && (
                  <div className="bg-[#E95420]/5 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-[#333333] mb-4 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-[#E95420]" />
                      OPC Cement Settings
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="opc_min_value"
                          className="block text-sm font-medium text-[#333333]"
                        >
                          OPC Min Value
                        </label>
                        <input
                          type="number"
                          name="opc_min_value"
                          id="opc_min_value"
                          value={formData.opc_min_value?.toString() || ''}
                          onChange={handleChange}
                          className="block w-full px-4 py-3 bg-white border border-[#AEA79F]/50 rounded-lg sm:text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="opc_max_value"
                          className="block text-sm font-medium text-[#333333]"
                        >
                          OPC Max Value
                        </label>
                        <input
                          type="number"
                          name="opc_max_value"
                          id="opc_max_value"
                          value={formData.opc_max_value?.toString() || ''}
                          onChange={handleChange}
                          className="block w-full px-4 py-3 bg-white border border-[#AEA79F]/50 rounded-lg sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* OEE Mapping Settings */}
                <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#E95420]" />
                    OEE Analysis Mapping
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <label className="flex items-start gap-4 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-[#E95420]/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.is_oee_feeder}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, is_oee_feeder: e.target.checked }))
                        }
                        className="w-5 h-5 text-[#E95420] border-slate-300 rounded"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                          Design Capacity Feeder
                        </span>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Mark this as the primary feeder for OEE Performance.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-[#772953]/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.is_oee_quality}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, is_oee_quality: e.target.checked }))
                        }
                        className="w-5 h-5 text-[#772953] border-slate-300 rounded"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                          Quality Compliance Param
                        </span>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Include this in OEE Quality calculations.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="mt-8 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0 pt-6 border-t border-[#AEA79F]/20">
          {isSubmitting && (
            <div className="flex items-center justify-center space-x-2 text-[#E95420] bg-[#E95420]/10 px-4 py-2 rounded-lg mr-auto">
              <span className="text-sm font-medium">Saving...</span>
            </div>
          )}
          <EnhancedButton type="button" variant="error" onClick={onCancel} disabled={isSubmitting}>
            {t.cancel_button}
          </EnhancedButton>
          <EnhancedButton
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="bg-[#E95420] hover:bg-[#d94612] text-white"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {t.save_button}
          </EnhancedButton>
        </div>
      </form>
    </motion.div>
  );
};

export default ParameterSettingForm;
