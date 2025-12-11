import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ParameterSetting, CcrParameterData, ParameterDataType } from '../../types';

interface CcrParameterDataTableProps {
  t: Record<string, string>;
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
  parameterShiftFooterData: Record<string, Record<string, number | undefined>>;
  parameterFooterData: Record<string, Record<string, number | undefined>>;
  currentUserName?: string;
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
    // formatStatValue, parameterShiftFooterData, parameterFooterData - passed for future use
    currentUserName,
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
    const visibleHours = useMemo(
      () => Array.from({ length: endRow - startRow + 1 }, (_, i) => startRow + i + 1),
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

    // Helper function to determine color based on value vs min/max
    const getValueColor = (
      value: string | number | null | undefined,
      minValue: number | undefined,
      maxValue: number | undefined
    ): { bgClass: string; textClass: string; borderClass: string } => {
      // Default styling (no color)
      const defaultStyle = {
        bgClass: 'bg-white',
        textClass: 'text-slate-800',
        borderClass: 'border-slate-300',
      };

      // If no value or empty string, return default
      if (value === null || value === undefined || value === '') {
        return defaultStyle;
      }

      // Parse value to number
      const numValue =
        typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '.'));

      // If not a valid number, return default
      if (isNaN(numValue)) {
        return defaultStyle;
      }

      // If both min and max are undefined, return default
      if (minValue === undefined && maxValue === undefined) {
        return defaultStyle;
      }

      // Check if value is out of range (red)
      const isBelowMin = minValue !== undefined && numValue < minValue;
      const isAboveMax = maxValue !== undefined && numValue > maxValue;

      if (isBelowMin || isAboveMax) {
        return {
          bgClass: 'bg-red-100',
          textClass: 'text-red-800 font-semibold',
          borderClass: 'border-red-400',
        };
      }

      // Value is within range (green)
      const hasMinOrMax = minValue !== undefined || maxValue !== undefined;
      if (hasMinOrMax) {
        return {
          bgClass: 'bg-green-100',
          textClass: 'text-green-800 font-semibold',
          borderClass: 'border-green-400',
        };
      }

