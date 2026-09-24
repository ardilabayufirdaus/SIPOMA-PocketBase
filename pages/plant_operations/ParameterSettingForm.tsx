import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { PlantUnit, ParameterSetting, ParameterDataType, CementType } from '../../types';
import { Settings, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { useCementTypes } from '../../hooks/useCementTypes';

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
  cementTypes?: CementType[];
}

const ParameterSettingForm: React.FC<FormProps> = ({
  recordToEdit,
  onSave,
  onCancel,
  t,
  plantUnits: providedPlantUnits,
  loading: providedLoading,
  hideCementSettings = false,
  cementTypes: providedCementTypes,
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
  const [cementTypeLimits, setCementTypeLimits] = useState<
    Record<string, { min?: number | undefined; max?: number | undefined }>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { records: hookPlantUnits, loading: hookPlantUnitsLoading } = usePlantUnits();
  const plantUnits = providedPlantUnits !== undefined ? providedPlantUnits : hookPlantUnits;
  const plantUnitsLoading = providedLoading !== undefined ? providedLoading : hookPlantUnitsLoading;

  const { records: hookCementTypes } = useCementTypes();
  const availableCementTypes = useMemo(() => {
    if (hideCementSettings) return [];
    const list = providedCementTypes !== undefined ? providedCementTypes : hookCementTypes;
    return list.filter((c) => c.is_active !== false);
  }, [hideCementSettings, providedCementTypes, hookCementTypes]);

  const categoryOptions = useMemo(() => {
    let categories = Array.from(new Set(plantUnits.map((u) => u.category)));
    if (formData.category && !categories.includes(formData.category)) {
      categories = [formData.category, ...categories];
    }
    return categories;
  }, [plantUnits, formData.category]);

  const unitOptions = useMemo(() => {
    let units: string[] = [];
    if (formData.category) {
      const filtered = plantUnits.filter((u) => u.category === formData.category);
      if (filtered.length > 0) {
        units = Array.from(new Set(filtered.map((u) => u.unit)));
      } else {
        units = Array.from(new Set(plantUnits.map((u) => u.unit)));
      }
    } else {
      units = Array.from(new Set(plantUnits.map((u) => u.unit)));
    }
    if (formData.unit && !units.includes(formData.unit)) {
      units = [formData.unit, ...units];
    }
    return units;
  }, [plantUnits, formData.category, formData.unit]);

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

    if (!hideCementSettings && availableCementTypes.length > 0) {
      availableCementTypes.forEach((c) => {
        const lim = cementTypeLimits[c.name];
        if (
          lim &&
          lim.min !== undefined &&
          lim.min !== null &&
          lim.max !== undefined &&
          lim.max !== null &&
          lim.min > lim.max
        ) {
          newErrors[`cement_${c.name}`] = `${c.name} Min tidak boleh lebih dari ${c.name} Max`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const processedValue =
      type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value;

    if (name === 'unit') {
      const matched = plantUnits.find((u) => u.unit === value);
      const newCategory = matched?.category || formData.category;
      setFormData((prev) => ({
        ...prev,
        unit: value,
        category: newCategory,
      }));
      setTouched((prev) => ({ ...prev, unit: true, ...(newCategory ? { category: true } : {}) }));
      setErrors((prev) => ({
        ...prev,
        unit: validateField('unit', value),
        ...(newCategory ? { category: validateField('category', newCategory) } : {}),
      }));
      return;
    }

    if (name === 'category') {
      const unitBelongsToCategory = plantUnits.some(
        (u) => u.unit === formData.unit && u.category === value
      );
      const newUnit = unitBelongsToCategory ? formData.unit : '';
      setFormData((prev) => ({
        ...prev,
        category: value,
        unit: newUnit,
      }));
      setTouched((prev) => ({ ...prev, category: true, ...(newUnit ? {} : { unit: false }) }));
      setErrors((prev) => ({
        ...prev,
        category: validateField('category', value),
        ...(newUnit ? { unit: validateField('unit', newUnit) } : { unit: '' }),
      }));
      return;
    }

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

    const finalLimits: Record<string, { min: number | null; max: number | null }> = {};
    if (!hideCementSettings) {
      availableCementTypes.forEach((c) => {
        const lim = cementTypeLimits[c.name];
        finalLimits[c.name] = {
          min: lim?.min !== undefined && lim?.min !== null ? Number(lim.min) : null,
          max: lim?.max !== undefined && lim?.max !== null ? Number(lim.max) : null,
        };
      });
    }

    const opcItem = availableCementTypes.find((c) => c.name === 'OPC' || c.code === 'OPC');
    const pccItem = availableCementTypes.find((c) => c.name === 'PCC' || c.code === 'PCC');
    const opcLim = opcItem ? finalLimits[opcItem.name] : null;
    const pccLim = pccItem ? finalLimits[pccItem.name] : null;

    const submissionData = {
      ...formData,
      cement_type_limits: hideCementSettings ? undefined : finalLimits,
      opc_min_value: opcLim && opcLim.min !== null ? opcLim.min : (formData.opc_min_value ?? null),
      opc_max_value: opcLim && opcLim.max !== null ? opcLim.max : (formData.opc_max_value ?? null),
      pcc_min_value: pccLim && pccLim.min !== null ? pccLim.min : (formData.pcc_min_value ?? null),
      pcc_max_value: pccLim && pccLim.max !== null ? pccLim.max : (formData.pcc_max_value ?? null),
    };

    setTimeout(() => {
      if (recordToEdit) {
        onSave({ ...recordToEdit, ...submissionData });
      } else {
        onSave(submissionData);
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

      const limits: Record<string, { min?: number | undefined; max?: number | undefined }> = {};
      availableCementTypes.forEach((c) => {
        const existing =
          recordToEdit.cement_type_limits?.[c.name] ??
          recordToEdit.cement_type_limits?.[c.code] ??
          recordToEdit.cement_type_limits?.[c.id];
        let min = existing?.min !== null ? existing?.min : undefined;
        let max = existing?.max !== null ? existing?.max : undefined;

        if (min === undefined && (c.code === 'OPC' || c.name === 'OPC'))
          min = recordToEdit.opc_min_value ?? undefined;
        if (max === undefined && (c.code === 'OPC' || c.name === 'OPC'))
          max = recordToEdit.opc_max_value ?? undefined;
        if (min === undefined && (c.code === 'PCC' || c.name === 'PCC'))
          min = recordToEdit.pcc_min_value ?? undefined;
        if (max === undefined && (c.code === 'PCC' || c.name === 'PCC'))
          max = recordToEdit.pcc_max_value ?? undefined;

        limits[c.name] = { min, max };
      });
      setCementTypeLimits(limits);
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
      const limits: Record<string, { min?: number | undefined; max?: number | undefined }> = {};
      availableCementTypes.forEach((c) => {
        limits[c.name] = { min: undefined, max: undefined };
      });
      setCementTypeLimits(limits);
    }
  }, [recordToEdit, availableCementTypes]);

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
        className="bg-gradient-to-r from-[#111827] to-[#0f172a] px-6 py-4"
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
                className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] transition-all duration-200 sm:text-sm ${
                  errors.parameter ? 'border-[#C7162B]' : 'border-[#94a3b8]/50'
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
              className="block w-full pl-3 pr-10 py-3 bg-white border border-[#94a3b8]/50 rounded-lg shadow-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] transition-all duration-200 sm:text-sm"
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
              className={`block w-full pl-3 pr-10 py-3 bg-white border rounded-lg shadow-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] transition-all duration-200 sm:text-sm ${
                errors.unit ? 'border-[#C7162B]' : 'border-[#94a3b8]/50'
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
              className={`block w-full pl-3 pr-10 py-3 bg-white border rounded-lg shadow-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] transition-all duration-200 sm:text-sm ${
                errors.category ? 'border-[#C7162B]' : 'border-[#94a3b8]/50'
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
                <div className="bg-[#F9F9F9] rounded-lg p-4 border border-[#94a3b8]/20">
                  <h4 className="text-lg font-medium text-[#111827] mb-4 flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-[#059669]" />
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
                        className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] transition-all duration-200 sm:text-sm ${
                          errors.min_value ? 'border-[#C7162B]' : 'border-[#94a3b8]/50'
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
                        className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] transition-all duration-200 sm:text-sm ${
                          errors.max_value ? 'border-[#C7162B]' : 'border-[#94a3b8]/50'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {!hideCementSettings && availableCementTypes.length > 0 && (
                  <div className="bg-[#059669]/5 rounded-lg p-5 border border-[#059669]/20 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#059669]/20 pb-2">
                      <h4 className="text-base font-semibold text-[#111827] flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2 text-[#059669]" />
                        Batas Nilai Berdasarkan Tipe Produk / Semen
                      </h4>
                      <span className="text-xs text-[#059669] font-semibold">
                        {availableCementTypes.length} Tipe Produk
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableCementTypes.map((c) => {
                        const lim = cementTypeLimits[c.name] || {};
                        const errKey = `cement_${c.name}`;
                        const hasErr = !!errors[errKey];

                        return (
                          <div
                            key={c.id}
                            className="p-4 rounded-lg bg-white border border-[#94a3b8]/30 shadow-sm space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm text-[#111827] flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#059669] inline-block" />
                                {c.name}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#059669]/10 text-[#059669] border border-[#059669]/30">
                                {c.code || c.name}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label
                                  htmlFor={`limit_${c.name}_min`}
                                  className="block text-xs font-medium text-[#333333] mb-1"
                                >
                                  Min
                                </label>
                                <input
                                  type="number"
                                  id={`limit_${c.name}_min`}
                                  value={lim.min !== undefined && lim.min !== null ? lim.min : ''}
                                  onChange={(e) => {
                                    const val =
                                      e.target.value === ''
                                        ? undefined
                                        : parseFloat(e.target.value);
                                    setCementTypeLimits((prev) => ({
                                      ...prev,
                                      [c.name]: { ...prev[c.name], min: val },
                                    }));
                                  }}
                                  placeholder="0"
                                  className="block w-full px-3 py-2 bg-white border border-[#94a3b8]/50 rounded-lg text-sm font-mono text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor={`limit_${c.name}_max`}
                                  className="block text-xs font-medium text-[#333333] mb-1"
                                >
                                  Max
                                </label>
                                <input
                                  type="number"
                                  id={`limit_${c.name}_max`}
                                  value={lim.max !== undefined && lim.max !== null ? lim.max : ''}
                                  onChange={(e) => {
                                    const val =
                                      e.target.value === ''
                                        ? undefined
                                        : parseFloat(e.target.value);
                                    setCementTypeLimits((prev) => ({
                                      ...prev,
                                      [c.name]: { ...prev[c.name], max: val },
                                    }));
                                  }}
                                  placeholder="100"
                                  className="block w-full px-3 py-2 bg-white border border-[#94a3b8]/50 rounded-lg text-sm font-mono text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]"
                                />
                              </div>
                            </div>

                            {hasErr && (
                              <p className="text-xs text-[#C7162B] flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {errors[errKey]}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* OEE Mapping Settings */}
                <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#059669]" />
                    OEE Analysis Mapping
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <label className="flex items-start gap-4 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-[#059669]/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.is_oee_feeder}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, is_oee_feeder: e.target.checked }))
                        }
                        className="w-5 h-5 text-[#059669] border-slate-300 rounded"
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

                    <label className="flex items-start gap-4 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-[#111827]/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.is_oee_quality}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, is_oee_quality: e.target.checked }))
                        }
                        className="w-5 h-5 text-[#111827] border-slate-300 rounded"
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

        <div className="mt-8 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0 pt-6 border-t border-[#94a3b8]/20">
          {isSubmitting && (
            <div className="flex items-center justify-center space-x-2 text-[#059669] bg-[#059669]/10 px-4 py-2 rounded-lg mr-auto">
              <span className="text-sm font-medium">Saving...</span>
            </div>
          )}
          <EnhancedButton
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t.cancel_button || 'Cancel'}
          </EnhancedButton>
          <EnhancedButton
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="bg-[#059669] hover:bg-[#047857] text-white rounded-xl"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {t.save_button || 'Save'}
          </EnhancedButton>
        </div>
      </form>
    </motion.div>
  );
};

export default ParameterSettingForm;
