import React, { useState, useEffect } from 'react';
import { WorkInstruction } from '../../types';

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from '../../components/ui/EnhancedComponents';

// Import hooks
import { usePlantUnits } from '../../hooks/usePlantUnits';

interface FormProps {
  instructionToEdit: WorkInstruction | null;
  onSave: (instruction: WorkInstruction | Omit<WorkInstruction, 'id'>) => void;
  onCancel: () => void;
  t: any;
  readOnly?: boolean;
}

const WorkInstructionForm: React.FC<FormProps> = ({
  instructionToEdit,
  onSave,
  onCancel,
  t,
  readOnly = false,
}) => {
  // Enhanced accessibility hooks
  const announceToScreenReader = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  // Fetch plant units for dropdowns
  const { records: plantUnits, loading: plantUnitsLoading } = usePlantUnits();

  // FIX: Use snake_case for properties to match WorkInstruction type
  const [formData, setFormData] = useState({
    activity: '',
    doc_code: '',
    doc_title: '',
    description: '',
    link: '',
    plant_category: '',
    plant_unit: '',
  });

  useEffect(() => {
    if (instructionToEdit) {
      // FIX: Use snake_case for properties
      setFormData({
        activity: instructionToEdit.activity,
        doc_code: instructionToEdit.doc_code,
        doc_title: instructionToEdit.doc_title,
        description: instructionToEdit.description,
        link: instructionToEdit.link,
        plant_category: instructionToEdit.plant_category,
        plant_unit: instructionToEdit.plant_unit,
      });
    } else {
      setFormData({
        activity: '',
        doc_code: '',
        doc_title: '',
        description: '',
        link: '',
        plant_category: '',
        plant_unit: '',
      });
    }
  }, [instructionToEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instructionToEdit) {
      onSave({ ...instructionToEdit, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="p-5 sm:p-6 space-y-4">
        <div>
          <label
            htmlFor="activity"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
          >
            {t.activity || 'Aktivitas'}
          </label>
          <input
            type="text"
            name="activity"
            id="activity"
            value={formData.activity}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm font-medium transition-all"
            disabled={readOnly}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="doc_code"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              {t.doc_code || 'Kode Dokumen'}
            </label>
            <input
              type="text"
              name="doc_code"
              id="doc_code"
              value={formData.doc_code}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm font-medium transition-all font-mono"
              disabled={readOnly}
            />
          </div>
          <div>
            <label
              htmlFor="doc_title"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              {t.doc_title || 'Judul Dokumen'}
            </label>
            <input
              type="text"
              name="doc_title"
              id="doc_title"
              value={formData.doc_title}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm font-medium transition-all"
              disabled={readOnly}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
          >
            {t.description || 'Deskripsi'}
          </label>
          <textarea
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm font-medium transition-all"
            disabled={readOnly}
          />
        </div>
        <div>
          <label
            htmlFor="link"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
          >
            {t.link || 'Tautan Dokumen'}
          </label>
          <input
            type="url"
            name="link"
            id="link"
            value={formData.link}
            onChange={handleChange}
            placeholder="https://example.com/doc"
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm font-medium transition-all"
            disabled={readOnly}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="plant_category"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Plant Category
            </label>
            <select
              name="plant_category"
              id="plant_category"
              value={formData.plant_category}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm font-medium transition-all cursor-pointer"
              disabled={readOnly}
            >
              <option value="">Pilih Kategori</option>
              {[...new Set(plantUnits.map((unit) => unit.category))].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="plant_unit"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Plant Unit
            </label>
            <select
              name="plant_unit"
              id="plant_unit"
              value={formData.plant_unit}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm font-medium transition-all cursor-pointer"
              disabled={readOnly}
            >
              <option value="">Pilih Unit</option>
              {plantUnits
                .filter(
                  (unit) => !formData.plant_category || unit.category === formData.plant_category
                )
                .map((unit) => (
                  <option key={unit.id} value={unit.unit}>
                    {unit.unit}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3.5 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl border-t border-slate-200 dark:border-slate-700/60 gap-3">
        {!readOnly && (
          <button
            type="submit"
            className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-sm px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:w-auto min-h-[44px] transition-all"
            aria-label={t.save_button || 'Simpan Instruksi Kerja'}
          >
            {t.save_button || 'Simpan'}
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="mt-2 sm:mt-0 w-full inline-flex justify-center items-center rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm px-5 py-2.5 bg-white dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 sm:w-auto min-h-[44px] transition-all"
          aria-label={t.cancel_button || 'Batal'}
        >
          {t.cancel_button || 'Batal'}
        </button>
      </div>
    </form>
  );
};

export default WorkInstructionForm;
