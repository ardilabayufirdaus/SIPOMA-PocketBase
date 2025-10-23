import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiloCapacity, PlantUnit } from '../../types';
import { Package, AlertCircle, CheckCircle } from 'lucide-react';

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useReducedMotion,
} from '../../components/ui/EnhancedComponents';

interface FormProps {
  recordToEdit: SiloCapacity | null;
  onSave: (record: SiloCapacity | Omit<SiloCapacity, 'id'>) => void;
  onCancel: () => void;
  t: Record<string, string>;
  plantUnits: PlantUnit[];
}

const SiloCapacityForm: React.FC<FormProps> = ({
  recordToEdit,
  onSave,
  onCancel,
  t,
  plantUnits,
}) => {
  // Enhanced accessibility hooks
  const announceToScreenReader = useAccessibility();
  const prefersReducedMotion = useReducedMotion();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState({
    plant_category: '',
    unit: '',
    silo_name: '',
    capacity: 0,
    dead_stock: 0,
  });

  const uniqueCategories = useMemo(
    () => [...new Set(plantUnits.map((u) => u.category).sort())],
    [plantUnits]
  );

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        plant_category: recordToEdit.plant_category,
        unit: recordToEdit.unit,
        silo_name: recordToEdit.silo_name,
        capacity: recordToEdit.capacity,
        dead_stock: recordToEdit.dead_stock,
      });
    } else {
      const firstCategory = uniqueCategories[0] || '';
      const firstUnit = plantUnits.find((u) => u.category === firstCategory)?.unit || '';
      setFormData({
        plant_category: firstCategory,
        unit: firstUnit,
        silo_name: '',
        capacity: 0,
        dead_stock: 0,
      });
    }
  }, [recordToEdit, plantUnits, uniqueCategories]);

  const unitsForCategory = useMemo(() => {
    return plantUnits
      .filter((u) => u.category === formData.plant_category)
      .map((u) => u.unit)
      .sort();
  }, [plantUnits, formData.plant_category]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    const firstUnit = plantUnits.find((u) => u.category === newCategory)?.unit || '';
    setFormData((prev) => ({
      ...prev,
      plant_category: newCategory,
      unit: firstUnit,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4"
      >
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-white" />
          <h2 className="text-xl font-semibold text-white">
            {t.silo_capacity_title || 'Silo Capacity'}
          </h2>
        </div>
        <p className="text-blue-100 text-sm mt-1">
          {t.silo_capacity_description || 'Configure silo capacity and dead stock management'}
        </p>
      </motion.div>

      <form ref={formRef} onSubmit={handleSubmit} aria-label="Silo Capacity Form" className="p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6"
        >
          {/* Plant Category */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="sm:col-span-2"
          >
            <label
              htmlFor="plant_category"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              {t.plant_category_label_silo}
            </label>
            <motion.select
              whileFocus={{ scale: 1.02 }}
              name="plant_category"
              id="plant_category"
              value={formData.plant_category}
              onChange={handleCategoryChange}
              className="block w-full pl-3 pr-10 py-3 bg-white border border-slate-300 rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm"
            >
              {uniqueCategories.map((cat) => (
                <motion.option
                  key={cat}
                  value={cat}
                  whileHover={{ backgroundColor: '#eff6ff' }}
                  className="py-2"
                >
                  {cat}
                </motion.option>
              ))}
            </motion.select>
          </motion.div>

          {/* Unit */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <label htmlFor="unit" className="block text-sm font-medium text-slate-700 mb-2">
              {t.unit_label}
            </label>
            <motion.select
              whileFocus={{ scale: 1.02 }}
              name="unit"
              id="unit"
              value={formData.unit}
              onChange={handleChange}
              required
              disabled={unitsForCategory.length === 0}
              className="block w-full pl-3 pr-10 py-3 bg-white border border-slate-300 rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
            >
              {unitsForCategory.map((u) => (
                <motion.option
                  key={u}
                  value={u}
                  whileHover={{ backgroundColor: '#eff6ff' }}
                  className="py-2"
                >
                  {u}
                </motion.option>
              ))}
            </motion.select>
          </motion.div>

          {/* Silo Name */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <div className="space-y-2">
              <label htmlFor="silo_name" className="block text-sm font-medium text-slate-700">
                {t.silo_name_label}
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="text"
                name="silo_name"
                id="silo_name"
                value={formData.silo_name}
                onChange={handleChange}
                required
                placeholder={t.silo_name_placeholder || 'Enter silo name'}
                className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm"
              />
            </div>
          </motion.div>

          {/* Capacity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <div className="space-y-2">
              <label htmlFor="capacity" className="block text-sm font-medium text-slate-700">
                {t.capacity_label}
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="number"
                name="capacity"
                id="capacity"
                value={formData.capacity}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm"
              />
            </div>
          </motion.div>

          {/* Dead Stock */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <div className="space-y-2">
              <label htmlFor="dead_stock" className="block text-sm font-medium text-slate-700">
                {t.dead_stock_label_silo}
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="number"
                name="dead_stock"
                id="dead_stock"
                value={formData.dead_stock}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0 pt-6 border-t border-slate-200"
        >
          <AnimatePresence>
            {isSubmitting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center space-x-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
                />
                <span className="text-sm font-medium">Saving silo capacity...</span>
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
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700"
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

export default SiloCapacityForm;

