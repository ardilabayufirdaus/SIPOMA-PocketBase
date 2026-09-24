import React, { useState, useEffect, useRef } from 'react';
import { ProjectTask } from '../types';
import { pb } from '../utils/pocketbase-simple';
import { EnhancedButton } from './ui/EnhancedComponents';
import { Camera, Image as ImageIcon, X, Trash2, UploadCloud, AlertCircle } from 'lucide-react';
import { formatDate } from '../utils/formatters';

type TaskFormData = Omit<ProjectTask, 'id' | 'project_id'>;

interface FormProps {
  taskToEdit: ProjectTask | null;
  onSave: (task: TaskFormData | ProjectTask | FormData) => void;
  onCancel: () => void;
  t: Record<string, string>;
}

const MAX_PHOTOS = 10;
const MAX_FILE_SIZE_MB = 20;

const ProjectTaskForm: React.FC<FormProps> = ({ taskToEdit, onSave, onCancel, t }) => {
  const [formData, setFormData] = useState<TaskFormData>({
    activity: '',
    planned_start: new Date().toISOString().split('T')[0],
    planned_end: new Date().toISOString().split('T')[0],
    actual_start: null,
    actual_end: null,
    percent_complete: 0,
    photos: [],
  });

  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        activity: taskToEdit.activity || '',
        planned_start: taskToEdit.planned_start || new Date().toISOString().split('T')[0],
        planned_end: taskToEdit.planned_end || new Date().toISOString().split('T')[0],
        actual_start: taskToEdit.actual_start || null,
        actual_end: taskToEdit.actual_end || null,
        percent_complete: taskToEdit.percent_complete || 0,
        photos: taskToEdit.photos || [],
      });
      setExistingPhotos(taskToEdit.photos || []);
    } else {
      setFormData({
        activity: '',
        planned_start: new Date().toISOString().split('T')[0],
        planned_end: new Date().toISOString().split('T')[0],
        actual_start: null,
        actual_end: null,
        percent_complete: 0,
        photos: [],
      });
      setExistingPhotos([]);
    }
    setNewPhotoFiles([]);
    setNewPhotoPreviews([]);
    setPhotoError(null);
  }, [taskToEdit]);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      newPhotoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPhotoPreviews]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'date' && !value) {
      setFormData((prev) => ({ ...prev, [name]: null }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? Math.max(0, Math.min(100, parseInt(value, 10) || 0)) : value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    if (!e.target.files || e.target.files.length === 0) return;

    const filesArray = Array.from(e.target.files);
    const totalCount = existingPhotos.length + newPhotoFiles.length + filesArray.length;

    if (totalCount > MAX_PHOTOS) {
      setPhotoError(
        `Maksimal ${MAX_PHOTOS} foto per aktivitas. Anda mencoba menambahkan ${totalCount} foto.`
      );
      return;
    }

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const file of filesArray) {
      if (!file.type.startsWith('image/')) {
        setPhotoError(`Berkas "${file.name}" bukan format gambar valid.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setPhotoError(`Ukuran berkas "${file.name}" melebihi batas ${MAX_FILE_SIZE_MB}MB.`);
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setNewPhotoFiles((prev) => [...prev, ...validFiles]);
    setNewPhotoPreviews((prev) => [...prev, ...validPreviews]);

    // Reset file input value so the same file can be selected again if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExistingPhoto = (indexToRemove: number) => {
    setExistingPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemoveNewPhoto = (indexToRemove: number) => {
    URL.revokeObjectURL(newPhotoPreviews[indexToRemove]);
    setNewPhotoFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setNewPhotoPreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const getExistingPhotoUrl = (filename: string) => {
    if (!taskToEdit) return '';
    const record = (taskToEdit as any)?.rawRecord || taskToEdit;
    return pb.files.getUrl(record, filename);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.activity.trim()) {
      newErrors.activity = t.activity_required || 'Nama aktivitas wajib diisi';
    }
    if (formData.planned_start && formData.planned_end) {
      if (new Date(formData.planned_end) < new Date(formData.planned_start)) {
        newErrors.planned_end =
          t.end_date_after_start || 'Rencana selesai tidak boleh lebih awal dari rencana mulai';
      }
    }
    if (formData.actual_start && formData.actual_end) {
      if (new Date(formData.actual_end) < new Date(formData.actual_start)) {
        newErrors.actual_end =
          t.actual_end_after_start ||
          'Realisasi selesai tidak boleh lebih awal dari realisasi mulai';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // If new photos were added or existing photos modified, build FormData for PocketBase upload
    if (
      newPhotoFiles.length > 0 ||
      (taskToEdit && existingPhotos.length !== (taskToEdit.photos?.length || 0))
    ) {
      const payload = new FormData();
      payload.append('activity', formData.activity);
      if (formData.planned_start) payload.append('planned_start', formData.planned_start);
      if (formData.planned_end) payload.append('planned_end', formData.planned_end);
      if (formData.actual_start) payload.append('actual_start', formData.actual_start);
      if (formData.actual_end) payload.append('actual_end', formData.actual_end);
      payload.append('percent_complete', String(formData.percent_complete));

      if (taskToEdit?.project_id) {
        payload.append('project_id', taskToEdit.project_id);
      }

      // Append new photo files
      newPhotoFiles.forEach((file) => {
        payload.append('photos', file);
      });

      // Pass FormData with target taskToEdit metadata if editing
      if (taskToEdit) {
        (payload as any).taskId = taskToEdit.id;
        onSave(payload);
      } else {
        onSave(payload);
      }
    } else {
      // Standard JSON payload
      if (taskToEdit) {
        onSave({ ...taskToEdit, ...formData, photos: existingPhotos });
      } else {
        onSave(formData);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="text-slate-800 dark:text-slate-100">
      <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
        {/* Activity Name */}
        <div>
          <label
            htmlFor="task-activity"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 uppercase tracking-wider"
          >
            {t.activity_label || 'Aktivitas / Deliverables'}{' '}
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="activity"
            id="task-activity"
            value={formData.activity}
            onChange={handleChange}
            maxLength={200}
            required
            className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800 border rounded-xl shadow-sm text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
              errors.activity
                ? 'border-rose-500 ring-1 ring-rose-500'
                : 'border-slate-300 dark:border-slate-700'
            }`}
            placeholder={t.activity_placeholder || 'Contoh: Fabrikasi & Penggantian Liner Mill...'}
          />
          {errors.activity && (
            <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 font-medium">
              {errors.activity}
            </p>
          )}
        </div>

        {/* Schedule Grid: Planned vs Actual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/60 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
            <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>📅 Target Rencana (Planned)</span>
            </span>
            <div>
              <label
                htmlFor="task-planned-start"
                className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1"
              >
                Rencana Mulai <span className="text-rose-500">*</span>
              </label>
              <div className="relative group/date">
                <div className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-slate-900 dark:text-white flex items-center justify-between pointer-events-none group-hover/date:border-slate-400 dark:group-hover/date:border-slate-600">
                  <span>
                    {formData.planned_start ? formatDate(formData.planned_start) : '--/--/----'}
                  </span>
                </div>
                <input
                  type="date"
                  name="planned_start"
                  id="task-planned-start"
                  value={formData.planned_start}
                  onChange={handleChange}
                  required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="task-planned-end"
                className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1"
              >
                Rencana Selesai <span className="text-rose-500">*</span>
              </label>
              <div className="relative group/date">
                <div
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl text-xs font-mono font-semibold text-slate-900 dark:text-white flex items-center justify-between pointer-events-none group-hover/date:border-slate-400 dark:group-hover/date:border-slate-600 ${
                    errors.planned_end
                      ? 'border-rose-500'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <span>
                    {formData.planned_end ? formatDate(formData.planned_end) : '--/--/----'}
                  </span>
                </div>
                <input
                  type="date"
                  name="planned_end"
                  id="task-planned-end"
                  value={formData.planned_end}
                  onChange={handleChange}
                  required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
              {errors.planned_end && (
                <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.planned_end}</p>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-slate-800/60 border border-emerald-100 dark:border-emerald-900/40 space-y-3">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>⏱️ Realisasi Aktual (Actual)</span>
            </span>
            <div>
              <label
                htmlFor="task-actual-start"
                className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1"
              >
                Realisasi Mulai
              </label>
              <div className="relative group/date">
                <div className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-slate-900 dark:text-white flex items-center justify-between pointer-events-none group-hover/date:border-slate-400 dark:group-hover/date:border-slate-600">
                  <span>
                    {formData.actual_start ? formatDate(formData.actual_start) : '--/--/----'}
                  </span>
                </div>
                <input
                  type="date"
                  name="actual_start"
                  id="task-actual-start"
                  value={formData.actual_start ?? ''}
                  onChange={handleChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="task-actual-end"
                className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1"
              >
                Realisasi Selesai
              </label>
              <div className="relative group/date">
                <div
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl text-xs font-mono font-semibold text-slate-900 dark:text-white flex items-center justify-between pointer-events-none group-hover/date:border-slate-400 dark:group-hover/date:border-slate-600 ${
                    errors.actual_end ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <span>
                    {formData.actual_end ? formatDate(formData.actual_end) : '--/--/----'}
                  </span>
                </div>
                <input
                  type="date"
                  name="actual_end"
                  id="task-actual-end"
                  value={formData.actual_end ?? ''}
                  onChange={handleChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
              {errors.actual_end && (
                <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.actual_end}</p>
              )}
            </div>
          </div>
        </div>

        {/* Progress Percent Slider & Input */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="task-percent-complete"
              className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider"
            >
              {t.percent_complete_label || 'Progress Pengerjaan Aktual'}
            </label>
            <span className="px-3 py-0.5 rounded-full text-xs font-black bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {formData.percent_complete}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              name="percent_complete"
              value={formData.percent_complete}
              onChange={handleChange}
              className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <input
              type="number"
              name="percent_complete"
              id="task-percent-complete"
              min="0"
              max="100"
              value={formData.percent_complete}
              onChange={handleChange}
              className="w-20 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-center text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Photo Evidence Upload Section */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Dokumentasi & Evidence Foto
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {existingPhotos.length + newPhotoFiles.length} / {MAX_PHOTOS} Foto
            </span>
          </div>

          {photoError && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{photoError}</span>
            </div>
          )}

          {/* Upload Dropzone Button */}
          {existingPhotos.length + newPhotoFiles.length < MAX_PHOTOS && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/jpeg,image/png,image/webp,image/jpg"
                multiple
                className="hidden"
                id="task-photo-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 px-4 border-2 border-dashed border-indigo-300 dark:border-indigo-700/60 rounded-2xl bg-white/70 dark:bg-slate-900/60 hover:bg-indigo-50/50 dark:hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Klik untuk Unggah Foto Evidence Aktivitas
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Mendukung JPG, PNG, WebP (Maks {MAX_FILE_SIZE_MB}MB per foto)
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Preview Photos Grid */}
          {(existingPhotos.length > 0 || newPhotoPreviews.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {/* Existing Photos from Database */}
              {existingPhotos.map((photoName, idx) => (
                <div
                  key={`existing-${idx}`}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 aspect-video shadow-sm"
                >
                  <img
                    src={getExistingPhotoUrl(photoName)}
                    alt={`Evidence ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-slate-900/80 text-white text-[9px] font-bold backdrop-blur-sm">
                    Tersimpan
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingPhoto(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600/90 text-white hover:bg-rose-700 transition-colors shadow-sm"
                    title="Hapus foto ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Newly Selected Photos */}
              {newPhotoPreviews.map((previewUrl, idx) => (
                <div
                  key={`new-${idx}`}
                  className="relative group rounded-xl overflow-hidden border-2 border-indigo-400 dark:border-indigo-600 bg-slate-100 dark:bg-slate-900 aspect-video shadow-sm"
                >
                  <img
                    src={previewUrl}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-bold shadow-sm">
                    Baru
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveNewPhoto(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600/90 text-white hover:bg-rose-700 transition-colors shadow-sm"
                    title="Batalkan foto ini"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Actions */}
      <div className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700/60 px-6 py-4 flex flex-row-reverse gap-3 rounded-b-2xl">
        <EnhancedButton
          variant="primary"
          size="md"
          type="submit"
          className="bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/20 rounded-xl px-6 py-2.5 font-bold transition-all"
          aria-label={t.save_button || 'Simpan Aktivitas'}
        >
          {t.save_button || 'Simpan Aktivitas'}
        </EnhancedButton>
        <EnhancedButton
          variant="secondary"
          size="md"
          type="button"
          onClick={onCancel}
          className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-5 py-2.5 font-medium transition-all"
          aria-label={t.cancel_button || 'Batal'}
        >
          {t.cancel_button || 'Batal'}
        </EnhancedButton>
      </div>
    </form>
  );
};

export default ProjectTaskForm;
