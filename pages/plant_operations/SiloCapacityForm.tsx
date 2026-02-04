import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiloCapacity, PlantUnit } from '../../types';
import { Database, CheckCircle, AlertCircle, Ruler, Factory, Box } from 'lucide-react';
import { EnhancedButton } from '../../components/ui/EnhancedComponents';

interface FormProps {
  recordToEdit: SiloCapacity | null;
  onSave: (record: SiloCapacity | Omit<SiloCapacity, 'id'>) => void;
  onCancel: () => void;
  t: Record<string, string>;
  plantUnits: PlantUnit[];
  theme?: 'red' | 'indigo';
}

const SiloCapacityForm: React.FC<FormProps> = ({
  recordToEdit,
  onSave,
  onCancel,
  t,
  plantUnits,
  theme = 'red',
}) => {
  // Theme configuration
  const themeConfig = {
    red: {
      gradient: 'from-[#772953] to-[#2C001E]',
      text: 'text-[#333333]',
      bg_light: 'bg-[#F0F0F0]',
      border_focus: 'focus:border-[#E95420]',
      ring_focus: 'focus:ring-[#E95420]',
      button_primary: 'bg-[#E95420] hover:bg-[#d94612] text-white',
      button_secondary: 'text-[#333333] hover:bg-[#E95420]/10',
      icon_color: 'text-[#E95420]',
      subtle_text: 'text-white/80',
      border_light: 'border-[#AEA79F]/20',
    },
    indigo: {
      gradient: 'from-[#772953] to-[#2C001E]',
      text: 'text-[#333333]',
      bg_light: 'bg-[#F0F0F0]',
      border_focus: 'focus:border-[#E95420]',
      ring_focus: 'focus:ring-[#E95420]',
      button_primary: 'bg-[#E95420] hover:bg-[#d94612] text-white',
      button_secondary: 'text-[#333333] hover:bg-[#E95420]/10',
      icon_color: 'text-[#E95420]',
      subtle_text: 'text-white/80',
      border_light: 'border-[#AEA79F]/20',
    },
  };

  const colors = themeConfig[theme];

  const [formData, setFormData] = useState<Partial<SiloCapacity>>({
    plant_category: '',
    unit: '',
    silo_name: '',
    capacity: 0,
    dead_stock: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (recordToEdit) {
      setFormData(recordToEdit);
    }
  }, [recordToEdit]);

  // Derived unique categories
  const categoryOptions = useMemo(() => {
    return Array.from(new Set(plantUnits.map((u) => u.category))).sort();
  }, [plantUnits]);

  // Derived units based on selected category
  const unitOptions = useMemo(() => {
    if (!formData.plant_category) return [];
    return plantUnits
      .filter((u) => u.category === formData.plant_category)
      .map((u) => u.unit)
      .sort();
  }, [plantUnits, formData.plant_category]);

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'plant_category':
        return !value ? t.required_field || 'Required' : '';
      case 'unit':
        return !value ? t.required_field || 'Required' : '';
      case 'silo_name':
        return !value ? t.required_field || 'Required' : '';
      case 'capacity':
        return value === undefined || value < 0 ? t.invalid_value || 'Invalid value' : '';
      case 'dead_stock':
        return value === undefined || value < 0 ? t.invalid_value || 'Invalid value' : '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const processedValue =
      name === 'capacity' || name === 'dead_stock' ? parseFloat(value) || 0 : value;

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    // Reset unit if category changes
    if (name === 'plant_category') {
      setFormData((prev) => ({ ...prev, unit: '' }));
    }

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, processedValue) }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const processedValue =
      name === 'capacity' || name === 'dead_stock' ? parseFloat(value) || 0 : value;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, processedValue) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof SiloCapacity]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (isValid) {
      setIsSubmitting(true);
      setTimeout(() => {
        onSave(formData as SiloCapacity);
        setIsSubmitting(false);
      }, 500);
    }
  };

  const getInputClass = (error?: string) => `
    block w-full px-4 py-3 bg-white border rounded-xl shadow-sm 
    text-[#333333] placeholder-[#AEA79F]
    focus:outline-none focus:ring-2 focus:ring-offset-1 
    transition-all duration-200 sm:text-sm
    ${
      error
        ? 'border-[#C7162B] focus:border-[#C7162B] focus:ring-[#C7162B]/20'
        : `border-[#AEA79F]/50 ${colors.border_focus} ${colors.ring_focus} focus:ring-opacity-50 hover:border-[#AEA79F]`
    }
  `;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-lg overflow-hidden border border-slate-100"
    >
      {/* Header */}
      <div className={`px-6 py-4 bg-gradient-to-r ${colors.gradient}`}>
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-white" />
          <div>
            <h2 className="text-xl font-bold text-white">
              {t.silo_capacity_title || 'Silo Capacity'}
            </h2>
            <p className={`text-sm ${colors.subtle_text}`}>
              {t.silo_capacity_subtitle || 'Manage silo storage capacities'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div className="space-y-2">
            <label htmlFor="plant_category" className="block text-sm font-medium text-[#333333]">
              {t.plant_category || 'Plant Category'} <span className="text-[#C7162B]">*</span>
            </label>
            <div className="relative">
              <select
                id="plant_category"
                name="plant_category"
                value={formData.plant_category}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${getInputClass(errors.plant_category)} appearance-none`}
              >
                <option value="">{t.select_category || 'Select Category'}</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Factory className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <AnimatePresence>
              {errors.plant_category && touched.plant_category && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-[#C7162B] flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="w-3 h-3" /> {errors.plant_category}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <label htmlFor="unit" className="block text-sm font-medium text-slate-700">
              {t.unit || 'Unit'} <span className="text-[#C7162B]">*</span>
            </label>
            <div className="relative">
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={!formData.plant_category}
                className={`${getInputClass(errors.unit)} appearance-none`}
              >
                <option value="">{t.select_unit || 'Select Unit'}</option>
                {unitOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <Box className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <AnimatePresence>
              {errors.unit && touched.unit && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-[#C7162B] flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="w-3 h-3" /> {errors.unit}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Silo Name */}
          <div className="md:col-span-2 space-y-2">
            <label htmlFor="silo_name" className="block text-sm font-medium text-slate-700">
              {t.silo_name || 'Silo Name'} <span className="text-[#C7162B]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="silo_name"
                name="silo_name"
                value={formData.silo_name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. Silo 1"
                className={getInputClass(errors.silo_name)}
              />
              <Database className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <AnimatePresence>
              {errors.silo_name && touched.silo_name && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-[#C7162B] flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="w-3 h-3" /> {errors.silo_name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <label htmlFor="capacity" className="block text-sm font-medium text-slate-700">
              {t.capacity || 'Capacity'} (Ton) <span className="text-[#C7162B]">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                onBlur={handleBlur}
                min="0"
                className={getInputClass(errors.capacity)}
              />
              <Ruler className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <AnimatePresence>
              {errors.capacity && touched.capacity && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-[#C7162B] flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="w-3 h-3" /> {errors.capacity}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Dead Stock */}
          <div className="space-y-2">
            <label htmlFor="dead_stock" className="block text-sm font-medium text-slate-700">
              {t.dead_stock || 'Dead Stock'} (Ton) <span className="text-[#C7162B]">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="dead_stock"
                name="dead_stock"
                value={formData.dead_stock}
                onChange={handleChange}
                onBlur={handleBlur}
                min="0"
                className={getInputClass(errors.dead_stock)}
              />
              <Ruler className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <AnimatePresence>
              {errors.dead_stock && touched.dead_stock && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-[#C7162B] flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="w-3 h-3" /> {errors.dead_stock}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
          <EnhancedButton
            type="button"
            variant="ghost" // Use ghost to avoid text-white issue (Fixed in step 489)
            onClick={onCancel}
            disabled={isSubmitting}
            className={`px-6 ${colors.button_secondary}`}
          >
            {t.cancel || 'Cancel'}
          </EnhancedButton>
          <EnhancedButton
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className={`px-8 ${colors.button_primary}`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">Loading...</span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {t.save || 'Save'}
              </span>
            )}
          </EnhancedButton>
        </div>
      </form>
    </motion.div>
  );
};

export default SiloCapacityForm;
