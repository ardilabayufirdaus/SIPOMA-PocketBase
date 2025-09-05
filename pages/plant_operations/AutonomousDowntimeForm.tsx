import React, { useState, useEffect } from 'react';
import { CcrDowntimeData, DowntimeStatus } from '../../types';
import { formatDate } from '../../utils/formatters';

interface FormProps {
  recordToEdit: CcrDowntimeData | null;
  onSave: (record: CcrDowntimeData) => void;
  onCancel: () => void;
  t: any;
}

const AutonomousDowntimeForm: React.FC<FormProps> = ({ recordToEdit, onSave, onCancel, t }) => {
  const [formData, setFormData] = useState({
    action: '',
    corrective_action: '',
    status: DowntimeStatus.OPEN,
  });

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        action: recordToEdit.action || '',
        corrective_action: recordToEdit.corrective_action || '',
        status: recordToEdit.status || DowntimeStatus.OPEN,
      });
    }
  }, [recordToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recordToEdit) {
      onSave({ ...recordToEdit, ...formData });
    }
  };

  if (!recordToEdit) return null;

  return (
    <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><strong className="text-slate-600">{t.date}:</strong> <span className="text-slate-800">{formatDate(recordToEdit.date)}</span></div>
                <div><strong className="text-slate-600">{t.unit}:</strong> <span className="text-slate-800">{recordToEdit.unit}</span></div>
                <div><strong className="text-slate-600">{t.start_time}:</strong> <span className="text-slate-800 font-mono">{recordToEdit.start_time}</span></div>
                <div><strong className="text-slate-600">{t.end_time}:</strong> <span className="text-slate-800 font-mono">{recordToEdit.end_time}</span></div>
                <div className="sm:col-span-2"><strong className="text-slate-600">{t.problem}:</strong> <span className="text-slate-800">{recordToEdit.problem}</span></div>
            </div>
            <div className="pt-4 border-t">
                 <div>
                    <label htmlFor="action" className="block text-sm font-medium text-slate-700">{t.action}</label>
                    <textarea name="action" id="action" value={formData.action} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                </div>
            </div>
             <div>
                <label htmlFor="corrective_action" className="block text-sm font-medium text-slate-700">{t.corrective_action}</label>
                <textarea name="corrective_action" id="corrective_action" value={formData.corrective_action} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
            </div>
            <div>
                 <label htmlFor="status" className="block text-sm font-medium text-slate-700">{t.status}</label>
                 <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md">
                    {Object.values(DowntimeStatus).map(s => <option key={s} value={s}>{s}</option>)}
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

export default AutonomousDowntimeForm;