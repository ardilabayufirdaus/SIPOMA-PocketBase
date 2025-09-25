import React, { useState, useEffect } from 'react';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import { ParameterSetting, ParameterDataType } from '../../types';

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from '../../components/ui/EnhancedComponents';

interface FormProps {
  recordToEdit: ParameterSetting | null;
  onSave: (record: ParameterSetting | Omit<ParameterSetting, 'id'>) => void;
  onCancel: () => void;
  t: any;
}

const ParameterSettingForm: React.FC<FormProps> = ({ recordToEdit, onSave, onCancel, t }) => {
  // Enhanced accessibility hooks
  const announceToScreenReader = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    parameter: '',
    data_type: ParameterDataType.NUMBER,
    unit: '',
    category: '',
    min_value: undefined as number | undefined,
    max_value: undefined as number | undefined,
    opc_min_value: undefined as number | undefined,
    opc_max_value: undefined as number | undefined,
    pcc_min_value: undefined as number | undefined,
    pcc_max_value: undefined as number | undefined,
  });
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<any>({});

  // Validasi field
  const validateField = (name: string, value: any) => {
    switch (name) {
      case 'parameter':
        if (!value.trim()) return 'Parameter wajib diisi';
        if (value.length < 2) return 'Minimal 2 karakter';
        return '';
      case 'unit':
        if (!value.trim()) return 'Unit wajib diisi';
        return '';
      case 'category':
        if (!value.trim()) return 'Kategori wajib diisi';
        return '';
      case 'min_value':
        // Allow empty values (undefined/null), only validate if both values exist
        if (
          value !== undefined &&
          value !== null &&
          formData.max_value !== undefined &&
          formData.max_value !== null &&
          value > formData.max_value
        )
          return 'Min tidak boleh lebih dari Max';
        return '';
      case 'max_value':
        // Allow empty values (undefined/null), only validate if both values exist
        if (
          value !== undefined &&
          value !== null &&
          formData.min_value !== undefined &&
          formData.min_value !== null &&
          value < formData.min_value
        )
          return 'Max tidak boleh kurang dari Min';
        return '';
      case 'opc_min_value':
        // Allow empty values (undefined/null), only validate if both values exist
        if (
          value !== undefined &&
          value !== null &&
          formData.opc_max_value !== undefined &&
          formData.opc_max_value !== null &&
          value > formData.opc_max_value
        )
          return 'OPC Min tidak boleh lebih dari OPC Max';
        return '';
      case 'opc_max_value':
        // Allow empty values (undefined/null), only validate if both values exist
        if (
          value !== undefined &&
          value !== null &&
          formData.opc_min_value !== undefined &&
          formData.opc_min_value !== null &&
          value < formData.opc_min_value
        )
          return 'OPC Max tidak boleh kurang dari OPC Min';
        return '';
      case 'pcc_min_value':
        // Allow empty values (undefined/null), only validate if both values exist
        if (
          value !== undefined &&
          value !== null &&
          formData.pcc_max_value !== undefined &&
          formData.pcc_max_value !== null &&
          value > formData.pcc_max_value
        )
          return 'PCC Min tidak boleh lebih dari PCC Max';
        return '';
      case 'pcc_max_value':
        // Allow empty values (undefined/null), only validate if both values exist
        if (
          value !== undefined &&
          value !== null &&
          formData.pcc_min_value !== undefined &&
          formData.pcc_min_value !== null &&
          value < formData.pcc_min_value
        )
          return 'PCC Max tidak boleh kurang dari PCC Min';
        return '';
      default:
        return '';
    }
  };

  // Validasi sebelum submit
  const validateForm = () => {
    const newErrors: any = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, (formData as any)[key]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const processedValue =
      type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value;
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
    setTouched((prev: any) => ({ ...prev, [name]: true }));
    // Pass the processed value to validateField, not the raw string value
    setErrors((prev: any) => ({ ...prev, [name]: validateField(name, processedValue) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      // Focus ke field error pertama
      const firstErrorKey = Object.keys(errors)[0];
      if (formRef.current && firstErrorKey) {
        const el = formRef.current.querySelector(`[name='${firstErrorKey}']`);
        if (el) (el as HTMLElement).focus();
      }
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      if (recordToEdit) {
        onSave({ ...recordToEdit, ...formData });
      } else {
        onSave(formData);
      }
      setIsSubmitting(false);
    }, 1000); // simulasi loading
  };

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        parameter: recordToEdit.parameter,
        data_type: recordToEdit.data_type,
        unit: recordToEdit.unit,
        category: recordToEdit.category,
        min_value: recordToEdit.min_value ?? undefined,
        max_value: recordToEdit.max_value ?? undefined,
        opc_min_value: recordToEdit.opc_min_value ?? undefined,
        opc_max_value: recordToEdit.opc_max_value ?? undefined,
        pcc_min_value: recordToEdit.pcc_min_value ?? undefined,
        pcc_max_value: recordToEdit.pcc_max_value ?? undefined,
      });
    } else {
      setFormData({
        parameter: '',
        data_type: ParameterDataType.NUMBER,
        unit: '',
        category: '',
        min_value: undefined,
        max_value: undefined,
        opc_min_value: undefined,
        opc_max_value: undefined,
        pcc_min_value: undefined,
        pcc_max_value: undefined,
      });
    }
  }, [recordToEdit]);

  const { records: plantUnits, loading: plantUnitsLoading } = usePlantUnits();

  // Get unique units and categories from plantUnits
  const unitOptions = Array.from(new Set(plantUnits.map((u) => u.unit)));
  const categoryOptions = Array.from(new Set(plantUnits.map((u) => u.category)));

  return (
    <form ref={formRef} onSubmit={handleSubmit} aria-label="Parameter Setting Form">
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <div className="sm:col-span-2">
          <label htmlFor="parameter" className="block text-sm font-medium text-slate-700">
            {t.parameter_label}
          </label>
          <input
            type="text"
            name="parameter"
            id="parameter"
            value={formData.parameter}
            onChange={handleChange}
            required
            aria-invalid={!!errors.parameter}
            aria-describedby={errors.parameter ? 'parameter-error' : undefined}
            className={`mt-1 block w-full px-3 py-2 bg-white border ${
              errors.parameter ? 'border-red-500' : 'border-slate-300'
            } rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
          />
          {errors.parameter && touched.parameter && (
            <p id="parameter-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.parameter}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="data_type" className="block text-sm font-medium text-slate-700">
            {t.data_type_label}
          </label>
          <select
            name="data_type"
            id="data_type"
            value={formData.data_type}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 bg-white text-base border-slate-300 text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
          >
            {Object.values(ParameterDataType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-slate-700">
            {t.unit_label_param}
          </label>
          <select
            name="unit"
            id="unit"
            value={formData.unit}
            onChange={handleChange}
            required
            aria-invalid={!!errors.unit}
            aria-describedby={errors.unit ? 'unit-error' : undefined}
            className={`mt-1 block w-full pl-3 pr-10 py-2 bg-white text-base border ${
              errors.unit ? 'border-red-500' : 'border-slate-300'
            } text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md`}
          >
            <option value="" disabled>
              {plantUnitsLoading ? t.loading : t.select_unit}
            </option>
            {unitOptions.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
          {errors.unit && touched.unit && (
            <p id="unit-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.unit}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="category" className="block text-sm font-medium text-slate-700">
            {t.category_label}
          </label>
          <select
            name="category"
            id="category"
            value={formData.category}
            onChange={handleChange}
            required
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? 'category-error' : undefined}
            className={`mt-1 block w-full pl-3 pr-10 py-2 bg-white text-base border ${
              errors.category ? 'border-red-500' : 'border-slate-300'
            } text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md`}
          >
            <option value="" disabled>
              {plantUnitsLoading ? t.loading : t.select_category}
            </option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && touched.category && (
            <p id="category-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.category}
            </p>
          )}
        </div>
        {formData.data_type === ParameterDataType.NUMBER && (
          <>
            <div>
              <label htmlFor="min_value" className="block text-sm font-medium text-slate-700">
                {t.min_value_label}
              </label>
              <input
                type="number"
                name="min_value"
                id="min_value"
                value={formData.min_value ?? ''}
                onChange={handleChange}
                aria-invalid={!!errors.min_value}
                aria-describedby={errors.min_value ? 'min_value-error' : undefined}
                className={`mt-1 block w-full px-3 py-2 bg-white border ${
                  errors.min_value ? 'border-red-500' : 'border-slate-300'
                } rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
              />
              {errors.min_value && touched.min_value && (
                <p id="min_value-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.min_value}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="max_value" className="block text-sm font-medium text-slate-700">
                {t.max_value_label}
              </label>
              <input
                type="number"
                name="max_value"
                id="max_value"
                value={formData.max_value ?? ''}
                onChange={handleChange}
                aria-invalid={!!errors.max_value}
                aria-describedby={errors.max_value ? 'max_value-error' : undefined}
                className={`mt-1 block w-full px-3 py-2 bg-white border ${
                  errors.max_value ? 'border-red-500' : 'border-slate-300'
                } rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
              />
              {errors.max_value && touched.max_value && (
                <p id="max_value-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.max_value}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <h4 className="text-md font-medium text-slate-900 mb-2">OPC Cement Settings</h4>
            </div>
            <div>
              <label htmlFor="opc_min_value" className="block text-sm font-medium text-slate-700">
                OPC Min Value
              </label>
              <input
                type="number"
                name="opc_min_value"
                id="opc_min_value"
                value={formData.opc_min_value ?? ''}
                onChange={handleChange}
                aria-invalid={!!errors.opc_min_value}
                aria-describedby={errors.opc_min_value ? 'opc_min_value-error' : undefined}
                className={`mt-1 block w-full px-3 py-2 bg-white border ${
                  errors.opc_min_value ? 'border-red-500' : 'border-slate-300'
                } rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
              />
              {errors.opc_min_value && touched.opc_min_value && (
                <p id="opc_min_value-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.opc_min_value}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="opc_max_value" className="block text-sm font-medium text-slate-700">
                OPC Max Value
              </label>
              <input
                type="number"
                name="opc_max_value"
                id="opc_max_value"
                value={formData.opc_max_value ?? ''}
                onChange={handleChange}
                aria-invalid={!!errors.opc_max_value}
                aria-describedby={errors.opc_max_value ? 'opc_max_value-error' : undefined}
                className={`mt-1 block w-full px-3 py-2 bg-white border ${
                  errors.opc_max_value ? 'border-red-500' : 'border-slate-300'
                } rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
              />
              {errors.opc_max_value && touched.opc_max_value && (
                <p id="opc_max_value-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.opc_max_value}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <h4 className="text-md font-medium text-slate-900 mb-2">PCC Cement Settings</h4>
            </div>
            <div>
              <label htmlFor="pcc_min_value" className="block text-sm font-medium text-slate-700">
                PCC Min Value
              </label>
              <input
                type="number"
                name="pcc_min_value"
                id="pcc_min_value"
                value={formData.pcc_min_value ?? ''}
                onChange={handleChange}
                aria-invalid={!!errors.pcc_min_value}
                aria-describedby={errors.pcc_min_value ? 'pcc_min_value-error' : undefined}
                className={`mt-1 block w-full px-3 py-2 bg-white border ${
                  errors.pcc_min_value ? 'border-red-500' : 'border-slate-300'
                } rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
              />
              {errors.pcc_min_value && touched.pcc_min_value && (
                <p id="pcc_min_value-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.pcc_min_value}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="pcc_max_value" className="block text-sm font-medium text-slate-700">
                PCC Max Value
              </label>
              <input
                type="number"
                name="pcc_max_value"
                id="pcc_max_value"
                value={formData.pcc_max_value ?? ''}
                onChange={handleChange}
                aria-invalid={!!errors.pcc_max_value}
                aria-describedby={errors.pcc_max_value ? 'pcc_max_value-error' : undefined}
                className={`mt-1 block w-full px-3 py-2 bg-white border ${
                  errors.pcc_max_value ? 'border-red-500' : 'border-slate-300'
                } rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
              />
              {errors.pcc_max_value && touched.pcc_max_value && (
                <p id="pcc_max_value-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.pcc_max_value}
                </p>
              )}
            </div>
          </>
        )}
      </div>
      <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
        {isSubmitting && (
          <div className="w-full flex justify-center items-center mb-2">
            <span className="animate-spin h-5 w-5 mr-2 border-2 border-red-500 border-t-transparent rounded-full inline-block"></span>
            <span className="text-red-600">Menyimpan...</span>
          </div>
        )}
        <EnhancedButton
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="sm:ml-3 sm:w-auto"
          aria-label={t.save_button || 'Save parameter setting'}
        >
          {t.save_button}
        </EnhancedButton>
        <EnhancedButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
          className="mt-3 sm:mt-0 sm:ml-3 sm:w-auto"
          aria-label={t.cancel_button || 'Cancel'}
        >
          {t.cancel_button}
        </EnhancedButton>
      </div>
    </form>
  );
};

export default ParameterSettingForm;
