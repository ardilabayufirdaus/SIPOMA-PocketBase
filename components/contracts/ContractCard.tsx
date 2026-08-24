import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EnrichedContract, formatContractCurrency } from '../../hooks/useContractsData';

interface ContractCardProps {
  contract: EnrichedContract;
  onViewDetail: (contract: EnrichedContract) => void;
  onEdit: (contract: EnrichedContract) => void;
  onDelete: (contract: EnrichedContract) => void;
  onViewPdf: (url: string, title: string) => void;
  onViewSapScreenshot: (url: string, po: string, title: string) => void;
  getFileUrl: (contract: any, filename?: string) => string;
  canEdit?: boolean;
  t?: Record<string, string>;
  language?: string;
}

export const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  onViewDetail,
  onEdit,
  onDelete,
  onViewPdf,
  onViewSapScreenshot,
  getFileUrl,
  canEdit = true,
  t = {},
  language = 'id',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPO = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(contract.po_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAmount = (val: number) => {
    return formatContractCurrency(val, contract.currency || 'IDR');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      const locale = language === 'en' ? 'en-US' : 'id-ID';
      return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const pdfUrl = contract.contract_pdf ? getFileUrl(contract, contract.contract_pdf) : '';
  const sapUrl = contract.sap_po_screenshot ? getFileUrl(contract, contract.sap_po_screenshot) : '';
  const attachmentCount = Array.isArray(contract.attachments) ? contract.attachments.length : 0;

  // Status Badge Logic
  const renderExpiryBadge = () => {
    if (contract.expiryStatus === 'expired') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          {t.expired_badge || 'Kedaluwarsa'}
        </span>
      );
    }
    if (contract.isH30) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider bg-rose-500 text-white shadow-xs animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          {t.h30_critical_badge || 'Kritis H-'}
          {contract.daysRemaining}
        </span>
      );
    }
    if (contract.isH90) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          H-{contract.daysRemaining} {t.days_left || 'Hari'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        {t.active_badge || 'Aktif'} ({contract.daysRemaining}d)
      </span>
    );
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md bg-white dark:bg-slate-900 flex flex-col justify-between overflow-hidden relative ${
        contract.isH30
          ? 'border-rose-400/80 dark:border-rose-800 ring-1 ring-rose-500/20'
          : contract.isH90
            ? 'border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-500/10'
            : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Top Accent Strip */}
      <div
        className={`h-1.5 w-full ${
          contract.isH30
            ? 'bg-rose-500'
            : contract.isH90
              ? 'bg-amber-500'
              : contract.expiryStatus === 'expired'
                ? 'bg-slate-400'
                : 'bg-emerald-500'
        }`}
      />

      <div className="p-5 flex-1 flex flex-col">
        {/* Card Header: PO & Status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleCopyPO}
              title="Salin Nomor PO"
              className="group inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs font-black rounded-lg border border-slate-200 dark:border-slate-700 transition-all"
            >
              <span>{contract.po_number}</span>
              <svg
                className={`w-3.5 h-3.5 ${copied ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {copied ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                )}
              </svg>
            </button>

            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-[10px] font-semibold rounded-md">
              {contract.category}
            </span>

            {contract.currency && contract.currency !== 'IDR' && (
              <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-mono font-bold rounded-md">
                {contract.currency}
              </span>
            )}
          </div>

          <div>{renderExpiryBadge()}</div>
        </div>

        {/* Contract Title & Vendor */}
        <h3
          onClick={() => onViewDetail(contract)}
          className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition-colors leading-snug mb-1"
        >
          {contract.contract_title}
        </h3>

        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-4">
          <svg
            className="w-3.5 h-3.5 text-slate-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span className="truncate">{contract.vendor_name}</span>
        </p>

        {/* Timeline / Masa Berlaku */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 mb-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
          <div>
            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
              {t.start_date || 'Mulai'}
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatDate(contract.start_date)}
            </span>
          </div>
          <div className="flex flex-col items-center px-2">
            <span className="text-slate-400 text-[10px]">s/d</span>
            <div className="w-12 h-0.5 bg-slate-200 dark:bg-slate-700 my-0.5"></div>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
              {t.end_date || 'Berakhir'}
            </span>
            <span
              className={`font-bold ${
                contract.isH30
                  ? 'text-rose-600 dark:text-rose-400'
                  : contract.isH90
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {formatDate(contract.end_date)}
            </span>
          </div>
        </div>

        {/* Meters Section: 1. Anggaran, 2. Sisa Volume */}
        <div className="space-y-3.5 mb-4 flex-1">
          {/* 1. Serapan Anggaran */}
          <div>
            <div className="flex justify-between items-baseline text-xs mb-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {t.budget_absorbed || 'Serapan Anggaran'} ({contract.budgetAbsorptionPct.toFixed(1)}
                %)
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {formatAmount(contract.budget_absorbed)}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  contract.budgetAbsorptionPct >= 95
                    ? 'bg-rose-500'
                    : contract.budgetAbsorptionPct >= 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, contract.budgetAbsorptionPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>
                {t.contract_budget || 'Pagu'}: {formatAmount(contract.contract_budget)}
              </span>
              <span>
                {t.remaining || 'Sisa'}: {formatAmount(contract.budgetRemaining)}
              </span>
            </div>
          </div>

          {/* 2. Sisa Volume Kontrak */}
          {contract.initial_volume > 0 && (
            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {t.remaining_volume || 'Sisa Volume'} (
                  {contract.volumeRemaining.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}{' '}
                  {contract.volume_unit || ''})
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {contract.volumeAbsorptionPct.toFixed(1)}% {t.absorbed || 'Terpakai'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, contract.volumeAbsorptionPct)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>
                  {t.contract_volume || 'Pagu Vol'}:{' '}
                  {contract.initial_volume.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}{' '}
                  {contract.volume_unit}
                </span>
                <span>
                  {t.absorbed_volume || 'Realisasi'}:{' '}
                  {contract.absorbed_volume?.toLocaleString(
                    language === 'en' ? 'en-US' : 'id-ID'
                  ) || 0}{' '}
                  {contract.volume_unit}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Document Chips (PDF, SAP Screenshot, Attachments) */}
        <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-slate-100 dark:border-slate-800/80 mb-3">
          {/* PDF Kontrak Utama */}
          {pdfUrl ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewPdf(pdfUrl, contract.contract_title);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold transition-all border border-rose-200 dark:border-rose-800"
            >
              <svg
                className="w-3 h-3 text-rose-500"
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
              <span>{t.contract_pdf || 'PDF Kontrak'}</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-medium">
              {t.no_pdf_uploaded || 'No PDF'}
            </span>
          )}

          {/* Screenshot SAP */}
          {sapUrl ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewSapScreenshot(sapUrl, contract.po_number, contract.contract_title);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold transition-all border border-blue-200 dark:border-blue-800"
            >
              <svg
                className="w-3 h-3 text-blue-500"
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
              <span>{t.sap_screenshot || 'SAP PO'}</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-medium">
              {t.no_sap_uploaded || 'No SAP'}
            </span>
          )}

          {/* Attachments Counter */}
          {attachmentCount > 0 && (
            <span
              onClick={() => onViewDetail(contract)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
            >
              <svg
                className="w-3 h-3 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              <span>
                {attachmentCount} {t.attachments || 'Lampiran'}
              </span>
            </span>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <button
            onClick={() => onViewDetail(contract)}
            className="flex-1 py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all text-center"
          >
            {t.contract_detail || 'Rincian & SLA'}
          </button>

          {canEdit && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(contract);
                }}
                className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-all"
                title={t.edit_contract || 'Edit Kontrak'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(contract);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-all"
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
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ContractCard;
