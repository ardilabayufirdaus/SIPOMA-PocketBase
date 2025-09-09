import React, { useState, useEffect } from "react";
import { ResponsiveTable } from "../ResponsiveTable";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ParameterSetting, CcrParameterData } from "../../types";
import { useParameterSettings } from "../../hooks/useParameterSettings";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useGlobalParameterSettings } from "../../hooks/useGlobalParameterSettings";

interface IndexTabProps {
  t: any;
  selectedCategory: string;
  selectedUnit: string;
  fetchIndexData?: (filter: IndexFilter) => Promise<IndexChartData[]>; // Make optional since we handle internally
}

export type IndexFilterType = "daily" | "monthly" | "yearly" | "range";
export interface IndexFilter {
  type: IndexFilterType;
  date?: string;
  month?: string;
  year?: string;
  startDate?: string;
  endDate?: string;
}
export interface IndexChartData {
  label: string;
  LOI: number;
  BTL: number;
  SO3: number;
  H2O: number;
  [key: string]: string | number; // Allow dynamic parameters
}

interface ParameterOption {
  id: string;
  name: string;
  color: string;
  unit?: string;
}

const IndexTab: React.FC<IndexTabProps> = ({
  t,
  selectedCategory,
  selectedUnit,
  fetchIndexData, // Optional prop
}) => {
  const [filterType, setFilterType] = useState<IndexFilterType>("daily");
  const [filter, setFilter] = useState<IndexFilter>({ type: "daily" });
  const [data, setData] = useState<IndexChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  const [availableParameters, setAvailableParameters] = useState<
    ParameterOption[]
  >([]);
  const [selectedParameters, setSelectedParameters] = useState<Set<string>>(
    new Set(["LOI", "BTL", "SO3", "H2O"])
  );

  // Fetch real Parameter Settings from Master Data
  const { records: parameterSettings, loading: parameterLoading } =
    useParameterSettings();

  // Get current user for role checking
  const { currentUser } = useCurrentUser();

  // Global parameter settings hook
  const {
    settings: globalSettings,
    loading: settingsLoading,
    error: settingsError,
    saveSettings,
    loadSettings,
  } = useGlobalParameterSettings();

  // Generate colors for parameters
  const generateParameterColor = (index: number): string => {
    const colors = [
      "#ef4444",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#f97316",
      "#06b6d4",
      "#84cc16",
      "#f43f5e",
      "#6366f1",
      "#8b5a2b",
      "#059669",
      "#7c3aed",
      "#db2777",
    ];
    return colors[index % colors.length];
  };

  // Fetch CCR Parameter Data for specific parameters and date range
  const fetchCcrParameterData = async (
    parameterIds: string[],
    filter: IndexFilter
  ): Promise<CcrParameterData[]> => {
    try {
      // TODO: Replace with real API call to CCR Parameter Data Entry
      // Should include selectedCategory and selectedUnit in the query
      // Example: const response = await fetch('/api/ccr-parameter-data', {
      //   method: 'POST',
      //   body: JSON.stringify({ parameterIds, filter, category: selectedCategory, unit: selectedUnit })
      // });
      // return response.json();

      // Mock data for now - replace with real API call
      const mockCcrData: CcrParameterData[] = [];

      // Generate mock data based on filter
      const startDate = filter.startDate || filter.date || "2025-09-01";
      const endDate = filter.endDate || filter.date || "2025-09-03";

      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];

        parameterIds.forEach((paramId) => {
          const hourlyValues: { [hour: number]: number } = {};
          // Generate 24 hours of mock data
          for (let hour = 1; hour <= 24; hour++) {
            hourlyValues[hour] =
              Math.random() * 10 + (paramId.includes("CV") ? 4000 : 0);
          }

          mockCcrData.push({
            id: `${paramId}_${dateStr}`,
            parameter_id: paramId,
            date: dateStr,
            hourly_values: hourlyValues,
          });
        });
      }

      return mockCcrData;
    } catch (error) {
      console.error("Failed to fetch CCR parameter data:", error);
      return [];
    }
  };

  // Load available parameters from Parameter Settings
  const loadAvailableParameters = async () => {
    try {
      // Filter parameters based on both selected category and unit
      const filteredParams = parameterSettings.filter((param) => {
        const categoryMatch = selectedCategory
          ? param.category === selectedCategory
          : true;
        const unitMatch = selectedUnit ? param.unit === selectedUnit : true;
        return categoryMatch && unitMatch;
      });

      const parameterOptions: ParameterOption[] = filteredParams.map(
        (param, index) => ({
          id: param.id,
          name: param.parameter,
          color: generateParameterColor(index),
          unit: param.unit,
        })
      );

      setAvailableParameters(parameterOptions);

      // Update selected parameters to include only available ones
      const availableIds = new Set(parameterOptions.map((p) => p.id));
      const currentSelected = Array.from(selectedParameters).filter((id) =>
        availableIds.has(id)
      );

      // If no valid selections remain, select the first few parameters
      if (currentSelected.length === 0 && parameterOptions.length > 0) {
        const defaultSelection = parameterOptions
          .slice(0, Math.min(4, parameterOptions.length))
          .map((p) => p.id);
        setSelectedParameters(new Set(defaultSelection));
      } else {
        setSelectedParameters(new Set(currentSelected));
      }
    } catch (error) {
      console.error("Failed to load parameters:", error);
      // Fallback to default parameters
      const defaultParameters: ParameterOption[] = [
        { id: "LOI", name: "LOI", color: "#ef4444", unit: "%" },
        { id: "BTL", name: "BTL", color: "#3b82f6", unit: "%" },
        { id: "SO3", name: "SO3", color: "#10b981", unit: "%" },
        { id: "H2O", name: "H2O", color: "#f59e0b", unit: "%" },
      ];
      setAvailableParameters(defaultParameters);
    }
  };

  const handleParameterToggle = (parameterId: string) => {
    const newSelected = new Set(selectedParameters);
    if (newSelected.has(parameterId)) {
      newSelected.delete(parameterId);
    } else {
      newSelected.add(parameterId);
    }
    setSelectedParameters(newSelected);
  };

  const handleSaveGlobalSettings = async () => {
    try {
      setLoading(true);

      console.log("Saving settings:", {
        selectedParameters: Array.from(selectedParameters),
        selectedCategory,
        selectedUnit,
        userRole: currentUser?.role,
      });

      // Validate required fields
      if (!selectedCategory || !selectedUnit) {
        throw new Error(
          "Please select plant category and unit before saving settings"
        );
      }

      if (selectedParameters.size === 0) {
        throw new Error("Please select at least one parameter before saving");
      }

      // Save settings using the hook
      await saveSettings(
        Array.from(selectedParameters),
        selectedCategory,
        selectedUnit
      );

      // Show success message
      console.log("Settings saved successfully!");
      alert(t.global_settings_saved || "Settings saved successfully!");
      setShowSettings(false);
    } catch (error) {
      console.error("Failed to save global settings:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save settings. Please try again.";
      alert(t.global_settings_save_failed || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openSettings = () => {
    loadAvailableParameters();
    setShowSettings(true);
  };

  // Initialize parameters on component mount and when selectedCategory, selectedUnit, or parameterSettings changes
  useEffect(() => {
    if (!parameterLoading) {
      loadAvailableParameters();
    }
  }, [selectedCategory, selectedUnit, parameterSettings, parameterLoading]);

  // Load global settings when globalSettings change
  useEffect(() => {
    if (globalSettings && globalSettings.selected_parameters) {
      setSelectedParameters(new Set(globalSettings.selected_parameters));
    }
  }, [globalSettings]);

  // Load settings when category/unit changes
  useEffect(() => {
    if (currentUser && selectedCategory && selectedUnit) {
      loadSettings(selectedCategory, selectedUnit);
    }
  }, [currentUser, selectedCategory, selectedUnit, loadSettings]);

  // Convert CCR Parameter Data to IndexChartData format
  const processCcrDataToChartData = (
    ccrData: CcrParameterData[],
    filterType: IndexFilterType
  ): IndexChartData[] => {
    const chartDataMap = new Map<string, IndexChartData>();

    ccrData.forEach((data) => {
      let label: string;

      // Determine label based on filter type
      switch (filterType) {
        case "daily":
          label = data.date;
          break;
        case "monthly":
          label = data.date.substring(0, 7); // YYYY-MM
          break;
        case "yearly":
          label = data.date.substring(0, 4); // YYYY
          break;
        case "range":
          label = data.date;
          break;
        default:
          label = data.date;
      }

      // Calculate average value from hourly data
      const hourlyValues = Object.values(data.hourly_values).filter(
        (val) => typeof val === "number"
      ) as number[];
      const avgValue =
        hourlyValues.length > 0
          ? hourlyValues.reduce((sum, val) => sum + val, 0) /
            hourlyValues.length
          : 0;

      if (!chartDataMap.has(label)) {
        chartDataMap.set(label, { label, LOI: 0, BTL: 0, SO3: 0, H2O: 0 });
      }

      const chartData = chartDataMap.get(label)!;
      chartData[data.parameter_id] = avgValue;
    });

    return Array.from(chartDataMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  };

  // Fetch and process data from CCR Parameter Data Entry
  const fetchAndProcessData = async (
    filter: IndexFilter
  ): Promise<IndexChartData[]> => {
    try {
      const selectedParamIds = Array.from(selectedParameters);
      const ccrData = await fetchCcrParameterData(selectedParamIds, filter);
      const chartData = processCcrDataToChartData(ccrData, filter.type);
      return chartData;
    } catch (error) {
      console.error("Failed to fetch and process data:", error);
      throw error;
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as IndexFilterType;
    setFilterType(type);
    setFilter({ type });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Use the new function instead of the prop function
      const result = await fetchAndProcessData(filter);
      setData(result);
    } catch (err: any) {
      setError("Gagal mengambil data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form
        className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-4"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <select
            value={filterType}
            onChange={handleFilterChange}
            className="px-3 py-2 rounded border"
          >
            <option value="daily">Harian</option>
            <option value="monthly">Bulanan</option>
            <option value="yearly">Tahunan</option>
            <option value="range">Rentang</option>
          </select>
          {filterType === "daily" && (
            <input
              type="date"
              name="date"
              value={filter.date || ""}
              onChange={handleInputChange}
              className="px-3 py-2 rounded border"
            />
          )}
          {filterType === "monthly" && (
            <>
              <input
                type="month"
                name="month"
                value={filter.month || ""}
                onChange={handleInputChange}
                className="px-3 py-2 rounded border"
              />
              <input
                type="number"
                name="year"
                value={filter.year || ""}
                onChange={handleInputChange}
                className="px-3 py-2 rounded border"
                placeholder="Tahun"
              />
            </>
          )}
          {filterType === "yearly" && (
            <input
              type="number"
              name="year"
              value={filter.year || ""}
              onChange={handleInputChange}
              className="px-3 py-2 rounded border"
              placeholder="Tahun"
            />
          )}
          {filterType === "range" && (
            <>
              <input
                type="date"
                name="startDate"
                value={filter.startDate || ""}
                onChange={handleInputChange}
                className="px-3 py-2 rounded border"
              />
              <input
                type="date"
                name="endDate"
                value={filter.endDate || ""}
                onChange={handleInputChange}
                className="px-3 py-2 rounded border"
              />
            </>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white rounded font-semibold"
          >
            Filter
          </button>
        </div>
        {loading && <div className="text-slate-500">Memuat data...</div>}
        {error && <div className="text-red-500">{error}</div>}
      </form>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            Grafik Parameter
          </h2>
          <button
            onClick={openSettings}
            className="p-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            title="Pengaturan Parameter"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
        <LineChart width={800} height={400} data={data} className="mx-auto">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Legend />
          {availableParameters
            .filter((param) => selectedParameters.has(param.id))
            .map((param) => (
              <Line
                key={param.id}
                type="monotone"
                dataKey={param.id}
                stroke={param.color}
                name={param.unit ? `${param.name} (${param.unit})` : param.name}
              />
            ))}
        </LineChart>
        {data.length === 0 && !loading && (
          <div className="text-slate-500 py-8 text-center">
            Tidak ada data untuk filter yang dipilih.
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Pilih Parameter
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Pilih parameter dari{" "}
                <strong>
                  Plant Operations → Master Data → Parameter Settings
                </strong>{" "}
                yang sesuai dengan{" "}
                <strong>Plant Category: {selectedCategory}</strong> dan{" "}
                <strong>Plant Unit: {selectedUnit}</strong>:
              </p>

              {currentUser?.role === "Super Admin" && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-amber-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.924-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        {t.super_admin_mode}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        {t.super_admin_global_settings_info}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {parameterLoading ? (
                <div className="text-center py-4">
                  <div className="text-slate-500">Memuat parameter...</div>
                </div>
              ) : availableParameters.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-slate-500">
                    Tidak ada parameter tersedia untuk Plant Category "
                    {selectedCategory}" dan Plant Unit "{selectedUnit}".
                    <br />
                    Silahkan tambahkan parameter di Master Data → Parameter
                    Settings.
                  </div>
                </div>
              ) : (
                availableParameters.map((param) => (
                  <label
                    key={param.id}
                    className="flex items-center space-x-3 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedParameters.has(param.id)}
                      onChange={() => handleParameterToggle(param.id)}
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: param.color }}
                      ></div>
                      <span className="text-slate-700 dark:text-slate-300">
                        {param.name}
                        {param.unit && (
                          <span className="text-slate-500 text-sm">
                            {" "}
                            ({param.unit})
                          </span>
                        )}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                {t.cancel_button || "Batal"}
              </button>
              {currentUser?.role === "Super Admin" ? (
                <button
                  onClick={handleSaveGlobalSettings}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span>{t.apply_to_all_users}</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  {t.apply_button || "Terapkan"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndexTab;
