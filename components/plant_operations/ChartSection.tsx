import React, { lazy, Suspense } from "react";
import { PlantOperationsDataPoint } from "../../hooks/usePlantOperationsDashboard";

const ComboChart = lazy(() => import("../charts/ComboChart"));

interface ChartSectionProps {
  realPlantOperationsData: PlantOperationsDataPoint[];
  selectedMetric: string;
  timeRange: "1h" | "4h" | "12h" | "24h";
  onMetricChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onTimeRangeChange: (range: "1h" | "4h" | "12h" | "24h") => void;
}

const ChartSection: React.FC<ChartSectionProps> = React.memo(
  ({
    realPlantOperationsData,
    selectedMetric,
    timeRange,
    onMetricChange,
    onTimeRangeChange,
  }) => {
    const chartData = React.useMemo(() => {
      return realPlantOperationsData.map((item) => ({
        timestamp: item.timestamp,
        [selectedMetric]:
          item[selectedMetric as keyof PlantOperationsDataPoint],
      }));
    }, [realPlantOperationsData, selectedMetric]);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Metrics Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Plant Operations Metrics
            </h3>
            <select
              value={selectedMetric}
              onChange={onMetricChange}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="efficiency">Efficiency (%)</option>
              <option value="availability">Availability (%)</option>
              <option value="quality">Quality (%)</option>
              <option value="throughput">Throughput</option>
              <option value="downtime">Downtime (hours)</option>
            </select>
          </div>

          <div className="h-80">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  <span className="ml-3 text-slate-600 dark:text-slate-400">
                    Loading chart...
                  </span>
                </div>
              }
            >
              <ComboChart
                data={chartData}
                lines={[
                  {
                    dataKey: selectedMetric,
                    stroke: "#dc2626",
                    name:
                      selectedMetric.charAt(0).toUpperCase() +
                      selectedMetric.slice(1),
                  },
                ]}
                xAxisConfig={{ dataKey: "timestamp", label: "Time" }}
                leftYAxisConfig={{
                  label:
                    selectedMetric === "throughput"
                      ? "Units/Hour"
                      : selectedMetric === "downtime"
                      ? "Hours"
                      : "Percentage (%)",
                }}
                height={320}
              />
            </Suspense>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Time Range Selection
          </h3>
          <div className="flex gap-2 flex-wrap">
            {(["1h", "4h", "12h", "24h"] as const).map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
            Select time range to view historical data and trends for plant
            operations metrics.
          </p>
        </div>
      </div>
    );
  }
);

ChartSection.displayName = "ChartSection";

export default ChartSection;
