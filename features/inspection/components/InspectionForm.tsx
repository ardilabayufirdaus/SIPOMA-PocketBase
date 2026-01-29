import React, { useState } from 'react';
import { motion } from 'framer-motion';
import XMarkIcon from '../../../components/icons/XMarkIcon';
import ClipboardCheckIcon from '../../../components/icons/ClipboardCheckIcon';

interface InspectionFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

const InspectionForm: React.FC<InspectionFormProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    equipment: '',
    location: '',
    unit: 'Unit of Clinker Production',
    status: 'pending',
    priority: 'medium',
    findings: '',
    inspector: 'Ardilaba Yufridaus', // Default
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-lg text-white">
            <ClipboardCheckIcon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            New Inspection Report
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Inspection Title
          </label>
          <input
            required
            type="text"
            placeholder="e.g., Weekly Engine Inspection"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Production Unit
          </label>
          <select
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="Unit of Derivative Product & Supporting">
              Derivative Product & Supporting
            </option>
            <option value="Unit of Cement Production">Cement Production</option>
            <option value="Unit of Clinker Production">Clinker Production</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Equipment Name
            </label>
            <input
              required
              type="text"
              placeholder="e.g., Conveyor B1"
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Area / Location
            </label>
            <input
              required
              type="text"
              placeholder="e.g., Section A"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Priority Level
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Detailed Findings
          </label>
          <textarea
            required
            rows={4}
            placeholder="Describe your observations here..."
            value={formData.findings}
            onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-medium text-slate-700 dark:text-slate-200 resize-none"
          />
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25"
          >
            Create Report
          </button>
        </div>
      </form>
    </div>
  );
};

export default InspectionForm;
