import React, { useMemo, useState } from "react";
import { usePlantUnits } from "../../hooks/usePlantUnits";
import IndexTab from "./IndexTab";
import ComboChart from "../charts/ComboChart";
import { CcrDowntimeData, AutonomousRiskData } from "../../types";
import { ResponsiveTable } from "../ResponsiveTable";

interface MonitoringProps {
  downtimeData: CcrDowntimeData[];
  riskData: AutonomousRiskData[];
  t: any;
}

const Monitoring: React.FC<MonitoringProps> = ({
  downtimeData,
  riskData,
  t,
}) => {
  // Gunakan kunci dari translations.ts, fallback tetap Bahasa Indonesia

  const tf = (key: string, fallback: string) => t?.[key] || fallback;

  // Plant Category & Unit filter
  const { records: plantUnits, loading: plantUnitsLoading } = usePlantUnits();

  // Add error handling for data validation
  const validateData = useMemo(() => {
    const errors: string[] = [];
    if (!Array.isArray(downtimeData)) {
      errors.push("Downtime data is not in correct format");
    }
    if (!Array.isArray(riskData)) {
      errors.push("Risk data is not in correct format");
    }
    return errors;
  }, [downtimeData, riskData]);
  const plantCategories = useMemo(
    () => [...new Set(plantUnits.map((unit) => unit.category).sort())],
    [plantUnits]
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const unitsForCategory = useMemo(
    () =>
      selectedCategory
        ? plantUnits
            .filter((u) => u.category === selectedCategory)
            .map((u) => u.unit)
            .sort()
        : [],
    [plantUnits, selectedCategory]
  );
  const [selectedUnit, setSelectedUnit] = useState<string>("");

  // Set default category/unit on load
  React.useEffect(() => {
    if (plantCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(plantCategories[0]);
    }
  }, [plantCategories, selectedCategory]);
  React.useEffect(() => {
    if (
      unitsForCategory.length > 0 &&
      !unitsForCategory.includes(selectedUnit)
    ) {
      setSelectedUnit(unitsForCategory[0]);
    } else if (unitsForCategory.length === 0) {
      setSelectedUnit("");
    }
  }, [unitsForCategory, selectedUnit]);

  // Filter downtimeData and riskData by selectedCategory and selectedUnit
  const filteredDowntimeData = useMemo(() => {
    if (!selectedCategory || !selectedUnit) return [];
    // Get the category for the selected unit from plantUnits
    const unitInfo = plantUnits.find((u) => u.unit === selectedUnit);
    if (!unitInfo || unitInfo.category !== selectedCategory) return [];

    return downtimeData.filter((d) => d.unit === selectedUnit);
  }, [downtimeData, selectedCategory, selectedUnit, plantUnits]);

  const filteredRiskData = useMemo(() => {
    if (!selectedCategory || !selectedUnit) return [];
    // Get the category for the selected unit from plantUnits
    const unitInfo = plantUnits.find((u) => u.unit === selectedUnit);
    if (!unitInfo || unitInfo.category !== selectedCategory) return [];

    return riskData.filter((r) => r.unit === selectedUnit);
  }, [riskData, selectedCategory, selectedUnit, plantUnits]);

  // Helper function for duration calculation to avoid code duplication
  const calculateDuration = (startTime: string, endTime: string): number => {
    try {
      const startParts = startTime.split(":");
      const endParts = endTime.split(":");

      if (startParts.length !== 2 || endParts.length !== 2) return 0;

      const startHour = parseInt(startParts[0], 10);
      const startMin = parseInt(startParts[1], 10);
      const endHour = parseInt(endParts[0], 10);
      const endMin = parseInt(endParts[1], 10);

      if (
        isNaN(startHour) ||
        isNaN(startMin) ||
        isNaN(endHour) ||
        isNaN(endMin)
      )
        return 0;
      if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23)
        return 0;
      if (startMin < 0 || startMin > 59 || endMin < 0 || endMin > 59) return 0;

      const startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;

      // Handle cases where end time is next day
      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60; // Add 24 hours
      }

      return Math.max(0, endMinutes - startMinutes);
    } catch (error) {
      console.warn("Invalid time format:", { startTime, endTime });
      return 0;
    }
  };

  // Helper function to calculate problem map for charts
  const calculateProblemMap = (data: CcrDowntimeData[]) => {
    const problemMap: Record<
      string,
      { count: number; duration: number; details: CcrDowntimeData[] }
    > = {};
    data.forEach((d) => {
      if (!d || !d.problem) return;
      if (!problemMap[d.problem]) {
        problemMap[d.problem] = { count: 0, duration: 0, details: [] };
      }
      problemMap[d.problem].count++;
      const duration = calculateDuration(
        d.start_time || "0:0",
        d.end_time || "0:0"
      );
      problemMap[d.problem].duration += duration;
      problemMap[d.problem].details.push(d);
    });
    return Object.entries(problemMap)
      .map(([problem, { count, duration, details }]) => ({
        problem,
        count,
        duration,
        details,
      }))
      .sort((a, b) => b.duration - a.duration);
  };

  const paretoData = useMemo(() => {
    if (!Array.isArray(filteredDowntimeData)) return [];
    return calculateProblemMap(filteredDowntimeData);
  }, [filteredDowntimeData]);

  const topProblems = paretoData.slice(0, 3);

  const picChartData = useMemo(() => {
    const picMap: Record<string, number> = {};
    filteredDowntimeData.forEach((d) => {
      if (d && d.pic) {
        picMap[d.pic] = (picMap[d.pic] || 0) + 1;
      }
    });
    return Object.entries(picMap).map(([pic, count]) => ({
      pic,
      count,
    }));
  }, [filteredDowntimeData]);

  const upcomingEvents = useMemo(() => {
    return Array.isArray(filteredRiskData) ? filteredRiskData : [];
  }, [filteredRiskData]);

  const [activeTab, setActiveTab] = useState("availability");

  // Show loading state
  if (plantUnitsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-slate-600 dark:text-slate-400">
          {tf("loading_plant_data", "Memuat data plant...")}
        </span>
      </div>
    );
  }

  // Show validation errors
  if (validateData.length > 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-red-500 mr-2"
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
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              {tf("data_validation_error", "Error Validasi Data")}
            </h3>
            <ul className="mt-1 text-sm text-red-700 dark:text-red-300">
              {validateData.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Show message when no plant units available
  if (plantCategories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-500 mb-4">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
          {tf("no_plant_units", "Tidak Ada Unit Plant Tersedia")}
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          {tf(
            "add_plant_units_first",
            "Silahkan tambahkan unit plant di Master Data terlebih dahulu."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filter Plant Category & Unit */}
      <div className="flex gap-4 mb-2">
        <div className="w-full sm:w-48">
          <label htmlFor="monitoring-category-filter" className="sr-only">
            Plant Category
          </label>
          <select
            id="monitoring-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md"
          >
            {plantCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-48">
          <label htmlFor="monitoring-unit-filter" className="sr-only">
            Plant Unit
          </label>
          <select
            id="monitoring-unit-filter"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md"
            disabled={unitsForCategory.length === 0}
          >
            {unitsForCategory.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Tabs */}
      <div
        className="flex gap-2 border-b mb-4"
        role="tablist"
        aria-label="Monitoring tabs"
      >
        <button
          role="tab"
          aria-selected={activeTab === "availability"}
          aria-controls="availability-panel"
          id="availability-tab"
          className={`px-4 py-2 font-semibold rounded-t-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-150 ${
            activeTab === "availability"
              ? "bg-white dark:bg-slate-800 border-x border-t border-b-0 text-red-600"
              : "bg-slate-100 dark:bg-slate-700 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600"
          }`}
          onClick={() => setActiveTab("availability")}
        >
          {tf("availability_tab", "Availability")}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "index"}
          aria-controls="index-panel"
          id="index-tab"
          className={`px-4 py-2 font-semibold rounded-t-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-150 ${
            activeTab === "index"
              ? "bg-white dark:bg-slate-800 border-x border-t border-b-0 text-red-600"
              : "bg-slate-100 dark:bg-slate-700 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600"
          }`}
          onClick={() => setActiveTab("index")}
        >
          {tf("index_tab", "Index")}
        </button>
      </div>
      <div
        role="tabpanel"
        id={activeTab === "availability" ? "availability-panel" : "index-panel"}
        aria-labelledby={
          activeTab === "availability" ? "availability-tab" : "index-tab"
        }
      >
        {activeTab === "availability" && (
          <div>
            {/* Chart Pareto Downtime */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
                {tf("downtime_pareto_chart", "Grafik Pareto Downtime")}
              </h2>
              {filteredDowntimeData.length > 0 ? (
                <ComboChart
                  data={calculateProblemMap(filteredDowntimeData)}
                  bars={[
                    {
                      dataKey: "duration",
                      fill: "#ef4444",
                      name: tf("duration", "Durasi"),
                    },
                  ]}
                  xAxisConfig={{
                    dataKey: "problem",
                    label: tf("problem", "Masalah"),
                  }}
                  leftYAxisConfig={{ label: tf("duration", "Durasi") }}
                  height={320}
                />
              ) : (
                <div className="text-slate-500 py-8 text-center">
                  {tf("no_downtime_data", "Data downtime tidak tersedia.")}
                </div>
              )}
            </div>
            {/* Chart PIC */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
                {tf("pic_bar_chart", "Grafik PIC")}
              </h2>
              {filteredDowntimeData.length > 0 ? (
                <ComboChart
                  data={picChartData}
                  bars={[
                    {
                      dataKey: "count",
                      fill: "#3b82f6",
                      name: tf("count", "Jumlah"),
                    },
                  ]}
                  xAxisConfig={{ dataKey: "pic", label: tf("pic", "PIC") }}
                  leftYAxisConfig={{ label: tf("count", "Jumlah") }}
                  height={320}
                />
              ) : (
                <div className="text-slate-500 py-8 text-center">
                  {tf("no_pic_data", "Data PIC tidak tersedia.")}
                </div>
              )}
            </div>
            {/* Tabel 3 Masalah Teratas */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
                {tf("top_3_problems", "3 Masalah Teratas")}
              </h2>
              <ResponsiveTable>
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {tf("problem", "Masalah")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {tf("duration", "Durasi")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {tf("pic", "PIC")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {tf("correction_action", "Tindakan Koreksi")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {tf("corrective_action", "Tindakan Perbaikan")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Top 3 problems from filteredDowntimeData using helper function
                    const topProblems = calculateProblemMap(
                      filteredDowntimeData
                    ).slice(0, 3);
                    return topProblems.length > 0 ? (
                      topProblems.flatMap((p) =>
                        p.details.map((d, idx) => (
                          <tr key={p.problem + d.pic + idx}>
                            <td className="px-4 py-2">{p.problem}</td>
                            <td className="px-4 py-2">{p.duration} menit</td>
                            <td className="px-4 py-2">{d.pic}</td>
                            <td className="px-4 py-2">{d.action}</td>
                            <td className="px-4 py-2">{d.corrective_action}</td>
                          </tr>
                        ))
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-slate-500 py-8 text-center"
                        >
                          {tf(
                            "no_downtime_problem_data",
                            "Data masalah downtime tidak tersedia."
                          )}
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </ResponsiveTable>
            </div>
            {/* Tabel Upcoming Events */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
                {tf("upcoming_events", "Event Mendatang")}
              </h2>
              <ResponsiveTable>
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {tf("upcoming_event", "Event Mendatang")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {tf("potential_counter_measures", "Tindakan Pencegahan")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {tf("risk_mitigation", "Mitigasi Risiko")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRiskData.length > 0 ? (
                    filteredRiskData.map((event, idx) => (
                      <tr key={event.id + idx}>
                        <td className="px-4 py-2">
                          {event.potential_disruption}
                        </td>
                        <td className="px-4 py-2">{event.preventive_action}</td>
                        <td className="px-4 py-2">{event.mitigation_plan}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-slate-500 py-8 text-center"
                      >
                        {tf(
                          "no_upcoming_event_data",
                          "Data event mendatang tidak tersedia."
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </ResponsiveTable>
            </div>
          </div>
        )}
        {activeTab === "index" && (
          <IndexTab
            t={t}
            selectedCategory={selectedCategory}
            selectedUnit={selectedUnit}
            fetchIndexData={async (filter) => {
              // TODO: Integrate with real CCR Data Entry API here
              return [];
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Monitoring;
