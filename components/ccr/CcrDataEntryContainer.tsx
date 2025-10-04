import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { useCcrParameterData } from '../../hooks/useCcrParameterData';
import { useCcrFooterData } from '../../hooks/useCcrFooterData';
import useCcrDowntimeData from '../../hooks/useCcrDowntimeData';
import CcrDataFilters from './CcrDataFilters';
import CcrDataActions from './CcrDataActions';

interface CcrDataEntryContainerProps {
  t: any;
  selectedDate: string;
  plantUnit: string;
  onDateChange: (date: string) => void;
  onPlantUnitChange: (plantUnit: string) => void;
}

export const CcrDataEntryContainer: React.FC<CcrDataEntryContainerProps> = ({
  t,
  selectedDate,
  plantUnit,
  onDateChange,
  onPlantUnitChange,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const { getDataForDate: getParameterData, loading: parameterLoading } = useCcrParameterData();
  const { getFooterDataForDate } = useCcrFooterData();
  const { getAllDowntime, loading: downtimeLoading } = useCcrDowntimeData();

  const handleImportFromExcel = async (file: File) => {
    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);

      // Process Parameter Data sheet
      const parameterWorksheet = workbook.getWorksheet('Parameter Data');
      if (parameterWorksheet) {
        const parameterData: Record<string, unknown>[] = [];
        let paramHeaders: string[] = [];

        parameterWorksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            const values = Array.from(row.values as ExcelJS.CellValue[]);
            paramHeaders = values.map((v) => String(v || ''));
          } else {
            const rowData: Record<string, unknown> = {};
            row.eachCell((cell, colNumber) => {
              rowData[paramHeaders[colNumber - 1]] = cell.value;
            });
            parameterData.push(rowData);
          }
        });
        // Process and save parameter data
        // TODO: Implement save logic
      }

      // Process Footer Data sheet
      const footerWorksheet = workbook.getWorksheet('Footer Data');
      if (footerWorksheet) {
        const footerData: Record<string, unknown>[] = [];
        let footerHeaders: string[] = [];

        footerWorksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            const values = Array.from(row.values as ExcelJS.CellValue[]);
            footerHeaders = values.map((v) => String(v || ''));
          } else {
            const rowData: Record<string, unknown> = {};
            row.eachCell((cell, colNumber) => {
              rowData[footerHeaders[colNumber - 1]] = cell.value;
            });
            footerData.push(rowData);
          }
        });
        // Process and save footer data
        // TODO: Implement save logic
      }

      // Process Downtime Data sheet
      const downtimeWorksheet = workbook.getWorksheet('Downtime Data');
      if (downtimeWorksheet) {
        const downtimeData: Record<string, unknown>[] = [];
        let downtimeHeaders: string[] = [];

        downtimeWorksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            const values = Array.from(row.values as ExcelJS.CellValue[]);
            downtimeHeaders = values.map((v) => String(v || ''));
          } else {
            const rowData: Record<string, unknown> = {};
            row.eachCell((cell, colNumber) => {
              rowData[downtimeHeaders[colNumber - 1]] = cell.value;
            });
            downtimeData.push(rowData);
          }
        });
        // Process and save downtime data
        // TODO: Implement save logic
      }

      alert('Import completed successfully!');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check the file format.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      // Get all data
      const [parameterData, footerData, downtimeData] = await Promise.all([
        getParameterData(selectedDate, plantUnit),
        getFooterDataForDate(selectedDate),
        getAllDowntime(),
      ]);

      // Create workbook
      const workbook = new ExcelJS.Workbook();

      // Parameter Data Sheet
      if (parameterData.length > 0) {
        const parameterWorksheet = workbook.addWorksheet('Parameter Data');
        const paramRows = parameterData.map((item) => {
          const row: Record<string, unknown> = {
            Date: item.date,
            ParameterId: item.parameter_id,
            Name: item.name,
          };
          // Add hourly values
          for (let hour = 1; hour <= 24; hour++) {
            row[`Hour${hour}`] = item.hourly_values[hour] || '';
          }
          return row;
        });
        parameterWorksheet.addRows(paramRows);
      }

      // Footer Data Sheet
      if (footerData.length > 0) {
        const footerWorksheet = workbook.addWorksheet('Footer Data');
        footerWorksheet.addRows(footerData);
      }

      // Downtime Data Sheet
      if (downtimeData.length > 0) {
        const downtimeWorksheet = workbook.addWorksheet('Downtime Data');
        downtimeWorksheet.addRows(downtimeData);
      }

      // Generate filename with date
      const filename = `CCR_Data_${selectedDate.replace(/\//g, '-')}.xlsx`;

      // Write file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      // You might want to show a toast notification here
    } finally {
      setIsExporting(false);
    }
  };

  const loading = parameterLoading || downtimeLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-cyan-600 dark:from-slate-200 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2">
            CCR Data Entry System
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Manage and monitor CCR parameter data with real-time updates
          </p>
        </div>

        <CcrDataFilters
          t={t}
          selectedDate={selectedDate}
          plantUnit={plantUnit}
          onDateChange={onDateChange}
          onPlantUnitChange={onPlantUnitChange}
        />

        <CcrDataActions
          t={t}
          onExport={handleExportToExcel}
          onImport={handleImportFromExcel}
          isExporting={isExporting}
          isImporting={isImporting}
          loading={loading}
        />

        {/* Data Tables Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Parameter Data Table */}
          <div className="backdrop-blur-md bg-white/10 dark:bg-slate-800/10 border border-white/20 dark:border-slate-700/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                Parameter Data
              </h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-slate-600 dark:text-slate-400">
                  Loading parameter data...
                </span>
              </div>
            ) : (
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-slate-700/20">
                <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                  Parameter data table will be rendered here with full functionality.
                </p>
              </div>
            )}
          </div>

          {/* Silo Data Table */}
          <div className="backdrop-blur-md bg-white/10 dark:bg-slate-800/10 border border-white/20 dark:border-slate-700/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                Silo Data
              </h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-slate-600 dark:text-slate-400">
                  Loading silo data...
                </span>
              </div>
            ) : (
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-slate-700/20">
                <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                  Silo data table will be rendered here with full functionality.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Data Section */}
        <div className="backdrop-blur-md bg-white/10 dark:bg-slate-800/10 border border-white/20 dark:border-slate-700/20 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
              Footer Data & Downtime
            </h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-slate-600 dark:text-slate-400">
                Loading footer data...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-slate-700/20">
                <p className="text-slate-600 dark:text-slate-400 text-center py-4">
                  Footer data table
                </p>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-slate-700/20">
                <p className="text-slate-600 dark:text-slate-400 text-center py-4">
                  Downtime data table
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
