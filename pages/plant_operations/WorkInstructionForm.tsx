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
    <form onSubmit={handleSubmit}>
      <div className="p-6 space-y-4">
        <div>
          <label htmlFor="activity" className="block text-sm font-bold text-[#333333]">
            {t.activity}
          </label>
          <input
            type="text"
            name="activity"
            id="activity"
            value={formData.activity}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2.5 border border-[#AEA79F] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] sm:text-sm text-[#333333]"
            disabled={readOnly}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="doc_code" className="block text-sm font-bold text-[#333333]">
              {t.doc_code}
            </label>
            {/* FIX: Use snake_case for name and value */}
            <input
              type="text"
              name="doc_code"
              id="doc_code"
              value={formData.doc_code}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2.5 border border-[#AEA79F] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] sm:text-sm text-[#333333]"
              disabled={readOnly}
            />
          </div>
          <div>
            <label htmlFor="doc_title" className="block text-sm font-bold text-[#333333]">
              {t.doc_title}
            </label>
            {/* FIX: Use snake_case for name and value */}
            <input
              type="text"
              name="doc_title"
              id="doc_title"
              value={formData.doc_title}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2.5 border border-[#AEA79F] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] sm:text-sm text-[#333333]"
              disabled={readOnly}
            />
          </div>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-bold text-[#333333]">
            {t.description}
          </label>
          <textarea
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            required
            className="mt-1 block w-full px-3 py-2.5 border border-[#AEA79F] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] sm:text-sm text-[#333333]"
            disabled={readOnly}
          />
        </div>
        <div>
          <label htmlFor="link" className="block text-sm font-bold text-[#333333]">
            {t.link}
          </label>
          <input
            type="url"
            name="link"
            id="link"
            value={formData.link}
            onChange={handleChange}
            placeholder="https://example.com/doc"
            required
            className="mt-1 block w-full px-3 py-2.5 border border-[#AEA79F] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] sm:text-sm text-[#333333]"
            disabled={readOnly}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="plant_category" className="block text-sm font-bold text-[#333333]">
              Plant Category
            </label>
            <select
              name="plant_category"
              id="plant_category"
              value={formData.plant_category}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2.5 border border-[#AEA79F] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] sm:text-sm text-[#333333]"
              disabled={readOnly}
            >
              <option value="">Select Category</option>
              {[...new Set(plantUnits.map((unit) => unit.category))].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="plant_unit" className="block text-sm font-bold text-[#333333]">
              Plant Unit
            </label>
            <select
              name="plant_unit"
              id="plant_unit"
              value={formData.plant_unit}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2.5 border border-[#AEA79F] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E95420] focus:border-[#E95420] sm:text-sm text-[#333333]"
              disabled={readOnly}
            >
              <option value="">Select Unit</option>
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
      <div className="bg-[#F9F9F9] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg border-t border-[#AEA79F]/20">
        {!readOnly && (
          <button
            type="submit"
            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-[#E95420] text-base font-medium text-white hover:bg-[#d94612] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E95420] sm:ml-3 sm:w-auto sm:text-sm min-h-[44px]"
            aria-label={t.save_button || 'Save work instruction'}
          >
            {t.save_button}
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 w-full inline-flex justify-center rounded-lg border border-[#AEA79F] shadow-sm px-4 py-2.5 bg-white text-base font-medium text-[#333333] hover:bg-[#F0F0F0] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm min-h-[44px]"
          aria-label={t.cancel_button || 'Cancel'}
        >
          {t.cancel_button}
        </button>
      </div>
    </form>
  );
};

export default WorkInstructionForm;
