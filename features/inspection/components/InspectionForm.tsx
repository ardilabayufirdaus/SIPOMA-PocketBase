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
    <div className="flex flex-col h-full bg-inspection-50/10 dark:bg-inspection-950/20 backdrop-blur-3xl font-sans">
      <div className="p-8 border-b border-inspection-100 dark:border-inspection-800/50 flex items-center justify-between bg-white/40 dark:bg-inspection-900/40 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-gradient-to-br from-inspection-700 to-inspection-500 rounded-2xl text-white shadow-xl shadow-inspection-500/20">
            <ClipboardCheckIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-inspection-800 dark:text-white tracking-tight">
              New Inspection Report
            </h3>
            <p className="text-[11px] font-black text-inspection-500 dark:text-inspection-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-inspection-500 animate-pulse"></span>
              One-off detailed report
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-3 rounded-2xl bg-white/50 dark:bg-inspection-800/50 text-inspection-500 hover:text-inspection-800 dark:hover:text-inspection-100 hover:bg-white dark:hover:bg-inspection-700 transition-all border border-inspection-100 dark:border-inspection-800/50 shadow-sm group"
        >
          <XMarkIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-thin scrollbar-thumb-inspection-200 dark:scrollbar-thumb-inspection-800"
      >
        <div>
          <label className="block text-[10px] font-black text-inspection-400 dark:text-inspection-500 uppercase tracking-[0.2em] mb-3 ml-1">
            Inspection Title
          </label>
          <input
            required
            type="text"
            placeholder="e.g., Weekly Engine Inspection"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-6 py-4 bg-white/50 dark:bg-inspection-900/50 border border-inspection-100 dark:border-inspection-800/50 rounded-2xl text-base font-bold outline-none focus:ring-4 focus:ring-inspection-500/10 focus:border-inspection-500/50 transition-all shadow-inner text-inspection-800 dark:text-inspection-100"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-inspection-400 dark:text-inspection-500 uppercase tracking-[0.2em] mb-3 ml-1">
            Production Unit
          </label>
          <select
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="w-full px-6 py-4 bg-white/50 dark:bg-inspection-900/50 border border-inspection-100 dark:border-inspection-800/50 rounded-2xl text-base font-bold outline-none focus:ring-4 focus:ring-inspection-500/10 focus:border-inspection-500/50 transition-all shadow-inner text-inspection-800 dark:text-inspection-100 appearance-none"
          >
            <option
              value="Unit of Derivative Product & Supporting"
              className="bg-white dark:bg-inspection-950"
            >
              Derivative Product & Supporting
            </option>
            <option value="Unit of Cement Production" className="bg-white dark:bg-inspection-950">
              Cement Production
            </option>
            <option value="Unit of Clinker Production" className="bg-white dark:bg-inspection-950">
              Clinker Production
            </option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-inspection-400 dark:text-inspection-500 uppercase tracking-[0.2em] mb-3 ml-1">
              Equipment Name
            </label>
            <input
              required
              type="text"
              placeholder="e.g., Conveyor B1"
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              className="w-full px-6 py-4 bg-white/50 dark:bg-inspection-900/50 border border-inspection-100 dark:border-inspection-800/50 rounded-2xl text-base font-bold outline-none focus:ring-4 focus:ring-inspection-500/10 focus:border-inspection-500/50 transition-all shadow-inner text-inspection-800 dark:text-inspection-100"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-inspection-400 dark:text-inspection-500 uppercase tracking-[0.2em] mb-3 ml-1">
              Area / Location
            </label>
            <input
              required
              type="text"
              placeholder="e.g., Section A"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-6 py-4 bg-white/50 dark:bg-inspection-900/50 border border-inspection-100 dark:border-inspection-800/50 rounded-2xl text-base font-bold outline-none focus:ring-4 focus:ring-inspection-500/10 focus:border-inspection-500/50 transition-all shadow-inner text-inspection-800 dark:text-inspection-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-inspection-400 dark:text-inspection-500 uppercase tracking-[0.2em] mb-3 ml-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-6 py-4 bg-white/50 dark:bg-inspection-900/50 border border-inspection-100 dark:border-inspection-800/50 rounded-2xl text-base font-bold outline-none focus:ring-4 focus:ring-inspection-500/10 focus:border-inspection-500/50 transition-all shadow-inner text-inspection-800 dark:text-inspection-100 appearance-none"
            >
              <option value="pending" className="bg-white dark:bg-inspection-950">
                Pending
              </option>
              <option value="completed" className="bg-white dark:bg-inspection-950">
                Completed
              </option>
              <option value="critical" className="bg-white dark:bg-inspection-950">
                Critical
              </option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-inspection-400 dark:text-inspection-500 uppercase tracking-[0.2em] mb-3 ml-1">
              Priority Level
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-6 py-4 bg-white/50 dark:bg-inspection-900/50 border border-inspection-100 dark:border-inspection-800/50 rounded-2xl text-base font-bold outline-none focus:ring-4 focus:ring-inspection-500/10 focus:border-inspection-500/50 transition-all shadow-inner text-inspection-800 dark:text-inspection-100 appearance-none"
            >
              <option value="low" className="bg-white dark:bg-inspection-950">
                Low
              </option>
              <option value="medium" className="bg-white dark:bg-inspection-950">
                Medium
              </option>
              <option value="high" className="bg-white dark:bg-inspection-950">
                High
              </option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-inspection-400 dark:text-inspection-500 uppercase tracking-[0.2em] mb-3 ml-1">
            Detailed Findings
          </label>
          <textarea
            required
            rows={4}
            placeholder="Describe your observations here..."
            value={formData.findings}
            onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
            className="w-full px-6 py-4 bg-white/50 dark:bg-inspection-900/50 border border-inspection-100 dark:border-inspection-800/50 rounded-2xl text-base font-bold outline-none focus:ring-4 focus:ring-inspection-500/10 focus:border-inspection-500/50 transition-all shadow-inner text-inspection-800 dark:text-inspection-100 resize-none placeholder:text-inspection-300 placeholder:italic"
          />
        </div>

        <div className="flex items-center gap-6 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-5 bg-inspection-50 dark:bg-inspection-800/50 text-inspection-600 dark:text-inspection-300 rounded-[2rem] font-black uppercase tracking-widest hover:bg-white dark:hover:bg-inspection-700 hover:text-inspection-800 dark:hover:text-inspection-100 transition-all border border-inspection-100 dark:border-inspection-800/50 shadow-sm active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-[2] py-5 bg-gradient-to-r from-inspection-700 to-inspection-500 hover:from-inspection-600 hover:to-inspection-400 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-inspection-500/30 hover:shadow-inspection-500/50 active:scale-[0.98]"
          >
            Create Report
          </button>
        </div>
      </form>
    </div>
  );
};

export default InspectionForm;
