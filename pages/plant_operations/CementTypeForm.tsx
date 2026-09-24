import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CementType } from '../../types';
import { Tag, FileText, CheckCircle, AlertCircle, Hash, Layers } from 'lucide-react';

import {
  EnhancedButton,
  EnhancedInput,
  useAccessibility,
  useReducedMotion,
} from '../../components/ui/EnhancedComponents';

interface FormProps {
  recordToEdit: CementType | null;
  onSave: (record: CementType | Omit<CementType, 'id'>, oldName?: string) => void;
  onCancel: () => void;
  t: Record<string, string>;
}

interface FormErrors {
  name?: string;
  code?: string;
  sort_order?: string;
}

const CementTypeForm: React.FC<FormProps> = ({ recordToEdit, onSave, onCancel, t }) => {
  const { announceToScreenReader } = useAccessibility();
  const prefersReducedMotion = useReducedMotion();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'CM',
    sort_order: 1,
    is_active: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        name: recordToEdit.name || '',
        code: recordToEdit.code || '',
        description: recordToEdit.description || '',
        category: recordToEdit.category || 'CM',
        sort_order: recordToEdit.sort_order ?? 1,
        is_active: recordToEdit.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        category: 'CM',
        sort_order: 1,
        is_active: true,
      });
    }
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setShowSuccess(false);
  }, [recordToEdit]);

  const validateField = (name: keyof typeof formData, value: any): string => {
    if (name === 'name') {
      if (!String(value).trim()) {
        return 'Nama tipe produk wajib diisi';
      }
      if (String(value).length < 2) {
        return 'Nama minimal 2 karakter';
      }
    }
    if (name === 'sort_order') {
      if (isNaN(Number(value)) || Number(value) < 0) {
        return 'Urutan harus berupa angka positif';
      }
    }
    return '';
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    const nameErr = validateField('name', formData.name);
    if (nameErr) {
      newErrors.name = nameErr;
      isValid = false;
    }

    const orderErr = validateField('sort_order', formData.sort_order);
    if (orderErr) {
      newErrors.sort_order = orderErr;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (field: keyof typeof formData) => (value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTouched({ name: true, sort_order: true });

    if (!validateForm()) {
      setIsSubmitting(false);
      announceToScreenReader('Form memiliki error validasi.');
      return;
    }

    try {
      if (recordToEdit) {
        onSave(
          {
            ...recordToEdit,
            ...formData,
            sort_order: Number(formData.sort_order),
          },
          recordToEdit.name
        );
      } else {
        onSave({
          ...formData,
          sort_order: Number(formData.sort_order),
        });
      }

      setShowSuccess(true);
      announceToScreenReader('Tipe produk berhasil disimpan');
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      announceToScreenReader('Gagal menyimpan tipe produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.25,
        staggerChildren: 0.08,
      },
    },
  };

  const fieldVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.2 },
    },
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="relative space-y-4"
      variants={formVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-semibold"
            role="alert"
          >
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Tipe produk/semen berhasil disimpan!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Field: Nama Tipe Produk */}
      <motion.div variants={fieldVariants}>
        <EnhancedInput
          label="Nama Tipe Produk / Semen"
          value={formData.name}
          onChange={(val) => {
            handleChange('name')(val);
            if (!formData.code || formData.code === formData.name) {
              setFormData((prev) => ({ ...prev, code: val.toUpperCase().trim() }));
            }
          }}
          placeholder="Contoh: OPC, PCC, PPC, Pozzolan"
          error={touched.name ? errors.name : undefined}
          required
          icon={<Tag className="w-4 h-4 text-slate-400" />}
          fullWidth
          ariaLabel="Nama Tipe Produk / Semen"
        />
      </motion.div>

      {/* Field: Kode Singkat & Urutan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div variants={fieldVariants}>
          <EnhancedInput
            label="Kode Produk (Singkat)"
            value={formData.code}
            onChange={handleChange('code')}
            placeholder="Contoh: OPC, PCC"
            icon={<Hash className="w-4 h-4 text-slate-400" />}
            fullWidth
            ariaLabel="Kode Produk"
          />
        </motion.div>

        <motion.div variants={fieldVariants}>
          <EnhancedInput
            label="Urutan Tampilan"
            value={String(formData.sort_order)}
            onChange={(val) => handleChange('sort_order')(val)}
            placeholder="1"
            error={touched.sort_order ? errors.sort_order : undefined}
            icon={<Layers className="w-4 h-4 text-slate-400" />}
            fullWidth
            ariaLabel="Urutan Tampilan"
          />
        </motion.div>
      </div>

      {/* Field: Kategori & Deskripsi */}
      <motion.div variants={fieldVariants}>
        <EnhancedInput
          label="Deskripsi / Keterangan (Opsional)"
          value={formData.description}
          onChange={handleChange('description')}
          placeholder="Contoh: Portland Composite Cement untuk pengerjaan umum"
          icon={<FileText className="w-4 h-4 text-slate-400" />}
          fullWidth
          ariaLabel="Deskripsi"
        />
      </motion.div>

      {/* Toggle Status Aktif */}
      <motion.div variants={fieldVariants} className="pt-1">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => handleChange('is_active')(e.target.checked)}
            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
          />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Aktifkan tipe produk ini (akan muncul di dropdown pilihan CCR & COP)
          </span>
        </label>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        variants={fieldVariants}
        className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800"
      >
        <EnhancedButton
          type="button"
          variant="secondary"
          size="md"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t.cancel || 'Batal'}
        </EnhancedButton>
        <EnhancedButton
          type="submit"
          variant="primary"
          size="md"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {recordToEdit ? t.save_changes || 'Simpan Perubahan' : t.save || 'Tambah Tipe Produk'}
        </EnhancedButton>
      </motion.div>
    </motion.form>
  );
};

export default CementTypeForm;
