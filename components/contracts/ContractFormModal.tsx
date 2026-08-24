import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ContractSLA,
  ContractCategory,
  ContractStatus,
  SlaStatus,
  ContractCurrency,
} from '../../types';
import { formatContractCurrency } from '../../hooks/useContractsData';

interface ContractFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  initialData?: ContractSLA | null;
  categories: string[];
  t?: Record<string, string>;
}

export const ContractFormModal: React.FC<ContractFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories,
  t = {},
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'financial' | 'sla' | 'files'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields State
  const [poNumber, setPoNumber] = useState('');
  const [contractTitle, setContractTitle] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [category, setCategory] = useState<string>('Raw Material');
  const [status, setStatus] = useState<ContractStatus>('Active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState<ContractCurrency>('IDR');
  const [contractBudget, setContractBudget] = useState<number>(0);
  const [budgetAbsorbed, setBudgetAbsorbed] = useState<number>(0);
  const [initialVolume, setInitialVolume] = useState<number>(0);
  const [absorbedVolume, setAbsorbedVolume] = useState<number>(0);
  const [volumeUnit, setVolumeUnit] = useState('Ton');
  const [slaKpiTarget, setSlaKpiTarget] = useState('');
  const [slaStatus, setSlaStatus] = useState<SlaStatus>('On Track');
  const [picName, setPicName] = useState('');
  const [picContact, setPicContact] = useState('');
  const [notes, setNotes] = useState('');

  // Files State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [sapScreenshotFile, setSapScreenshotFile] = useState<File | null>(null);
  const [sapPreviewUrl, setSapPreviewUrl] = useState<string | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  // Drag and Drop States
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [isDraggingSap, setIsDraggingSap] = useState(false);
  const [isDraggingAttachments, setIsDraggingAttachments] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const sapInputRef = useRef<HTMLInputElement>(null);
  const attachmentsInputRef = useRef<HTMLInputElement>(null);

  // Reset or initialize state
  useEffect(() => {
    if (initialData) {
      setPoNumber(initialData.po_number || '');
      setContractTitle(initialData.contract_title || '');
      setVendorName(initialData.vendor_name || '');
      setCategory(initialData.category || 'Raw Material');
      setStatus(initialData.status || 'Active');
      setStartDate(initialData.start_date || '');
      setEndDate(initialData.end_date || '');
      setCurrency((initialData.currency as ContractCurrency) || 'IDR');
      setContractBudget(Number(initialData.contract_budget || 0));
      setBudgetAbsorbed(Number(initialData.budget_absorbed || 0));
      setInitialVolume(Number(initialData.initial_volume || 0));
      setAbsorbedVolume(Number(initialData.absorbed_volume || 0));
      setVolumeUnit(initialData.volume_unit || 'Ton');
      setSlaKpiTarget(initialData.sla_kpi_target || '');
      setSlaStatus((initialData.sla_status as SlaStatus) || 'On Track');
      setPicName(initialData.pic_name || '');
      setPicContact(initialData.pic_contact || '');
      setNotes(initialData.notes || '');
    } else {
      setPoNumber('');
      setContractTitle('');
      setVendorName('');
      setCategory('Raw Material');
      setStatus('Active');
      setStartDate('');
      setEndDate('');
      setCurrency('IDR');
      setContractBudget(0);
      setBudgetAbsorbed(0);
      setInitialVolume(0);
      setAbsorbedVolume(0);
      setVolumeUnit('Ton');
      setSlaKpiTarget('');
      setSlaStatus('On Track');
      setPicName('');
      setPicContact('');
      setNotes('');
    }
    setPdfFile(null);
    setSapScreenshotFile(null);
    setSapPreviewUrl(null);
    setAttachmentFiles([]);
    setIsDraggingPdf(false);
    setIsDraggingSap(false);
    setIsDraggingAttachments(false);
    setFormError(null);
    setActiveTab('info');
  }, [initialData, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Handle SAP screenshot preview
  const handleSapFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSapScreenshotFile(file);
      setSapPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Drag & Drop Handlers for PDF
  const handlePdfDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPdf(true);
  };
  const handlePdfDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPdf(false);
  };
  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPdf(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setPdfFile(file);
    }
  };

  // Drag & Drop Handlers for SAP Screenshot
  const handleSapDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingSap(true);
  };
  const handleSapDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingSap(false);
  };
  const handleSapDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingSap(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSapScreenshotFile(file);
      setSapPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Drag & Drop Handlers for Attachments
  const handleAttachmentsDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAttachments(true);
  };
  const handleAttachmentsDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAttachments(false);
  };
  const handleAttachmentsDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAttachments(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setAttachmentFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Handle Attachments selection
  const handleAttachmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachmentFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!poNumber.trim()) {
      setFormError(t.validation_po_required || 'Nomor Purchase Order (PO) wajib diisi');
      setActiveTab('info');
      return;
    }
    if (!contractTitle.trim()) {
      setFormError(t.validation_title_required || 'Judul Kontrak wajib diisi');
      setActiveTab('info');
      return;
    }
    if (!vendorName.trim()) {
      setFormError(t.validation_vendor_required || 'Nama Rekanan / Vendor wajib diisi');
      setActiveTab('info');
      return;
    }
    if (!startDate || !endDate) {
      setFormError(
        t.validation_dates_required || 'Tanggal mulai dan tanggal akhir masa berlaku wajib diisi'
      );
      setActiveTab('financial');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setFormError(
        t.validation_date_invalid ||
          'Tanggal mulai tidak boleh lebih besar dari tanggal akhir masa berlaku'
      );
      setActiveTab('financial');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('po_number', poNumber.trim());
      formData.append('contract_title', contractTitle.trim());
      formData.append('vendor_name', vendorName.trim());
      formData.append('category', category);
      formData.append('status', status);
      formData.append('start_date', startDate);
      formData.append('end_date', endDate);
      formData.append('currency', currency);
      formData.append('contract_budget', contractBudget.toString());
      formData.append('budget_absorbed', budgetAbsorbed.toString());
      formData.append('initial_volume', initialVolume.toString());
      formData.append('absorbed_volume', absorbedVolume.toString());
      formData.append('remaining_volume', Math.max(0, initialVolume - absorbedVolume).toString());
      formData.append('volume_unit', volumeUnit.trim());
      formData.append('sla_kpi_target', slaKpiTarget.trim());
      formData.append('sla_status', slaStatus);
      formData.append('pic_name', picName.trim());
      formData.append('pic_contact', picContact.trim());
      formData.append('notes', notes.trim());

      // Append files if selected
      if (pdfFile) {
        formData.append('contract_pdf', pdfFile);
      }
      if (sapScreenshotFile) {
        formData.append('sap_po_screenshot', sapScreenshotFile);
      }
      attachmentFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      console.error('Error submitting contract form:', err);
      setFormError(
        err?.message || 'Gagal menyimpan data kontrak. Silakan periksa kembali berkas dan isian.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative z-10 w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  {initialData
                    ? t.edit_contract || 'Edit Data Kontrak & SLA'
                    : t.add_new_contract_modal || 'Tambah Kontrak Baru'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.contract_sla_sub ||
                    'Lengkapi nomor PO SAP, masa berlaku, nilai anggaran, dan berkas lampiran digital.'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/40">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'info'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              1. {t.tab_general_info || 'Info Pokok & PO SAP'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('financial')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'financial'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              2. {t.tab_financial_period || 'Masa Berlaku & Anggaran'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sla')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'sla'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              3. {t.tab_volume_sla || 'Volume, SLA & PIC'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('files')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'files'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              4. {t.tab_documents_files || 'Berkas PDF & Screenshot SAP'}
            </button>
          </div>

          {/* Form Content Body */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 flex flex-col justify-between"
          >
            {formError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-rose-500 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            {/* TAB 1: INFO POKOK & PO SAP */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t.po_number || 'Nomor Purchase Order (PO) SAP'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      placeholder="PO-4500128901"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t.category || 'Kategori Kontrak'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.contract_title || 'Judul / Nama Kontrak'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contractTitle}
                    onChange={(e) => setContractTitle(e.target.value)}
                    placeholder="Contoh: Pengadaan & Pasokan Bahan Baku Gypsum Sintetik Pabrik Tonasa"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t.vendor_name || 'Nama Rekanan / Vendor'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      placeholder="Contoh: PT Petrokimia Semen Nusantara"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ContractStatus)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Near Expiry">Near Expiry</option>
                      <option value="Expired">Expired</option>
                      <option value="Completed">Completed</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MASA BERLAKU & ANGGARAN */}
            {activeTab === 'financial' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t.start_date || 'Tanggal Mulai Masa Berlaku'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t.end_date || 'Tanggal Akhir Masa Berlaku (Expiry Date)'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                      *{' '}
                      {t.h90_reminder_desc ||
                        'Sistem akan otomatis memberikan notifikasi peringatan jika sisa hari <= 90 hari (H-90).'}
                    </p>
                  </div>
                </div>

                {/* Currency Selector Pill Group */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    {t.currency || 'Mata Uang Anggaran'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setCurrency('IDR')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        currency === 'IDR'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700 ring-2 ring-emerald-500/20'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>IDR (Rp)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        currency === 'USD'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700 ring-2 ring-blue-500/20'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>USD ($)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrency('EUR')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        currency === 'EUR'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700 ring-2 ring-indigo-500/20'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span>EUR (€)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t.contract_budget || 'Total Pagu Anggaran Kontrak'} ({currency}){' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={currency === 'IDR' ? 1 : 0.01}
                      value={contractBudget}
                      onChange={(e) => setContractBudget(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 block font-mono">
                      {formatContractCurrency(contractBudget, currency)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t.budget_absorbed || 'Realisasi Serapan Anggaran'} ({currency})
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={currency === 'IDR' ? 1 : 0.01}
                      value={budgetAbsorbed}
                      onChange={(e) => setBudgetAbsorbed(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 block font-mono">
                      {formatContractCurrency(budgetAbsorbed, currency)} (
                      {contractBudget > 0
                        ? ((budgetAbsorbed / contractBudget) * 100).toFixed(1)
                        : 0}
                      % {t.absorbed || 'terserap'})
                    </span>
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
                      {t.remaining_budget || 'Sisa Pagu Anggaran'} ({currency})
                    </span>
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 font-mono">
                      {formatContractCurrency(
                        Math.max(0, contractBudget - budgetAbsorbed),
                        currency
                      )}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
                      {t.absorption_rate || 'Tingkat Serapan'}
                    </span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                      {contractBudget > 0
                        ? ((budgetAbsorbed / contractBudget) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: VOLUME, SLA & PIC */}
            {activeTab === 'sla' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t.contract_volume || 'Pagu Volume Awal'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={initialVolume}
                      onChange={(e) => setInitialVolume(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t.absorbed_volume || 'Realisasi Volume'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={absorbedVolume}
                      onChange={(e) => setAbsorbedVolume(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t.volume_unit || 'Satuan Volume'}
                    </label>
                    <input
                      type="text"
                      value={volumeUnit}
                      onChange={(e) => setVolumeUnit(e.target.value)}
                      placeholder="Ton, Jam, Unit, Trip..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t.sla_kpi_target || 'Target Indikator & KPI SLA'}
                    </label>
                    <textarea
                      rows={3}
                      value={slaKpiTarget}
                      onChange={(e) => setSlaKpiTarget(e.target.value)}
                      placeholder="Contoh: Ketersediaan Unit > 95%, Waktu Tanggap Darurat < 2 Jam"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t.sla_status || 'Status Pemenuhan SLA'}
                    </label>
                    <select
                      value={slaStatus}
                      onChange={(e) => setSlaStatus(e.target.value as SlaStatus)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 mb-3"
                    >
                      <option value="Achieved">Achieved</option>
                      <option value="On Track">On Track</option>
                      <option value="Warning">Warning</option>
                      <option value="Breached">Breached</option>
                    </select>

                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t.pic_name || 'PIC'} & {t.pic_contact || 'Kontak'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={picName}
                        onChange={(e) => setPicName(e.target.value)}
                        placeholder="Nama PIC"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={picContact}
                        onChange={(e) => setPicContact(e.target.value)}
                        placeholder="No HP / WhatsApp"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.notes || 'Catatan Tambahan'}
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan tambahan terkait spesifikasi, klausul penalti, atau status perpanjangan..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: BERKAS PDF & SCREENSHOT SAP */}
            {activeTab === 'files' && (
              <div className="space-y-5">
                {/* 1. PDF Dokumen Kontrak Utama */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      {t.contract_pdf || 'PDF Dokumen Kontrak Utama'} (.pdf)
                    </label>
                    {initialData?.contract_pdf && (
                      <span className="text-[11px] text-emerald-600 font-semibold">
                        Sudah ada berkas di server
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={pdfInputRef}
                    accept="application/pdf"
                    onChange={(e) => e.target.files && setPdfFile(e.target.files[0])}
                    className="hidden"
                  />
                  <div
                    onDragOver={handlePdfDragOver}
                    onDragEnter={handlePdfDragOver}
                    onDragLeave={handlePdfDragLeave}
                    onDrop={handlePdfDrop}
                    onClick={() => pdfInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                      isDraggingPdf
                        ? 'border-rose-500 bg-rose-500/10 dark:bg-rose-950/40 ring-4 ring-rose-500/20 scale-[1.01]'
                        : 'border-slate-300 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    {pdfFile ? (
                      <div className="flex items-center justify-between gap-3 p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-200 dark:border-rose-800">
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/80 text-rose-600 flex items-center justify-center shrink-0">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div className="text-left truncate">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {pdfFile.name}
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {(pdfFile.size / 1024 / 1024).toFixed(2)} MB • Klik atau seret file
                              baru untuk mengganti
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPdfFile(null);
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/80 rounded-lg transition-all shrink-0"
                          title="Hapus file"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="py-2">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center mb-2">
                          <svg
                            className={`w-5 h-5 ${isDraggingPdf ? 'animate-bounce text-rose-600' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isDraggingPdf
                            ? t.drop_files_here || 'Lepaskan berkas PDF di sini...'
                            : t.drag_drop_pdf ||
                              'Tarik & Lepas berkas PDF Kontrak ke sini, atau klik untuk memilih'}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Format: .PDF (Maks. 50MB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Gambar Screenshot Sistem SAP PO */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      {t.sap_screenshot || 'Gambar Screenshot Sistem SAP Nomor PO'} (.jpg, .png,
                      .webp)
                    </label>
                    {initialData?.sap_po_screenshot && (
                      <span className="text-[11px] text-emerald-600 font-semibold">
                        Sudah ada gambar di server
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={sapInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleSapFileChange}
                    className="hidden"
                  />
                  <div
                    onDragOver={handleSapDragOver}
                    onDragEnter={handleSapDragOver}
                    onDragLeave={handleSapDragLeave}
                    onDrop={handleSapDrop}
                    onClick={() => sapInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                      isDraggingSap
                        ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-950/40 ring-4 ring-blue-500/20 scale-[1.01]'
                        : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    {sapPreviewUrl ? (
                      <div className="flex items-center justify-between gap-3 p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-3 truncate">
                          <img
                            src={sapPreviewUrl}
                            alt="SAP Preview"
                            className="w-12 h-12 object-cover rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="text-left truncate">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {sapScreenshotFile?.name || 'Screenshot SAP'}
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {sapScreenshotFile
                                ? `${(sapScreenshotFile.size / 1024).toFixed(0)} KB • `
                                : ''}
                              Klik atau seret gambar baru untuk mengganti
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSapScreenshotFile(null);
                            setSapPreviewUrl(null);
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/80 rounded-lg transition-all shrink-0"
                          title="Hapus gambar"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="py-2">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 mx-auto flex items-center justify-center mb-2">
                          <svg
                            className={`w-5 h-5 ${isDraggingSap ? 'animate-bounce text-blue-600' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isDraggingSap
                            ? t.drop_files_here || 'Lepaskan gambar di sini...'
                            : t.drag_drop_image ||
                              'Tarik & Lepas screenshot SAP PO ke sini, atau klik untuk memilih'}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Format: .JPG, .PNG, .WEBP (Maks. 20MB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Lampiran Dokumen Lainnya (Multi-PDF / Multi-files) */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      {t.attachments || 'Lampiran Beberapa Dokumen Kontrak PDF'} (Amandemen, BAST,
                      SPK)
                    </label>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                      {attachmentFiles.length} file dipilih
                    </span>
                  </div>
                  <input
                    type="file"
                    ref={attachmentsInputRef}
                    multiple
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={handleAttachmentsChange}
                    className="hidden"
                  />
                  <div
                    onDragOver={handleAttachmentsDragOver}
                    onDragEnter={handleAttachmentsDragOver}
                    onDragLeave={handleAttachmentsDragLeave}
                    onDrop={handleAttachmentsDrop}
                    onClick={() => attachmentsInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all mb-3 ${
                      isDraggingAttachments
                        ? 'border-indigo-500 bg-indigo-500/10 dark:bg-indigo-950/40 ring-4 ring-indigo-500/20 scale-[1.01]'
                        : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center mb-1.5">
                      <svg
                        className={`w-4 h-4 ${isDraggingAttachments ? 'animate-bounce text-indigo-600' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isDraggingAttachments
                        ? t.drop_files_here || 'Lepaskan berkas lampiran di sini...'
                        : t.drag_drop_attachments ||
                          'Tarik & Lepas beberapa berkas lampiran ke sini, atau klik untuk memilih'}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Bisa memilih / menarik beberapa berkas sekaligus (.PDF / .Image)
                    </span>
                  </div>

                  {/* List of pending attachments */}
                  {attachmentFiles.length > 0 && (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {attachmentFiles.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="truncate">{f.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({(f.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAttachment(idx);
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors shrink-0"
                            title="Hapus lampiran"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Bottom Footer Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                {t.cancel || 'Batal'}
              </button>

              <div className="flex items-center gap-2">
                {activeTab !== 'info' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'files') setActiveTab('sla');
                      else if (activeTab === 'sla') setActiveTab('financial');
                      else if (activeTab === 'financial') setActiveTab('info');
                    }}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    {t.previous || 'Sebelumnya'}
                  </button>
                )}

                {activeTab !== 'files' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'info') setActiveTab('financial');
                      else if (activeTab === 'financial') setActiveTab('sla');
                      else if (activeTab === 'sla') setActiveTab('files');
                    }}
                    className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold"
                  >
                    {t.next || 'Selanjutnya'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                        <span>{t.saving || 'Menyimpan...'}</span>
                      </>
                    ) : (
                      <span>
                        {initialData
                          ? t.update_contract || 'Perbarui Kontrak'
                          : t.save_contract || 'Simpan Kontrak'}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ContractFormModal;
