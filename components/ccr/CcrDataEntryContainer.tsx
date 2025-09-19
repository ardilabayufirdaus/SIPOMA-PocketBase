import React, { useState } from 'react';
import * as XLSX from 'xlsx';
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
      const workbook = XLSX.read(data);

      // Process Parameter Data sheet
      const parameterSheet = workbook.Sheets['Parameter Data'];
      if (parameterSheet) {
        const parameterData = XLSX.utils.sheet_to_json(parameterSheet);
        // Process and save parameter data
        console.log('Parameter data to import:', parameterData);
        // TODO: Implement save logic
      }

      // Process Footer Data sheet
      const footerSheet = workbook.Sheets['Footer Data'];
      if (footerSheet) {
        const footerData = XLSX.utils.sheet_to_json(footerSheet);
        // Process and save footer data
        console.log('Footer data to import:', footerData);
        // TODO: Implement save logic
      }

      // Process Downtime Data sheet
      const downtimeSheet = workbook.Sheets['Downtime Data'];
      if (downtimeSheet) {
        const downtimeData = XLSX.utils.sheet_to_json(downtimeSheet);
        // Process and save downtime data
        console.log('Downtime data to import:', downtimeData);
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
      const wb = XLSX.utils.book_new();

      // Parameter Data Sheet
      if (parameterData.length > 0) {
        const parameterSheet = XLSX.utils.json_to_sheet(
          parameterData.map((item) => {
            const row: any = {
              Date: item.date,
              ParameterId: item.parameter_id,
              Name: item.name,
            };
            // Add hourly values
            for (let hour = 1; hour <= 24; hour++) {
              row[`Hour${hour}`] = item.hourly_values[hour] || '';
            }
            return row;
          })
        );
        XLSX.utils.book_append_sheet(wb, parameterSheet, 'Parameter Data');
      }

      // Footer Data Sheet
      if (footerData.length > 0) {
        const footerSheet = XLSX.utils.json_to_sheet(footerData);
        XLSX.utils.book_append_sheet(wb, footerSheet, 'Footer Data');
      }

      // Downtime Data Sheet
      if (downtimeData.length > 0) {
        const downtimeSheet = XLSX.utils.json_to_sheet(downtimeData);
        XLSX.utils.book_append_sheet(wb, downtimeSheet, 'Downtime Data');
      }

      // Generate filename with date
      const filename = `CCR_Data_${selectedDate.replace(/\//g, '-')}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
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
