import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnrichedContract, formatContractCurrency } from '../../hooks/useContractsData';

interface ContractDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: EnrichedContract | null;
  onEdit: (contract: EnrichedContract) => void;
  onDelete: (contract: EnrichedContract) => void;
  onUpdateRealization: (id: string, budget: number, volume: number) => Promise<any>;
  onViewPdf: (url: string, title: string) => void;
  onViewSapScreenshot: (url: string, po: string, title: string) => void;
  getFileUrl: (contract: any, filename?: string) => string;
  canEdit?: boolean;
  t?: Record<string, string>;
  language?: string;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  isOpen,
  onClose,
  contract,
  onEdit,
  onDelete,
  onUpdateRealization,
  onViewPdf,
  onViewSapScreenshot,
  getFileUrl,
  canEdit = true,
  t = {},
  language = 'id',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sap' | 'pdf' | 'attachments' | 'sla'>(
    'overview'
  );
  const [isUpdatingRealization, setIsUpdatingRealization] = useState(false);
  const [editBudgetAbsorbed, setEditBudgetAbsorbed] = useState<number>(0);
  const [editAbsorbedVolume, setEditAbsorbedVolume] = useState<number>(0);
  const [showRealizationEditor, setShowRealizationEditor] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (contract) {
      setEditBudgetAbsorbed(Number(contract.budget_absorbed || 0));
      setEditAbsorbedVolume(Number(contract.absorbed_volume || 0));
      setShowRealizationEditor(false);
      setActiveTab('overview');
    }
  }, [contract]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !contract) return null;

  const handleCopyPO = () => {
    navigator.clipboard.writeText(contract.po_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveRealization = async () => {
    setIsUpdatingRealization(true);
    try {
      await onUpdateRealization(contract.id, editBudgetAbsorbed, editAbsorbedVolume);
      setShowRealizationEditor(false);
    } catch (err) {
      console.error('Failed to update realization:', err);
    } finally {
      setIsUpdatingRealization(false);
    }
  };

  const formatAmount = (val: number) => {
    return formatContractCurrency(val, contract.currency || 'IDR');
  };

  const formatDate = (dStr: string) => {
    if (!dStr) return '-';
    try {
      const locale = language === 'en' ? 'en-US' : 'id-ID';
      return new Date(dStr).toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const pdfUrl = contract.contract_pdf ? getFileUrl(contract, contract.contract_pdf) : '';
  const sapUrl = contract.sap_po_screenshot ? getFileUrl(contract, contract.sap_po_screenshot) : '';
  const attachments = Array.isArray(contract.attachments) ? contract.attachments : [];

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

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative z-10 w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden font-sans"
        >
          {/* Top Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPO}
                    className="inline-flex items-center gap-1 font-mono text-xs font-black bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <span>{contract.po_number}</span>
                    {copied && (
                      <span className="text-[10px] text-emerald-600 font-bold">
                        ✓ {t.copied_to_clipboard || 'Tersalin'}
                      </span>
                    )}
                  </button>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-md">
                    {contract.category}
                  </span>
                  {contract.isH30 ? (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                      {t.h30_critical_badge || 'Kritis H-'}
                      {contract.daysRemaining}
                    </span>
                  ) : contract.isH90 ? (
                    <span className="bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                      {t.h90_warning_badge || 'Peringatan H-'}
                      {contract.daysRemaining}
                    </span>
                  ) : null}
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight mt-0.5 line-clamp-1">
                  {contract.contract_title}
                </h3>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              {canEdit && (
                <>
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(contract);
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span>{t.edit_contract || 'Edit'}</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onDelete(contract);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-all"
                    title={t.delete_contract || 'Hapus Kontrak'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </>
              )}

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
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/40 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {t.tab_overview || 'Ringkasan & Realisasi'}
            </button>
            <button
              onClick={() => setActiveTab('sap')}
              className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'sap'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <span>{t.sap_screenshot || 'Screenshot SAP PO'}</span>
              {sapUrl && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'pdf'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <span>{t.contract_pdf || 'PDF Dokumen Kontrak'}</span>
              {pdfUrl && <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>}
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'attachments'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <span>
                {t.attachments || 'Lampiran Berkas'} ({attachments.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('sla')}
              className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'sla'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {t.sla_kpi_target || 'Target & Kinerja SLA'}
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* TAB 1: OVERVIEW & REALISASI */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 1. Masa Berlaku & H-90 Countdown Banner */}
                <div
                  className={`rounded-2xl p-4.5 border ${
                    contract.isH30
                      ? 'bg-rose-500/10 border-rose-400 dark:border-rose-800'
                      : contract.isH90
                        ? 'bg-amber-500/10 border-amber-300 dark:border-amber-700'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {t.contract_period || 'Masa Berlaku Kontrak'}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                        {formatDate(contract.start_date)} &mdash; {formatDate(contract.end_date)}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          {t.days_remaining || 'Sisa Masa Berlaku'}
                        </span>
                        <span
                          className={`text-base font-black ${
                            contract.expiryStatus === 'expired'
                              ? 'text-rose-600'
                              : contract.isH30
                                ? 'text-rose-600'
                                : contract.isH90
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                          }`}
                        >
                          {contract.expiryStatus === 'expired'
                            ? t.expired_badge || 'Sudah Kedaluwarsa'
                            : `${contract.daysRemaining} ${t.days_left || 'Hari Lagi'}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Key Metrics Grid: Anggaran & Volume */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Anggaran Tracker */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-4.5 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {t.contract_budget || 'Anggaran'} & {t.absorbed || 'Serapan'}
                      </h4>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {contract.budgetAbsorptionPct.toFixed(1)}%
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-500 font-sans">
                          {t.contract_budget || 'Pagu Total'} ({contract.currency || 'IDR'}):
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatAmount(contract.contract_budget)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-500 font-sans">
                          {t.budget_absorbed || 'Realisasi Serapan'}:
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatAmount(contract.budget_absorbed)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800 font-mono">
                        <span className="text-slate-500 font-sans">
                          {t.remaining_budget || 'Sisa Pagu'}:
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {formatAmount(contract.budgetRemaining)}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, contract.budgetAbsorptionPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Volume Tracker */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-4.5 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        {t.contract_volume || 'Volume'} & {t.remaining_volume || 'Sisa Volume'}
                      </h4>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                        {contract.volumeAbsorptionPct.toFixed(1)}%
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">
                          {t.contract_volume || 'Pagu Volume'}:
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          {contract.initial_volume.toLocaleString(
                            language === 'en' ? 'en-US' : 'id-ID'
                          )}{' '}
                          {contract.volume_unit}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">
                          {t.absorbed_volume || 'Volume Terpakai'}:
                        </span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                          {contract.absorbed_volume?.toLocaleString(
                            language === 'en' ? 'en-US' : 'id-ID'
                          ) || 0}{' '}
                          {contract.volume_unit}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">
                          {t.remaining_volume || 'Sisa Volume'}:
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                          {contract.volumeRemaining.toLocaleString(
                            language === 'en' ? 'en-US' : 'id-ID'
                          )}{' '}
                          {contract.volume_unit}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, contract.volumeAbsorptionPct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Realization Update Box */}
                {canEdit && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {t.update_realization_quick ||
                            'Pembaruan Cepat Realisasi (Serapan Anggaran & Volume)'}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {t.update_realization_desc ||
                            'Perbarui realisasi bulanan tanpa harus membuka form edit lengkap.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRealizationEditor(!showRealizationEditor)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-all shadow-xs"
                      >
                        {showRealizationEditor
                          ? t.cancel || 'Tutup Editor'
                          : t.update_realization || 'Update Realisasi'}
                      </button>
                    </div>

                    {showRealizationEditor && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            {t.budget_absorbed || 'Realisasi Serapan Anggaran'} (
                            {contract.currency || 'IDR'})
                          </label>
                          <input
                            type="number"
                            step={contract.currency === 'IDR' ? 1 : 0.01}
                            value={editBudgetAbsorbed}
                            onChange={(e) => setEditBudgetAbsorbed(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            {t.absorbed_volume || 'Realisasi Volume'} (
                            {contract.volume_unit || 'Unit'})
                          </label>
                          <input
                            type="number"
                            value={editAbsorbedVolume}
                            onChange={(e) => setEditAbsorbedVolume(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={isUpdatingRealization}
                          onClick={handleSaveRealization}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {isUpdatingRealization
                            ? t.saving || 'Menyimpan...'
                            : t.save_realization || 'Simpan Realisasi'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Vendor, PIC, & Notes Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                      {t.vendor_name || 'Vendor'} & {t.pic_name || 'PIC'}
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500">{t.vendor_name || 'Nama Vendor'}:</span>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {contract.vendor_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">{t.pic_name || 'PIC'}:</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {contract.pic_name || '-'}{' '}
                          {contract.pic_contact ? `(${contract.pic_contact})` : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                      {t.notes || 'Catatan Kontrak'}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      {contract.notes || 'Tidak ada catatan tambahan untuk kontrak ini.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SAP SCREENSHOT */}
            {activeTab === 'sap' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {t.sap_screenshot || 'Screenshot Sistem SAP PO'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Tangkapan layar bukti input purchase order pada sistem SAP.
                    </p>
                  </div>
                  {sapUrl && (
                    <button
                      onClick={() =>
                        onViewSapScreenshot(sapUrl, contract.po_number, contract.contract_title)
                      }
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm"
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
                          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                        />
                      </svg>
                      <span>{t.view_full_resolution || 'Lihat Resolusi Penuh'}</span>
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-950/20 p-4 flex items-center justify-center min-h-[350px]">
                  {sapUrl ? (
                    <img
                      src={sapUrl}
                      alt={`SAP Screenshot ${contract.po_number}`}
                      className="max-w-full max-h-[450px] object-contain rounded-lg shadow-md cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() =>
                        onViewSapScreenshot(sapUrl, contract.po_number, contract.contract_title)
                      }
                    />
                  ) : (
                    <div className="text-center p-8 text-slate-400 text-xs">
                      {t.no_sap_uploaded || 'Belum ada gambar screenshot sistem SAP yang diunggah.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: PDF DOKUMEN KONTRAK */}
            {activeTab === 'pdf' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {t.contract_pdf || 'Dokumen PDF Kontrak Utama'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Naskah asli perjanjian kontrak pengadaan / jasa.
                    </p>
                  </div>
                  {pdfUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-1.5"
                      >
                        {t.open_new_tab || 'Buka Tab Baru'}
                      </a>
                      <a
                        href={pdfUrl}
                        download
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        {t.download_pdf || 'Unduh PDF'}
                      </a>
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 h-[450px]">
                  {pdfUrl ? (
                    <iframe
                      src={`${pdfUrl}#toolbar=1&navpanes=0`}
                      title="Contract PDF Preview"
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                      {t.no_pdf_uploaded || 'Belum ada dokumen PDF kontrak utama yang diunggah.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: LAMPIRAN BERKAS PDF */}
            {activeTab === 'attachments' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {t.attachments || 'Arsip Lampiran Dokumen Digital'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Berkas pendukung: Dokumen Addendum, Amandemen, Berita Acara (BAST), SPK, dan
                    Dokumen SLA.
                  </p>
                </div>

                {attachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map((filename: string, idx: number) => {
                      const fileUrl = getFileUrl(contract, filename);
                      const isPdf = filename.toLowerCase().endsWith('.pdf');

                      return (
                        <div
                          key={idx}
                          className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isPdf
                                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/80'
                                  : 'bg-blue-100 text-blue-600 dark:bg-blue-950/80'
                              }`}
                            >
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
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {t.attachments || 'Lampiran'} #{idx + 1}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">{filename}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                if (isPdf) {
                                  onViewPdf(
                                    fileUrl,
                                    `Lampiran #${idx + 1} - ${contract.contract_title}`
                                  );
                                } else {
                                  onViewSapScreenshot(
                                    fileUrl,
                                    contract.po_number,
                                    `Lampiran #${idx + 1}`
                                  );
                                }
                              }}
                              className="p-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-all"
                              title="Pratinjau"
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            <a
                              href={fileUrl}
                              download
                              className="p-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-all"
                              title="Unduh Berkas"
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
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                    {t.no_attachments ||
                      'Belum ada lampiran berkas tambahan yang diunggah untuk kontrak ini.'}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: TARGET & KINERJA SLA */}
            {activeTab === 'sla' && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4.5 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {t.sla_kpi_target || 'Target & Indikator Kinerja (KPI) SLA'}
                    </h4>
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                      {t.sla_status || 'Status SLA'}: {contract.sla_status || 'On Track'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {contract.sla_kpi_target || 'Belum ada target SLA khusus yang didefinisikan.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all"
            >
              {t.close || 'Tutup'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ContractDetailModal;
