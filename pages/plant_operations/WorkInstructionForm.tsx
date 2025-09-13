import React, { useState, useEffect } from "react";
import { WorkInstruction } from "../../types";

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from "../../components/ui/EnhancedComponents";

interface FormProps {
  instructionToEdit: WorkInstruction | null;
  onSave: (instruction: WorkInstruction | Omit<WorkInstruction, "id">) => void;
  onCancel: () => void;
  t: any;
}

const WorkInstructionForm: React.FC<FormProps> = ({
  instructionToEdit,
  onSave,
  onCancel,
  t,
}) => {
  // Enhanced accessibility hooks
  const announceToScreenReader = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  // FIX: Use snake_case for properties to match WorkInstruction type
  const [formData, setFormData] = useState({
    activity: "",
    doc_code: "",
    doc_title: "",
    description: "",
    link: "",
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
      });
    } else {
      setFormData({
        activity: "",
        doc_code: "",
        doc_title: "",
        description: "",
        link: "",
      });
    }
  }, [instructionToEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
          <label
            htmlFor="activity"
            className="block text-sm font-medium text-slate-700"
          >
            {t.activity}
          </label>
          <input
            type="text"
            name="activity"
            id="activity"
            value={formData.activity}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="doc_code"
              className="block text-sm font-medium text-slate-700"
            >
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
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="doc_title"
              className="block text-sm font-medium text-slate-700"
            >
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
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700"
          >
            {t.description}
          </label>
          <textarea
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="link"
            className="block text-sm font-medium text-slate-700"
          >
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
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          />
        </div>
      </div>
      <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
        <EnhancedButton
          type="submit"
          variant="primary"
          className="sm:ml-3 sm:w-auto"
          aria-label={t.save_button || "Save work instruction"}
        >
          {t.save_button}
        </EnhancedButton>
        <EnhancedButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="mt-3 sm:mt-0 sm:ml-3 sm:w-auto"
          aria-label={t.cancel_button || "Cancel"}
        >
          {t.cancel_button}
        </EnhancedButton>
      </div>
    </form>
  );
};

export default WorkInstructionForm;
