import React from 'react';
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
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow space-y-3">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1 truncate">
            {t.ccr_parameter_data_entry_title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>↑↓←→/Tab navigasi, Esc keluar</span>
            </div>
            <button
              onClick={() => {}}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              title="Show navigation help"
            >
              ? Help
            </button>
          </div>
        </div>

        {/* Column Search Filter and Export/Import controls should be handled outside this component */}

        {loading ? (
          <div className="text-center py-10 text-slate-500 animate-pulse">Loading data...</div>
        ) : (
          <div
            className="ccr-table-container overflow-x-auto"
            role="grid"
            aria-label="Parameter Data Entry Table"
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
                <thead className="bg-slate-50 text-center sticky top-0 z-20" role="rowgroup">
                  <tr className="border-b" role="row">
                    <th
                      className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r sticky left-0 bg-slate-50 z-30 sticky-col-header"
                      style={{ width: '90px' }}
                      role="columnheader"
                      scope="col"
                    >
                      {t.hour}
                    </th>
                    <th
                      className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r sticky left-24 bg-slate-50 z-30 sticky-col-header"
                      style={{ width: '140px' }}
                      role="columnheader"
                      scope="col"
                    >
                      {t.shift}
                    </th>
                    <th
                      className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-r sticky left-56 bg-slate-50 z-30 sticky-col-header"
                      style={{ width: '200px' }}
                      role="columnheader"
                      scope="col"
                    >
                      {t.name}
                    </th>
                    {filteredParameterSettings.map((param) => (
                      <th
                        key={param.id}
                        className={`px-2 py-3 text-xs font-semibold text-slate-600 border-r text-center ${
                          shouldHighlightColumn(param) ? 'filtered-column' : ''
                        }`}
                        style={{ width: '100px', minWidth: '100px' }}
                        role="columnheader"
                        scope="col"
                      >
                        <div className="text-center">
                          <div className="font-bold text-[8px] leading-tight uppercase tracking-wider">
                            {param.parameter}
                          </div>
                          <div className="font-normal normal-case text-[10px] text-slate-500 mt-1">
                            ({param.unit})
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white" role="rowgroup">
                  {filteredParameterSettings.length > 0 ? (
                    Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
                      <tr
                        key={hour}
                        className={`border-b group ${
                          hour % 2 === 0 ? 'bg-slate-25' : 'bg-white'
                        } hover:bg-slate-100 transition-colors duration-200`}
                        role="row"
                      >
                        <td
                          className="px-3 py-2 whitespace-nowrap text-sm font-medium text-slate-900 border-r sticky left-0 bg-white group-hover:bg-slate-100 z-30 sticky-col"
                          style={{ width: '90px' }}
                          role="gridcell"
                        >
                          <div className="flex items-center justify-center h-8">
                            {String(hour).padStart(2, '0')}:00
                          </div>
                        </td>
                        <td
                          className="px-3 py-2 whitespace-nowrap text-xs text-slate-600 border-r sticky left-24 bg-white group-hover:bg-slate-100 z-30 sticky-col"
                          style={{ width: '140px' }}
                          role="gridcell"
                        >
                          <div className="flex items-center h-8">{getShiftForHour(hour)}</div>
                        </td>
                        <td
                          className="px-3 py-2 whitespace-nowrap text-xs text-slate-800 border-r sticky left-56 bg-white group-hover:bg-slate-100 z-30 overflow-hidden text-ellipsis sticky-col"
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
                              className={`p-1 border-r bg-white relative ${
                                shouldHighlightColumn(param) ? 'filtered-column' : ''
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
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }
);
CcrParameterDataTable.displayName = 'CcrParameterDataTable';

export default CcrParameterDataTable;
