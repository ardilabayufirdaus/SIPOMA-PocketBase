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
  readOnly?: boolean;
}

const AutonomousDowntimeForm: React.FC<FormProps> = ({
  recordToEdit,
  onSave,
  onCancel,
  t,
  readOnly = false,
}) => {
  const [formData, setFormData] = useState({
    action: '',
    corrective_action: '',
    status: DowntimeStatus.OPEN,
  });

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
    <form onSubmit={handleSubmit} className="font-sans">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Downtime Details Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-lg font-bold text-ubuntu-aubergine mb-4">{t.downtime_details}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col space-y-1">
                <span className="text-ubuntu-coolGrey font-bold">{t.date}:</span>
                <span className="text-slate-800 font-mono bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                  {formatDate(recordToEdit.date)}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-ubuntu-coolGrey font-bold">{t.unit}:</span>
                <span className="text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                  {recordToEdit.unit}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-ubuntu-coolGrey font-bold">{t.start_time}:</span>
                <span className="text-slate-800 font-mono bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                  {recordToEdit.start_time}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-ubuntu-coolGrey font-bold">{t.end_time}:</span>
                <span className="text-slate-800 font-mono bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                  {recordToEdit.end_time}
                </span>
              </div>
              <div className="sm:col-span-2 flex flex-col space-y-1">
                <span className="text-ubuntu-coolGrey font-bold">{t.problem}:</span>
                <span className="text-slate-800 bg-white border border-slate-200 px-3 py-2 rounded-lg min-h-[2.5rem] flex items-center shadow-sm">
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
                className="block text-sm font-bold text-ubuntu-coolGrey uppercase tracking-wider"
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
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange transition-all duration-300 hover:border-ubuntu-orange/50 text-slate-800 font-medium resize-none shadow-sm"
                  placeholder={t.action_placeholder || 'Enter action taken...'}
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="corrective_action"
                className="block text-sm font-bold text-ubuntu-coolGrey uppercase tracking-wider"
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
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange transition-all duration-300 hover:border-ubuntu-orange/50 text-slate-800 font-medium resize-none shadow-sm"
                  placeholder={t.corrective_action_placeholder || 'Enter corrective action...'}
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="status"
                className="block text-sm font-bold text-ubuntu-coolGrey uppercase tracking-wider"
              >
                {t.status}
              </label>
              <div className="relative group">
                <select
                  name="status"
                  id="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange transition-all duration-300 hover:border-ubuntu-orange/50 text-slate-800 font-medium appearance-none shadow-sm cursor-pointer"
                  disabled={readOnly}
                >
                  {Object.values(DowntimeStatus).map((s) => (
                    <option key={s} value={s} className="bg-white">
                      {s}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Action Buttons */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row sm:justify-end gap-3">
          <EnhancedButton
            variant="secondary"
            size="md"
            type="button"
            onClick={onCancel}
            className="bg-white hover:bg-slate-100 border border-ubuntu-warmGrey/60 text-ubuntu-coolGrey font-bold rounded-xl px-6 py-2 transition-all duration-200 bg-none shadow-sm hover:shadow"
            aria-label={t.cancel_button || 'Cancel downtime form'}
          >
            {t.cancel_button}
          </EnhancedButton>

          {!readOnly && (
            <EnhancedButton
              variant="primary"
              size="md"
              type="submit"
              className="bg-ubuntu-orange bg-none hover:bg-[#d84615] text-white font-bold rounded-xl px-6 py-2 shadow-md hover:shadow-lg transition-all duration-200 border border-transparent"
              aria-label={t.save_button || 'Save downtime record'}
            >
              {t.save_button}
            </EnhancedButton>
          )}
        </div>
      </div>
    </form>
  );
};

export default AutonomousDowntimeForm;
