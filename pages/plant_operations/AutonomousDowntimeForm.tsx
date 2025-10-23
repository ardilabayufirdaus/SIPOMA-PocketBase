import React, { useState, useEffect } from 'react';
import { CcrDowntimeData, DowntimeStatus } from '../../types';
import { formatDate } from '../../utils/formatters';

// Import Enhanced Components
import { EnhancedButton } from '../../components/ui/EnhancedComponents';

interface FormProps {
  recordToEdit: CcrDowntimeData | null;
  onSave: (record: CcrDowntimeData) => void;
  onCancel: () => void;
  t: Record<string, string>;
}

const AutonomousDowntimeForm: React.FC<FormProps> = ({ recordToEdit, onSave, onCancel, t }) => {
  const [formData, setFormData] = useState({
    action: '',
    corrective_action: '',
    status: DowntimeStatus.OPEN,
  });

  // Enhanced accessibility hooks
  // const { announceToScreenReader } = useAccessibility();

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        action: recordToEdit.action ?? '',
        corrective_action: recordToEdit.corrective_action ?? '',
        status: recordToEdit.status ?? DowntimeStatus.OPEN,
      });
    }
  }, [recordToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      <div className="backdrop-blur-md bg-white/10 dark:bg-slate-800/10 border border-white/20 dark:border-slate-700/20 rounded-2xl p-6 shadow-2xl">
        <div className="space-y-6">
          {/* Downtime Details Section */}
          <div className="backdrop-blur-sm bg-white/20 dark:bg-slate-800/20 border border-white/30 dark:border-slate-600/30 rounded-xl p-4">
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent mb-4">
              {t.downtime_details}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col space-y-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">{t.date}:</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                  {formatDate(recordToEdit.date)}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">{t.unit}:</span>
                <span className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                  {recordToEdit.unit}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {t.start_time}:
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                  {recordToEdit.start_time}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {t.end_time}:
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                  {recordToEdit.end_time}
                </span>
              </div>
              <div className="sm:col-span-2 flex flex-col space-y-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">{t.problem}:</span>
                <span className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg min-h-[2.5rem] flex items-center">
                  {recordToEdit.problem}
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="action"
                className="block text-sm font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent"
              >
                {t.action}
              </label>
              <div className="relative group">
                <textarea
                  name="action"
                  id="action"
                  value={formData.action}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-medium resize-none"
                  placeholder={t.action_placeholder || 'Enter action taken...'}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="corrective_action"
                className="block text-sm font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent"
              >
                {t.corrective_action}
              </label>
              <div className="relative group">
                <textarea
                  name="corrective_action"
                  id="corrective_action"
                  value={formData.corrective_action}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-medium resize-none"
                  placeholder={t.corrective_action_placeholder || 'Enter corrective action...'}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="status"
                className="block text-sm font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent"
              >
                {t.status}
              </label>
              <div className="relative group">
                <select
                  name="status"
                  id="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-medium appearance-none"
                >
                  {Object.values(DowntimeStatus).map((s) => (
                    <option key={s} value={s} className="bg-white dark:bg-slate-800">
                      {s}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-slate-600 dark:text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="backdrop-blur-sm bg-white/20 dark:bg-slate-800/20 border border-white/30 dark:border-slate-600/30 rounded-xl px-6 py-4 mt-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <EnhancedButton
            variant="secondary"
            size="md"
            type="button"
            onClick={onCancel}
            className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-800/70 border border-slate-200/50 dark:border-slate-600/50 rounded-xl px-6 py-2 font-medium transition-all duration-300"
            aria-label={t.cancel_button || 'Cancel downtime form'}
          >
            {t.cancel_button}
          </EnhancedButton>
          <EnhancedButton
            variant="primary"
            size="md"
            type="submit"
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            aria-label={t.save_button || 'Save downtime record'}
          >
            {t.save_button}
          </EnhancedButton>
        </div>
      </div>
    </form>
  );
};

export default AutonomousDowntimeForm;


