import React, { useState, useEffect } from 'react';
import { ResponsiveTable } from '../ResponsiveTable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ParameterSetting, CcrParameterData } from '../../types';
import { useParameterSettings } from '../../hooks/useParameterSettings';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useGlobalParameterSettings } from '../../hooks/useGlobalParameterSettings';
import { EnhancedButton, useAccessibility } from '../../components/ui/EnhancedComponents';

interface IndexTabProps {
  t: any;
  selectedCategory: string;
  selectedUnit: string;
  fetchIndexData?: (filter: IndexFilter) => Promise<IndexChartData[]>;
}

export type IndexFilterType = 'daily' | 'monthly' | 'yearly' | 'range';
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
  [key: string]: string | number;
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
  fetchIndexData,
}) => {
  const { announceToScreenReader } = useAccessibility();
  const [filterType, setFilterType] = useState<IndexFilterType>('daily');
  const [filter, setFilter] = useState<IndexFilter>({ type: 'daily' });
  const [data, setData] = useState<IndexChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [availableParameters, setAvailableParameters] = useState<ParameterOption[]>([]);
  const [selectedParameters, setSelectedParameters] = useState<Set<string>>(
    new Set(['LOI', 'BTL', 'SO3', 'H2O'])
  );

  const { records: parameterSettings, loading: parameterLoading } = useParameterSettings();
  const { currentUser } = useCurrentUser();
  const {
    settings: globalSettings,
    loading: settingsLoading,
    error: settingsError,
    saveSettings,
    loadSettings,
  } = useGlobalParameterSettings();

  const generateParameterColor = (index: number): string => {
    const colors = [
      '#ef4444',
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#8b5cf6',
      '#ec4899',
      '#f97316',
      '#06b6d4',
      '#84cc16',
      '#f43f5e',
      '#6366f1',
      '#8b5a2b',
      '#059669',
      '#7c3aed',
      '#db2777',
    ];
    return colors[index % colors.length];
  };

  const fetchCcrParameterData = async (
    parameterIds: string[],
    filter: IndexFilter
  ): Promise<CcrParameterData[]> => {
    try {
      const mockCcrData: CcrParameterData[] = [];
      const startDate = filter.startDate || filter.date || '2025-09-01';
      const endDate = filter.endDate || filter.date || '2025-09-03';

      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];

        parameterIds.forEach((paramId) => {
          const hourlyValues: { [hour: number]: number } = {};
          for (let hour = 1; hour <= 24; hour++) {
            hourlyValues[hour] = Math.random() * 10 + (paramId.includes('CV') ? 4000 : 0);
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
      console.error('Failed to fetch CCR parameter data:', error);
      return [];
    }
  };

  const loadAvailableParameters = async () => {
    try {
      const filteredParams = parameterSettings.filter((param) => {
        const categoryMatch = selectedCategory ? param.category === selectedCategory : true;
        const unitMatch = selectedUnit ? param.unit === selectedUnit : true;
        return categoryMatch && unitMatch;
      });

      const parameterOptions: ParameterOption[] = filteredParams.map((param, index) => ({
        id: param.id,
        name: param.parameter,
        color: generateParameterColor(index),
        unit: param.unit,
      }));

      setAvailableParameters(parameterOptions);

      const availableIds = new Set(parameterOptions.map((p) => p.id));
      const currentSelected = Array.from(selectedParameters).filter((id) => availableIds.has(id));

      if (currentSelected.length === 0 && parameterOptions.length > 0) {
        const defaultSelection = parameterOptions
          .slice(0, Math.min(4, parameterOptions.length))
          .map((p) => p.id);
        setSelectedParameters(new Set(defaultSelection));
      } else {
        setSelectedParameters(new Set(currentSelected));
      }
    } catch (error) {
      console.error('Failed to load parameters:', error);
      const defaultParameters: ParameterOption[] = [
        { id: 'LOI', name: 'LOI', color: '#ef4444', unit: '%' },
        { id: 'BTL', name: 'BTL', color: '#3b82f6', unit: '%' },
        { id: 'SO3', name: 'SO3', color: '#10b981', unit: '%' },
        { id: 'H2O', name: 'H2O', color: '#f59e0b', unit: '%' },
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

      if (!selectedCategory || !selectedUnit) {
        throw new Error('Please select plant category and unit before saving settings');
      }

      if (selectedParameters.size === 0) {
        throw new Error('Please select at least one parameter before saving');
      }

      await saveSettings(Array.from(selectedParameters), selectedCategory, selectedUnit);
      alert(t.global_settings_saved || 'Settings saved successfully!');
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to save global settings:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save settings. Please try again.';
      alert(t.global_settings_save_failed || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openSettings = () => {
    loadAvailableParameters();
    setShowSettings(true);
  };

  useEffect(() => {
    if (!parameterLoading) {
      loadAvailableParameters();
    }
  }, [selectedCategory, selectedUnit, parameterSettings, parameterLoading]);

  useEffect(() => {
    if (globalSettings && globalSettings.selected_parameters) {
      setSelectedParameters(new Set(globalSettings.selected_parameters));
    }
  }, [globalSettings]);

  useEffect(() => {
    if (currentUser && selectedCategory && selectedUnit) {
      loadSettings(selectedCategory, selectedUnit);
    }
  }, [currentUser, selectedCategory, selectedUnit, loadSettings]);

  const processCcrDataToChartData = (
    ccrData: CcrParameterData[],
    filterType: IndexFilterType
  ): IndexChartData[] => {
    const chartDataMap = new Map<string, IndexChartData>();

    ccrData.forEach((data) => {
      let label: string;

      switch (filterType) {
        case 'daily':
          label = data.date;
          break;
        case 'monthly':
          label = data.date.substring(0, 7);
          break;
        case 'yearly':
          label = data.date.substring(0, 4);
          break;
        case 'range':
          label = data.date;
          break;
        default:
          label = data.date;
      }

      const hourlyValues = Object.values(data.hourly_values).filter(
        (val) => typeof val === 'number'
      ) as number[];
      const avgValue =
        hourlyValues.length > 0
          ? hourlyValues.reduce((sum, val) => sum + val, 0) / hourlyValues.length
          : 0;

      if (!chartDataMap.has(label)) {
        chartDataMap.set(label, { label, LOI: 0, BTL: 0, SO3: 0, H2O: 0 });
      }

      const chartData = chartDataMap.get(label)!;
      chartData[data.parameter_id] = avgValue;
    });

    return Array.from(chartDataMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  };

  const fetchAndProcessData = async (filter: IndexFilter): Promise<IndexChartData[]> => {
    try {
      const selectedParamIds = Array.from(selectedParameters);
      const ccrData = await fetchCcrParameterData(selectedParamIds, filter);
      const chartData = processCcrDataToChartData(ccrData, filter.type);
      return chartData;
    } catch (error) {
      console.error('Failed to fetch and process data:', error);
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
      const result = await fetchAndProcessData(filter);
      setData(result);
    } catch (err: any) {
      setError('Gagal mengambil data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Filter Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            {t.filter_data || 'Filter Data'}
          </h3>
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            {t.filter || 'Filter'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t.filter_type || 'Tipe Filter'}
              </label>
              <select
                value={filterType}
                onChange={handleFilterChange}
                className="block w-full pl-4 pr-10 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-lg shadow-sm transition-colors"
              >
                <option value="daily">{t.daily || 'Harian'}</option>
                <option value="monthly">{t.monthly || 'Bulanan'}</option>
                <option value="yearly">{t.yearly || 'Tahunan'}</option>
                <option value="range">{t.range || 'Rentang'}</option>
              </select>
            </div>

            {filterType === 'daily' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t.date || 'Tanggal'}
                </label>
                <input
                  type="date"
                  name="date"
                  value={filter.date || ''}
                  onChange={handleInputChange}
                  className="block w-full pl-4 pr-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-lg shadow-sm transition-colors"
                />
              </div>
            )}

            {filterType === 'monthly' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t.month || 'Bulan'}
                  </label>
                  <input
                    type="month"
                    name="month"
                    value={filter.month || ''}
                    onChange={handleInputChange}
                    className="block w-full pl-4 pr-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-lg shadow-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t.year || 'Tahun'}
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={filter.year || ''}
                    onChange={handleInputChange}
                    placeholder={t.year || 'Tahun'}
                    className="block w-full pl-4 pr-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-lg shadow-sm transition-colors"
                  />
                </div>
              </>
            )}

            {filterType === 'yearly' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t.year || 'Tahun'}
                </label>
                <input
                  type="number"
                  name="year"
                  value={filter.year || ''}
                  onChange={handleInputChange}
                  placeholder={t.year || 'Tahun'}
                  className="block w-full pl-4 pr-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-lg shadow-sm transition-colors"
                />
              </div>
            )}

            {filterType === 'range' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t.start_date || 'Tanggal Mulai'}
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={filter.startDate || ''}
                    onChange={handleInputChange}
                    className="block w-full pl-4 pr-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-lg shadow-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {t.end_date || 'Tanggal Akhir'}
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={filter.endDate || ''}
                    onChange={handleInputChange}
                    className="block w-full pl-4 pr-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-lg shadow-sm transition-colors"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {loading && (
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t.loading_data || 'Memuat data...'}
                </div>
              )}
              {error && (
                <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                  <svg
                    className="w-5 h-5 mr-2"
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
                  {error}
                </div>
              )}
            </div>

            <EnhancedButton
              type="submit"
              disabled={loading}
              variant="primary"
              size="md"
              className="inline-flex items-center"
              ariaLabel={t.apply_filter || 'Terapkan Filter'}
              loading={loading}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              {t.apply_filter || 'Terapkan Filter'}
            </EnhancedButton>
          </div>
        </form>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {t.parameter_chart || 'Grafik Parameter'}
            </h2>
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 ml-3">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              {t.chart || 'Grafik'}
            </div>
          </div>
          <EnhancedButton
            onClick={openSettings}
            variant="ghost"
            size="sm"
            className="inline-flex items-center"
            ariaLabel={t.parameter_settings || 'Pengaturan Parameter'}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
            </svg>
            {t.settings || 'Pengaturan'}
          </EnhancedButton>
        </div>

        {data.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[600px] h-[450px]">
              <LineChart
                width={Math.max(600, window.innerWidth - 100)}
                height={450}
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ color: '#374151', fontWeight: '600' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
                {availableParameters
                  .filter((param) => selectedParameters.has(param.id))
                  .map((param) => (
                    <Line
                      key={param.id}
                      type="monotone"
                      dataKey={param.id}
                      stroke={param.color}
                      strokeWidth={2}
                      dot={{ fill: param.color, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: param.color, strokeWidth: 2 }}
                      name={param.unit ? `${param.name} (${param.unit})` : param.name}
                    />
                  ))}
              </LineChart>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
            <svg
              className="w-20 h-20 mb-6 opacity-50"
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
            <h3 className="text-xl font-medium mb-3">
              {t.no_data_available || 'Tidak Ada Data Tersedia'}
            </h3>
            <p className="text-center text-sm max-w-md">
              {t.no_data_for_selected_filter || 'Tidak ada data untuk filter yang dipilih.'}
            </p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                Pilih Parameter
              </h3>
              <EnhancedButton
                onClick={() => setShowSettings(false)}
                variant="ghost"
                size="sm"
                className="p-2"
                ariaLabel="Close settings modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </EnhancedButton>
            </div>

            <div className="space-y-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Pilih parameter dari{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  Plant Operations → Master Data → Parameter Settings
                </strong>{' '}
                yang sesuai dengan{' '}
                <strong className="text-red-600">Plant Category: {selectedCategory}</strong> dan{' '}
                <strong className="text-red-600">Plant Unit: {selectedUnit}</strong>:
              </p>

              {currentUser?.role === 'Super Admin' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-6 h-6 text-amber-500 flex-shrink-0"
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
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        {t.super_admin_mode || 'Mode Super Admin'}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        {t.super_admin_global_settings_info ||
                          'Pengaturan ini akan diterapkan ke semua pengguna.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {parameterLoading ? (
                <div className="text-center py-8">
                  <div className="text-slate-500 mb-3">Memuat parameter...</div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                </div>
              ) : availableParameters.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-slate-500">
                    Tidak ada parameter tersedia untuk Plant Category &quot;{selectedCategory}&quot;
                    dan Plant Unit &quot;{selectedUnit}&quot;.
                    <br />
                    Silahkan tambahkan parameter di Master Data → Parameter Settings.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableParameters.map((param) => (
                    <label
                      key={param.id}
                      className="flex items-center space-x-4 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border border-slate-200 dark:border-slate-600"
                    >
                      <input
                        type="checkbox"
                        checked={selectedParameters.has(param.id)}
                        onChange={() => handleParameterToggle(param.id)}
                        className="w-5 h-5 text-red-600 rounded border-slate-300 focus:ring-red-500"
                      />
                      <div className="flex items-center space-x-3 flex-1">
                        <div
                          className="w-5 h-5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: param.color }}
                        ></div>
                        <div className="flex-1">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {param.name}
                          </span>
                          {param.unit && (
                            <span className="text-slate-500 text-sm ml-2">({param.unit})</span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <EnhancedButton
                onClick={() => setShowSettings(false)}
                variant="ghost"
                size="md"
                ariaLabel={t.cancel_button || 'Batal'}
              >
                {t.cancel_button || 'Batal'}
              </EnhancedButton>
              {currentUser?.role === 'Super Admin' ? (
                <EnhancedButton
                  onClick={handleSaveGlobalSettings}
                  variant="primary"
                  size="md"
                  className="flex items-center space-x-2"
                  ariaLabel={t.apply_to_all_users || 'Terapkan ke Semua User'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span>{t.apply_to_all_users || 'Terapkan ke Semua User'}</span>
                </EnhancedButton>
              ) : (
                <EnhancedButton
                  onClick={() => setShowSettings(false)}
                  variant="primary"
                  size="md"
                  ariaLabel={t.apply_button || 'Terapkan'}
                >
                  {t.apply_button || 'Terapkan'}
                </EnhancedButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndexTab;
