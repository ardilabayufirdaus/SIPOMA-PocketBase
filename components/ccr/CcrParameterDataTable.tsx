import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ParameterSetting, CcrParameterData, ParameterDataType } from '../../types';

interface CcrParameterDataTableProps {
  t: any;
  loading: boolean;
  filteredParameterSettings: ParameterSetting[];
  parameterDataMap: Map<string, CcrParameterData>;
  savingParameterId: string | null;
  handleParameterDataChange: (parameterId: string, hour: number, value: string) => void;
  getInputRef: (table: 'silo' | 'parameter', row: number, col: number) => string;
  setInputRef: (key: string, element: HTMLInputElement | null) => void;
  handleKeyDown: (
    e: React.KeyboardEvent,
    table: 'silo' | 'parameter',
    currentRow: number,
    currentCol: number
  ) => void;
  shouldHighlightColumn: (param: ParameterSetting) => boolean;
  formatInputValue: (value: number | string | null | undefined, precision?: number) => string;
  parseInputValue: (value: string) => number | null;
  formatStatValue: (value: number | undefined, precision?: number) => string;
  parameterShiftFooterData: any;
  parameterFooterData: any;
}

const CcrParameterDataTable: React.FC<CcrParameterDataTableProps> = React.memo(
  ({
    t,
    loading,
    filteredParameterSettings,
    parameterDataMap,
    savingParameterId,
    handleParameterDataChange,
    getInputRef,
    setInputRef,
    handleKeyDown,
    shouldHighlightColumn,
    formatInputValue,
    parseInputValue,
    formatStatValue,
    parameterShiftFooterData,
    parameterFooterData,
  }) => {
    // Virtual scrolling state
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(600);
    const rowHeight = 48; // Approximate height per row
    const visibleRows = Math.ceil(containerHeight / rowHeight) + 2; // Add buffer
    const totalRows = 24;
    
    // Calculate visible range
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 1);
    const endRow = Math.min(totalRows - 1, startRow + visibleRows);
    const visibleHours = useMemo(() => 
      Array.from({ length: endRow - startRow + 1 }, (_, i) => startRow + i + 1),
      [startRow, endRow]
    );
    
    // Handle scroll
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    };

    // Calculate total height for virtual scrolling
    const totalHeight = totalRows * rowHeight;

    // Update container height on mount
    useEffect(() => {
      const updateHeight = () => {
        const viewportHeight = window.innerHeight;
        setContainerHeight(Math.min(600, viewportHeight * 0.6)); // 60% of viewport, max 600px
      };
      
      updateHeight();
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }, []);
    const getShiftForHour = (h: number) => {
      if (h >= 1 && h <= 7) return `${t.shift_3} (${t.shift_3_cont})`;
      if (h >= 8 && h <= 15) return t.shift_1;
      if (h >= 16 && h <= 22) return t.shift_2;
      return t.shift_3;
    };

    // Helper function to determine precision based on unit
    const getPrecisionForUnit = (unit: string): number => {
      if (!unit) return 1;

      // Units that typically need 2 decimal places
      const highPrecisionUnits = ['bar', 'psi', 'kPa', 'MPa', 'm³/h', 'kg/h', 't/h', 'L/h', 'mL/h'];
      // Units that typically need 1 decimal place
      const mediumPrecisionUnits = ['°C', '°F', '°K', '%', 'kg', 'ton', 'm³', 'L', 'mL'];
      // Units that typically need 0 decimal places (whole numbers)
      const lowPrecisionUnits = ['unit', 'pcs', 'buah', 'batch', 'shift'];

      const lowerUnit = unit.toLowerCase();

      if (highPrecisionUnits.some((u) => lowerUnit.includes(u.toLowerCase()))) {
        return 2;
      }
      if (mediumPrecisionUnits.some((u) => lowerUnit.includes(u.toLowerCase()))) {
        return 1;
      }
      if (lowPrecisionUnits.some((u) => lowerUnit.includes(u.toLowerCase()))) {
        return 0;
      }

      // Default to 1 decimal place for unknown units
      return 1;
    };

    return (
      <div className="backdrop-blur-md bg-white/10 dark:bg-slate-800/10 border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
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
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                {t.ccr_parameter_data_entry_title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Input data parameter CCR per jam
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
              <span>↑↓←→/Tab navigasi, Esc keluar</span>
            </div>
            <button
              onClick={() => {}}
              className="px-3 py-2 text-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              title="Show navigation help"
            >
              ? Help
            </button>
          </div>
        </div>

        {/* Column Search Filter and Export/Import controls should be handled outside this component */}

        {loading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-center py-16"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"
            ></motion.div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="ml-3 text-slate-600 dark:text-slate-400 font-medium"
            >
              Loading parameter data...
            </motion.span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="ccr-table-container overflow-x-auto rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner"
            role="grid"
            aria-label="Parameter Data Entry Table"
            style={{ height: containerHeight }}
            onScroll={handleScroll}
          >
            <div className="ccr-table-wrapper min-w-[600px]">
              <table className="ccr-table text-xs" role="grid">
                <colgroup>
                  <col style={{ width: '90px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '200px' }} />
                  {filteredParameterSettings.map((_, index) => (
                    <col key={index} style={{ width: '100px' }} />
                  ))}
                </colgroup>
                <thead
                  className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white sticky top-0 z-20 shadow-lg"
                  role="rowgroup"
                >
                  <tr className="border-b border-orange-300/30" role="row">
                    <th
                      className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-orange-300/30 sticky left-0 bg-gradient-to-r from-orange-500 to-red-500 z-30 shadow-md"
                      style={{ width: '90px' }}
                      role="columnheader"
                      scope="col"
                    >
                      {t.hour}
                    </th>
                    <th
                      className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-orange-300/30 sticky left-24 bg-gradient-to-r from-orange-500 to-red-500 z-30 shadow-md"
                      style={{ width: '140px' }}
                      role="columnheader"
                      scope="col"
                    >
                      {t.shift}
                    </th>
                    <th
                      className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-orange-300/30 sticky left-56 bg-gradient-to-r from-orange-500 to-red-500 z-30 shadow-md"
                      style={{ width: '200px' }}
                      role="columnheader"
                      scope="col"
                    >
                      {t.name}
                    </th>
                    {filteredParameterSettings.map((param) => (
                      <th
                        key={param.id}
                        className={`px-3 py-4 text-xs font-bold border-r border-orange-300/30 text-center transition-all duration-200 ${
                          shouldHighlightColumn(param)
                            ? 'bg-gradient-to-b from-yellow-400/20 to-orange-500/20 ring-2 ring-yellow-400/50'
                            : ''
                        }`}
                        style={{ width: '100px', minWidth: '100px' }}
                        role="columnheader"
                        scope="col"
                      >
                        <div className="text-center">
                          <div className="font-bold text-[8px] leading-tight uppercase tracking-wider text-white">
                            {param.parameter}
                          </div>
                          <div className="font-normal normal-case text-[10px] text-orange-100 mt-1 opacity-90">
                            ({param.unit})
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                  role="rowgroup"
                  style={{ height: totalHeight }}
                >
                  {/* Spacer for virtual scrolling */}
                  <tr style={{ height: startRow * rowHeight }} />
                  
                  {filteredParameterSettings.length > 0 ? (
                    visibleHours.map((hour) => (
                      <tr
                        key={hour}
                        className={`border-b border-slate-200/50 dark:border-slate-700/50 group transition-all duration-200 ${
                          hour % 2 === 0
                            ? 'bg-slate-50/30 dark:bg-slate-700/30'
                            : 'bg-white/60 dark:bg-slate-800/60'
                        } hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/30 dark:hover:from-orange-900/20 dark:hover:to-red-900/20 hover:shadow-md hover:scale-[1.002] transform`}
                        role="row"
                      >
                        <td
                          className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200/50 dark:border-slate-700/50 sticky left-0 bg-white/90 dark:bg-slate-800/90 group-hover:bg-orange-50/80 dark:group-hover:bg-orange-900/30 z-30 shadow-sm transition-all duration-200"
                          style={{ width: '90px' }}
                          role="gridcell"
                        >
                          <div className="flex items-center justify-center h-8">
                            <span className="bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-300 dark:to-slate-400 bg-clip-text text-transparent font-bold">
                              {String(hour).padStart(2, '0')}:00
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200/50 dark:border-slate-700/50 sticky left-24 bg-white/90 dark:bg-slate-800/90 group-hover:bg-orange-50/80 dark:group-hover:bg-orange-900/30 z-30 shadow-sm transition-all duration-200"
                          style={{ width: '140px' }}
                          role="gridcell"
                        >
                          <div className="flex items-center h-8">
                            <span className="bg-gradient-to-r from-slate-600 to-slate-500 dark:from-slate-400 dark:to-slate-500 bg-clip-text text-transparent">
                              {getShiftForHour(hour)}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-800 dark:text-slate-200 border-r border-slate-200/50 dark:border-slate-700/50 sticky left-56 bg-white/90 dark:bg-slate-800/90 group-hover:bg-orange-50/80 dark:group-hover:bg-orange-900/30 z-30 overflow-hidden text-ellipsis shadow-sm transition-all duration-200"
                          style={{ width: '200px' }}
                          role="gridcell"
                        >
                          <div className="flex items-center h-8">
                            {(() => {
                              const filledParam = filteredParameterSettings.find((param) => {
                                const paramData = parameterDataMap.get(param.id);
                                if (!paramData?.hourly_values?.[hour]) return false;
                                const hourData = paramData.hourly_values[hour] as any;
                                if (!hourData || typeof hourData !== 'object') return false;
                                return (
                                  'value' in hourData &&
                                  hourData.value !== undefined &&
                                  hourData.value !== ''
                                );
                              });
                              if (filledParam) {
                                const paramData = parameterDataMap.get(filledParam.id);
                                const hourData = paramData?.hourly_values?.[hour] as any;
                                const userName =
                                  hourData &&
                                  typeof hourData === 'object' &&
                                  hourData !== null &&
                                  'user_name' in hourData
                                    ? String(hourData.user_name || '')
                                    : '';
                                return (
                                  <span className="truncate" title={userName}>
                                    {userName}
                                  </span>
                                );
                              }
                              return <span className="text-slate-400 italic">-</span>;
                            })()}
                          </div>
                        </td>
                        {filteredParameterSettings.map((param, paramIndex) => {
                          const value = parameterDataMap.get(param.id)?.hourly_values[hour] ?? '';
                          const isCurrentlySaving = savingParameterId === param.id;

                          return (
                            <td
                              key={param.id}
                              className={`p-2 border-r border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 group-hover:bg-orange-50/40 dark:group-hover:bg-orange-900/20 relative transition-all duration-200 ${
                                shouldHighlightColumn(param)
                                  ? 'ring-2 ring-yellow-400/30 bg-yellow-50/50 dark:bg-yellow-900/20'
                                  : ''
                              }`}
                              style={{ width: '160px', minWidth: '160px' }}
                              role="gridcell"
                            >
                              <div className="relative">
                                <input
                                  ref={(el) => {
                                    const refKey = getInputRef('parameter', hour - 1, paramIndex);
                                    setInputRef(refKey, el);
                                  }}
                                  type={
                                    param.data_type === ParameterDataType.NUMBER ? 'text' : 'text'
                                  }
                                  defaultValue={
                                    param.data_type === ParameterDataType.NUMBER
                                      ? formatInputValue(value, getPrecisionForUnit(param.unit))
                                      : value
                                  }
                                  onChange={(e) => {
                                    if (param.data_type === ParameterDataType.NUMBER) {
                                      const parsed = parseInputValue(e.target.value);
                                      handleParameterDataChange(
                                        param.id,
                                        hour,
                                        parsed !== null ? parsed.toString() : ''
                                      );
                                    } else {
                                      handleParameterDataChange(param.id, hour, e.target.value);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    if (param.data_type === ParameterDataType.NUMBER) {
                                      const parsed = parseInputValue(e.target.value);
                                      if (parsed !== null) {
                                        e.target.value = formatInputValue(
                                          parsed,
                                          getPrecisionForUnit(param.unit)
                                        );
                                      }
                                    }
                                  }}
                                  onKeyDown={(e) =>
                                    handleKeyDown(e, 'parameter', hour - 1, paramIndex)
                                  }
                                  disabled={isCurrentlySaving}
                                  className={`w-full text-center px-1 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-white hover:bg-slate-50 text-slate-800 transition-all duration-200 text-xs ${
                                    isCurrentlySaving
                                      ? 'opacity-50 cursor-not-allowed bg-slate-100'
                                      : ''
                                  }`}
                                  style={{
                                    fontSize: '11px',
                                    minHeight: '24px',
                                    maxWidth: '120px',
                                  }}
                                  aria-label={`Parameter ${param.parameter} jam ${hour}`}
                                  title={`Isi data parameter ${param.parameter} untuk jam ${hour}`}
                                  placeholder={
                                    param.data_type === ParameterDataType.NUMBER
                                      ? '0,0'
                                      : 'Enter text'
                                  }
                                />
                                {isCurrentlySaving && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded">
                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          3 +
                          (filteredParameterSettings.length > 0
                            ? filteredParameterSettings.length
                            : 0)
                        }
                        className="text-center py-10 text-slate-500"
                      >
                        {!filteredParameterSettings.length
                          ? 'No parameters available.'
                          : 'No data available.'}
                      </td>
                    </tr>
                  )}
                  
                  {/* Spacer for virtual scrolling */}
                  <tr style={{ height: (totalRows - endRow - 1) * rowHeight }} />
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    );
  }
);
CcrParameterDataTable.displayName = 'CcrParameterDataTable';

export default CcrParameterDataTable;
