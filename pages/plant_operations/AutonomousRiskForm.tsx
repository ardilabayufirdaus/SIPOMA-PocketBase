import React, { useState, useEffect } from 'react';
import { AutonomousRiskData, RiskStatus } from '../../types';

interface FormProps {
  recordToEdit: AutonomousRiskData | null;
  onSave: (record: AutonomousRiskData | Omit<AutonomousRiskData, 'id'>) => void;
  onCancel: () => void;
  t: any;
  plantUnits: string[];
}

const AutonomousRiskForm: React.FC<FormProps> = ({ recordToEdit, onSave, onCancel, t, plantUnits }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    unit: plantUnits[0] || '',
    potential_disruption: '',
    preventive_action: '',
    mitigation_plan: '',
    status: RiskStatus.IDENTIFIED,
  });

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        date: recordToEdit.date,
        unit: recordToEdit.unit,
        potential_disruption: recordToEdit.potential_disruption,
        preventive_action: recordToEdit.preventive_action,
        mitigation_plan: recordToEdit.mitigation_plan,
        status: recordToEdit.status,
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        unit: plantUnits[0] || '',
        potential_disruption: '',
        preventive_action: '',
        mitigation_plan: '',
        status: RiskStatus.IDENTIFIED,
      });
    }
  }, [recordToEdit, plantUnits]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-slate-700">{t.date}</label>
                    <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-slate-700">{t.unit}</label>
                    <select name="unit" id="unit" value={formData.unit} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md">
                        {plantUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="potential_disruption" className="block text-sm font-medium text-slate-700">{t.potential_disruption}</label>
                <textarea name="potential_disruption" id="potential_disruption" value={formData.potential_disruption} onChange={handleChange} rows={3} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="preventive_action" className="block text-sm font-medium text-slate-700">{t.preventive_action}</label>
                <textarea name="preventive_action" id="preventive_action" value={formData.preventive_action} onChange={handleChange} rows={3} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="mitigation_plan" className="block text-sm font-medium text-slate-700">{t.risk_mitigation_plan}</label>
                <textarea name="mitigation_plan" id="mitigation_plan" value={formData.mitigation_plan} onChange={handleChange} rows={3} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700">{t.status}</label>
                <select name="status" id="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md">
                    {Object.values(RiskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        </div>
        <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">
                {t.save_button}
            </button>
            <button type="button" onClick={onCancel} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                {t.cancel_button}
            </button>
        </div>
    </form>
  );
};

export default AutonomousRiskForm;