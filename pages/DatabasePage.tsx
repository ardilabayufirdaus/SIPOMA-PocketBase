import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useTranslation } from '../hooks/useTranslation';
import { pb } from '../utils/pocketbase-simple';
import { logger } from '../utils/logger';

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t.database || 'Database'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.database_description || 'Manage your database and collections'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'cm' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                CM Plant Operations Database
              </h3>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Select a collection to manage master data or download reports.
              </p>
            </div>

            {/* Filter & Download Section */}
            <div className="max-w-xl mx-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleDownloadExcel}
                  disabled={isDownloading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isDownloading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isDownloading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg
                        className="-ml-1 mr-2 h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download CM Data (Excel)
                    </>
                  )}
                </button>
                <p className="text-xs text-center text-slate-500 mt-2">
                  Downloads data for all plant units for the selected month.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rkc' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700">
            <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              RKC Plant Operations Database
            </h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Select a collection to manage master data.
            </p>
            {/* Logic for RKC download can be added here later */}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabasePage;
