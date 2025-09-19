import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../../components/Modal';
import { usePackingPlantMasterData } from '../../hooks/usePackingPlantMasterData';
import { PackingPlantStockRecord } from '../../types';
import DocumentArrowDownIcon from '../../components/icons/DocumentArrowDownIcon';
import DocumentArrowUpIcon from '../../components/icons/DocumentArrowUpIcon';
import { formatDate, formatNumber } from '../../utils/formatters';
import { usePackingPlantStockData } from '../../hooks/usePackingPlantStockData';

// Import Enhanced Components
import {
  EnhancedButton,
  useAccessibility,
  useHighContrast,
  useReducedMotion,
  useColorScheme,
} from '../../components/ui/EnhancedComponents';

// Helper function to format number for display in inputs
const formatInputNumber = (num: number): string => {
  if (num === null || num === undefined) {
    return '0,00';
  }

  const formatted = num.toFixed(2);
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.join(',');
};

// Helper function to parse formatted number back to number
const parseFormattedNumber = (str: string): number => {
  if (!str) return 0;
  // Remove thousand separators (dots) and replace comma with dot for decimal
  // Handle both comma and dot as decimal separators
  const cleaned = str.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper function to format user input as they type
const formatUserInput = (value: string): string => {
  // Remove all non-digit characters except comma and dot
  let cleaned = value.replace(/[^\d,\.]/g, '');

  // If there's a comma, treat it as decimal separator
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    // Only keep the first comma, remove others
    if (parts.length > 2) {
      cleaned = parts[0] + ',' + parts.slice(1).join('');
    }
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      cleaned = parts[0] + ',' + parts[1].substring(0, 2);
    }
  }

  // Add thousand separators to the integer part
  const parts = cleaned.split(',');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1] !== undefined ? ',' + parts[1] : '';

  return integerPart + decimalPart;
};

interface PageProps {
  t: any;
  areas: string[];
}