      return defaultStyle;
    };

    return (
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-blue-500 flex items-center justify-center">
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
              <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                {t.ccr_parameter_data_entry_title}
              </h3>
              <p className="text-sm text-slate-600">Input data parameter CCR per jam</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
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
              className="ml-3 text-slate-600 font-medium"
            >
              Loading parameter data...
            </motion.span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="ccr-table-container overflow-x-auto rounded-xl border border-slate-200/50 shadow-inner"
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
                <thead className="sticky top-0 z-20 shadow-lg" role="rowgroup">
                  {/* Main Header Row */}
                  <tr
                    className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600"
                    role="row"
                  >
                    <th
                      className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider border-r border-white/20 sticky left-0 bg-gradient-to-br from-slate-800 via-slate-700 to-indigo-800 z-30 shadow-lg"
                      style={{ width: '90px' }}
                      role="columnheader"
                      scope="col"
                      rowSpan={2}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-white font-semibold">{t.hour}</span>
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider border-r border-white/20 sticky left-24 bg-gradient-to-br from-slate-800 via-slate-700 to-indigo-800 z-30 shadow-lg"
                      style={{ width: '140px' }}
                      role="columnheader"
                      scope="col"
                      rowSpan={2}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-white font-semibold">{t.shift}</span>
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider border-r border-white/20 sticky left-56 bg-gradient-to-br from-slate-800 via-slate-700 to-indigo-800 z-30 shadow-lg"
                      style={{ width: '200px' }}
                      role="columnheader"
                      scope="col"
                      rowSpan={2}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-white font-semibold">{t.name}</span>
                      </div>
                    </th>
                    {filteredParameterSettings.map((param, idx) => (
                      <th
                        key={param.id}
                        className={`px-3 py-2 text-xs font-bold border-r border-white/20 text-center transition-all duration-200 ${
                          idx % 4 === 0
                            ? 'bg-gradient-to-b from-indigo-500 to-indigo-600'
                            : idx % 4 === 1
                              ? 'bg-gradient-to-b from-purple-500 to-purple-600'
                              : idx % 4 === 2
                                ? 'bg-gradient-to-b from-violet-500 to-violet-600'
                                : 'bg-gradient-to-b from-fuchsia-500 to-fuchsia-600'
                        } ${
                          shouldHighlightColumn(param) ? 'ring-2 ring-yellow-400/50 ring-inset' : ''
                        }`}
                        style={{ width: '100px', minWidth: '100px' }}
                        role="columnheader"
                        scope="col"
                      >
                        <div className="text-center">
                          <div className="font-bold text-[9px] leading-tight uppercase tracking-wide text-white drop-shadow-sm">
                            {param.parameter}
                          </div>
                          <div className="font-medium normal-case text-[10px] text-white/80 mt-0.5">
                            ({param.unit})
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                  {/* Min/Max Sub-Header Row */}
                  <tr
                    className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700"
                    role="row"
                  >
                    {filteredParameterSettings.map((param, idx) => (
                      <th
                        key={`minmax-${param.id}`}
                        className={`px-2 py-1.5 text-center border-r border-white/10 ${
                          idx % 4 === 0
                            ? 'bg-indigo-700/80'
                            : idx % 4 === 1
                              ? 'bg-purple-700/80'
                              : idx % 4 === 2
                                ? 'bg-violet-700/80'
                                : 'bg-fuchsia-700/80'
                        }`}
                        style={{ width: '100px', minWidth: '100px' }}
                      >
                        <div className="flex items-center justify-center gap-2 text-[9px]">
                          <span className="text-cyan-300 font-medium">
                            Min: {param.min_value ?? '-'}
                          </span>
                          <span className="text-white/40">|</span>
                          <span className="text-amber-300 font-medium">
                            Max: {param.max_value ?? '-'}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  className="bg-white/80 backdrop-blur-sm"
                  role="rowgroup"
                  style={{ height: totalHeight }}
                >
                  {/* Spacer for virtual scrolling */}
                  <tr style={{ height: startRow * rowHeight }} />

                  {filteredParameterSettings.length > 0 ? (
                    visibleHours.map((hour) => (
                      <tr
                        key={hour}
                        className={`border-b border-slate-200/50 group transition-all duration-200 ${
                          hour % 2 === 0 ? 'bg-slate-50/30' : 'bg-white/60'
                        } hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-blue-50/30 hover:shadow-md hover:scale-[1.002] transform`}
                        role="row"
                      >
                        <td
                          className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-900 border-r border-slate-200/50 sticky left-0 bg-white/90 group-hover:bg-orange-50/80 z-30 shadow-sm transition-all duration-200"
                          style={{ width: '90px' }}
                          role="gridcell"
                        >
                          <div className="flex items-center justify-center h-8">
                            <span className="bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent font-bold">
                              {String(hour).padStart(2, '0')}:00
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-700 border-r border-slate-200/50 sticky left-24 bg-white/90 group-hover:bg-orange-50/80 z-30 shadow-sm transition-all duration-200"
                          style={{ width: '140px' }}
                          role="gridcell"
                        >
                          <div className="flex items-center h-8">
                            <span className="bg-gradient-to-r from-slate-600 to-slate-500 bg-clip-text text-transparent">
                              {getShiftForHour(hour)}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-800 border-r border-slate-200/50 sticky left-56 bg-white/90 group-hover:bg-orange-50/80 z-30 overflow-hidden text-ellipsis shadow-sm transition-all duration-200"
                          style={{ width: '200px' }}
                          role="gridcell"
                        >
                          <div className="flex items-center h-8">
                            {(() => {
                              const filledParam = filteredParameterSettings.find((param) => {
                                const paramData = parameterDataMap.get(param.id);
                                if (!paramData?.hourly_values?.[hour]) return false;
                                const hourData = paramData.hourly_values[hour];
                                return (
                                  hourData !== undefined && hourData !== '' && hourData !== null
                                );
                              });

                              if (filledParam) {
                                const paramData = parameterDataMap.get(filledParam.id);
                                const hourData = paramData?.hourly_values?.[hour];

                                // Extract user_name from data
                                let userName = currentUserName || 'Unknown User';
                                if (
                                  hourData &&
                                  typeof hourData === 'object' &&
                                  'user_name' in hourData
                                ) {
                                  userName = hourData.user_name;
                                }

                                return (
                                  <span
                                    className="truncate font-medium text-slate-700"
                                    title={userName}
                                  >
                                    {userName}
                                  </span>
                                );
                              }
                              return <span className="text-slate-400 italic">-</span>;
                            })()}
                          </div>
                        </td>
                        {filteredParameterSettings.map((param, paramIndex) => {
                          const hourData = parameterDataMap.get(param.id)?.hourly_values?.[hour];

                          // Extract value based on data format
                          let value = '';
                          if (hourData !== undefined && hourData !== null) {
                            if (typeof hourData === 'object' && 'value' in hourData) {
                              // New format with user tracking
                              value = String(hourData.value);
                            } else {
                              // Legacy format (direct value)
                              value = String(hourData);
                            }
                          }

                          const isCurrentlySaving = savingParameterId === param.id;

                          // Get color styling based on value vs min/max
                          const valueColor = getValueColor(value, param.min_value, param.max_value);

                          return (
                            <td
                              key={param.id}
                              className={`p-2 border-r border-slate-200/50 relative transition-all duration-200 ${valueColor.bgClass} ${
                                shouldHighlightColumn(param) ? 'ring-2 ring-yellow-400/30' : ''
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
                                  className={`w-full text-center px-1 py-1 border rounded focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-transparent transition-all duration-200 text-xs ${valueColor.textClass} ${valueColor.borderClass} ${
                                    isCurrentlySaving ? 'opacity-50 cursor-not-allowed' : ''
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
                        })}
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
