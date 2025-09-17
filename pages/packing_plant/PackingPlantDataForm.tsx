import React, { useState, useEffect } from 'react';
import { PackingPlantMasterRecord } from '../../types';

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from '../../components/ui/EnhancedComponents';

interface FormProps {
  recordToEdit: PackingPlantMasterRecord | null;
  onSave: (record: PackingPlantMasterRecord | Omit<PackingPlantMasterRecord, 'id'>) => void;
  onCancel: () => void;
  t: any;
}

const PackingPlantDataForm: React.FC<FormProps> = ({ recordToEdit, onSave, onCancel, t }) => {
  // Enhanced accessibility hooks
  const announceToScreenReader = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  const [formData, setFormData] = useState({
    area: '',
    plant_code: '',
    silo_capacity: 0,
    dead_stock: 0,
    cement_type: '',
  });

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        area: recordToEdit.area,
        plant_code: recordToEdit.plant_code,
        silo_capacity: recordToEdit.silo_capacity,
        dead_stock: recordToEdit.dead_stock,
        cement_type: recordToEdit.cement_type,
      });
    } else {
      setFormData({
        area: '',
        plant_code: '',
        silo_capacity: 0,
        dead_stock: 0,
        cement_type: '',
      });
    }
  }, [recordToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recordToEdit) {
      onSave({ ...recordToEdit, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 space-y-4">
        <div>
          <label
            htmlFor="area"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t.area_label}
          </label>
          <input
            type="text"
            name="area"
            id="area"
            value={formData.area}
            onChange={handleChange}
            required
            className="mt-1 input-style"
          />
        </div>
        <div>
          <label
            htmlFor="plant_code"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t.plant_code_label}
          </label>
          <input
            type="text"
            name="plant_code"
            id="plant_code"
            value={formData.plant_code}
            onChange={handleChange}
            required
            className="mt-1 input-style"
          />
        </div>
        <div>
          <label
            htmlFor="silo_capacity"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t.silo_capacity_label}
          </label>
          <input
            type="number"
            name="silo_capacity"
            id="silo_capacity"
            value={formData.silo_capacity}
            onChange={handleChange}
            required
            className="mt-1 input-style no-spinner"
          />
        </div>
        <div>
          <label
            htmlFor="dead_stock"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t.dead_stock_label}
          </label>
          <input
            type="number"
            name="dead_stock"
            id="dead_stock"
            value={formData.dead_stock}
            onChange={handleChange}
            required
            className="mt-1 input-style no-spinner"
          />
        </div>
        <div>
          <label
            htmlFor="cement_type"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t.cement_type_label}
          </label>
          <input
            type="text"
            name="cement_type"
            id="cement_type"
            value={formData.cement_type}
            onChange={handleChange}
            required
            className="mt-1 input-style"
          />
        </div>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg border-t border-slate-200 dark:border-slate-700">
        <EnhancedButton
          type="submit"
          variant="primary"
          className="sm:ml-3 sm:w-auto"
          aria-label={t.save_button || 'Save packing plant data'}
        >
          {t.save_button}
        </EnhancedButton>
        <EnhancedButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="mt-3 sm:mt-0 sm:ml-3 sm:w-auto"
          aria-label={t.cancel_button || 'Cancel'}
        >
          {t.cancel_button}
        </EnhancedButton>
      </div>
    </form>
  );
};

export default PackingPlantDataForm;
