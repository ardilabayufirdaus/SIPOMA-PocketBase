import React, { useState, useEffect } from "react";
import { CcrDowntimeData } from "../../types";
import { usePicSettings } from "../../hooks/usePicSettings";

interface FormProps {
  recordToEdit: CcrDowntimeData | null;
  onSave: (
    record: CcrDowntimeData | Omit<CcrDowntimeData, "id" | "date">
  ) => void;
  onCancel: () => void;
  t: any;
  plantUnits: string[];
}

const CcrDowntimeForm: React.FC<FormProps> = ({
  recordToEdit,
  onSave,
  onCancel,
  t,
  plantUnits,
}) => {
  const { records: picSettings } = usePicSettings();
  const [formData, setFormData] = useState({
    start_time: "00:00",
    end_time: "00:00",
    unit: plantUnits[0] || "",
    pic: picSettings[0]?.pic || "",
    problem: "",
  });

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        start_time: recordToEdit.start_time,
        end_time: recordToEdit.end_time,
        unit: recordToEdit.unit,
        pic: recordToEdit.pic,
        problem: recordToEdit.problem,
      });
    } else {
      setFormData({
        start_time: "00:00",
        end_time: "00:00",
        unit: plantUnits[0] || "",
        pic: picSettings[0]?.pic || "",
        problem: "",
      });
    }
  }, [recordToEdit, picSettings, plantUnits]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
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
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="start_time"
              className="block text-sm font-medium text-slate-700"
            >
              {t.start_time}
            </label>
            <input
              type="time"
              name="start_time"
              id="start_time"
              value={formData.start_time}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm no-spinner"
            />
          </div>
          <div>
            <label
              htmlFor="end_time"
              className="block text-sm font-medium text-slate-700"
            >
              {t.end_time}
            </label>
            <input
              type="time"
              name="end_time"
              id="end_time"
              value={formData.end_time}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm no-spinner"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="unit"
            className="block text-sm font-medium text-slate-700"
          >
            {t.unit}
          </label>
          <select
            name="unit"
            id="unit"
            value={formData.unit}
            onChange={handleChange}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          >
            {plantUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="pic"
            className="block text-sm font-medium text-slate-700"
          >
            {t.pic}
          </label>
          <select
            name="pic"
            id="pic"
            value={formData.pic}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          >
            {picSettings.map((picSetting) => (
              <option key={picSetting.id} value={picSetting.pic}>
                {picSetting.pic}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="problem"
            className="block text-sm font-medium text-slate-700"
          >
            {t.problem}
          </label>
          <textarea
            name="problem"
            id="problem"
            value={formData.problem}
            onChange={handleChange}
            rows={4}
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          />
        </div>
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

export default CcrDowntimeForm;
