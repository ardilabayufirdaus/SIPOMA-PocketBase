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
      className: 'border-t-2 border-slate-300',
    },
    {
      label: t.average_shift_3_cont,
      data: parameterShiftAverageData.shift3Cont,
      className: 'bg-slate-50 dark:bg-slate-700',
    },
    {
      label: t.total_shift_1,
      data: parameterShiftFooterData.shift1,
      className: 'border-t border-slate-200',
    },
    {
      label: t.average_shift_1,
      data: parameterShiftAverageData.shift1,
      className: 'bg-slate-50 dark:bg-slate-700',
    },
    {
      label: t.total_shift_2,
      data: parameterShiftFooterData.shift2,
      className: 'border-t border-slate-200',
    },
    {
      label: t.average_shift_2,
      data: parameterShiftAverageData.shift2,
      className: 'bg-slate-50 dark:bg-slate-700',
    },
    {
      label: t.total_shift_3,
      data: parameterShiftFooterData.shift3,
      className: 'border-t border-slate-200',
    },
    {
      label: t.average_shift_3,
      data: parameterShiftAverageData.shift3,
      className: 'bg-slate-50 dark:bg-slate-700',
    },
    {
      label: 'Counter Shift 3 (Cont.)',
      data: parameterShiftCounterData.shift3Cont,
      className: 'border-t-2 border-blue-300 bg-blue-50 dark:bg-blue-900',
    },
    {
      label: 'Counter Shift 1',
      data: parameterShiftCounterData.shift1,
      className: 'border-t border-blue-200 bg-blue-50 dark:bg-blue-900',
    },
    {
      label: 'Counter Shift 2',
      data: parameterShiftCounterData.shift2,
      className: 'border-t border-blue-200 bg-blue-50 dark:bg-blue-900',
    },
    {
      label: 'Counter Shift 3',
      data: parameterShiftCounterData.shift3,
      className: 'border-t border-blue-200 bg-blue-50 dark:bg-blue-900',
    },
    {
      label: t.total,
      data: parameterFooterData,
      dataKey: 'total',
      className: 'border-t-2 border-slate-300',
    },
    {
      label: t.average,
      data: parameterFooterData,
      dataKey: 'avg',
    },
    {
      label: t.min,
      data: parameterFooterData,
      dataKey: 'min',
    },
    {
      label: t.max,
      data: parameterFooterData,
      dataKey: 'max',
    },
  ];

  const getCellStyling = (rowIndex: number) => {
    // Rows with light backgrounds need dark text
    const lightBackgroundRows = [1, 3, 5, 7]; // average rows with bg-slate-50
    const blueBackgroundRows = [8, 9, 10, 11]; // counter rows with bg-blue-50

    if (lightBackgroundRows.includes(rowIndex)) {
      return 'text-slate-800 bg-slate-50/95 dark:text-slate-100 dark:bg-slate-700/95 hover:bg-slate-100/95 dark:hover:bg-slate-600/95';
    } else if (blueBackgroundRows.includes(rowIndex)) {
      return 'text-blue-900 bg-blue-50/95 dark:text-blue-100 dark:bg-blue-900/95 hover:bg-blue-100/95 dark:hover:bg-blue-800/95';
    } else {
      return 'text-slate-800 dark:text-slate-100 bg-white/90 dark:bg-slate-800/90 hover:bg-white/95 dark:hover:bg-slate-700/95';
    }
  };

  return (
    <div className="ccr-table-footer-container bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-xl shadow-2xl border border-emerald-300/30 dark:border-emerald-700/30 p-4 mt-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-slate-900/80 backdrop-blur-sm flex items-center justify-center border border-white/20">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h4 className="text-lg font-bold text-slate-900 drop-shadow-sm bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/30">
          Data Summary & Statistics
        </h4>
      </div>
      <div className="ccr-footer-scroll-wrapper" ref={footerRef}>
        <table
          className="ccr-table text-xs bg-white/20 backdrop-blur-md rounded-lg overflow-hidden shadow-inner border border-white/30"
          style={{ marginBottom: 0 }}
        >
          <colgroup>
            <col style={{ width: '90px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '200px' }} />
            {filteredParameterSettings.map((_, index) => (
              <col key={index} style={{ width: '100px' }} />
            ))}
          </colgroup>
          <tbody role="rowgroup">
            {footerRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`${row.className || ''} border-b border-white/30 last:border-b-0`}
                role="row"
              >
                <td
                  colSpan={3}
                  className="px-4 py-3 text-right font-bold text-slate-900 bg-white/95 backdrop-blur-sm border-r border-white/40 sticky left-0 z-30 shadow-lg"
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
                      className={`px-4 py-3 text-center font-bold border-r border-white/30 transition-all duration-200 backdrop-blur-sm ${getCellStyling(rowIndex)}`}
                      style={{ width: '160px', minWidth: '160px' }}
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
    </div>
  );
};

export default CcrTableFooter;
