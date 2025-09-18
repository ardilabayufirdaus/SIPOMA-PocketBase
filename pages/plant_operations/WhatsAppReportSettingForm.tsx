import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WhatsAppReportSetting, ParameterSetting, ParameterDataType, PlantUnit } from '../../types';

// Import Enhanced Components
import { EnhancedButton, useAccessibility } from '../../components/ui/EnhancedComponents';
import { usePlantUnits } from '../../hooks/usePlantUnits';

interface FormProps {
  recordToEdit: WhatsAppReportSetting | null;
  onSave: (record: WhatsAppReportSetting | Omit<WhatsAppReportSetting, 'id'>) => void;
  onCancel: () => void;
  t: Record<string, string>;
  allParameters: ParameterSetting[];
  existingSettings: WhatsAppReportSetting[];
  plantCategories: string[];
}

interface FormData {
  jenis: 'text' | 'number' | 'unit_name' | 'material' | 'feeder' | 'downtime' | 'silo' | 'summary';
  parameter_id: string;
  data: string;
  category: string;
  plant_unit: string;
  report_type: 'daily' | 'shift';
  kalkulasi: 'selisih' | 'total' | 'average' | 'min' | 'max' | 'counter_total';
}

interface ValidationErrors {
  jenis?: string;
  parameter_id?: string;
  data?: string;
  category?: string;
  plant_unit?: string;
  report_type?: string;
  kalkulasi?: string;
}

