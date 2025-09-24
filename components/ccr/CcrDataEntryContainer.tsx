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
    <div className="space-y-4">
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

      {/* Placeholder for data tables - these would need proper props */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
        <p className="text-slate-600 dark:text-slate-400">
          Data tables will be rendered here with proper data management.
        </p>
      </div>
    </div>
  );
};
