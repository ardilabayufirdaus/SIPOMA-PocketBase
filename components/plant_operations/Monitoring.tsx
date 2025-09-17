import * as React from 'react';
import { useMemo, useState } from 'react';
import { usePlantUnits } from '../../hooks/usePlantUnits';
import IndexTab from './IndexTab';
import ComboChart from '../charts/ComboChart';
import { CcrDowntimeData, AutonomousRiskData } from '../../types';
import { ResponsiveTable } from '../ResponsiveTable';
import { calculateDuration, formatDuration } from '../../utils/formatters';

interface MonitoringProps {
  downtimeData: CcrDowntimeData[];
  riskData: AutonomousRiskData[];
  t: any;
}

const Monitoring: React.FC<MonitoringProps> = ({ downtimeData, riskData, t }) => {
  // Gunakan kunci dari translations.ts, fallback tetap Bahasa Indonesia

  const tf = (key: string, fallback: string) => t?.[key] || fallback;

  // Plant Category & Unit filter
  const { records: plantUnits, loading: plantUnitsLoading } = usePlantUnits();

  // Add error handling for data validation
  const validateData = useMemo(() => {
    const errors: string[] = [];
    if (!Array.isArray(downtimeData)) {
      errors.push('Downtime data is not in correct format');
    }
    if (!Array.isArray(riskData)) {
      errors.push('Risk data is not in correct format');
    }
    return errors;
  }, [downtimeData, riskData]);
  const plantCategories = useMemo(
    () => [...new Set(plantUnits.map((unit) => unit.category).sort())],
    [plantUnits]
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('');
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
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  // Set default category/unit on load
  React.useEffect(() => {
    if (plantCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(plantCategories[0]);
    }
  }, [plantCategories, selectedCategory]);
  React.useEffect(() => {
    if (unitsForCategory.length > 0 && !unitsForCategory.includes(selectedUnit)) {
      setSelectedUnit(unitsForCategory[0]);
    } else if (unitsForCategory.length === 0) {
      setSelectedUnit('');
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
  // Using the same calculation method as Autonomous Data Entry for consistency
  const calculateDurationInMinutes = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;

    const { hours, minutes } = calculateDuration(startTime, endTime);
    return hours * 60 + minutes;
  };

  // Helper function to calculate problem map for charts
  // Updated to use Autonomous Data Entry duration calculation method
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
      // Use Autonomous Data Entry duration calculation method
      const duration = calculateDurationInMinutes(d.start_time || '0:0', d.end_time || '0:0');
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

  const [activeTab, setActiveTab] = useState('availability');

  // Show loading state
  if (plantUnitsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-slate-600 dark:text-slate-400 text-sm">
          {tf('loading_plant_data', 'Memuat data plant...')}
        </span>
      </div>
    );
  }

  // Show validation errors
  if (validateData.length > 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
        <div className="flex items-center">
          <svg
            className="w-4 h-4 text-red-500 mr-2 flex-shrink-0"
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
              {tf('data_validation_error', 'Error Validasi Data')}
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
      <div className="text-center py-8">
        <div className="text-slate-500 mb-3">
          <svg
            className="w-12 h-12 mx-auto mb-3"
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
        <h3 className="text-base font-medium text-slate-700 dark:text-slate-300 mb-1">
          {tf('no_plant_units', 'Tidak Ada Unit Plant Tersedia')}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {tf(
            'add_plant_units_first',
            'Silahkan tambahkan unit plant di Master Data terlebih dahulu.'
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {tf('monitoring_title', 'Monitoring Plant Operations')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {tf('monitoring_subtitle', 'Pantau performa dan downtime operasi pabrik')}
            </p>
          </div>

          {/* Filter Plant Category & Unit */}
          <div className="flex flex-col sm:flex-row gap-3 min-w-0 xl:w-auto">
            <div className="min-w-0 flex-1 sm:max-w-xs">
              <label
                htmlFor="monitoring-category-filter"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                {tf('plant_category', 'Kategori Plant')}
              </label>
              <select
                id="monitoring-category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full pl-3 pr-8 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-md shadow-sm transition-colors"
              >
                {plantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0 flex-1 sm:max-w-xs">
              <label
                htmlFor="monitoring-unit-filter"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                {tf('plant_unit', 'Unit Plant')}
              </label>
              <select
                id="monitoring-unit-filter"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="block w-full pl-3 pr-8 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-md shadow-sm disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-500 dark:disabled:text-slate-400 transition-colors"
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
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div
          className="flex gap-0 border-b border-slate-200 dark:border-slate-700"
          role="tablist"
          aria-label="Monitoring tabs"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'availability'}
            aria-controls="availability-panel"
            id="availability-tab"
            className={`flex-1 px-4 py-3 font-medium text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset transition-all duration-200 text-sm ${
              activeTab === 'availability'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-b-2 border-red-500'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('availability')}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {tf('availability_tab', 'Availability')}
            </div>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'index'}
            aria-controls="index-panel"
            id="index-tab"
            className={`flex-1 px-4 py-3 font-medium text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset transition-all duration-200 text-sm ${
              activeTab === 'index'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-b-2 border-red-500'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('index')}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              {tf('index_tab', 'Index')}
            </div>
          </button>
        </div>

        <div
          role="tabpanel"
          id={activeTab === 'availability' ? 'availability-panel' : 'index-panel'}
          aria-labelledby={activeTab === 'availability' ? 'availability-tab' : 'index-tab'}
          className="p-4"
        >
          {activeTab === 'availability' && (
            <div className="space-y-4">
              {/* Charts Section - Grid Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Chart Pareto Downtime */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                      {tf('downtime_pareto_chart', 'Grafik Pareto Downtime')}
                    </h2>
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <svg
                        className="w-4 h-4 mr-2"
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
                      {tf('chart', 'Grafik')}
                    </div>
                  </div>
                  {filteredDowntimeData.length > 0 ? (
                    <ComboChart
                      data={calculateProblemMap(filteredDowntimeData)}
                      bars={[
                        {
                          dataKey: 'duration',
                          fill: '#ef4444',
                          name: tf('duration', 'Durasi'),
                        },
                      ]}
                      xAxisConfig={{
                        dataKey: 'problem',
                        label: tf('problem', 'Masalah'),
                      }}
                      leftYAxisConfig={{ label: tf('duration', 'Durasi') }}
                      height={350}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                      <svg
                        className="w-12 h-12 mb-3 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <h3 className="text-base font-medium mb-1">
                        {tf('no_data_available', 'Tidak Ada Data Tersedia')}
                      </h3>
                      <p className="text-center text-xs">
                        {tf('no_downtime_data', 'Data downtime tidak tersedia.')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Chart PIC */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                      {tf('pic_bar_chart', 'Grafik PIC')}
                    </h2>
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {tf('personnel', 'Personil')}
                    </div>
                  </div>
                  {filteredDowntimeData.length > 0 ? (
                    <ComboChart
                      data={picChartData}
                      bars={[
                        {
                          dataKey: 'count',
                          fill: '#3b82f6',
                          name: tf('count', 'Jumlah'),
                        },
                      ]}
                      xAxisConfig={{ dataKey: 'pic', label: tf('pic', 'PIC') }}
                      leftYAxisConfig={{ label: tf('count', 'Jumlah') }}
                      height={350}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                      <svg
                        className="w-12 h-12 mb-3 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <h3 className="text-base font-medium mb-1">
                        {tf('no_data_available', 'Tidak Ada Data Tersedia')}
                      </h3>
                      <p className="text-center text-xs">
                        {tf('no_pic_data', 'Data PIC tidak tersedia.')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tables Section */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Tabel 3 Masalah Teratas */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {tf('top_3_problems', '3 Masalah Teratas')}
                      </h2>
                      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                        <svg
                          className="w-4 h-4 mr-2"
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
                        {tf('issues', 'Masalah')}
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <ResponsiveTable>
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {tf('problem', 'Masalah')}
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {tf('duration', 'Durasi')}
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {tf('pic', 'PIC')}
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {tf('correction_action', 'Tindakan Koreksi')}
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {tf('corrective_action', 'Tindakan Perbaikan')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {(() => {
                          // Top 3 problems from filteredDowntimeData using helper function
                          const topProblems = calculateProblemMap(filteredDowntimeData).slice(0, 3);
                          return topProblems.length > 0 ? (
                            topProblems.flatMap((p) =>
                              p.details.map((d, idx) => (
                                <tr
                                  key={p.problem + d.pic + idx}
                                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                  <td className="px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-medium">
                                    {p.problem}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">
                                    {(() => {
                                      const hours = Math.floor(p.duration / 60);
                                      const minutes = p.duration % 60;
                                      return formatDuration(hours, minutes);
                                    })()}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">
                                    {d.pic}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">
                                    {d.action}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">
                                    {d.corrective_action}
                                  </td>
                                </tr>
                              ))
                            )
                          ) : (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-3 py-8 text-center text-slate-500 dark:text-slate-400"
                              >
                                <div className="flex flex-col items-center">
                                  <svg
                                    className="w-8 h-8 mb-2 opacity-50"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.966-5.618-2.479.047-.074.1-.147.16-.218 1.049-1.235 2.737-2.303 4.458-2.303s3.409 1.068 4.458 2.303c.06.071.113.144.16.218C16.29 14.034 14.34 15 12 15z"
                                    />
                                  </svg>
                                  {tf(
                                    'no_downtime_problem_data',
                                    'Data masalah downtime tidak tersedia.'
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </ResponsiveTable>
                  </div>
                </div>

                {/* Tabel Upcoming Events */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {tf('upcoming_events', 'Event Mendatang')}
                      </h2>
                      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {tf('events', 'Event')}
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <ResponsiveTable>
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {tf('upcoming_event', 'Event Mendatang')}
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {tf('potential_counter_measures', 'Tindakan Pencegahan')}
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {tf('risk_mitigation', 'Mitigasi Risiko')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredRiskData.length > 0 ? (
                          filteredRiskData.map((event, idx) => (
                            <tr
                              key={event.id + idx}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                              <td className="px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-medium">
                                {event.potential_disruption}
                              </td>
                              <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">
                                {event.preventive_action}
                              </td>
                              <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">
                                {event.mitigation_plan}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-3 py-8 text-center text-slate-500 dark:text-slate-400"
                            >
                              <div className="flex flex-col items-center">
                                <svg
                                  className="w-8 h-8 mb-2 opacity-50"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                {tf(
                                  'no_upcoming_event_data',
                                  'Data event mendatang tidak tersedia.'
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </ResponsiveTable>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'index' && (
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
    </div>
  );
};

export default Monitoring;
