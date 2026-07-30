import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useTranslation } from '../hooks/useTranslation';
import { pb } from '../utils/pocketbase-simple';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
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
          const expanded = d.expand?.silo_id as { unit: string } | undefined;
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
            {} as Record<string, { date: string; [key: string]: number | string | undefined }>
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
    <div className="relative flex flex-col min-h-full text-slate-800 dark:text-slate-100 font-sans bg-slate-50 dark:bg-slate-950 p-4 md:p-6 transition-colors duration-300">
      {/* Subtle Ambient Gradient Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 dark:opacity-30 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-emerald-700/10 rounded-full blur-[140px]"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col gap-4 lg:gap-6 max-w-[1700px] mx-auto w-full">
        {/* Header Area */}
        <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-2">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#333333] dark:text-white">
                Database <span className="text-primary-600 dark:text-primary-400">Management</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-primary-600 text-white">
                Admin Tools
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 pl-0.5">
              CENTRALIZED DATA REPOSITORY • OPERATIONAL REPORTING
            </p>
          </motion.div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-4 py-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 shadow-sm">
              <Activity className="w-3.5 h-3.5 text-primary-600" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest">
                Database Online
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
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
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm transform scale-105'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-primary-500/50'
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          {activeTab === 'cm' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Control Card */}
              <div className="lg:col-span-8">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 lg:p-10 shadow-sm relative overflow-hidden h-full">
                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary-600/5 rounded-bl-full pointer-events-none"></div>

                  <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-12 w-full">
                    {/* Description */}
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                          <FileSpreadsheet className="w-8 h-8 text-primary-600" />
                        </div>
                        <h3 className="text-xl font-bold uppercase tracking-tight border-l-2 border-primary-600 pl-3">
                          CM Plant Report Generator
                        </h3>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                        Module ekstraksi data operasional CM Plant. Sistem akan melakukan
                        sinkronisasi kernel sebelum mengunduh laporan dalam format Microsoft Excel
                        (.xlsx).
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="w-full lg:w-72 space-y-5 bg-slate-50/50 dark:bg-slate-950/30 p-6 rounded-xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            PILIH BULAN
                          </label>
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-sm cursor-pointer"
                          >
                            {months.map((m) => (
                              <option key={m.value} value={m.value}>
                                {m.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            PILIH TAHUN
                          </label>
                          <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-sm cursor-pointer"
                          >
                            {years.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <button
                          onClick={handleDownloadExcel}
                          disabled={isDownloading}
                          className={`
                            w-full py-3 px-4 rounded font-bold text-xs uppercase tracking-wider
                            flex items-center justify-center gap-2 transition-all shadow-sm
                            ${
                              isDownloading
                                ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/10'
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
                        </button>

                        {isDownloading && (
                          <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/10 rounded border border-emerald-100 dark:border-emerald-800/30">
                            <Activity className="w-3 h-3 text-emerald-500" />
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter truncate">
                              {syncStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rkc' && (
            <div className="w-full">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 lg:p-20 text-center shadow-sm relative overflow-hidden">
                <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-8 border border-slate-100 dark:border-slate-700 shadow-inner">
                    <Cpu className="w-10 h-10 text-primary-600" />
                  </div>
                  <h3 className="text-2xl font-bold uppercase tracking-tight mb-4 text-slate-800 dark:text-white">
                    RKC Operations Kernel
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-10 font-bold uppercase tracking-wider">
                    Initializing data mapping kernel • Status:{' '}
                    <span className="text-primary-600">Deploying</span>
                  </p>

                  <div className="inline-flex items-center gap-4 px-6 py-2.5 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10 text-[10px] font-mono font-bold text-slate-800 dark:text-white/60 uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-primary-600" />
                    CORE_INITIALIZING_PHASE_09
                  </div>
                </div>
              </div>
            </div>
          )}
          <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(5, 150, 105, 0.2);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(5, 150, 105, 0.4);
          }
        `}</style>
        </div>
      </div>
    </div>
  );
};

export default DatabasePage;
