
import React, { useState, useEffect } from 'react';
import { PackingPlantStockRecord } from '../../types';

type FormRecord = Omit<PackingPlantStockRecord, 'id' | 'opening_stock' | 'stock_received'>;
type EditableRecord = Omit<PackingPlantStockRecord, 'opening_stock' | 'stock_received'>;


interface FormProps {
  recordToEdit: EditableRecord | null;
  onSave: (record: EditableRecord | FormRecord) => void;
  onCancel: () => void;
  t: any;
  areas: string[];
}

const PackingPlantStockDataForm: React.FC<FormProps> = ({ recordToEdit, onSave, onCancel, t, areas }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    area: areas[0] || '',
    stock_out: 0,
    closing_stock: 0,
  });

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        date: recordToEdit.date,
        area: recordToEdit.area,
        stock_out: recordToEdit.stock_out,
        closing_stock: recordToEdit.closing_stock,
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        area: areas[0] || '',
        stock_out: 0,
        closing_stock: 0,
      });
    }
  }, [recordToEdit, areas]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
                <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.date_label}</label>
                <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 input-style" />
            </div>
            <div>
                <label htmlFor="area" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.area_label}</label>
                <select name="area" id="area" value={formData.area} onChange={handleChange} className="mt-1 input-style">
                    {areas.map(area => <option key={area} value={area}>{area}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="stock_out" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.stock_out_label}</label>
                <input type="number" name="stock_out" id="stock_out" value={formData.stock_out} onChange={handleChange} required className="mt-1 input-style no-spinner" />
            </div>
             <div>
                <label htmlFor="closing_stock" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t.closing_stock_label}</label>
                <input type="number" name="closing_stock" id="closing_stock" value={formData.closing_stock} onChange={handleChange} required className="mt-1 input-style no-spinner" />
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

export default PackingPlantStockDataForm;
