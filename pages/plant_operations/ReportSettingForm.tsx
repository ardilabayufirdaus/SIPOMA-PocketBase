


import React, { useState, useEffect } from 'react';
import { ReportSetting, ParameterSetting, ParameterDataType } from '../../types';

interface FormProps {
  recordToEdit: ReportSetting | null;
  onSave: (record: ReportSetting | Omit<ReportSetting, 'id'>) => void;
  onCancel: () => void;
  t: any;
  allParameters: ParameterSetting[];
  existingParameterIds: string[];
}

const ReportSettingForm: React.FC<FormProps> = ({ recordToEdit, onSave, onCancel, t, allParameters, existingParameterIds }) => {
  // FIX: Use snake_case for state property to match ReportSetting type
  const [formData, setFormData] = useState({
    parameter_id: '',
    category: '',
  });
  
  const availableParameters = allParameters
    // FIX: Use snake_case for data_type
    .filter(p => p.data_type === ParameterDataType.NUMBER)
    // FIX: Use snake_case for parameter_id
    .filter(p => !existingParameterIds.includes(p.id) || p.id === recordToEdit?.parameter_id);


  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        // FIX: Use snake_case for parameter_id
        parameter_id: recordToEdit.parameter_id,
        category: recordToEdit.category,
      });
    } else {
      setFormData({
        parameter_id: availableParameters[0]?.id || '',
        category: '',
      });
    }
  }, [recordToEdit, availableParameters]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.parameter_id) {
        // Handle case where no parameters are available to be selected
        onCancel();
        return;
    }
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
                <label htmlFor="parameter_id" className="block text-sm font-medium text-slate-700">{t.parameter_select_label}</label>
                {/* FIX: Update name, id, and value to use snake_case */}
                <select name="parameter_id" id="parameter_id" value={formData.parameter_id} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2 bg-white text-base border-slate-300 text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md disabled:bg-slate-100" disabled={availableParameters.length === 0}>
                   {availableParameters.map(param => (
                       <option key={param.id} value={param.id}>{param.parameter} ({param.category})</option>
                   ))}
                   {availableParameters.length === 0 && <option>No available parameters</option>}
                </select>
            </div>
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700">{t.report_category_label}</label>
                <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
            </div>
        </div>
        <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors disabled:bg-red-400" disabled={availableParameters.length === 0 && !recordToEdit}>
                {t.save_button}
            </button>
            <button type="button" onClick={onCancel} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                {t.cancel_button}
            </button>
        </div>
    </form>
  );
};

export default ReportSettingForm;
