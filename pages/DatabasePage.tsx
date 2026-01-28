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
  Server,
  FileSpreadsheet,
  Loader2,
  ChevronDown,
} from 'lucide-react';

type TabId = 'cm' | 'rkc';

const DatabasePage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('cm');

  // Month & Year State
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isDownloading, setIsDownloading] = useState(false);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'cm', label: t.plantOperations || 'CM Plant Operations' },
    { id: 'rkc', label: t.rkcPlantOperations || 'RKC Plant Operations' },
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
      const workbook = new ExcelJS.Workbook();

      // Calculate start and end date for the selected period
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      // Calculate last day of the month
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDay}`;
      const filter = `date >= "${startDate}" && date <= "${endDate}"`;

      logger.debug(`Downloading CM data for period: ${startDate} to ${endDate}`);

      // 1. Fetch Plant Units to create sheets (and silo defs)
      const [plantUnits, siloDefs] = await Promise.all([
        pb.collection('plant_units').getFullList({
          sort: 'category,unit',
        }),
        pb.collection('silo_capacities').getFullList({
          sort: 'silo_name',
        }),
      ]);

      // 2. Fetch all data for the month (optimized: fetch once, filter in memory)
      const [materialData, downtimeData, siloData, infoData] = await Promise.all([
        pb.collection('ccr_material_usage').getFullList({ filter, sort: 'date,created' }),
        pb.collection('ccr_downtime_data').getFullList({ filter, sort: 'date,created' }),
        pb
          .collection('ccr_silo_data')
          .getFullList({ filter, sort: 'date,created', expand: 'silo_id' }),
        pb.collection('ccr_information').getFullList({ filter, sort: 'date,created' }),
      ]);

      // 3. Process each plant unit
      for (const unit of plantUnits) {
        // Create sanitized sheet name (max 31 chars, no invalid chars)
        const sheetName = `${unit.unit}`.replace(/[\\/*[\]:?]/g, '_').substring(0, 31);
        const worksheet = workbook.addWorksheet(sheetName);

        // Filter data for this unit
        const unitMaterial = materialData.filter((d) => d.plant_unit === unit.unit);
        const unitDowntime = downtimeData.filter((d) => d.plant_unit === unit.unit);
        // Silo data linked by unit_id in silo definition or directly (schema varies, checking logic)
        // Based on useCcrSiloData, silo_id is expanded. We need to match unit name.
        const unitSiloData = siloData.filter((d) => {
          const expanded = d.expand?.silo_id as any;
          return expanded?.unit === unit.unit;
        });
        const unitInfo = infoData.filter((d) => d.plant_unit === unit.unit);

        // Filter silo definitions for this unit
        const unitSiloDefs = siloDefs.filter((def) => def.unit === unit.unit);

        // --- Header ---
        worksheet.addRow([`CM Plant Operations Data - ${unit.unit}`]);
        worksheet.addRow([
          `Period: ${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`,
        ]);
        worksheet.addRow([]);

        // --- Section 1: Material Usage (Daily Total) ---
        worksheet.addRow(['SECTION 1: MATERIAL USAGE (DAILY TOTAL)']);
        // Remove 'Shift' from header
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

        // Generate all dates for the selected month to ensure continuous timeline
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const allDates = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        });

        if (allDates.length > 0) {
          // Aggregate by date
          const dailyAggregated = unitMaterial.reduce(
            (acc, curr) => {
              const date = curr.date;
              if (!acc[date]) {
                acc[date] = {
                  date: date,
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

          // Iterate over all dates in the month
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
        } else {
          worksheet.addRow(['No Dates Generated']);
        }
        worksheet.addRow([]);

        // --- Section 2: Silo Data ---
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
              // Find matching record for this date and silo
              const record = unitSiloData.find((d) => {
                const dDate = d.date.split('T')[0];
                return dDate === dateStr && d.silo_id === siloDef.id;
              });

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
                // Empty row for this specific silo on this date
                worksheet.addRow([
                  dateStr,
                  siloDef.silo_name,
                  '-', // shift1_empty
                  '-', // shift1_content
                  '-', // shift2_empty
                  '-', // shift2_content
                  '-', // shift3_empty
                  '-', // shift3_content
                ]);
              }
            });
          });
        } else if (allDates.length > 0 && unitSiloDefs.length === 0) {
          worksheet.addRow(['No Silos Configured for this Unit']);
        } else {
          worksheet.addRow(['No Dates Generated']);
        }
        worksheet.addRow([]);

        // --- Section 3: Downtime Data ---
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
              item.equipment_tag || item.equipment, // Handle varying field names
              item.description || item.problem, // Handle varying field names
              item.action,
              item.remarks,
            ]);
          });
        } else {
          worksheet.addRow(['No Data Available']);
        }
        worksheet.addRow([]);

        // --- Section 4: Information ---
        worksheet.addRow(['SECTION 4: INFORMATION']);
        const infoHeader = ['Date', 'Information'];
        worksheet.addRow(infoHeader);

        if (unitInfo.length > 0) {
          unitInfo.forEach((item) => {
            worksheet.addRow([item.date, item.information]);
          });
        } else {
          worksheet.addRow(['No Data Available']);
        }

        // Formatting
        worksheet.columns.forEach((column) => {
          column.width = 15;
        });
        worksheet.getRow(1).font = { bold: true, size: 14 };
        worksheet.getRow(2).font = { size: 12 };
      }

      // Generate File
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileName = `CM_Plant_Operations_${months.find((m) => m.value === selectedMonth)?.label}_${selectedYear}.xlsx`;
      saveAs(blob, fileName);

      alert('Download complete!');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Failed to download Excel. Please check console for details.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-8 w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 flex items-center gap-3">
            <Database className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            {t.database || 'Database Management'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg max-w-2xl">
            {t.database_description ||
              'Centralized hub for managing operational data, generating reports, and accessing system archives.'}
          </p>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <div className="flex justify-center">
        <div className="bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl inline-flex space-x-2 border border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2.5 z-0
                  ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-indigo-600 rounded-xl -z-10 shadow-lg shadow-indigo-500/30"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {tab.id === 'cm' ? <Layers className="w-4 h-4" /> : <Server className="w-4 h-4" />}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'cm' && (
          <motion.div
            key="cm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full mx-auto"
          >
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 border border-slate-100 dark:border-slate-700 shadow-2xl shadow-indigo-500/5 relative overflow-hidden group">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-48 -mt-48 transition-opacity duration-1000 group-hover:opacity-75" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl -ml-32 -mb-32 transition-opacity duration-1000 group-hover:opacity-75" />

              <div className="relative z-10">
                <div className="flex flex-col items-center text-center mb-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-3xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-inset ring-indigo-500/10">
                    <FileSpreadsheet className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                    CM Plant Operations Report
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                    Generate comprehensive Excel reports covering material usage, silo statistics,
                    downtime logs, and shift information.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-100 dark:border-slate-700/50 backdrop-blur-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Month Selection */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 pl-1">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        Select Month
                      </label>
                      <div className="relative group/select">
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(Number(e.target.value))}
                          className="w-full pl-5 pr-12 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700 dark:text-slate-200 appearance-none shadow-sm group-hover/select:border-indigo-400 cursor-pointer"
                        >
                          {months.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 group-hover/select:text-indigo-500 transition-colors">
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Year Selection */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 pl-1">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        Select Year
                      </label>
                      <div className="relative group/select">
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                          className="w-full pl-5 pr-12 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700 dark:text-slate-200 appearance-none shadow-sm group-hover/select:border-indigo-400 cursor-pointer"
                        >
                          {years.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 group-hover/select:text-indigo-500 transition-colors">
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={!isDownloading ? { scale: 1.02, translateY: -2 } : {}}
                    whileTap={!isDownloading ? { scale: 0.98 } : {}}
                    onClick={handleDownloadExcel}
                    disabled={isDownloading}
                    className={`
                      w-full relative overflow-hidden group/btn flex items-center justify-center py-5 px-8 rounded-xl text-white font-bold text-lg
                      bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
                      focus:outline-none focus:ring-4 focus:ring-indigo-500/30
                      transition-all duration-300 shadow-xl shadow-indigo-500/20
                      disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none
                    `}
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />

                    {isDownloading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6" />
                        <span>Processing Data...</span>
                      </>
                    ) : (
                      <>
                        <Download className="mr-3 h-6 w-6 group-hover/btn:scale-110 transition-transform duration-300" />
                        <span>Download Excel Report</span>
                      </>
                    )}
                  </motion.button>

                  <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-4">
                    Securely generates & downloads .xlsx file to your device
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'rkc' && (
          <motion.div
            key="rkc"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full mx-auto"
          >
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-700 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-orange-600" />

              <div className="w-24 h-24 mx-auto bg-orange-50 dark:bg-orange-900/20 rounded-3xl flex items-center justify-center mb-8 ring-1 ring-orange-500/10">
                <Server className="w-12 h-12 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                RKC Plant Operations Database
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                Data management and reporting modules for RKC operations are currently being
                configured.
              </p>
              <div className="inline-flex items-center justify-center px-4 py-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-slate-500 dark:text-slate-400 text-sm font-medium">
                Coming Soon
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DatabasePage;
