import React, { useState } from 'react';
import { EnrichedContract, formatContractCurrency } from '../../hooks/useContractsData';

interface ContractTableViewProps {
  contracts: EnrichedContract[];
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

export const ContractTableView: React.FC<ContractTableViewProps> = ({
  contracts,
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPO = (po: string, id: string) => {
    navigator.clipboard.writeText(po);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatAmount = (val: number, curr?: string) => {
    return formatContractCurrency(val, curr || 'IDR');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  if (contracts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {t.no_contracts_found || 'Tidak ada data kontrak'}
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          {t.no_contracts_desc ||
            'Coba sesuaikan filter pencarian Anda atau tambahkan kontrak baru.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Table Header Bar - COP Analysis Precision Framing */}
      <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              {t.contract_table_title || 'Tabel Registrasi Kontrak & SLA'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daftar seluruh kontrak rekanan aktif, serapan anggaran, volume, dan kepatuhan masa
              berlaku
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700">
            {contracts.length} Kontrak
          </span>
        </div>
      </div>

      <div className="overflow-x-auto scroll-smooth">
        <table className="min-w-full text-xs border-collapse text-left" role="table">
          <thead className="bg-slate-700 dark:bg-slate-800 text-white uppercase text-[11px] font-bold tracking-wider sticky top-0 z-20 border-b border-slate-600 dark:border-slate-700">
            <tr>
              <th className="py-2.5 px-3">
                {t.po_number || 'PO'} & {t.vendor_name || 'Rekanan'}
              </th>
              <th className="py-2.5 px-3">
                {t.contract_title || 'Judul Kontrak'} & {t.category || 'Kategori'}
              </th>
              <th className="py-2.5 px-3">{t.contract_period || 'Masa Berlaku'} & Status</th>
              <th className="py-2.5 px-3">
                {t.contract_budget || 'Anggaran'} & {t.absorbed || 'Serapan'}
              </th>
              <th className="py-2.5 px-3">{t.remaining_volume || 'Sisa Volume'}</th>
              <th className="py-2.5 px-3 text-center">{t.attachments || 'Dokumen'}</th>
              <th className="py-2.5 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
            {contracts.map((c) => {
              const pdfUrl = c.contract_pdf ? getFileUrl(c, c.contract_pdf) : '';
              const sapUrl = c.sap_po_screenshot ? getFileUrl(c, c.sap_po_screenshot) : '';
              const attachmentCount = Array.isArray(c.attachments) ? c.attachments.length : 0;

              return (
                <tr
                  key={c.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors group"
                >
                  {/* 1. PO & Vendor */}
                  <td className="py-2 px-3 align-top whitespace-nowrap">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                        {c.po_number}
                      </span>
                      <button
                        onClick={() => handleCopyPO(c.po_number, c.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title={t.copied_to_clipboard || 'Salin No PO'}
                      >
                        {copiedId === c.id ? (
                          <span className="text-[10px] text-emerald-500 font-bold">OK!</span>
                        ) : (
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
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                      {c.vendor_name}
                    </div>
                  </td>

                  {/* 2. Judul Kontrak & Kategori */}
                  <td className="py-2 px-3 align-top max-w-xs">
                    <div
                      onClick={() => onViewDetail(c)}
                      className="font-bold text-xs text-slate-900 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer line-clamp-2 mb-0.5"
                    >
                      {c.contract_title}
                    </div>
                    <span className="inline-block px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold rounded">
                      {c.category}
                    </span>
                  </td>

                  {/* 3. Masa Berlaku & Status H-90 */}
                  <td className="py-2 px-3 align-top whitespace-nowrap">
                    <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-semibold mb-0.5">
                      {formatDate(c.start_date)} - {formatDate(c.end_date)}
                    </div>
                    <div>
                      {c.expiryStatus === 'expired' ? (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                          {t.expired_badge || 'Kedaluwarsa'}
                        </span>
                      ) : c.isH30 ? (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                          {t.h30_critical_badge || 'Kritis H-'}
                          {c.daysRemaining}
                        </span>
                      ) : c.isH90 ? (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          H-{c.daysRemaining} {t.days_left || 'Hari'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {t.active_badge || 'Aktif'} ({c.daysRemaining}d)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 4. Anggaran & Serapan */}
                  <td className="py-2 px-3 align-top whitespace-nowrap">
                    <div className="flex justify-between items-center text-[11px] font-bold mb-0.5 font-mono">
                      <span className="text-slate-900 dark:text-white">
                        {formatAmount(c.budget_absorbed, c.currency)}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 ml-2">
                        {c.budgetAbsorptionPct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-0.5">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, c.budgetAbsorptionPct)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
                      <span>Pagu: {formatAmount(c.contract_budget, c.currency)}</span>
                    </div>
                  </td>

                  {/* 5. Sisa Volume */}
                  <td className="py-2 px-3 align-top whitespace-nowrap">
                    {c.initial_volume > 0 ? (
                      <div>
                        <div className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">
                          {c.volumeRemaining.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}{' '}
                          {c.volume_unit}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {t.remaining || 'Sisa'} /{' '}
                          {c.initial_volume.toLocaleString(language === 'en' ? 'en-US' : 'id-ID')} (
                          {c.volumeAbsorptionPct.toFixed(0)}%)
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>

                  {/* 6. Dokumen (PDF, SAP, Attachments) */}
                  <td className="py-2 px-3 align-top text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {pdfUrl && (
                        <button
                          onClick={() => onViewPdf(pdfUrl, c.contract_title)}
                          className="p-1 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded border border-rose-200 dark:border-rose-800 transition-all"
                          title={t.preview_pdf || 'Lihat PDF Kontrak'}
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
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      )}

                      {sapUrl && (
                        <button
                          onClick={() => onViewSapScreenshot(sapUrl, c.po_number, c.contract_title)}
                          className="p-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800 transition-all"
                          title={t.preview_sap || 'Lihat Screenshot SAP'}
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
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      )}

                      {attachmentCount > 0 && (
                        <span
                          onClick={() => onViewDetail(c)}
                          className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded cursor-pointer"
                          title={`${attachmentCount} ${t.attachments || 'Lampiran'}`}
                        >
                          +{attachmentCount}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 7. Action buttons */}
                  <td className="py-2 px-3 align-top text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewDetail(c)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all shadow-xs"
                      >
                        {t.contract_detail || 'Detail'}
                      </button>

                      {canEdit && (
                        <>
                          <button
                            onClick={() => onEdit(c)}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded transition-all"
                            title={t.edit_contract || 'Edit'}
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
                          </button>
                          <button
                            onClick={() => onDelete(c)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded transition-all"
                            title={t.delete_contract || 'Hapus'}
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractTableView;
