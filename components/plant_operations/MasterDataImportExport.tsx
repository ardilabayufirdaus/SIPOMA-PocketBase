import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import DocumentArrowDownIcon from "../../components/icons/DocumentArrowDownIcon";
import DocumentArrowUpIcon from "../../components/icons/DocumentArrowUpIcon";

interface MasterDataImportExportProps {
  t: any;
  plantUnits: any[];
  parameterSettings: any[];
  siloCapacities: any[];
  picSettings: any[];
  copParameters: any[];
  reportSettings: any[];
  allParametersMap: Map<string, any>;
  onImportPlantUnits: (data: any[]) => void;
  onImportPicSettings: (data: any[]) => void;
  onImportParameterSettings: (data: any[]) => void;
  onImportSiloCapacities: (data: any[]) => void;
  onImportCopParameters: (copIds: string[], newParams: any[]) => void;
  onImportReportSettings: (data: any[]) => void;
}

const MasterDataImportExport: React.FC<MasterDataImportExportProps> = ({
  t,
  plantUnits,
  parameterSettings,
  siloCapacities,
  picSettings,
  copParameters,
  reportSettings,
  allParametersMap,
  onImportPlantUnits,
  onImportPicSettings,
  onImportParameterSettings,
  onImportSiloCapacities,
  onImportCopParameters,
  onImportReportSettings,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAll = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      // Validate data before export
      if (
        plantUnits.length === 0 &&
        parameterSettings.length === 0 &&
        siloCapacities.length === 0 &&
        picSettings.length === 0 &&
        copParameters.length === 0 &&
        reportSettings.length === 0
      ) {
        alert("No data available to export. Please add some data first.");
        return;
      }

      const wb = XLSX.utils.book_new();

      // Plant Units sheet
      if (plantUnits.length > 0) {
        const ws_pu = XLSX.utils.json_to_sheet(
          plantUnits.map(({ id, ...rest }) => rest)
        );
        XLSX.utils.book_append_sheet(wb, ws_pu, "Plant Units");
      }

      // PIC Settings sheet
      if (picSettings.length > 0) {
        const ws_pic = XLSX.utils.json_to_sheet(
          picSettings.map(({ id, ...rest }) => rest)
        );
        XLSX.utils.book_append_sheet(wb, ws_pic, "PIC Settings");
      }

      // Parameter Settings sheet
      if (parameterSettings.length > 0) {
        const ws_param = XLSX.utils.json_to_sheet(
          parameterSettings.map(({ id, ...rest }) => rest)
        );
        XLSX.utils.book_append_sheet(wb, ws_param, "Parameter Settings");
      }

      // Silo Capacities sheet
      if (siloCapacities.length > 0) {
        const ws_silo = XLSX.utils.json_to_sheet(
          siloCapacities.map(({ id, ...rest }) => rest)
        );
        XLSX.utils.book_append_sheet(wb, ws_silo, "Silo Capacities");
      }

      // COP Parameters sheet
      if (copParameters.length > 0) {
        const copDataToExport = copParameters.map((p) => ({
          Parameter: p.parameter,
          Category: p.category,
        }));
        const ws_cop = XLSX.utils.json_to_sheet(copDataToExport);
        XLSX.utils.book_append_sheet(wb, ws_cop, "COP Parameters");
      }

      // Report Settings sheet
      if (reportSettings.length > 0) {
        const reportDataToExport = reportSettings.map((rs) => {
          const param = allParametersMap.get(rs.parameter_id);
          return {
            Parameter: param?.parameter || `ID:${rs.parameter_id}`,
            Category: rs.category,
          };
        });
        const ws_report = XLSX.utils.json_to_sheet(reportDataToExport);
        XLSX.utils.book_append_sheet(wb, ws_report, "Report Settings");
      }

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:.]/g, "-");
      const filename = `SIPOMA_MasterData_${timestamp}.xlsx`;

      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Failed to export master data:", error);
      alert(
        `An error occurred during export: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (isImporting) return;

    // Validate file type
    const validExtensions = [".xlsx", ".xls"];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));
    if (!validExtensions.includes(fileExtension)) {
      alert("Please select a valid Excel file (.xlsx or .xls)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error("Failed to read file data");
        }

        const wb = XLSX.read(data, { type: "array" });
        let importedCount = 0;
        let newParams: any[] = [];
        let parameterImportCount = 0;

        // Process sheets. Non-dependent first.
        // 1. Plant Units
        const ws_pu = wb.Sheets["Plant Units"];
        if (ws_pu) {
          const jsonData: any[] = XLSX.utils.sheet_to_json(ws_pu);
          const newPlantUnits = jsonData
            .map((row) => ({
              unit: row.unit?.toString().trim(),
              category: row.category?.toString().trim(),
            }))
            .filter((d) => d.unit && d.category);

          if (newPlantUnits.length > 0) {
            onImportPlantUnits(newPlantUnits);
            importedCount++;
          }
        }

        // 2. PIC Settings
        const ws_pic = wb.Sheets["PIC Settings"];
        if (ws_pic) {
          const jsonData: any[] = XLSX.utils.sheet_to_json(ws_pic);
          const newPics = jsonData
            .map((row) => ({ pic: row.pic?.toString().trim() }))
            .filter((d) => d.pic);

          if (newPics.length > 0) {
            onImportPicSettings(newPics);
            importedCount++;
          }
        }

        // 3. Silo Capacities
        const ws_silo = wb.Sheets["Silo Capacities"];
        if (ws_silo) {
          const jsonData: any[] = XLSX.utils.sheet_to_json(ws_silo);
          const newSilos = jsonData
            .map((row) => ({
              plant_category: row.plant_category?.toString().trim(),
              unit: row.unit?.toString().trim(),
              silo_name: row.silo_name?.toString().trim(),
              capacity: parseFloat(row.capacity) || 0,
              dead_stock: parseFloat(row.dead_stock) || 0,
            }))
            .filter((d) => d.silo_name && d.capacity > 0);

          if (newSilos.length > 0) {
            onImportSiloCapacities(newSilos);
            importedCount++;
          }
        }

        // 4. Parameter Settings (must be processed before dependent sheets)
        const ws_param = wb.Sheets["Parameter Settings"];
        if (ws_param) {
          console.log("Found Parameter Settings sheet");
          const jsonData: any[] = XLSX.utils.sheet_to_json(ws_param);
          console.log("Raw parameter data from Excel:", jsonData);
          console.log(
            "Sheet headers detected:",
            Object.keys(jsonData[0] || {})
          );

          const newRawParams = jsonData
            .map((row, index) => {
              const parameter =
                row.parameter?.toString().trim() ||
                row.Parameter?.toString().trim() ||
                row.PARAMETER?.toString().trim() ||
                "";

              const dataType =
                row.data_type?.toString().trim() ||
                row.Data_Type?.toString().trim() ||
                row.DATA_TYPE?.toString().trim() ||
                row.type?.toString().trim() ||
                "Number";

              let normalizedDataType = "Number";
              const lowerDataType = dataType.toLowerCase();
              if (
                lowerDataType.includes("number") ||
                lowerDataType.includes("num") ||
                lowerDataType.includes("numeric")
              ) {
                normalizedDataType = "Number";
              } else if (
                lowerDataType.includes("text") ||
                lowerDataType.includes("string") ||
                lowerDataType.includes("str")
              ) {
                normalizedDataType = "Text";
              } else {
                normalizedDataType = "Number";
              }

              const unit =
                row.unit?.toString().trim() ||
                row.Unit?.toString().trim() ||
                row.UNIT?.toString().trim() ||
                "";

              const category =
                row.category?.toString().trim() ||
                row.Category?.toString().trim() ||
                row.CATEGORY?.toString().trim() ||
                "";

              const processedParam = {
                parameter,
                data_type: normalizedDataType,
                unit,
                category,
                min_value:
                  row.min_value !== undefined &&
                  row.min_value !== null &&
                  row.min_value !== ""
                    ? parseFloat(row.min_value)
                    : undefined,
                max_value:
                  row.max_value !== undefined &&
                  row.max_value !== null &&
                  row.max_value !== ""
                    ? parseFloat(row.max_value)
                    : undefined,
              };

              console.log(`Processing row ${index + 1}:`, {
                original: row,
                processed: processedParam,
                isValid:
                  processedParam.parameter &&
                  processedParam.data_type &&
                  processedParam.category,
              });
              return processedParam;
            })
            .filter((d) => {
              const isValid = d.parameter && d.data_type && d.category;
              if (!isValid) {
                console.log("Filtered out invalid row:", d);
              }
              return isValid;
            });

          console.log(
            "Valid parameter settings after processing:",
            newRawParams
          );

          if (newRawParams.length > 0) {
            console.log(
              `Attempting to import ${newRawParams.length} parameter settings...`
            );
            onImportParameterSettings(newRawParams);
            parameterImportCount = newRawParams.length;
            newParams = newRawParams.map(
              (p, i) =>
                ({
                  ...p,
                  id: `imported_${Date.now()}_${i}`,
                } as any)
            );
            importedCount++;
          } else {
            console.log(
              "No valid parameter settings found to import - check data format"
            );
            console.log(
              "Required fields: parameter, data_type, unit, category"
            );
          }
        } else {
          console.log("Parameter Settings sheet not found in Excel file");
        }

        // 5. COP Parameters (dependent)
        const ws_cop = wb.Sheets["COP Parameters"];
        if (ws_cop && newParams.length > 0) {
          const jsonData: any[] = XLSX.utils.sheet_to_json(ws_cop);
          const newCopIds = jsonData
            .map((row) => {
              const param = newParams.find(
                (p) =>
                  p.parameter === row.Parameter?.toString().trim() &&
                  p.category === row.Category?.toString().trim()
              );
              return param ? param.id : null;
            })
            .filter((id): id is string => id !== null);

          if (newCopIds.length > 0) {
            onImportCopParameters(newCopIds, newParams);
            importedCount++;
          }
        }

        // 6. Report Settings (dependent)
        const ws_report = wb.Sheets["Report Settings"];
        if (ws_report && newParams.length > 0) {
          const jsonData: any[] = XLSX.utils.sheet_to_json(ws_report);
          const newReportSettings = jsonData
            .map((row) => {
              const param = newParams.find(
                (p) => p.parameter === row.Parameter?.toString().trim()
              );
              return param
                ? {
                    parameter_id: param.id,
                    category: row.Category?.toString().trim(),
                  }
                : null;
            })
            .filter((rs): rs is any => rs !== null && rs.category);

          if (newReportSettings.length > 0) {
            onImportReportSettings(newReportSettings);
            importedCount++;
          }
        }

        if (importedCount > 0) {
          let successMessage = `Master data imported successfully! ${importedCount} section(s) were imported.\n\n`;

          if (parameterImportCount > 0) {
            successMessage += `• Parameter Settings: ${parameterImportCount} records imported\n`;
          }

          console.log("Import completed successfully:", {
            totalSections: importedCount,
            parameterCount: parameterImportCount,
          });

          alert(successMessage);
        } else {
          alert(
            "No valid data found in the Excel file. Please check the file format and sheet names.\n\nFor Parameter Settings, make sure you have columns: parameter, data_type, unit, category"
          );
        }
      } catch (error) {
        console.error("Failed to import master data:", error);
        alert(
          `An error occurred during import: ${
            error instanceof Error ? error.message : "Unknown error"
          }. Please check file format and content.`
        );
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.onerror = () => {
      alert("Failed to read the file. Please try again.");
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
          {t.op_master_data}
        </h2>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportAll}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DocumentArrowUpIcon className="w-5 h-5" />
            {isImporting ? t.importing || "Importing..." : t.import_all}
          </button>
          <button
            onClick={handleExportAll}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            {isExporting ? t.exporting || "Exporting..." : t.export_all}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MasterDataImportExport;
