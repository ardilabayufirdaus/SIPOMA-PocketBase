import React, { useState, useEffect, useMemo } from "react";
import { SiloCapacity, PlantUnit } from "../../types";

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from "../../components/ui/EnhancedComponents";

interface FormProps {
  recordToEdit: SiloCapacity | null;
  onSave: (record: SiloCapacity | Omit<SiloCapacity, "id">) => void;
  onCancel: () => void;
  t: any;
  plantUnits: PlantUnit[];
}

const SiloCapacityForm: React.FC<FormProps> = ({
  recordToEdit,
  onSave,
  onCancel,
  t,
  plantUnits,
}) => {
  // Enhanced accessibility hooks
  const announceToScreenReader = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  const [formData, setFormData] = useState({
    plant_category: "",
    unit: "",
    silo_name: "",
    capacity: 0,
    dead_stock: 0,
  });

  const uniqueCategories = useMemo(
    () => [...new Set(plantUnits.map((u) => u.category).sort())],
    [plantUnits]
  );

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        plant_category: recordToEdit.plant_category,
        unit: recordToEdit.unit,
        silo_name: recordToEdit.silo_name,
        capacity: recordToEdit.capacity,
        dead_stock: recordToEdit.dead_stock,
      });
    } else {
      const firstCategory = uniqueCategories[0] || "";
      const firstUnit =
        plantUnits.find((u) => u.category === firstCategory)?.unit || "";
      setFormData({
        plant_category: firstCategory,
        unit: firstUnit,
        silo_name: "",
        capacity: 0,
        dead_stock: 0,
      });
    }
  }, [recordToEdit, plantUnits, uniqueCategories]);

  const unitsForCategory = useMemo(() => {
    return plantUnits
      .filter((u) => u.category === formData.plant_category)
      .map((u) => u.unit)
      .sort();
  }, [plantUnits, formData.plant_category]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    const firstUnit =
      plantUnits.find((u) => u.category === newCategory)?.unit || "";
    setFormData((prev) => ({
      ...prev,
      plant_category: newCategory,
      unit: firstUnit,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
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

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <div className="sm:col-span-2">
          <label
            htmlFor="plant_category"
            className="block text-sm font-medium text-slate-700"
          >
            {t.plant_category_label_silo}
          </label>
          <select
            name="plant_category"
            id="plant_category"
            value={formData.plant_category}
            onChange={handleCategoryChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 bg-white text-base border-slate-300 text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
          >
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="unit"
            className="block text-sm font-medium text-slate-700"
          >
            {t.unit_label}
          </label>
          <select
            name="unit"
            id="unit"
            value={formData.unit}
            onChange={handleChange}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 bg-white text-base border-slate-300 text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
            disabled={unitsForCategory.length === 0}
          >
            {unitsForCategory.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="silo_name"
            className="block text-sm font-medium text-slate-700"
          >
            {t.silo_name_label}
          </label>
          <input
            type="text"
            name="silo_name"
            id="silo_name"
            value={formData.silo_name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="capacity"
            className="block text-sm font-medium text-slate-700"
          >
            {t.capacity_label}
          </label>
          <input
            type="number"
            name="capacity"
            id="capacity"
            value={formData.capacity}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="dead_stock"
            className="block text-sm font-medium text-slate-700"
          >
            {t.dead_stock_label_silo}
          </label>
          <input
            type="number"
            name="dead_stock"
            id="dead_stock"
            value={formData.dead_stock}
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
          aria-label={t.save_button || "Save silo capacity"}
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

export default SiloCapacityForm;
