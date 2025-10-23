import React, { useState, useEffect } from 'react';
import { AutonomousRiskData, RiskStatus } from '../../types';

// Import Enhanced Components
import { EnhancedButton } from '../../components/ui/EnhancedComponents';

interface FormProps {
  recordToEdit: AutonomousRiskData | null;
  onSave: (record: AutonomousRiskData | Omit<AutonomousRiskData, 'id'>) => void;
  onCancel: () => void;
  t: Record<string, string>;
  plantUnits: string[];
}

const AutonomousRiskForm: React.FC<FormProps> = ({
  recordToEdit,
  onSave,
  onCancel,
  t,
  plantUnits,
}) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    unit: plantUnits[0] || '',
    potential_disruption: '',
    preventive_action: '',
    mitigation_plan: '',
    status: RiskStatus.IDENTIFIED,
  });

  // Enhanced accessibility hooks
  // const { announceToScreenReader } = useAccessibility();
  // const isHighContrast = useHighContrast();
  // const prefersReducedMotion = useReducedMotion();
  // const colorScheme = useColorScheme();

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      <div className="backdrop-blur-md bg-white/10 dark:bg-slate-800/10 border border-white/20 dark:border-slate-700/20 rounded-2xl p-6 shadow-2xl">
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="date"
                className="block text-sm font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent"
              >
                {t.date}
              </label>
              <div className="relative group">
                <input
                  type="date"
                  name="date"
                  id="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-medium"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-fire opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="unit"
                className="block text-sm font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent"
              >
                {t.unit}
              </label>
              <div className="relative group">
                <select
                  name="unit"
                  id="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-medium appearance-none"
                >
                  {plantUnits.map((unit) => (
                    <option key={unit} value={unit} className="bg-white dark:bg-slate-800">
                      {unit}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-0 rounded-xl bg-gradient-fire opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
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

          {/* Risk Details Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="potential_disruption"
                className="block text-sm font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent"
              >
                {t.potential_disruption}
              </label>
              <div className="relative group">
                <textarea
                  name="potential_disruption"
                  id="potential_disruption"
                  value={formData.potential_disruption}
                  onChange={handleChange}
                  rows={3}
                  required
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-medium resize-none"
                  placeholder={
                    t.potential_disruption_placeholder || 'Describe the potential disruption...'
                  }
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-fire opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="preventive_action"
                className="block text-sm font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent"
              >
                {t.preventive_action}
              </label>
              <div className="relative group">
                <textarea
                  name="preventive_action"
                  id="preventive_action"
                  value={formData.preventive_action}
                  onChange={handleChange}
                  rows={3}
                  required
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-medium resize-none"
                  placeholder={t.preventive_action_placeholder || 'Describe preventive actions...'}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-fire opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="mitigation_plan"
                className="block text-sm font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent"
              >
                {t.risk_mitigation_plan}
              </label>
              <div className="relative group">
                <textarea
                  name="mitigation_plan"
                  id="mitigation_plan"
                  value={formData.mitigation_plan}
                  onChange={handleChange}
                  rows={3}
                  required
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-medium resize-none"
                  placeholder={t.mitigation_plan_placeholder || 'Describe mitigation plan...'}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-fire opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
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
                  required
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-medium appearance-none"
                >
                  {Object.values(RiskStatus).map((s) => (
                    <option key={s} value={s} className="bg-white dark:bg-slate-800">
                      {s}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
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
            aria-label={t.cancel_button || 'Cancel risk form'}
          >
            {t.cancel_button}
          </EnhancedButton>
          <EnhancedButton
            variant="primary"
            size="md"
            type="submit"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            aria-label={t.save_button || 'Save risk record'}
          >
            {t.save_button}
          </EnhancedButton>
        </div>
      </div>
    </form>
  );
};

export default AutonomousRiskForm;


