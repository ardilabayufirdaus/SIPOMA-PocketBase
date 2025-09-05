import React, { useState, useCallback, useRef, useEffect } from "react";
import Modal from "../../components/Modal";
import { usePackingPlantMasterData } from "../../hooks/usePackingPlantMasterData";
import * as XLSX from "xlsx";
import { PackingPlantStockRecord } from "../../types";
import DocumentArrowDownIcon from "../../components/icons/DocumentArrowDownIcon";
import DocumentArrowUpIcon from "../../components/icons/DocumentArrowUpIcon";
import { formatDate, formatNumber } from "../../utils/formatters";
import { usePackingPlantStockData } from "../../hooks/usePackingPlantStockData";

// Helper function to format number for display in inputs
const formatInputNumber = (num: number): string => {
  if (num === null || num === undefined) {
    return "0,00";
  }

  const formatted = num.toFixed(2);
  const parts = formatted.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.join(",");
};

// Helper function to parse formatted number back to number
const parseFormattedNumber = (str: string): number => {
  if (!str) return 0;
  // Remove thousand separators (dots) and replace comma with dot for decimal
  // Handle both comma and dot as decimal separators
  const cleaned = str.replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper function to format user input as they type
const formatUserInput = (value: string): string => {
  // Remove all non-digit characters except comma and dot
  let cleaned = value.replace(/[^\d,\.]/g, "");

  // If there's a comma, treat it as decimal separator
  if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    // Only keep the first comma, remove others
    if (parts.length > 2) {
      cleaned = parts[0] + "," + parts.slice(1).join("");
    }
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      cleaned = parts[0] + "," + parts[1].substring(0, 2);
    }
  }

  // Add thousand separators to the integer part
  const parts = cleaned.split(",");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimalPart = parts[1] !== undefined ? "," + parts[1] : "";

  return integerPart + decimalPart;
};

interface PageProps {
  t: any;
  areas: string[];
}