const PackingPlantStockData: React.FC<PageProps> = ({ t, areas }) => {
  // Enhanced accessibility hooks
  const announceToScreenReader = useAccessibility();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { records, upsertRecord } = usePackingPlantStockData();
  const { records: masterAreas } = usePackingPlantMasterData();

  const [filterArea, setFilterArea] = useState(areas[0] || '');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [tableData, setTableData] = useState<PackingPlantStockRecord[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [newRecord, setNewRecord] = useState<PackingPlantStockRecord>({
    id: '',
    date: '',
    area: filterArea,
    opening_stock: 0,
    stock_received: 0,
    stock_out: 0,
    closing_stock: 0,
  });

  // State for quick add row
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [autoContinueMode, setAutoContinueMode] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    stock_out: '0,00',
    closing_stock: '0,00',
  });

  // State for formatted input values in modal
  const [modalStockOut, setModalStockOut] = useState('0,00');
  const [modalClosingStock, setModalClosingStock] = useState('0,00');

  useEffect(() => {
    if (areas.length > 0 && !areas.includes(filterArea)) {
      setFilterArea(areas[0]);
    }
  }, [areas, filterArea]);

  useEffect(() => {
    // Filter records by area, month, year
    const filtered = records.filter((r) => {
      const recordDate = new Date(r.date);
      const matches =
        r.area === filterArea &&
        recordDate.getMonth() === filterMonth &&
        recordDate.getFullYear() === filterYear;
      return matches;
    });

    setTableData(filtered);
  }, [records, filterArea, filterMonth, filterYear]);

  // Function to get the next date based on the latest record
  const getNextDate = () => {
    // Filter records by area and current filter period (month/year)
    const filteredByArea = records.filter((r) => r.area === filterArea);
    const filteredByPeriod = filteredByArea.filter((r) => {
      const recordDate = new Date(r.date);
      return recordDate.getMonth() === filterMonth && recordDate.getFullYear() === filterYear;
    });

    if (filteredByPeriod.length === 0) {
      // If no data for current period, start with the first day of the filter month/year
      const firstDayOfMonth = new Date(filterYear, filterMonth, 1);
      return firstDayOfMonth.toISOString().split('T')[0];
    }

    // Sort by date and get the latest within the current period
    const sortedData = filteredByPeriod.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestDate = new Date(sortedData[0].date);

    // Add 1 day
    latestDate.setDate(latestDate.getDate() + 1);
    return latestDate.toISOString().split('T')[0];
  };

  const getOpeningStock = (date: string, area: string) => {
    // Get the previous day
    const currentDate = new Date(date);
    const previousDay = new Date(currentDate);
    previousDay.setDate(previousDay.getDate() - 1);

    // Find the record for the previous day (from any period)
    const prevRecord = records
      .filter((r) => r.area === area && r.date < date)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    return prevRecord ? prevRecord.closing_stock : 0;
  };

  const handleQuickAdd = () => {
    setQuickAddMode(true);
    setQuickAddData({
      stock_out: '0,00',
      closing_stock: '0,00',
    });
  };

  const handleQuickAddSubmit = () => {
    const nextDate = getNextDate();

    // Look up the master area ID
    const master = masterAreas.find((m: any) => m.area === filterArea);
    const masterId = master ? master.id : undefined;

    // Use the new getOpeningStock function
    const opening_stock = getOpeningStock(nextDate, filterArea);

    // Parse the formatted values
    const stock_out = parseFormattedNumber(quickAddData.stock_out);
    const closing_stock = parseFormattedNumber(quickAddData.closing_stock);

    const stock_received = Math.round(closing_stock - (opening_stock - stock_out));

    upsertRecord({
      id: masterId || '',
      date: nextDate,
      area: filterArea,
      opening_stock,
      stock_received,
      stock_out,
      closing_stock,
    });

    // Reset quick add mode and immediately show next quick add
    setQuickAddMode(false);
    setQuickAddData({
      stock_out: '0,00',
      closing_stock: '0,00',
    });

    // Automatically prepare for next entry after a short delay
    setTimeout(() => {
      const nextNextDate = new Date(nextDate);
      nextNextDate.setDate(nextNextDate.getDate() + 1);

      // Only show next quick add if it's still within the current filter period and auto-continue is enabled
      if (
        autoContinueMode &&
        nextNextDate.getMonth() === filterMonth &&
        nextNextDate.getFullYear() === filterYear
      ) {
        setQuickAddMode(true);
        setQuickAddData({
          stock_out: '0,00',
          closing_stock: '0,00',
        });
      }
    }, 100);
  };

  const handleQuickAddCancel = () => {
    setQuickAddMode(false);
    setQuickAddData({
      stock_out: '0,00',
      closing_stock: '0,00',
    });
  };

  const handleAddData = () => {
    // Check if we can use quick add (when the filter is for current month/year or future)
    const currentDate = new Date();
    const nextDate = new Date(getNextDate());
    const filterDate = new Date(filterYear, filterMonth);

    // If next date falls within the current filter period, use quick add
    if (nextDate.getMonth() === filterMonth && nextDate.getFullYear() === filterYear) {
      handleQuickAdd();
    } else {
      // Otherwise use modal
      setIsAddModalOpen(true);
      setNewRecord({
        id: '',
        date: getNextDate(),
        area: filterArea,
        opening_stock: 0,
        stock_received: 0,
        stock_out: 0,
        closing_stock: 0,
      });
      setModalStockOut('0,00');
      setModalClosingStock('0,00');
    }
  };

  const handleAddDataSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.date || !newRecord.area) return;

    // Look up the master area ID
    const master = masterAreas.find((m: any) => m.area === newRecord.area);
    const masterId = master ? master.id : undefined;

    // Use the new getOpeningStock function
    const opening_stock = getOpeningStock(newRecord.date, newRecord.area);

    // Parse the formatted values
    const stock_out = parseFormattedNumber(modalStockOut);
    const closing_stock = parseFormattedNumber(modalClosingStock);

    const stock_received = Math.round(closing_stock - (opening_stock - stock_out));
    upsertRecord({
      ...newRecord,
      id: masterId || '', // Use the looked up master ID or empty string
      opening_stock,
      stock_received,
      stock_out,
      closing_stock,
    });
    setIsAddModalOpen(false);
  };

  const handleValueChange = (
    index: number,
    field: 'stock_out' | 'closing_stock',
    formattedValue: string
  ) => {
    const updated = [...tableData];
    updated[index][field] = parseFormattedNumber(formattedValue);
    setTableData(updated);
  };

  const handleSave = (index: number) => {
    const record = tableData[index];

    // Look up the master area ID
    const master = masterAreas.find((m: any) => m.area === record.area);
    const masterId = master ? master.id : undefined;

    // Use the new getOpeningStock function
    const opening_stock = getOpeningStock(record.date, record.area);
    const stock_received = Math.round(record.closing_stock - (opening_stock - record.stock_out));
    upsertRecord({
      ...record,
      id: masterId || '', // Use the looked up master ID or empty string
      opening_stock,
      stock_received,
    });
  };

  const handleExport = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Export current filtered data
      const exportData = tableData.map((record) => ({
        Date: record.date,
        Area: record.area,
        'Opening Stock': record.opening_stock,
        'Stock Received': record.stock_received,
        'Stock Out': record.stock_out,
        'Closing Stock': record.closing_stock,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Stock Data');

      // Generate filename with current filter info
      const monthName =
        monthOptions.find((m) => m.value === filterMonth)?.label || `Month_${filterMonth + 1}`;
      const filename = `PackingPlant_Stock_${filterArea}_${monthName}_${filterYear}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets['Stock Data'];

      if (!worksheet) {
        alert('Invalid Excel format. Please ensure the file contains a "Stock Data" sheet.');
        return;
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Process and validate imported data
      const importedRecords: PackingPlantStockRecord[] = [];
      const errors: string[] = [];

      jsonData.forEach((row: any, index: number) => {
        try {
          // Validate required fields
          if (!row.Date || !row.Area) {
            errors.push(`Row ${index + 2}: Missing Date or Area`);
            return;
          }

          // Parse and validate data
          const record: PackingPlantStockRecord = {
            id: '', // Will be set by upsertRecord
            date: row.Date,
            area: row.Area,
            opening_stock: Number(row['Opening Stock']) || 0,
            stock_received: Number(row['Stock Received']) || 0,
            stock_out: Number(row['Stock Out']) || 0,
            closing_stock: Number(row['Closing Stock']) || 0,
          };

          importedRecords.push(record);
        } catch (error) {
          errors.push(`Row ${index + 2}: Invalid data format`);
        }
      });

      if (errors.length > 0) {
        alert(`Import validation errors:\n${errors.join('\n')}`);
        return;
      }

      // Import records
      for (const record of importedRecords) {
        try {
          // Look up the master area ID
          const master = masterAreas.find((m: any) => m.area === record.area);
          const masterId = master ? master.id : '';

          await upsertRecord({
            ...record,
            id: masterId,
          });
        } catch (error) {
          console.error('Error importing record:', record, error);
        }
      }

      alert(`Successfully imported ${importedRecords.length} records.`);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check the file format and try again.');
    } finally {
      setIsImporting(false);
    }

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label:
      t[
        `month_${
          ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][i]
        }`
      ],
  }));

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          {t.pack_stock_data_entry_title}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <EnhancedButton
            onClick={handleExport}
            variant="secondary"
            size="md"
            className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            aria-label={t.export_excel || 'Export to Excel'}
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            <span className="text-sm font-medium">{t.export_excel}</span>
          </EnhancedButton>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <EnhancedButton
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            variant="secondary"
            size="md"
            loading={isImporting}
            loadingText={t.importing || 'Importing...'}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            aria-label={t.import_excel || 'Import from Excel'}
          >
            <DocumentArrowUpIcon className="w-5 h-5" />
            <span className="text-sm font-medium">
              {isImporting ? t.importing || 'Importing...' : t.import_excel || 'Import Excel'}
            </span>
          </EnhancedButton>
          <EnhancedButton
            onClick={handleAddData}
            disabled={quickAddMode}
            variant="success"
            className={`inline-flex items-center justify-center gap-2 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-2 text-sm sm:text-base ${
              quickAddMode
                ? 'bg-gray-400 text-gray-200 border-gray-400 cursor-not-allowed opacity-60'
                : 'bg-green-600 hover:bg-green-700 text-white border-green-500 hover:border-green-600'
            }`}
            aria-label={(() => {
              if (quickAddMode) return 'Currently inputting...';
              const nextDate = new Date(getNextDate());
              const isInCurrentFilter =
                nextDate.getMonth() === filterMonth && nextDate.getFullYear() === filterYear;
              return isInCurrentFilter
                ? `Add data for ${formatDate(getNextDate())}`
                : t.add_data || 'Add Data';
            })()}
          >
            {(() => {
              if (quickAddMode) return 'Sedang Input...';
              const nextDate = new Date(getNextDate());
              const isInCurrentFilter =
                nextDate.getMonth() === filterMonth && nextDate.getFullYear() === filterYear;
              return isInCurrentFilter
                ? `+ ${formatDate(getNextDate())}`
                : t.add_data || 'Add Data';
            })()}
          </EnhancedButton>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex-1">
          <label
            htmlFor="filter-area"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t.filter_by_area}
          </label>
          <select
            id="filter-area"
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="mt-1 input-style"
          >
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label
            htmlFor="filter-month"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t.filter_by_month}
          </label>
          <select
            id="filter-month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
            className="mt-1 input-style"
          >
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label
            htmlFor="filter-year"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t.filter_by_year}
          </label>
          <select
            id="filter-year"
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="mt-1 input-style"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Status Indicator */}
      {tableData.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Menampilkan data: {filterArea} - {monthOptions[filterMonth]?.label} {filterYear}
              </span>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              {tableData.length} entri data
            </span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={t.add_data_title || 'Tambah Data Stock'}
        >
          <form onSubmit={handleAddDataSubmit} className="space-y-4 p-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.date || 'Tanggal'}</label>
              <input
                type="date"
                className="input-style w-full"
                value={newRecord.date}
                onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.area || 'Area'}</label>
              <select
                className="input-style w-full"
                value={newRecord.area}
                onChange={(e) => setNewRecord({ ...newRecord, area: e.target.value })}
                required
              >
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.stock_out || 'Stock Out'}</label>
              <input
                type="text"
                className="input-style w-full"
                value={modalStockOut}
                onChange={(e) => setModalStockOut(formatUserInput(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.closing_stock || 'Closing Stock'}
              </label>
              <input
                type="text"
                className="input-style w-full"
                value={modalClosingStock}
                onChange={(e) => setModalClosingStock(formatUserInput(e.target.value))}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <EnhancedButton
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                variant="secondary"
                aria-label={t.cancel || 'Cancel'}
              >
                {t.cancel || 'Batal'}
              </EnhancedButton>
              <EnhancedButton type="submit" variant="primary" aria-label={t.save || 'Save'}>
                {t.save || 'Simpan'}
              </EnhancedButton>
            </div>
          </form>
        </Modal>
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t.date}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t.area}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t.opening_stock}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t.stock_received}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t.stock_out}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t.closing_stock}
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((record, index) => (
              <tr
                key={record.id ? `${record.id}-${index}` : `${record.date}-${record.area}-${index}`}
                className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700"
              >
                <td className="px-6 py-2 whitespace-nowrap text-sm">{formatDate(record.date)}</td>
                <td className="px-6 py-2 whitespace-nowrap text-sm">{record.area}</td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-right">
                  {formatNumber(record.opening_stock)}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-right">
                  {formatNumber(record.stock_received)}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-sm w-40">
                  <input
                    type="text"
                    className="input-style w-full text-right no-spinner"
                    value={formatInputNumber(record.stock_out)}
                    onChange={(e) => {
                      const formatted = formatUserInput(e.target.value);
                      handleValueChange(index, 'stock_out', formatted);
                    }}
                    onBlur={() => handleSave(index)}
                    aria-label={`Stock Out for ${record.date}`}
                  />
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-sm w-40">
                  <input
                    type="text"
                    className="input-style w-full text-right no-spinner font-semibold"
                    value={formatInputNumber(record.closing_stock)}
                    onChange={(e) => {
                      const formatted = formatUserInput(e.target.value);
                      handleValueChange(index, 'closing_stock', formatted);
                    }}
                    onBlur={() => handleSave(index)}
                    aria-label={`Closing Stock for ${record.date}`}
                  />
                </td>
              </tr>
            ))}
            {/* Quick Add Row */}
            {quickAddMode ? (
              <tr className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-700">
                <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-green-700 dark:text-green-300">
                  {formatDate(getNextDate())}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-green-700 dark:text-green-300">
                  {filterArea}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-right text-slate-500">
                  {formatNumber(getOpeningStock(getNextDate(), filterArea))}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-right text-slate-500">
                  {(() => {
                    const opening_stock = getOpeningStock(getNextDate(), filterArea);
                    const stock_out = parseFormattedNumber(quickAddData.stock_out);
                    const closing_stock = parseFormattedNumber(quickAddData.closing_stock);
                    const stock_received = Math.round(closing_stock - (opening_stock - stock_out));
                    return formatNumber(stock_received);
                  })()}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-sm w-40">
                  <input
                    type="text"
                    className="input-style w-full text-right no-spinner border-green-300 focus:border-green-500 focus:ring-green-500"
                    value={quickAddData.stock_out}
                    onChange={(e) => {
                      const formatted = formatUserInput(e.target.value);
                      setQuickAddData((prev) => ({
                        ...prev,
                        stock_out: formatted,
                      }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        // Move to next input
                        const nextInput = e.currentTarget
                          .closest('tr')
                          ?.querySelector('td:last-child input') as HTMLInputElement;
                        nextInput?.focus();
                      } else if (e.key === 'Escape') {
                        handleQuickAddCancel();
                      }
                    }}
                    placeholder="0,00"
                    autoFocus
                  />
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-sm w-40">
                  <input
                    type="text"
                    className="input-style w-full text-right no-spinner font-semibold border-green-300 focus:border-green-500 focus:ring-green-500"
                    value={quickAddData.closing_stock}
                    onChange={(e) => {
                      const formatted = formatUserInput(e.target.value);
                      setQuickAddData((prev) => ({
                        ...prev,
                        closing_stock: formatted,
                      }));
                    }}
                    placeholder="0,00"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleQuickAddSubmit();
                      } else if (e.key === 'Escape') {
                        handleQuickAddCancel();
                      }
                    }}
                  />
                </td>
              </tr>
            ) : (
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                <td
                  colSpan={6}
                  className="px-6 py-3 text-center text-sm text-slate-600 dark:text-slate-400"
                  onClick={handleQuickAdd}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-green-600 dark:text-green-400 font-medium">+</span>
                    <span>Tambah data untuk tanggal {formatDate(getNextDate())}</span>
                  </div>
                </td>
              </tr>
            )}
            {/* Quick Add Action Buttons Row */}
            {quickAddMode && (
              <tr className="bg-green-50 dark:bg-green-900/20">
                <td colSpan={6} className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <EnhancedButton
                      onClick={handleQuickAddSubmit}
                      variant="success"
                      size="sm"
                      aria-label="Save quick add data"
                    >
                      ✓ Simpan
                    </EnhancedButton>
                    <EnhancedButton
                      onClick={handleQuickAddCancel}
                      variant="secondary"
                      size="sm"
                      aria-label="Cancel quick add"
                    >
                      ✕ Batal
                    </EnhancedButton>
                    <div className="flex items-center gap-2 ml-4">
                      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={autoContinueMode}
                          onChange={(e) => setAutoContinueMode(e.target.checked)}
                          className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                        />
                        <span>Lanjut otomatis ke tanggal berikutnya</span>
                      </label>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Tekan Enter untuk simpan, Escape untuk batal
                  </div>
                </td>
              </tr>
            )}
            {tableData.length === 0 && !quickAddMode && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-500 dark:text-slate-400">
                  <div className="space-y-2">
                    <div>Belum ada data untuk periode ini</div>
                    <EnhancedButton
                      onClick={handleQuickAdd}
                      variant="success"
                      className="inline-flex items-center gap-2"
                      aria-label={`Add first data for ${formatDate(getNextDate())}`}
                    >
                      <span className="text-lg">+</span>
                      Tambah data pertama untuk {formatDate(getNextDate())}
                    </EnhancedButton>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PackingPlantStockData;
