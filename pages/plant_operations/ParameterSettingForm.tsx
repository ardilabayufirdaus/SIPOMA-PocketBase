import React, { useState, useEffect } from "react";
import { usePlantUnits } from "../../hooks/usePlantUnits";
import { ParameterSetting, ParameterDataType } from "../../types";

interface FormProps {
  recordToEdit: ParameterSetting | null;
  onSave: (record: ParameterSetting | Omit<ParameterSetting, "id">) => void;
  onCancel: () => void;
  t: any;
}

const ParameterSettingForm: React.FC<FormProps> = ({
  recordToEdit,
  onSave,
  onCancel,
  t,
}) => {
  const [formData, setFormData] = useState({
    parameter: "",
    data_type: ParameterDataType.NUMBER,
    unit: "",
    category: "",
    min_value: undefined as number | undefined,
    max_value: undefined as number | undefined,
  });

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        parameter: recordToEdit.parameter,
        data_type: recordToEdit.data_type,
        unit: recordToEdit.unit,
        category: recordToEdit.category,
        min_value: recordToEdit.min_value,
        max_value: recordToEdit.max_value,
      });
    } else {
      setFormData({
        parameter: "",
        data_type: ParameterDataType.NUMBER,
        unit: "",
        category: "",
        min_value: undefined,
        max_value: undefined,
      });
    }
  }, [recordToEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? value === ""
            ? undefined
            : parseFloat(value)
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recordToEdit) {
      onSave({ ...recordToEdit, ...formData });
    } else {
      onSave(formData);
    }
  };

  const { records: plantUnits, loading: plantUnitsLoading } = usePlantUnits();

  // Get unique units and categories from plantUnits
  const unitOptions = Array.from(new Set(plantUnits.map((u) => u.unit)));
  const categoryOptions = Array.from(
    new Set(plantUnits.map((u) => u.category))
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <div className="sm:col-span-2">
          <label
            htmlFor="parameter"
            className="block text-sm font-medium text-slate-700"
          >
            {t.parameter_label}
          </label>
          <input
            type="text"
            name="parameter"
            id="parameter"
            value={formData.parameter}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="data_type"
            className="block text-sm font-medium text-slate-700"
          >
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
          <label
            htmlFor="unit"
            className="block text-sm font-medium text-slate-700"
          >
            {t.unit_label_param}
          </label>
          <select
            name="unit"
            id="unit"
            value={formData.unit}
            onChange={handleChange}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 bg-white text-base border-slate-300 text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
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
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="category"
            className="block text-sm font-medium text-slate-700"
          >
            {t.category_label}
          </label>
          <select
            name="category"
            id="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 bg-white text-base border-slate-300 text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
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
        </div>
        {formData.data_type === ParameterDataType.NUMBER && (
          <>
            <div>
              <label
                htmlFor="min_value"
                className="block text-sm font-medium text-slate-700"
              >
                {t.min_value_label}
              </label>
              <input
                type="number"
                name="min_value"
                id="min_value"
                value={formData.min_value ?? ""}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="max_value"
                className="block text-sm font-medium text-slate-700"
              >
                {t.max_value_label}
              </label>
              <input
                type="number"
                name="max_value"
                id="max_value"
                value={formData.max_value ?? ""}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>
          </>
        )}
      </div>
      <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
        <button
          type="submit"
          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
        >
          {t.save_button}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
        >
          {t.cancel_button}
        </button>
      </div>
    </form>
  );
};

export default ParameterSettingForm;
