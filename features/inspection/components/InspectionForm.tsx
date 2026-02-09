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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 backdrop-blur-3xl font-ubuntu">
      <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-gradient-to-br from-ubuntu-orange to-orange-600 rounded-2xl text-white shadow-lg shadow-orange-500/20">
            <ClipboardCheckIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-ubuntu-coolGrey dark:text-white tracking-tight">
              New Inspection Report
            </h3>
            <p className="text-[11px] font-bold text-ubuntu-warmGrey uppercase tracking-widest flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-ubuntu-orange animate-pulse"></span>
              One-off detailed report
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-ubuntu-coolGrey dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-white/10 shadow-sm group"
        >
          <XMarkIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700"
      >
        <div>
          <label className="block text-[10px] font-bold text-ubuntu-warmGrey uppercase tracking-[0.2em] mb-3 ml-1">
            Inspection Title
          </label>
          <input
            required
            type="text"
            placeholder="e.g., Weekly Engine Inspection"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-base font-bold outline-none focus:ring-2 focus:ring-ubuntu-orange/20 focus:border-ubuntu-orange transition-all shadow-inner text-ubuntu-coolGrey dark:text-white"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-ubuntu-warmGrey uppercase tracking-[0.2em] mb-3 ml-1">
            Production Unit
          </label>
          <select
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-base font-bold outline-none focus:ring-2 focus:ring-ubuntu-orange/20 focus:border-ubuntu-orange transition-all shadow-inner text-ubuntu-coolGrey dark:text-white appearance-none"
          >
            <option
              value="Unit of Derivative Product & Supporting"
              className="bg-white dark:bg-slate-900"
            >
              Derivative Product & Supporting
            </option>
            <option value="Unit of Cement Production" className="bg-white dark:bg-slate-900">
              Cement Production
            </option>
            <option value="Unit of Clinker Production" className="bg-white dark:bg-slate-900">
              Clinker Production
            </option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-ubuntu-warmGrey uppercase tracking-[0.2em] mb-3 ml-1">
              Equipment Name
            </label>
            <input
              required
              type="text"
              placeholder="e.g., Conveyor B1"
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-base font-bold outline-none focus:ring-2 focus:ring-ubuntu-orange/20 focus:border-ubuntu-orange transition-all shadow-inner text-ubuntu-coolGrey dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-ubuntu-warmGrey uppercase tracking-[0.2em] mb-3 ml-1">
              Area / Location
            </label>
            <input
              required
              type="text"
              placeholder="e.g., Section A"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-base font-bold outline-none focus:ring-2 focus:ring-ubuntu-orange/20 focus:border-ubuntu-orange transition-all shadow-inner text-ubuntu-coolGrey dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-ubuntu-warmGrey uppercase tracking-[0.2em] mb-3 ml-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-base font-bold outline-none focus:ring-2 focus:ring-ubuntu-orange/20 focus:border-ubuntu-orange transition-all shadow-inner text-ubuntu-coolGrey dark:text-white appearance-none"
            >
              <option value="pending" className="bg-white dark:bg-slate-900">
                Pending
              </option>
              <option value="completed" className="bg-white dark:bg-slate-900">
                Completed
              </option>
              <option value="critical" className="bg-white dark:bg-slate-900">
                Critical
              </option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-ubuntu-warmGrey uppercase tracking-[0.2em] mb-3 ml-1">
              Priority Level
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-base font-bold outline-none focus:ring-2 focus:ring-ubuntu-orange/20 focus:border-ubuntu-orange transition-all shadow-inner text-ubuntu-coolGrey dark:text-white appearance-none"
            >
              <option value="low" className="bg-white dark:bg-slate-900">
                Low
              </option>
              <option value="medium" className="bg-white dark:bg-slate-900">
                Medium
              </option>
              <option value="high" className="bg-white dark:bg-slate-900">
                High
              </option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-ubuntu-warmGrey uppercase tracking-[0.2em] mb-3 ml-1">
            Detailed Findings
          </label>
          <textarea
            required
            rows={4}
            placeholder="Describe your observations here..."
            value={formData.findings}
            onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
            className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-base font-bold outline-none focus:ring-2 focus:ring-ubuntu-orange/20 focus:border-ubuntu-orange transition-all shadow-inner text-ubuntu-coolGrey dark:text-white resize-none placeholder:text-slate-400 placeholder:italic"
          />
        </div>

        <div className="flex items-center gap-6 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-5 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-300 rounded-2xl font-bold uppercase tracking-widest hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white transition-all border border-slate-200 dark:border-white/10 shadow-sm active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-[2] py-5 bg-gradient-to-r from-ubuntu-orange to-orange-600 hover:from-orange-500 hover:to-orange-500 text-white rounded-2xl font-bold uppercase tracking-[0.2em] transition-all shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 active:scale-[0.98]"
          >
            Create Report
          </button>
        </div>
      </form>
    </div>
  );
};

export default InspectionForm;
