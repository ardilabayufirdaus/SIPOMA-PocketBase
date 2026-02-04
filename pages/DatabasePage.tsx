import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useTranslation } from '../hooks/useTranslation';
import { pb } from '../utils/pocketbase-simple';
import { logger } from '../utils/logger';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
  Loader2,
  ChevronDown,
  Activity,
  Terminal,
  Cpu,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { syncOperationalDataForMonth } from '../utils/operationalSyncUtils';

type TabId = 'cm' | 'rkc';

const DatabasePage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('cm');

  // Month & Year State
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isDownloading, setIsDownloading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'cm',
      label: t.plantOperations || 'CM Plant Operations',
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      id: 'rkc',
      label: t.rkcPlantOperations || 'RKC Plant Operations',
      icon: <Cpu className="w-3.5 h-3.5" />,
    },
  ];

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      setSyncStatus('Sinkronisasi & Update Kalkulasi...');
      await syncOperationalDataForMonth(selectedMonth, selectedYear, (current, total) => {
        setSyncStatus(`Sinkronisasi Data... ${Math.round((current / total) * 100)}%`);
      });
      setSyncStatus('Menyiapkan Laporan...');

      const workbook = new ExcelJS.Workbook();
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDay}`;
      const filter = `date >= "${startDate}" && date <= "${endDate}"`;

      const [plantUnits, siloDefs] = await Promise.all([
        pb.collection('plant_units').getFullList({ sort: 'category,unit' }),
        pb.collection('silo_capacities').getFullList({ sort: 'silo_name' }),
      ]);

      const [materialData, downtimeData, siloData, infoData] = await Promise.all([
        pb.collection('ccr_material_usage').getFullList({ filter, sort: 'date,created' }),
        pb.collection('ccr_downtime_data').getFullList({ filter, sort: 'date,created' }),
        pb
          .collection('ccr_silo_data')
          .getFullList({ filter, sort: 'date,created', expand: 'silo_id' }),
        pb.collection('ccr_information').getFullList({ filter, sort: 'date,created' }),
      ]);

      for (const unit of plantUnits) {
        const sheetName = `${unit.unit}`.replace(/[\\/*[\]:?]/g, '_').substring(0, 31);
        const worksheet = workbook.addWorksheet(sheetName);

        const unitMaterial = materialData.filter((d) => d.plant_unit === unit.unit);
        const unitDowntime = downtimeData.filter((d) => d.plant_unit === unit.unit);
        const unitSiloData = siloData.filter((d) => {
          const expanded = d.expand?.silo_id as any;
          return expanded?.unit === unit.unit;
        });
        const unitInfo = infoData.filter((d) => d.plant_unit === unit.unit);
        const unitSiloDefs = siloDefs.filter((def) => def.unit === unit.unit);

        worksheet.addRow([`CM Plant Operations Data - ${unit.unit}`]);
        worksheet.addRow([
          `Period: ${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`,
        ]);
        worksheet.addRow([]);

        worksheet.addRow(['SECTION 1: MATERIAL USAGE (DAILY TOTAL)']);
        const materialHeader = [
          'Date',
          'Clinker',
          'Gypsum',
          'Limestone',
          'Trass',
          'Fly Ash',
          'Fine Trass',
          'CKD',
          'Total Production',
        ];
        worksheet.addRow(materialHeader);

        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const allDates = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        });

        if (allDates.length > 0) {
          const dailyAggregated = unitMaterial.reduce(
            (acc, curr) => {
              const date = curr.date;
              if (!acc[date]) {
                acc[date] = {
                  date,
                  clinker: 0,
                  gypsum: 0,
                  limestone: 0,
                  trass: 0,
                  fly_ash: 0,
                  fine_trass: 0,
                  ckd: 0,
                  total_production: 0,
                };
              }
              acc[date].clinker += curr.clinker || 0;
              acc[date].gypsum += curr.gypsum || 0;
              acc[date].limestone += curr.limestone || 0;
              acc[date].trass += curr.trass || 0;
              acc[date].fly_ash += curr.fly_ash || 0;
              acc[date].fine_trass += curr.fine_trass || 0;
              acc[date].ckd += curr.ckd || 0;
              acc[date].total_production += curr.total_production || 0;
              return acc;
            },
            {} as Record<string, any>
          );

          allDates.forEach((dateStr) => {
            const item = dailyAggregated[dateStr] || {
              date: dateStr,
              clinker: 0,
              gypsum: 0,
              limestone: 0,
              trass: 0,
              fly_ash: 0,
              fine_trass: 0,
              ckd: 0,
              total_production: 0,
            };
            worksheet.addRow([
              item.date,
              item.clinker,
              item.gypsum,
              item.limestone,
              item.trass,
              item.fly_ash,
              item.fine_trass,
              item.ckd,
              item.total_production,
            ]);
          });
        }
        worksheet.addRow([]);

        worksheet.addRow(['SECTION 2: SILO DATA']);
        const siloHeader = [
          'Date',
          'Silo Name',
          'Shift 1 Empty',
          'Shift 1 Content',
          'Shift 2 Empty',
          'Shift 2 Content',
          'Shift 3 Empty',
          'Shift 3 Content',
        ];
        worksheet.addRow(siloHeader);

        if (allDates.length > 0 && unitSiloDefs.length > 0) {
          allDates.forEach((dateStr) => {
            unitSiloDefs.forEach((siloDef) => {
              const record = unitSiloData.find(
                (d) => d.date.split('T')[0] === dateStr && d.silo_id === siloDef.id
              );
              if (record) {
                worksheet.addRow([
                  dateStr,
                  siloDef.silo_name,
                  record.shift1_empty_space,
                  record.shift1_content,
                  record.shift2_empty_space,
                  record.shift2_content,
                  record.shift3_empty_space,
                  record.shift3_content,
                ]);
              } else {
                worksheet.addRow([dateStr, siloDef.silo_name, '-', '-', '-', '-', '-', '-']);
              }
            });
          });
        }
        worksheet.addRow([]);

        worksheet.addRow(['SECTION 3: DOWNTIME DATA']);
        const downtimeHeader = [
          'Date',
          'Start Time',
          'End Time',
          'Duration (Min)',
          'Equipment',
          'Problem',
          'Action',
          'Remarks',
        ];
        worksheet.addRow(downtimeHeader);

        if (unitDowntime.length > 0) {
          unitDowntime.forEach((item) => {
            worksheet.addRow([
              item.date,
              item.start_time,
              item.end_time,
              item.duration_minutes,
              item.equipment_tag || item.equipment,
              item.description || item.problem,
              item.action,
              item.remarks,
            ]);
          });
        }
        worksheet.addRow([]);

        worksheet.addRow(['SECTION 4: INFORMATION']);
        const infoHeader = ['Date', 'Information'];
        worksheet.addRow(infoHeader);

        if (unitInfo.length > 0) {
          unitInfo.forEach((item) => {
            worksheet.addRow([item.date, item.information]);
          });
        }

        worksheet.columns.forEach((column) => {
          column.width = 15;
        });
        worksheet.getRow(1).font = { bold: true, size: 14 };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileName = `CM_Plant_Operations_${months.find((m) => m.value === selectedMonth)?.label}_${selectedYear}.xlsx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Failed to download Excel.');
    } finally {
      setIsDownloading(false);
      setSyncStatus('');
    }
  };

  return (
    <div className="relative flex flex-col h-screen max-h-screen overflow-hidden text-[#333333] dark:text-slate-100 font-sans bg-[#F7F7F7] dark:bg-slate-950">
      {/* Subtle Ubuntu Gradient Overlay (Mirrors Main Dashboard) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#E95420]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[#772953]/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 overflow-hidden max-w-[1700px] mx-auto w-full">
        {/* Header Area */}
        <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-2">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#333333] dark:text-white">
                Database <span className="text-[#E95420]">Management</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-[#E95420] text-white">
                Admin Tools
              </span>
            </div>
            <p className="text-[11px] text-[#808080] dark:text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 pl-0.5">
              CENTRALIZED DATA REPOSITORY • OPERATIONAL REPORTING
            </p>
          </motion.div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-4 py-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 shadow-sm">
              <Activity className="w-3.5 h-3.5 text-[#E95420]" />
              <span className="text-xs font-bold text-[#333333] dark:text-slate-300 uppercase tracking-widest">
                Database Online
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Dashboard Style */}
        <div className="flex-shrink-0 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-5 py-2.5 rounded text-[11px] font-bold uppercase tracking-widest transition-all duration-200 flex items-center gap-2 border
                  ${
                    isActive
                      ? 'bg-[#E95420] text-white border-[#E95420] shadow-sm transform scale-105'
                      : 'bg-white dark:bg-slate-900 text-[#333333] dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-[#E95420]/50'
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area - Scrollable like Dashboard Overview */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'cm' && (
              <motion.div
                key="cm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* Main Control Card */}
                <div className="lg:col-span-8">
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 lg:p-10 shadow-sm relative overflow-hidden h-full">
                    {/* Corner accent like in Widget */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#E95420]/5 rounded-bl-full pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row gap-8 lg:gap-12 w-full">
                      {/* Description */}
                      <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            <FileSpreadsheet className="w-8 h-8 text-[#E95420]" />
                          </div>
                          <h3 className="text-xl font-bold uppercase tracking-tight border-l-2 border-[#E95420] pl-3">
                            CM Plant Report Generator
                          </h3>
                        </div>
                        <p className="text-sm text-[#4d4d4d] dark:text-slate-400 leading-relaxed max-w-xl">
                          Module ekstraksi data operasional CM Plant. Sistem akan melakukan
                          sinkronisasi kernel sebelum mengunduh laporan dalam format Microsoft Excel
                          (.xlsx).
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-[10px] font-bold text-[#808080] dark:text-slate-500 uppercase tracking-widest">
                          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                            <ShieldCheck className="w-4 h-4 text-emerald-500 font-bold" />
                            <span>Data Integrity Verified</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                            <Clock className="w-4 h-4 text-[#772953] font-bold" />
                            <span>Auto-Sync Enabled</span>
                          </div>
                        </div>
                      </div>

                      {/* Controls Section */}
                      <div className="w-full md:w-80 space-y-6 bg-[#F7F7F7] dark:bg-slate-950/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-[#808080] uppercase tracking-widest mb-2 block">
                              Pilih Bulan
                            </label>
                            <div className="relative group">
                              <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-xs font-bold transition-all focus:ring-2 focus:ring-[#E95420]/20 outline-none appearance-none cursor-pointer"
                              >
                                {months.map((m) => (
                                  <option key={m.value} value={m.value}>
                                    {m.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-[#E95420] transition-colors" />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-[#808080] uppercase tracking-widest mb-2 block">
                              Pilih Tahun
                            </label>
                            <div className="relative group">
                              <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-xs font-bold transition-all focus:ring-2 focus:ring-[#E95420]/20 outline-none appearance-none cursor-pointer"
                              >
                                {years.map((y) => (
                                  <option key={y} value={y}>
                                    {y}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-[#E95420] transition-colors" />
                            </div>
                          </div>
                        </div>

                        <motion.button
                          whileHover={!isDownloading ? { scale: 1.02 } : {}}
                          whileTap={!isDownloading ? { scale: 0.98 } : {}}
                          onClick={handleDownloadExcel}
                          disabled={isDownloading}
                          className={`
                              w-full flex items-center justify-center gap-3 py-4 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all
                              ${
                                isDownloading
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700'
                                  : 'bg-[#E95420] text-white shadow-md shadow-[#E95420]/20 hover:bg-[#D44415]'
                              }
                            `}
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="animate-spin w-4 h-4" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              <span>Unduh Laporan</span>
                            </>
                          )}
                        </motion.button>

                        {isDownloading && (
                          <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/10 rounded border border-emerald-100 dark:border-emerald-800/30">
                            <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter truncate">
                              {syncStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side Stats Card (Like System Health Widget) */}
                <div className="lg:col-span-4">
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#772953] opacity-50"></div>
                    <h4 className="text-[10px] font-bold text-[#333333] dark:text-slate-300 uppercase tracking-widest mb-6 border-l-2 border-[#E95420] pl-2">
                      System Diagnostics
                    </h4>

                    <div className="space-y-6 flex-1">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-[#808080] uppercase tracking-wide">
                          Kernel Status
                        </span>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                          <span>VERIFIED_OK</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-[#808080] uppercase tracking-wide">
                          Extraction Engine
                        </span>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#333333] dark:text-slate-200">
                          <Terminal className="w-3.5 h-3.5 text-[#E95420]" />
                          <span>ExcelJS_v4.4.0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'rkc' && (
              <motion.div
                key="rkc"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="w-full"
              >
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 lg:p-20 text-center shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#E95420]/5 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#772953]/5 rounded-full blur-3xl"></div>

                  <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-8 border border-slate-100 dark:border-slate-700 shadow-inner">
                      <Cpu className="w-10 h-10 text-[#E95420] animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold uppercase tracking-tight mb-4 text-[#333333] dark:text-white">
                      RKC Operations Kernel
                    </h3>
                    <p className="text-sm text-[#808080] dark:text-slate-400 leading-relaxed mb-10 font-bold uppercase tracking-wider">
                      Initializing data mapping kernel • Status:{' '}
                      <span className="text-[#E95420]">Deploying</span>
                    </p>

                    <div className="inline-flex items-center gap-4 px-6 py-2.5 bg-[#300a24]/5 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10 text-[10px] font-mono font-bold text-[#772953] dark:text-white/60 uppercase tracking-widest">
                      <div className="w-2 h-2 rounded-full bg-[#E95420] animate-ping" />
                      CORE_INITIALIZING_PHASE_09
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E9542033;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #E9542066;
        }
      `}</style>
    </div>
  );
};

export default DatabasePage;