const PackingPlantStockData: React.FC<PageProps> = ({ t, areas }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { records, upsertRecord } = usePackingPlantStockData();
  const { records: masterAreas } = usePackingPlantMasterData();

  const [filterArea, setFilterArea] = useState(areas[0] || "");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [tableData, setTableData] = useState<PackingPlantStockRecord[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [newRecord, setNewRecord] = useState<PackingPlantStockRecord>({
    id: "",
    date: "",
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
    stock_out: "0,00",
    closing_stock: "0,00",
  });

  // State for formatted input values in modal
  const [modalStockOut, setModalStockOut] = useState("0,00");
  const [modalClosingStock, setModalClosingStock] = useState("0,00");

  useEffect(() => {
    if (areas.length > 0 && !areas.includes(filterArea)) {
      setFilterArea(areas[0]);
    }
  }, [areas, filterArea]);

  useEffect(() => {
    // Filter records by area, month, year
    const filtered = records.filter((r) => {
      const recordDate = new Date(r.date);
      return (
        r.area === filterArea &&
        recordDate.getMonth() === filterMonth &&
        recordDate.getFullYear() === filterYear
      );
    });

    setTableData(filtered);
  }, [records, filterArea, filterMonth, filterYear]);

  // Function to get the next date based on the latest record
  const getNextDate = () => {
    // Filter records by area and current filter period (month/year)
    const filteredByArea = records.filter((r) => r.area === filterArea);
    const filteredByPeriod = filteredByArea.filter((r) => {
      const recordDate = new Date(r.date);
      return (
        recordDate.getMonth() === filterMonth &&
        recordDate.getFullYear() === filterYear
      );
    });

    if (filteredByPeriod.length === 0) {
      // If no data for current period, start with the first day of the filter month/year
      const firstDayOfMonth = new Date(filterYear, filterMonth, 1);
      return firstDayOfMonth.toISOString().split("T")[0];
    }

    // Sort by date and get the latest within the current period
    const sortedData = filteredByPeriod.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestDate = new Date(sortedData[0].date);

    // Add 1 day
    latestDate.setDate(latestDate.getDate() + 1);
    return latestDate.toISOString().split("T")[0];
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
      stock_out: "0,00",
      closing_stock: "0,00",
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

    const stock_received = Math.round(
      closing_stock - (opening_stock - stock_out)
    );

    upsertRecord({
      id: masterId || "",
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
      stock_out: "0,00",
      closing_stock: "0,00",
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
          stock_out: "0,00",
          closing_stock: "0,00",
        });
      }
    }, 100);
  };

  const handleQuickAddCancel = () => {
    setQuickAddMode(false);
    setQuickAddData({
      stock_out: "0,00",
      closing_stock: "0,00",
    });
  };

  const handleAddData = () => {
    // Check if we can use quick add (when the filter is for current month/year or future)
    const currentDate = new Date();
    const nextDate = new Date(getNextDate());
    const filterDate = new Date(filterYear, filterMonth);

    // If next date falls within the current filter period, use quick add
    if (
      nextDate.getMonth() === filterMonth &&
      nextDate.getFullYear() === filterYear
    ) {
      handleQuickAdd();
    } else {
      // Otherwise use modal
      setIsAddModalOpen(true);
      setNewRecord({
        id: "",
        date: getNextDate(),
        area: filterArea,
        opening_stock: 0,
        stock_received: 0,
        stock_out: 0,
        closing_stock: 0,
      });
      setModalStockOut("0,00");
      setModalClosingStock("0,00");
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

    const stock_received = Math.round(
      closing_stock - (opening_stock - stock_out)
    );
    upsertRecord({
      ...newRecord,
      id: masterId || "", // Use the looked up master ID or empty string
      opening_stock,
      stock_received,
      stock_out,
      closing_stock,
    });
    setIsAddModalOpen(false);
  };

  const handleValueChange = (
    index: number,
    field: "stock_out" | "closing_stock",
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
    const stock_received = Math.round(
      record.closing_stock - (opening_stock - record.stock_out)
    );
    upsertRecord({
      ...record,
      id: masterId || "", // Use the looked up master ID or empty string
      opening_stock,
      stock_received,
    });
  };

  const handleExport = () => {
    // Prepare data for export
    const exportData = tableData.map((record) => ({
      [t.date || "Date"]: formatDate(record.date),
      [t.area || "Area"]: record.area,
      [t.opening_stock || "Opening Stock"]: record.opening_stock,
      [t.stock_received || "Stock Received"]: record.stock_received,
      [t.stock_out || "Stock Out"]: record.stock_out,
      [t.closing_stock || "Closing Stock"]: record.closing_stock,
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Auto-size columns
    const colWidths = [
      { wch: 15 }, // Date
      { wch: 20 }, // Area
      { wch: 15 }, // Opening Stock
      { wch: 15 }, // Stock Received
      { wch: 15 }, // Stock Out
      { wch: 15 }, // Closing Stock
    ];
    worksheet["!cols"] = colWidths;

    // Add the worksheet to workbook
    const monthName =
      monthOptions[filterMonth]?.label || `Month ${filterMonth + 1}`;
    const sheetName = `${filterArea} ${monthName} ${filterYear}`;
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate filename
    const filename = `Stock_Data_${filterArea}_${monthName}_${filterYear}.xlsx`;

    // Write and download the file
    XLSX.writeFile(workbook, filename);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      if (!data) {
        setIsImporting(false);
        return;
      }

      try {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        const validRecords = json
          .map((row) => {
            // Handle date parsing
            let date = row[t.date] || row["Date"];
            if (typeof date === "number") {
              // Excel date serial number
              const jsDate = new Date(Math.round((date - 25569) * 864e5));
              date = jsDate.toISOString().split("T")[0];
            } else if (typeof date === "string") {
              // Handle various date formats
              const parts = date.split("/");
              if (parts.length === 3) {
                // Convert DD/MM/YYYY to YYYY-MM-DD
                date = `${parts[2]}-${parts[1].padStart(
                  2,
                  "0"
                )}-${parts[0].padStart(2, "0")}`;
              } else if (date.includes("-")) {
                // Already in YYYY-MM-DD format or similar
                const dateParts = date.split("-");
                if (dateParts.length === 3) {
                  date = `${dateParts[0]}-${dateParts[1].padStart(
                    2,
                    "0"
                  )}-${dateParts[2].padStart(2, "0")}`;
                }
              }
            }

            const area = row[t.area] || row["Area"];

            // Find master area data
            const master = masterAreas.find((m: any) => m.area === area);
            const id = master ? master.id : "";
            const record_id = master
              ? `${master.id}-${date}`
              : `${area}-${date}`;

            // Parse numeric values
            let opening_stock = parseFloat(
              row[t.opening_stock] || row["Opening Stock"] || "0"
            );
            if (isNaN(opening_stock)) opening_stock = 0;

            let stock_out = parseFloat(
              row[t.stock_out] || row["Stock Out"] || "0"
            );
            if (isNaN(stock_out)) stock_out = 0;

            let closing_stock = parseFloat(
              row[t.closing_stock] || row["Closing Stock"] || "0"
            );
            if (isNaN(closing_stock)) closing_stock = 0;

            // Calculate stock_received
            let stock_received = closing_stock - (opening_stock - stock_out);
            if (isNaN(stock_received)) stock_received = 0;

            return {
              id,
              record_id,
              date,
              area,
              opening_stock,
              stock_received,
              stock_out,
              closing_stock,
            };
          })
          .filter((record) => {
            // Validate required fields
            return (
              record.date &&
              record.area &&
              record.date.match(/^\d{4}-\d{2}-\d{2}$/) && // Valid date format
              !isNaN(record.stock_out) &&
              !isNaN(record.closing_stock)
            );
          });

        // Process each record individually using upsertRecord for proper replace functionality
        let successCount = 0;
        let errorCount = 0;

        for (const record of validRecords) {
          try {
            await upsertRecord(record as PackingPlantStockRecord);
            successCount++;
          } catch (error) {
            console.error(
              `Error importing record for ${record.date} - ${record.area}:`,
              error
            );
            errorCount++;
          }
        }

        // Log import completion
        // Import completed: ${successCount} records processed successfully, ${errorCount} errors

        // Show success message
        if (successCount > 0) {
          alert(
            `Import berhasil: ${successCount} record berhasil diimport/diupdate${
              errorCount > 0 ? `, ${errorCount} record gagal` : ""
            }`
          );
        } else if (errorCount > 0) {
          alert(`Import gagal: ${errorCount} record tidak dapat diproses`);
        } else {
          alert("Tidak ada data valid yang dapat diimport");
        }
      } catch (error) {
        console.error("Error processing Excel file:", error);
        alert(
          "Error saat memproses file Excel. Pastikan format file sudah benar."
        );
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsArrayBuffer(file);

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label:
      t[
        `month_${
          [
            "jan",
            "feb",
            "mar",
            "apr",
            "may",
            "jun",
            "jul",
            "aug",
            "sep",
            "oct",
            "nov",
            "dec",
          ][i]
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
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 transition-all dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            {t.export_excel}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className={`inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold ${
              isImporting
                ? "text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed"
                : "text-slate-700 bg-white border-slate-300 hover:bg-slate-50"
            } border rounded-md shadow-sm transition-all dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600`}
          >
            <DocumentArrowUpIcon className="w-5 h-5" />
            {isImporting
              ? t.importing || "Importing..."
              : t.import_excel || "Import Excel"}
          </button>
          <button
            onClick={handleAddData}
            className={`inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold border rounded-md shadow-sm transition-all ${
              quickAddMode
                ? "text-slate-500 bg-slate-200 border-slate-300 cursor-not-allowed"
                : "text-white bg-green-600 border-green-700 hover:bg-green-700"
            }`}
            disabled={quickAddMode}
          >
            {(() => {
              if (quickAddMode) return "Sedang Input...";
              const nextDate = new Date(getNextDate());
              const isInCurrentFilter =
                nextDate.getMonth() === filterMonth &&
                nextDate.getFullYear() === filterYear;
              return isInCurrentFilter
                ? `+ ${formatDate(getNextDate())}`
                : t.add_data || "Add Data";
            })()}
          </button>
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
      <div className="overflow-x-auto">
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={t.add_data_title || "Tambah Data Stock"}
        >
          <form onSubmit={handleAddDataSubmit} className="space-y-4 p-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.date || "Tanggal"}
              </label>
              <input
                type="date"
                className="input-style w-full"
                value={newRecord.date}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, date: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.area || "Area"}
              </label>
              <select
                className="input-style w-full"
                value={newRecord.area}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, area: e.target.value })
                }
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
              <label className="block text-sm font-medium mb-1">
                {t.stock_out || "Stock Out"}
              </label>
              <input
                type="text"
                className="input-style w-full"
                value={modalStockOut}
                onChange={(e) =>
                  setModalStockOut(formatUserInput(e.target.value))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.closing_stock || "Closing Stock"}
              </label>
              <input
                type="text"
                className="input-style w-full"
                value={modalClosingStock}
                onChange={(e) =>
                  setModalClosingStock(formatUserInput(e.target.value))
                }
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                {t.cancel || "Batal"}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                {t.save || "Simpan"}
              </button>
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
                key={
                  record.id
                    ? `${record.id}-${index}`
                    : `${record.date}-${record.area}-${index}`
                }
                className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700"
              >
                <td className="px-6 py-2 whitespace-nowrap text-sm">
                  {formatDate(record.date)}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm">
                  {record.area}
                </td>
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
                      handleValueChange(index, "stock_out", formatted);
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
                      handleValueChange(index, "closing_stock", formatted);
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
                    const opening_stock = getOpeningStock(
                      getNextDate(),
                      filterArea
                    );
                    const stock_out = parseFormattedNumber(
                      quickAddData.stock_out
                    );
                    const closing_stock = parseFormattedNumber(
                      quickAddData.closing_stock
                    );
                    const stock_received = Math.round(
                      closing_stock - (opening_stock - stock_out)
                    );
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
                      if (e.key === "Enter") {
                        // Move to next input
                        const nextInput = e.currentTarget
                          .closest("tr")
                          ?.querySelector(
                            "td:last-child input"
                          ) as HTMLInputElement;
                        nextInput?.focus();
                      } else if (e.key === "Escape") {
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
                      if (e.key === "Enter") {
                        handleQuickAddSubmit();
                      } else if (e.key === "Escape") {
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
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      +
                    </span>
                    <span>
                      Tambah data untuk tanggal {formatDate(getNextDate())}
                    </span>
                  </div>
                </td>
              </tr>
            )}
            {/* Quick Add Action Buttons Row */}
            {quickAddMode && (
              <tr className="bg-green-50 dark:bg-green-900/20">
                <td colSpan={6} className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handleQuickAddSubmit}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                    >
                      ✓ Simpan
                    </button>
                    <button
                      onClick={handleQuickAddCancel}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600"
                    >
                      ✕ Batal
                    </button>
                    <div className="flex items-center gap-2 ml-4">
                      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={autoContinueMode}
                          onChange={(e) =>
                            setAutoContinueMode(e.target.checked)
                          }
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
                <td
                  colSpan={6}
                  className="text-center py-10 text-slate-500 dark:text-slate-400"
                >
                  <div className="space-y-2">
                    <div>Belum ada data untuk periode ini</div>
                    <button
                      onClick={handleQuickAdd}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                    >
                      <span className="text-lg">+</span>
                      Tambah data pertama untuk {formatDate(getNextDate())}
                    </button>
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
