import React, { useState, useEffect } from 'react';
import { PackingPlantMasterRecord } from '../../types';

interface FormProps {
  recordToEdit: PackingPlantMasterRecord | null;
  onSave: (record: PackingPlantMasterRecord | Omit<PackingPlantMasterRecord, 'id'>) => void;
  onCancel: () => void;
  t: any;
}

const PackingPlantDataForm: React.FC<FormProps> = ({ recordToEdit, onSave, onCancel, t }) => {
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
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'number' ? parseFloat(value) || 0 : value 
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
                <label htmlFor="area" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.area_label}</label>
                <input type="text" name="area" id="area" value={formData.area} onChange={handleChange} required className="mt-1 input-style" />
            </div>
            <div>
                <label htmlFor="plant_code" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.plant_code_label}</label>
                <input type="text" name="plant_code" id="plant_code" value={formData.plant_code} onChange={handleChange} required className="mt-1 input-style" />
            </div>
            <div>
                <label htmlFor="silo_capacity" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.silo_capacity_label}</label>
                <input type="number" name="silo_capacity" id="silo_capacity" value={formData.silo_capacity} onChange={handleChange} required className="mt-1 input-style no-spinner" />
            </div>
            <div>
                <label htmlFor="dead_stock" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.dead_stock_label}</label>
                <input type="number" name="dead_stock" id="dead_stock" value={formData.dead_stock} onChange={handleChange} required className="mt-1 input-style no-spinner" />
            </div>
            <div>
                <label htmlFor="cement_type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.cement_type_label}</label>
                <input type="text" name="cement_type" id="cement_type" value={formData.cement_type} onChange={handleChange} required className="mt-1 input-style" />
            </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg border-t border-slate-200 dark:border-slate-700">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-150">
            {t.save_button}
            </button>
            <button type="button" onClick={onCancel} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-150 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600">
            {t.cancel_button}
            </button>
        </div>
    </form>
  );
};

export default PackingPlantDataForm;