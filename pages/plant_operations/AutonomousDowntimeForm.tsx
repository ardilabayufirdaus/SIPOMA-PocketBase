import React, { useState, useEffect } from "react";
import { CcrDowntimeData, DowntimeStatus } from "../../types";
import { formatDate } from "../../utils/formatters";

interface FormProps {
  recordToEdit: CcrDowntimeData | null;
  onSave: (record: CcrDowntimeData) => void;
  onCancel: () => void;
  t: any;
}

const AutonomousDowntimeForm: React.FC<FormProps> = ({
  recordToEdit,
  onSave,
  onCancel,
  t,
}) => {
  const [formData, setFormData] = useState({
    action: "",
    corrective_action: "",
    status: DowntimeStatus.OPEN,
  });

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        action: recordToEdit.action ?? "",
        corrective_action: recordToEdit.corrective_action ?? "",
        status: recordToEdit.status ?? DowntimeStatus.OPEN,
      });
    }
  }, [recordToEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recordToEdit) {
      onSave({ ...recordToEdit, ...formData });
    }
  };

  if (!recordToEdit) return null;

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-4 space-y-4">
        <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
            {t.downtime_details}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <strong className="text-slate-600 dark:text-slate-400">
                {t.date}:
              </strong>{" "}
              <span className="text-slate-800 dark:text-slate-200">
                {formatDate(recordToEdit.date)}
              </span>
            </div>
            <div>
              <strong className="text-slate-600 dark:text-slate-400">
                {t.unit}:
              </strong>{" "}
              <span className="text-slate-800 dark:text-slate-200">
                {recordToEdit.unit}
              </span>
            </div>
            <div>
              <strong className="text-slate-600 dark:text-slate-400">
                {t.start_time}:
              </strong>{" "}
              <span className="text-slate-800 dark:text-slate-200 font-mono">
                {recordToEdit.start_time}
              </span>
            </div>
            <div>
              <strong className="text-slate-600 dark:text-slate-400">
                {t.end_time}:
              </strong>{" "}
              <span className="text-slate-800 dark:text-slate-200 font-mono">
                {recordToEdit.end_time}
              </span>
            </div>
            <div className="sm:col-span-2">
              <strong className="text-slate-600 dark:text-slate-400">
                {t.problem}:
              </strong>{" "}
              <span className="text-slate-800 dark:text-slate-200">
                {recordToEdit.problem}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="action"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              {t.action}
            </label>
            <textarea
              name="action"
              id="action"
              value={formData.action}
              onChange={handleChange}
              rows={2}
              className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors"
              placeholder={t.action_placeholder || "Enter action taken..."}
            />
          </div>
          <div>
            <label
              htmlFor="corrective_action"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              {t.corrective_action}
            </label>
            <textarea
              name="corrective_action"
              id="corrective_action"
              value={formData.corrective_action}
              onChange={handleChange}
              rows={2}
              className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors"
              placeholder={
                t.corrective_action_placeholder || "Enter corrective action..."
              }
            />
          </div>
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              {t.status}
            </label>
            <select
              name="status"
              id="status"
              value={formData.status}
              onChange={handleChange}
              className="block w-full pl-3 pr-10 py-2 text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors"
            >
              {Object.values(DowntimeStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="bg-slate-50 dark:bg-slate-700 px-4 py-2 sm:px-4 sm:flex sm:flex-row-reverse rounded-b-lg border-t border-slate-200 dark:border-slate-600">
        <button
          type="submit"
          className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-3 py-1.5 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
        >
          {t.save_button}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mt-2 w-full inline-flex justify-center rounded-lg border border-slate-300 dark:border-slate-600 shadow-sm px-3 py-1.5 bg-white dark:bg-slate-600 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
        >
          {t.cancel_button}
        </button>
      </div>
    </form>
  );
};

export default AutonomousDowntimeForm;
