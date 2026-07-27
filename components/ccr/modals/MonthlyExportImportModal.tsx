import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import {
  exportMonthlyCcrData,
  parseMonthlyCcrImport,
  saveMonthlyCcrImportToDb,
  MonthlyImportResult,
} from '../../../utils/excelMonthlyUtils';
import { usePlantUnits } from '../../../hooks/usePlantUnits';
import { canAccessMonthlyExportImport } from '../../../utils/roleHelpers';
import { pb } from '../../../utils/pocketbase-simple';

interface MonthlyExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUnit: string;
  t: Record<string, string>;
  onSuccess?: () => void;
}

const MonthlyExportImportModal: React.FC<MonthlyExportImportModalProps> = ({
  isOpen,
  onClose,
  selectedUnit,
  t,
  onSuccess,
}) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [unit, setUnit] = useState<string>(selectedUnit || 'ALL');

  useEffect(() => {
    if (selectedUnit) {
      setUnit(selectedUnit);
    }
  }, [selectedUnit, isOpen]);

  const { records: plantUnits } = usePlantUnits();

  const availableUnitNames = useMemo(() => {
    const names = plantUnits.map((u) => u.unit);
    return [...new Set(names)].sort();
  }, [plantUnits]);

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isExporting, setIsExporting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [importResult, setImportResult] = useState<MonthlyImportResult | null>(null);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number } | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const monthsList = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  const yearsList = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

  const handleExport = async () => {
    setIsExporting(true);
    setNotification(null);
    try {
      await exportMonthlyCcrData(selectedYear, selectedMonth, unit);
      setNotification({
        type: 'success',
        message: 'Ekspor data bulanan berhasil di-download!',
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal mengekspor data bulanan.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setNotification(null);
    setImportResult(null);

    try {
      const parsed = await parseMonthlyCcrImport(file, unit);
      setImportResult(parsed);
      if (parsed.invalidRows > 0) {
        setNotification({
          type: 'error',
          message: `Ditemukan ${parsed.invalidRows} baris tidak valid dari total ${parsed.totalRows} baris.`,
        });
      } else {
        setNotification({
          type: 'success',
          message: `File berhasil diproses. ${parsed.validRows} baris siap diimpor.`,
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal membaca file Excel.',
      });
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  const handleSaveImport = async () => {
    if (!importResult || importResult.data.length === 0) return;

    setIsSaving(true);
    setNotification(null);
    setSaveProgress({ current: 0, total: importResult.data.length });

    try {
      const res = await saveMonthlyCcrImportToDb(importResult.data, (current, total) => {
        setSaveProgress({ current, total });
      });

      setNotification({
        type: 'success',
        message: `Impor Selesai! Berhasil menyimpan ${res.success} data record (Gagal: ${res.failed}).`,
      });
      setImportResult(null);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal menyimpan data ke database.',
      });
    } finally {
      setIsSaving(false);
      setSaveProgress(null);
    }
  };

  const userRole = pb.authStore.model?.role;
  if (!isOpen || !canAccessMonthlyExportImport(userRole)) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-slate-900 text-white border border-white/20 rounded-3xl shadow-2xl overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <DocumentDuplicateIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide">
                  Ekspor / Impor Bulanan CCR
                </h3>
                <p className="text-xs text-white/60">
                  Kelola data CCR operasional dalam rentang 1 bulan penuh
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition duration-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-hide">
            {/* Filter Selection */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                  Bulan
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-black/40 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#059669]"
                >
                  {monthsList.map((m) => (
                    <option key={m.value} value={m.value} className="bg-[#0f172a] text-white">
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                  Tahun
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-black/40 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#059669]"
                >
                  {yearsList.map((y) => (
                    <option key={y} value={y} className="bg-[#0f172a] text-white">
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                  Unit Pabrik
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/40 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#059669]"
                >
                  <option value="ALL" className="bg-[#0f172a] text-white">
                    Semua Unit (ALL)
                  </option>
                  {availableUnitNames.map((u) => (
                    <option key={u} value={u} className="bg-[#0f172a] text-white">
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notification Alert */}
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl flex items-center gap-3 border text-sm font-medium ${
                  notification.type === 'success'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                }`}
              >
                {notification.type === 'success' ? (
                  <CheckCircleIcon className="w-5 h-5 shrink-0 text-emerald-400" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-rose-400" />
                )}
                <span>{notification.message}</span>
              </motion.div>
            )}

            {/* Tabs Navigation */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('export')}
                className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'export'
                    ? 'border-[#059669] text-[#059669]'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Ekspor Bulanan
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'import'
                    ? 'border-[#059669] text-[#059669]'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                <DocumentArrowUpIcon className="w-5 h-5" />
                Impor Bulanan
              </button>
            </div>

            {/* Tab 1: Export Content */}
            {activeTab === 'export' && (
              <div className="space-y-4 pt-2">
                <p className="text-sm text-white/70 leading-relaxed">
                  Unduh seluruh data entri parameter CCR untuk bulan{' '}
                  <strong className="text-white">
                    {monthsList.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                  </strong>{' '}
                  ke dalam format berkas Excel (.xlsx).
                </p>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      Download Template / Data Bulanan
                    </h4>
                    <p className="text-xs text-white/50">
                      Termasuk semua parameter aktif dan kolom 24 jam.
                    </p>
                  </div>

                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-bold rounded-xl shadow-lg transition duration-200 disabled:opacity-50"
                  >
                    {isExporting ? (
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    ) : (
                      <DocumentArrowDownIcon className="w-5 h-5" />
                    )}
                    <span>{isExporting ? 'Mengekspor...' : 'Download Excel'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Import Content */}
            {activeTab === 'import' && (
              <div className="space-y-4 pt-2">
                <p className="text-sm text-white/70 leading-relaxed">
                  Unggah berkas Excel bulanan untuk memperbarui atau memasukkan data CCR sekaligus
                  ke database.
                </p>

                {/* File Upload Dropzone */}
                <div className="relative p-6 border-2 border-dashed border-white/20 hover:border-[#059669]/60 rounded-2xl bg-black/20 text-center transition duration-200">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    disabled={isParsing || isSaving}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <DocumentArrowUpIcon className="w-10 h-10 text-[#059669]" />
                    <span className="text-sm font-bold text-white">
                      Klik atau seret berkas Excel di sini
                    </span>
                    <span className="text-xs text-white/40">Format didukung: .xlsx, .xls</span>
                  </div>
                </div>

                {isParsing && (
                  <div className="flex items-center justify-center gap-3 p-4">
                    <ArrowPathIcon className="w-5 h-5 animate-spin text-[#059669]" />
                    <span className="text-sm font-medium text-white/70">
                      Membaca data dari Excel...
                    </span>
                  </div>
                )}

                {/* Import Preview */}
                {importResult && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-white/70">
                      <span>Preview Ringkasan Baris Data:</span>
                      <span className="text-emerald-400">
                        {importResult.validRows} Siap Diimpor
                      </span>
                    </div>

                    {/* Progress Bar when saving */}
                    {isSaving && saveProgress && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-white/70">
                          <span>Menyimpan ke Database...</span>
                          <span>
                            {saveProgress.current} / {saveProgress.total}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#059669] to-emerald-400 transition-all duration-200"
                            style={{
                              width: `${(saveProgress.current / saveProgress.total) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="max-h-48 overflow-y-auto border border-white/10 rounded-xl bg-black/40 p-2 scrollbar-hide text-xs">
                      <table className="w-full text-left">
                        <thead className="text-white/40 border-b border-white/10 uppercase">
                          <tr>
                            <th className="p-2">Tanggal</th>
                            <th className="p-2">Parameter</th>
                            <th className="p-2 text-center">Unit</th>
                            <th className="p-2 text-right">Data Jam</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/80">
                          {importResult.data.slice(0, 15).map((row, idx) => (
                            <tr key={idx}>
                              <td className="p-2">{row.date}</td>
                              <td className="p-2 font-medium text-white">{row.parameter_name}</td>
                              <td className="p-2 text-center">{row.unit}</td>
                              <td className="p-2 text-right">
                                {Object.values(row.hours).filter((v) => v !== null).length} / 24
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {importResult.data.length > 15 && (
                        <p className="p-2 text-center text-white/40 text-[10px]">
                          ...dan {importResult.data.length - 15} baris lainnya.
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleSaveImport}
                      disabled={isSaving || importResult.validRows === 0}
                      className="w-full py-3 bg-gradient-to-r from-[#059669] to-[#111827] hover:from-[#059669]/90 hover:to-[#111827]/90 text-white font-bold text-sm rounded-xl shadow-lg transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircleIcon className="w-5 h-5" />
                      )}
                      <span>
                        {isSaving
                          ? 'Menyimpan Data...'
                          : `Simpan ${importResult.validRows} Record ke Database`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MonthlyExportImportModal;