const WhatsAppReportSettingForm: React.FC<FormProps> = ({
  recordToEdit,
  onSave,
  onCancel,
  t,
  allParameters,
  existingSettings,
  plantCategories,
}) => {
  // Enhanced accessibility hooks
  const { announceToScreenReader } = useAccessibility();

  // Get plant units data
  const { records: plantUnits } = usePlantUnits();

  // State management
  const [formData, setFormData] = useState<FormData>({
    jenis: 'text',
    parameter_id: '',
    data: '',
    category: '',
    plant_unit: '',
    report_type: 'daily',
    kalkulasi: 'total',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Filter plant units based on selected category
  const filteredPlantUnits = useMemo(() => {
    if (!formData.category) return [];
    return plantUnits.filter((unit) => unit.category === formData.category);
  }, [plantUnits, formData.category]);

  // Initialize form data when editing
  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        jenis: recordToEdit.jenis,
        parameter_id: recordToEdit.parameter_id || '',
        data: recordToEdit.data,
        category: recordToEdit.category,
        plant_unit: recordToEdit.plant_unit || '',
        report_type: recordToEdit.report_type || 'daily',
        kalkulasi: recordToEdit.kalkulasi || 'total',
      });
    } else {
      setFormData({
        jenis: 'text',
        parameter_id: '',
        data: '',
        category: '',
        plant_unit: '',
        report_type: 'daily',
        kalkulasi: 'total',
      });
    }
    setErrors({});
    setTouched({});
  }, [recordToEdit]);

  // Available parameters calculation with memoization
  const availableParameters = useMemo(() => {
    return allParameters
      .filter((p) => p.data_type === ParameterDataType.NUMBER)
      .filter(
        (p) =>
          !existingSettings.some(
            (s) =>
              s.parameter_id === p.id &&
              s.report_type === formData.report_type &&
              s.category === formData.category
          ) || p.id === recordToEdit?.parameter_id
      );
  }, [
    allParameters,
    existingSettings,
    recordToEdit?.parameter_id,
    formData.report_type,
    formData.category,
  ]);

  // Validation functions
  const validateField = useCallback(
    (name: keyof FormData, value: string): string => {
      switch (name) {
        case 'jenis':
          if (!value) return 'Jenis is required';
          if (
            ![
              'text',
              'number',
              'unit_name',
              'material',
              'feeder',
              'downtime',
              'silo',
              'summary',
            ].includes(value)
          )
            return 'Invalid jenis selected';
          return '';
        case 'parameter_id':
          if (formData.jenis === 'number' && !value) return 'Parameter is required for number type';
          if (formData.jenis === 'number' && !availableParameters.find((p) => p.id === value))
            return 'Selected parameter is not available';
          return '';
        case 'data':
          if (formData.jenis === 'text' && !value.trim()) return 'Data is required for text type';
          if (formData.jenis === 'text' && value.trim().length > 500)
            return 'Data must be less than 500 characters';
          return '';
        case 'category':
          if (!value.trim()) return 'Category is required';
          if (value.trim().length < 2) return 'Category must be at least 2 characters';
          if (value.trim().length > 50) return 'Category must be less than 50 characters';
          return '';
        case 'plant_unit':
          // Plant unit is optional, but if provided should be valid
          if (value.trim() && value.trim().length > 50)
            return 'Plant unit must be less than 50 characters';
          return '';
        case 'report_type':
          if (!value) return 'Report type is required';
          if (!['daily', 'shift'].includes(value)) return 'Invalid report type selected';
          return '';
        case 'kalkulasi':
          if (formData.jenis === 'number' && !value) return 'Kalkulasi is required for number type';
          if (
            formData.jenis === 'number' &&
            !['selisih', 'total', 'average', 'min', 'max', 'counter_total'].includes(value)
          )
            return 'Invalid kalkulasi selected';
          return '';
        default:
          return '';
      }
    },
    [formData.jenis, availableParameters]
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    (Object.keys(formData) as (keyof FormData)[]).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    // Additional validation for duplicate parameter in same report_type and category
    if (formData.jenis === 'number' && formData.parameter_id) {
      const duplicateSetting = existingSettings.find(
        (s) =>
          s.parameter_id === formData.parameter_id &&
          s.report_type === formData.report_type &&
          s.category === formData.category &&
          s.id !== recordToEdit?.id
      );

      if (duplicateSetting) {
        newErrors.parameter_id = `This parameter is already used in ${formData.report_type} report for ${formData.category} category`;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField, existingSettings, recordToEdit?.id]);

  // Event handlers
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Clear parameter_id if switching to text type
      if (name === 'jenis' && value === 'text') {
        setFormData((prev) => ({ ...prev, parameter_id: '' }));
      }

      // Clear errors for this field
      if (errors[name as keyof ValidationErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));

      const error = validateField(name as keyof FormData, formData[name as keyof FormData]);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [formData, validateField]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        announceToScreenReader('Form has validation errors. Please correct them and try again.');
        return;
      }

      setIsSubmitting(true);

      try {
        const submitData = {
          jenis: formData.jenis,
          parameter_id: formData.jenis === 'number' ? formData.parameter_id : undefined,
          data: formData.data,
          category: formData.category,
          plant_unit: formData.plant_unit || undefined,
          report_type: formData.report_type,
          kalkulasi: formData.jenis === 'number' ? formData.kalkulasi : undefined,
        };

        if (recordToEdit) {
          onSave({ ...submitData, id: recordToEdit.id });
        } else {
          onSave(submitData);
        }

        announceToScreenReader(
          recordToEdit ? 'Report setting updated successfully' : 'Report setting added successfully'
        );
      } catch (error) {
        console.error('Error saving report setting:', error);
        announceToScreenReader('Error saving report setting. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, recordToEdit, validateForm, onSave, announceToScreenReader]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-50 dark:bg-slate-700 px-4 py-3 sm:px-6 rounded-t-lg border-b border-slate-200 dark:border-slate-600">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
          {recordToEdit ? t.edit_report_parameter_title : t.add_report_parameter_title}
        </h3>
      </div>

      <div className="px-4 py-3 sm:px-6 space-y-6">
        {/* Jenis Field */}
        <div>
          <label
            htmlFor="jenis"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Jenis <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            name="jenis"
            id="jenis"
            value={formData.jenis}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            disabled={isSubmitting}
            aria-describedby={errors.jenis ? 'jenis-error' : undefined}
            aria-invalid={!!errors.jenis}
            className={`mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-800 text-base border text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed ${
              errors.jenis
                ? 'border-red-500 dark:border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            <option value="text">Text (Custom Text)</option>
            <option value="number">Number (Parameter Data)</option>
            <option value="unit_name">Unit Name (Custom Unit Display)</option>
            <option value="material">Material (Consumption Data)</option>
            <option value="feeder">Feeder (Feeder Settings)</option>
            <option value="downtime">Downtime (Downtime Information)</option>
            <option value="silo">Silo (Silo Status)</option>
            <option value="summary">Summary (Report Summary)</option>
          </select>
          {errors.jenis && touched.jenis && (
            <p
              id="jenis-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.jenis}
            </p>
          )}
        </div>

        {/* Report Type Field */}
        <div>
          <label
            htmlFor="report_type"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Tipe Laporan <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            name="report_type"
            id="report_type"
            value={formData.report_type}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            disabled={isSubmitting}
            aria-describedby={errors.report_type ? 'report_type-error' : undefined}
            aria-invalid={!!errors.report_type}
            className={`mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-800 text-base border text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed ${
              errors.report_type
                ? 'border-red-500 dark:border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            <option value="daily">Daily Report</option>
            <option value="shift">Shift Report</option>
          </select>
          {errors.report_type && touched.report_type && (
            <p
              id="report_type-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.report_type}
            </p>
          )}
        </div>

        {/* Parameter Field - Only show for number type */}
        {formData.jenis === 'number' && (
          <div>
            <label
              htmlFor="parameter_id"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              {t.parameter_select_label}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              name="parameter_id"
              id="parameter_id"
              value={formData.parameter_id}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              disabled={availableParameters.length === 0 || isSubmitting}
              aria-describedby={errors.parameter_id ? 'parameter_id-error' : undefined}
              aria-invalid={!!errors.parameter_id}
              className={`mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-800 text-base border text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed ${
                errors.parameter_id
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              <option value="">
                {availableParameters.length === 0
                  ? 'No parameters available'
                  : 'Select a parameter...'}
              </option>
              {availableParameters.map((param) => (
                <option key={param.id} value={param.id}>
                  {param.parameter} - {param.category} ({param.unit})
                </option>
              ))}
            </select>
            {availableParameters.length === 0 && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                {allParameters.filter((p) => p.data_type === ParameterDataType.NUMBER).length === 0
                  ? 'No numeric parameters available. Please configure parameters in Master Data first.'
                  : `All numeric parameters are already used in ${formData.report_type} reports for ${formData.category} category.`}
              </p>
            )}
            {errors.parameter_id && touched.parameter_id && (
              <p
                id="parameter_id-error"
                className="mt-1 text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {errors.parameter_id}
              </p>
            )}
          </div>
        )}

        {/* Kalkulasi Field - Only show for number type */}
        {formData.jenis === 'number' && (
          <div>
            <label
              htmlFor="kalkulasi"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Kalkulasi
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              name="kalkulasi"
              id="kalkulasi"
              value={formData.kalkulasi}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              disabled={isSubmitting}
              aria-describedby={errors.kalkulasi ? 'kalkulasi-error' : undefined}
              aria-invalid={!!errors.kalkulasi}
              className={`mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-800 text-base border text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed ${
                errors.kalkulasi
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              <option value="selisih">Selisih</option>
              <option value="total">Total</option>
              <option value="average">Average</option>
              <option value="min">Min</option>
              <option value="max">Max</option>
              <option value="counter_total">Counter Total</option>
            </select>
            {errors.kalkulasi && touched.kalkulasi && (
              <p
                id="kalkulasi-error"
                className="mt-1 text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {errors.kalkulasi}
              </p>
            )}
          </div>
        )}

        {/* Data Field */}
        <div>
          <label
            htmlFor="data"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Data {formData.jenis === 'text' && <span className="text-red-500 ml-1">*</span>}
          </label>
          {formData.jenis === 'text' ? (
            <textarea
              name="data"
              id="data"
              value={formData.data}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              disabled={isSubmitting}
              rows={3}
              placeholder="Enter manual text data..."
              aria-describedby={errors.data ? 'data-error' : undefined}
              aria-invalid={!!errors.data}
              className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md shadow-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed ${
                errors.data
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            />
          ) : (
            <div>
              <input
                type="text"
                name="data"
                id="data"
                value={formData.data}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="Masukkan label data bebas (opsional)"
                aria-describedby={errors.data ? 'data-error' : undefined}
                aria-invalid={!!errors.data}
                className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md shadow-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed ${
                  errors.data
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Masukkan label bebas sesuai kebutuhan report Anda.
              </p>
            </div>
          )}
          {errors.data && touched.data && (
            <p id="data-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.data}
            </p>
          )}
        </div>

        {/* Category Field */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t.plant_category_label}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            name="category"
            id="category"
            value={formData.category}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            disabled={isSubmitting}
            aria-describedby={errors.category ? 'category-error' : undefined}
            aria-invalid={!!errors.category}
            className={`mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-800 text-base border text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed ${
              errors.category
                ? 'border-red-500 dark:border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            <option value="">
              {plantCategories.length === 0
                ? 'No plant categories available'
                : 'Select a plant category...'}
            </option>
            {plantCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {plantCategories.length === 0 && (
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
              No plant categories available. Please configure plant units in Master Data first.
            </p>
          )}
          {errors.category && touched.category && (
            <p
              id="category-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.category}
            </p>
          )}
        </div>

        {/* Plant Unit Field */}
        <div>
          <label
            htmlFor="plant_unit"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Plant Unit
          </label>
          <select
            name="plant_unit"
            id="plant_unit"
            value={formData.plant_unit}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-describedby={errors.plant_unit ? 'plant_unit-error' : undefined}
            aria-invalid={!!errors.plant_unit}
            className={`mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-800 text-base border text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed ${
              errors.plant_unit
                ? 'border-red-500 dark:border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            <option value="">All Units (Optional)</option>
            {filteredPlantUnits.map((unit) => (
              <option key={unit.id} value={unit.unit}>
                {unit.unit} - {unit.category}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Leave empty to apply to all units in the selected category, or select specific unit.
          </p>
          {errors.plant_unit && touched.plant_unit && (
            <p
              id="plant_unit-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.plant_unit}
            </p>
          )}
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg border-t border-slate-200 dark:border-slate-600">
        <EnhancedButton
          type="submit"
          variant="primary"
          disabled={
            isSubmitting || (availableParameters.length === 0 && formData.jenis === 'number')
          }
          loading={isSubmitting}
          loadingText={recordToEdit ? 'Updating...' : 'Saving...'}
          className="sm:ml-3 sm:w-auto"
          aria-label={
            recordToEdit ? t.save_button || 'Update report setting' : 'Add report setting'
          }
        >
          {recordToEdit ? t.save_button : 'Add Setting'}
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

export default WhatsAppReportSettingForm;
