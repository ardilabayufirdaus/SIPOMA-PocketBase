import React, { useState, useEffect } from 'react';
import { PicSetting } from '../../types';

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from '../../components/ui/EnhancedComponents';

interface FormProps {
  recordToEdit: PicSetting | null;
  onSave: (record: PicSetting | Omit<PicSetting, 'id'>) => void;
  onCancel: () => void;
  t: any;
}

const PicSettingForm: React.FC<FormProps> = ({ recordToEdit, onSave, onCancel, t }) => {
  // Enhanced accessibility hooks
  const announceToScreenReader = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  const [formData, setFormData] = useState({
    pic: '',
  });

  useEffect(() => {
    if (recordToEdit) {
      setFormData({ pic: recordToEdit.pic });
    } else {
      setFormData({ pic: '' });
    }
  }, [recordToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <div className="p-6 space-y-4">
        <div>
          <label htmlFor="pic" className="block text-sm font-medium text-slate-700">
            {t.pic}
          </label>
          <input
            type="text"
            name="pic"
            id="pic"
            value={formData.pic}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          />
        </div>
      </div>
      <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
        <EnhancedButton
          type="submit"
          variant="primary"
          className="sm:ml-3 sm:w-auto"
          aria-label={t.save_button || 'Save PIC setting'}
        >
          {t.save_button}
        </EnhancedButton>
        <EnhancedButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="mt-3 sm:mt-0 sm:ml-3 sm:w-auto"
          aria-label={t.cancel_button || 'Cancel'}
        >
          {t.cancel_button}
        </EnhancedButton>
      </div>
    </form>
  );
};

export default PicSettingForm;
