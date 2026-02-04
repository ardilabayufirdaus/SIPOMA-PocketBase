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
  readOnly?: boolean;
}

const AutonomousRiskForm: React.FC<FormProps> = ({
  recordToEdit,
  onSave,
  onCancel,
  t,
  plantUnits,
  readOnly = false,
}) => {
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
    <form onSubmit={handleSubmit} className="font-sans">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Basic Information Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="date"
                className="block text-sm font-bold text-ubuntu-coolGrey uppercase tracking-wider"
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
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange transition-all duration-300 hover:border-ubuntu-orange/50 text-slate-800 font-medium shadow-sm"
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="unit"
                className="block text-sm font-bold text-ubuntu-coolGrey uppercase tracking-wider"
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
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange transition-all duration-300 hover:border-ubuntu-orange/50 text-slate-800 font-medium appearance-none shadow-sm cursor-pointer"
                  disabled={readOnly}
                >
                  {plantUnits.map((unit) => (
                    <option key={unit} value={unit} className="bg-white">
                      {unit}
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

          {/* Risk Details Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="potential_disruption"
                className="block text-sm font-bold text-ubuntu-coolGrey uppercase tracking-wider"
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
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange transition-all duration-300 hover:border-ubuntu-orange/50 text-slate-800 font-medium resize-none shadow-sm"
                  placeholder={
                    t.potential_disruption_placeholder || 'Describe the potential disruption...'
                  }
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="preventive_action"
                className="block text-sm font-bold text-ubuntu-coolGrey uppercase tracking-wider"
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
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange transition-all duration-300 hover:border-ubuntu-orange/50 text-slate-800 font-medium resize-none shadow-sm"
                  placeholder={t.preventive_action_placeholder || 'Describe preventive actions...'}
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="mitigation_plan"
                className="block text-sm font-bold text-ubuntu-coolGrey uppercase tracking-wider"
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
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange transition-all duration-300 hover:border-ubuntu-orange/50 text-slate-800 font-medium resize-none shadow-sm"
                  placeholder={t.mitigation_plan_placeholder || 'Describe mitigation plan...'}
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
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-ubuntu-orange/40 focus:border-ubuntu-orange transition-all duration-300 hover:border-ubuntu-orange/50 text-slate-800 font-medium appearance-none shadow-sm cursor-pointer"
                  disabled={readOnly}
                >
                  {Object.values(RiskStatus).map((s) => (
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
            aria-label={t.cancel_button || 'Cancel risk form'}
          >
            {t.cancel_button}
          </EnhancedButton>

          {!readOnly && (
            <EnhancedButton
              variant="primary"
              size="md"
              type="submit"
              className="bg-ubuntu-orange bg-none hover:bg-[#d84615] text-white font-bold rounded-xl px-6 py-2 shadow-md hover:shadow-lg transition-all duration-200 border border-transparent"
              aria-label={t.save_button || 'Save risk record'}
            >
              {t.save_button}
            </EnhancedButton>
          )}
        </div>
      </div>
    </form>
  );
};

export default AutonomousRiskForm;
