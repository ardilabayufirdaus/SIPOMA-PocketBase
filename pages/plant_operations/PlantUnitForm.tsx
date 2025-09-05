

import React, { useState, useEffect } from 'react';
import { PlantUnit } from '../../types';

interface FormProps {
  recordToEdit: PlantUnit | null;
  onSave: (record: PlantUnit | Omit<PlantUnit, 'id'>) => void;
  onCancel: () => void;
  t: any;
}

const PlantUnitForm: React.FC<FormProps> = ({ recordToEdit, onSave, onCancel, t }) => {
  const [formData, setFormData] = useState({
    unit: '',
    category: '',
  });

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
  }, [recordToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
                <label htmlFor="unit" className="block text-sm font-medium text-slate-700">{t.unit_label}</label>
                <input type="text" name="unit" id="unit" value={formData.unit} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700">{t.plant_category_label}</label>
                <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
            </div>
        </div>
        <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                {t.save_button}
            </button>
            <button type="button" onClick={onCancel} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                {t.cancel_button}
            </button>
        </div>
    </form>
  );
};

export default PlantUnitForm;
