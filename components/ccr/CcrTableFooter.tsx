import React, { useEffect, useRef } from 'react';
import { ParameterSetting } from '../../types';

interface CcrTableFooterProps {
  filteredParameterSettings: ParameterSetting[];
  parameterShiftFooterData: any;
  parameterShiftAverageData: any;
  parameterShiftCounterData: any;
  parameterFooterData: any;
  formatStatValue: (value: number) => string;
  t: any;
  mainTableScrollElement?: HTMLElement | null;
}

const CcrTableFooter: React.FC<CcrTableFooterProps> = ({
  filteredParameterSettings,
  parameterShiftFooterData,
  parameterShiftAverageData,
  parameterShiftCounterData,
  parameterFooterData,
  formatStatValue,
  t,
  mainTableScrollElement,
}) => {
  const footerRef = useRef<HTMLDivElement>(null);

  // Sync horizontal scroll between main table and footer
  useEffect(() => {
    if (!mainTableScrollElement || !footerRef.current) return;

    const handleMainTableScroll = () => {
      if (footerRef.current) {
        footerRef.current.scrollLeft = mainTableScrollElement.scrollLeft;
      }
    };

    mainTableScrollElement.addEventListener('scroll', handleMainTableScroll);

    return () => {
      mainTableScrollElement.removeEventListener('scroll', handleMainTableScroll);
    };
  }, [mainTableScrollElement]);

  if (filteredParameterSettings.length === 0) return null;

  const footerRows = [
    {
      label: t.total_shift_3_cont,
      data: parameterShiftFooterData.shift3Cont,
      type: 'total',
      shift: '3cont',
    },
    {
      label: t.average_shift_3_cont,
      data: parameterShiftAverageData.shift3Cont,
      type: 'average',
      shift: '3cont',
    },
    {
      label: t.total_shift_1,
      data: parameterShiftFooterData.shift1,
      type: 'total',
      shift: '1',
    },
    {
      label: t.average_shift_1,
      data: parameterShiftAverageData.shift1,
      type: 'average',
      shift: '1',
    },
    {
      label: t.total_shift_2,
      data: parameterShiftFooterData.shift2,
      type: 'total',
      shift: '2',
    },
    {
      label: t.average_shift_2,
      data: parameterShiftAverageData.shift2,
      type: 'average',
      shift: '2',
    },
    {
      label: t.total_shift_3,
      data: parameterShiftFooterData.shift3,
      type: 'total',
      shift: '3',
    },
    {
      label: t.average_shift_3,
      data: parameterShiftAverageData.shift3,
      type: 'average',
      shift: '3',
    },
    {
      label: 'Counter Shift 3 (Cont.)',
      data: parameterShiftCounterData.shift3Cont,
      type: 'counter',
      shift: '3cont',
    },
    {
      label: 'Counter Shift 1',
      data: parameterShiftCounterData.shift1,
      type: 'counter',
      shift: '1',
    },
    {
      label: 'Counter Shift 2',
      data: parameterShiftCounterData.shift2,
      type: 'counter',
      shift: '2',
    },
    {
      label: 'Counter Shift 3',
      data: parameterShiftCounterData.shift3,
      type: 'counter',
      shift: '3',
    },
    {
      label: t.total,
      data: parameterFooterData,
      dataKey: 'total',
      type: 'summary',
      shift: 'all',
    },
    {
      label: t.average,
      data: parameterFooterData,
      dataKey: 'avg',
      type: 'summary',
      shift: 'all',
    },
    {
      label: t.min,
      data: parameterFooterData,
      dataKey: 'min',
      type: 'summary',
      shift: 'all',
    },
    {
      label: t.max,
      data: parameterFooterData,
      dataKey: 'max',
      type: 'summary',
      shift: 'all',
    },
  ];

  // Get row styling based on type
  const getRowStyle = (type: string, shift: string) => {
    // Total rows - darker background
    if (type === 'total') {
      if (shift === '3cont') return 'bg-indigo-100 hover:bg-indigo-200/80';
      if (shift === '1') return 'bg-blue-100 hover:bg-blue-200/80';
      if (shift === '2') return 'bg-sky-100 hover:bg-sky-200/80';
      if (shift === '3') return 'bg-cyan-100 hover:bg-cyan-200/80';
    }
    // Average rows - lighter background
    if (type === 'average') {
      if (shift === '3cont') return 'bg-indigo-50 hover:bg-indigo-100/80';
      if (shift === '1') return 'bg-blue-50 hover:bg-blue-100/80';
      if (shift === '2') return 'bg-sky-50 hover:bg-sky-100/80';
      if (shift === '3') return 'bg-cyan-50 hover:bg-cyan-100/80';
    }
    // Counter rows - amber/yellow tones
    if (type === 'counter') {
      return 'bg-amber-50 hover:bg-amber-100/80';
    }
    // Summary rows - slate/gray tones
    if (type === 'summary') {
      return 'bg-slate-100 hover:bg-slate-200/80';
    }
    return 'bg-white hover:bg-slate-50';
  };

  // Get label cell styling based on type
  const getLabelStyle = (type: string, shift: string) => {
    if (type === 'total') {
      if (shift === '3cont') return 'bg-indigo-600 text-white';
      if (shift === '1') return 'bg-blue-600 text-white';
      if (shift === '2') return 'bg-sky-600 text-white';
      if (shift === '3') return 'bg-cyan-600 text-white';
    }
    if (type === 'average') {
      if (shift === '3cont') return 'bg-indigo-500 text-white';
      if (shift === '1') return 'bg-blue-500 text-white';
      if (shift === '2') return 'bg-sky-500 text-white';
      if (shift === '3') return 'bg-cyan-500 text-white';
    }
    if (type === 'counter') {
      return 'bg-amber-500 text-white';
    }
    if (type === 'summary') {
      return 'bg-slate-700 text-white';
    }
    return 'bg-slate-600 text-white';
  };

  // Get data cell text color based on type
  const getDataCellStyle = (type: string) => {
    if (type === 'total') return 'text-slate-900 font-bold';
    if (type === 'average') return 'text-slate-700 font-semibold';
    if (type === 'counter') return 'text-amber-800 font-semibold';
    if (type === 'summary') return 'text-slate-800 font-bold';
    return 'text-slate-700';
  };

  return (
    <>
      {/* Footer Header - Matching main table header style */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-t-xl shadow-lg px-4 py-3 mt-4 border-b-2 border-indigo-500/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-white drop-shadow-sm">Data Summary & Statistics</h4>
        </div>
      </div>
      {/* Footer Table */}
      <div
        className="ccr-footer-scroll-wrapper overflow-x-auto rounded-b-xl border border-slate-200 border-t-0 shadow-lg"
        ref={footerRef}
        style={{ overflowX: 'hidden' }}
      >
        <table
          className="ccr-table text-xs"
          style={{
            marginBottom: 0,
            tableLayout: 'fixed',
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <colgroup>
            <col style={{ width: '60px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '180px' }} />
            {filteredParameterSettings.map((_, index) => (
              <col key={index} style={{ width: '80px' }} />
            ))}
          </colgroup>
          <tbody role="rowgroup">
            {footerRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-b border-slate-200/70 last:border-b-0 transition-colors duration-150 ${getRowStyle(row.type, row.shift)}`}
                role="row"
              >
                <td
                  colSpan={3}
                  className={`px-4 py-2.5 text-right font-semibold text-xs uppercase tracking-wide border-r border-slate-200/70 sticky left-0 z-30 shadow-md ${getLabelStyle(row.type, row.shift)}`}
                  style={{ width: '320px', minWidth: '320px' }}
                  role="columnheader"
                >
                  {row.label}
                </td>
                {filteredParameterSettings.map((param) => {
                  let value;
                  if (row.dataKey) {
                    const stats = row.data[param.id];
                    value = stats ? stats[row.dataKey] : undefined;
                  } else {
                    value = row.data[param.id];
                  }

                  return (
                    <td
                      key={param.id}
                      className={`px-2 py-2.5 text-center border-r border-slate-200/50 transition-all duration-150 ${getDataCellStyle(row.type)}`}
                      style={{ width: '80px', minWidth: '80px' }}
                      role="gridcell"
                    >
                      {value !== undefined ? formatStatValue(value) : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default CcrTableFooter;
