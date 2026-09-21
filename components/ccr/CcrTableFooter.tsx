import React, { useEffect, useRef } from 'react';
import { ParameterSetting } from '../../types';

interface CcrTableFooterProps {
  filteredParameterSettings: ParameterSetting[];
  parameterShiftFooterData: Record<string, Record<string, number | undefined>>;
  parameterShiftAverageData: Record<string, Record<string, number | undefined>>;
  parameterShiftCounterData: Record<string, Record<string, number | undefined>>;
  parameterFooterData: Record<string, Record<string, number | undefined>>;
  formatStatValue: (value: number) => string;
  t: Record<string, string>;
  mainTableScrollElement?: HTMLElement | null;
}

interface FooterRowItem {
  badge: string;
  label: string;
  data: Record<string, any>;
  dataKey?: string;
  type: 'total' | 'average' | 'counter' | 'summary';
  shift: string;
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

  // Sync horizontal scroll bidirectionally between main table and footer
  useEffect(() => {
    if (!mainTableScrollElement || !footerRef.current) return;

    const footerEl = footerRef.current;
    let isSyncingMain = false;
    let isSyncingFooter = false;

    const handleMainTableScroll = () => {
      if (isSyncingMain) {
        isSyncingMain = false;
        return;
      }
      if (footerEl) {
        isSyncingFooter = true;
        footerEl.scrollLeft = mainTableScrollElement.scrollLeft;
      }
    };

    const handleFooterScroll = () => {
      if (isSyncingFooter) {
        isSyncingFooter = false;
        return;
      }
      if (mainTableScrollElement) {
        isSyncingMain = true;
        mainTableScrollElement.scrollLeft = footerEl.scrollLeft;
      }
    };

    mainTableScrollElement.addEventListener('scroll', handleMainTableScroll, { passive: true });
    footerEl.addEventListener('scroll', handleFooterScroll, { passive: true });

    // Initial sync immediately upon mount/render
    footerEl.scrollLeft = mainTableScrollElement.scrollLeft;

    return () => {
      mainTableScrollElement.removeEventListener('scroll', handleMainTableScroll);
      footerEl.removeEventListener('scroll', handleFooterScroll);
    };
  }, [mainTableScrollElement]);

  if (filteredParameterSettings.length === 0) return null;

  const footerRows: FooterRowItem[] = [
    {
      badge: 'S3 Cont',
      label: t.total_shift_3_cont || 'Total Shift 3 (Lanjutan)',
      data: parameterShiftFooterData?.shift3Cont || {},
      type: 'total',
      shift: '3cont',
    },
    {
      badge: 'S3 Cont',
      label: t.average_shift_3_cont || 'Rata-Rata Shift 3 (Lanjutan)',
      data: parameterShiftAverageData?.shift3Cont || {},
      type: 'average',
      shift: '3cont',
    },
    {
      badge: 'Shift 1',
      label: t.total_shift_1 || 'Total Shift 1',
      data: parameterShiftFooterData?.shift1 || {},
      type: 'total',
      shift: '1',
    },
    {
      badge: 'Shift 1',
      label: t.average_shift_1 || 'Rata-Rata Shift 1',
      data: parameterShiftAverageData?.shift1 || {},
      type: 'average',
      shift: '1',
    },
    {
      badge: 'Shift 2',
      label: t.total_shift_2 || 'Total Shift 2',
      data: parameterShiftFooterData?.shift2 || {},
      type: 'total',
      shift: '2',
    },
    {
      badge: 'Shift 2',
      label: t.average_shift_2 || 'Rata-Rata Shift 2',
      data: parameterShiftAverageData?.shift2 || {},
      type: 'average',
      shift: '2',
    },
    {
      badge: 'Shift 3',
      label: t.total_shift_3 || 'Total Shift 3',
      data: parameterShiftFooterData?.shift3 || {},
      type: 'total',
      shift: '3',
    },
    {
      badge: 'Shift 3',
      label: t.average_shift_3 || 'Rata-Rata Shift 3',
      data: parameterShiftAverageData?.shift3 || {},
      type: 'average',
      shift: '3',
    },
    {
      badge: 'Count',
      label: t.counter_shift_3_cont || 'Counter Shift 3 (Lanjutan)',
      data: parameterShiftCounterData?.shift3Cont || {},
      type: 'counter',
      shift: '3cont',
    },
    {
      badge: 'Count',
      label: t.counter_shift_1 || 'Counter Shift 1',
      data: parameterShiftCounterData?.shift1 || {},
      type: 'counter',
      shift: '1',
    },
    {
      badge: 'Count',
      label: t.counter_shift_2 || 'Counter Shift 2',
      data: parameterShiftCounterData?.shift2 || {},
      type: 'counter',
      shift: '2',
    },
    {
      badge: 'Count',
      label: t.counter_shift_3 || 'Counter Shift 3',
      data: parameterShiftCounterData?.shift3 || {},
      type: 'counter',
      shift: '3',
    },
    {
      badge: 'SUM',
      label: t.total || 'Total',
      data: parameterFooterData || {},
      dataKey: 'total',
      type: 'summary',
      shift: 'all',
    },
    {
      badge: 'AVG',
      label: t.average || 'Rata-Rata',
      data: parameterFooterData || {},
      dataKey: 'avg',
      type: 'summary',
      shift: 'all',
    },
    {
      badge: 'MIN',
      label: t.min || 'Min',
      data: parameterFooterData || {},
      dataKey: 'min',
      type: 'summary',
      shift: 'all',
    },
    {
      badge: 'MAX',
      label: t.max || 'Maks',
      data: parameterFooterData || {},
      dataKey: 'max',
      type: 'summary',
      shift: 'all',
    },
  ];

  // Get row styling based on type and metrics
  const getRowStyle = (row: FooterRowItem) => {
    if (row.type === 'total') {
      return 'bg-slate-100/70 dark:bg-slate-850/60 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 transition-colors';
    }
    if (row.type === 'average') {
      return 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/50 border-b border-slate-200/70 dark:border-slate-800 transition-colors';
    }
    if (row.type === 'counter') {
      return 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-950/40 border-b border-amber-200/40 dark:border-amber-900/30 transition-colors';
    }
    if (row.type === 'summary') {
      if (row.dataKey === 'total') {
        return 'bg-slate-200/80 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 border-b border-slate-300 dark:border-slate-700 hover:bg-slate-300/60 dark:hover:bg-slate-750 transition-colors';
      }
      if (row.dataKey === 'avg') {
        return 'bg-slate-100 dark:bg-slate-850 font-bold border-b border-slate-200 dark:border-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors';
      }
      if (row.dataKey === 'min') {
        return 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-950/40 border-b border-red-200/50 dark:border-red-900/30 transition-colors';
      }
      if (row.dataKey === 'max') {
        return 'bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 border-b-0 transition-colors';
      }
    }
    return 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border-b border-slate-200 dark:border-slate-800 transition-colors';
  };

  // Get sticky label cell styling based on type and metrics
  const getLabelStyle = (row: FooterRowItem) => {
    if (row.type === 'total') {
      return 'bg-slate-700 dark:bg-slate-800 text-white font-bold border-r border-slate-600 dark:border-slate-700';
    }
    if (row.type === 'average') {
      return 'bg-slate-600 dark:bg-slate-850 text-slate-100 font-semibold border-r border-slate-500 dark:border-slate-700';
    }
    if (row.type === 'counter') {
      return 'bg-amber-800/90 dark:bg-amber-900/90 text-amber-50 font-bold border-r border-amber-700/60 dark:border-amber-800/60';
    }
    if (row.type === 'summary') {
      if (row.dataKey === 'total') {
        return 'bg-slate-900 dark:bg-slate-950 text-white font-extrabold border-r border-slate-800 tracking-wider';
      }
      if (row.dataKey === 'avg') {
        return 'bg-slate-800 dark:bg-slate-900 text-white font-bold border-r border-slate-700 tracking-wider';
      }
      if (row.dataKey === 'min') {
        return 'bg-red-900/90 dark:bg-red-950 text-red-100 font-bold border-r border-red-800 tracking-wider';
      }
      if (row.dataKey === 'max') {
        return 'bg-emerald-900/90 dark:bg-emerald-950 text-emerald-100 font-bold border-r border-emerald-800 tracking-wider';
      }
    }
    return 'bg-slate-700 dark:bg-slate-800 text-white';
  };

  // Get data cell text color based on type and metrics
  const getDataCellStyle = (row: FooterRowItem) => {
    if (row.type === 'total') {
      return 'text-slate-900 dark:text-slate-100 font-bold';
    }
    if (row.type === 'average') {
      return 'text-slate-700 dark:text-slate-300 font-medium';
    }
    if (row.type === 'counter') {
      return 'text-amber-800 dark:text-amber-300 font-semibold';
    }
    if (row.type === 'summary') {
      if (row.dataKey === 'total') {
        return 'text-slate-900 dark:text-white font-black text-[12px]';
      }
      if (row.dataKey === 'avg') {
        return 'text-slate-850 dark:text-slate-100 font-bold';
      }
      if (row.dataKey === 'min') {
        return 'text-red-700 dark:text-red-400 font-bold';
      }
      if (row.dataKey === 'max') {
        return 'text-emerald-700 dark:text-emerald-400 font-bold';
      }
    }
    return 'text-slate-700 dark:text-slate-300';
  };

  return (
    <>
      {/* Footer Header */}
      <div className="bg-slate-800 dark:bg-slate-850 rounded-t-lg px-3.5 py-2.5 mt-3 border border-b-0 border-slate-700 dark:border-slate-800 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-white/10 dark:bg-slate-700 flex items-center justify-center border border-white/10 text-primary-400">
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
          <div>
            <h4 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-white">
              Data Summary & Statistics
            </h4>
          </div>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700/80 dark:bg-slate-800 text-slate-300 border border-slate-600/50">
          Aggregated Metrics
        </span>
      </div>

      {/* Footer Table */}
      <div
        className="ccr-footer-scroll-wrapper overflow-x-auto rounded-b-lg border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900"
        ref={footerRef}
      >
        <table
          className="ccr-table text-xs border-collapse"
          style={{
            marginBottom: 0,
            tableLayout: 'fixed',
            minWidth: `${320 + filteredParameterSettings.length * 80}px`,
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
              <tr key={rowIndex} className={getRowStyle(row)} role="row">
                <td
                  colSpan={3}
                  className={`px-3 py-1.5 text-right text-xs uppercase tracking-wide border-r sticky left-0 z-30 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.15)] ${getLabelStyle(row)}`}
                  style={{ width: '320px', minWidth: '320px' }}
                  role="columnheader"
                >
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/25">
                      {row.badge}
                    </span>
                    <span className="truncate">{row.label}</span>
                  </div>
                </td>
                {filteredParameterSettings.map((param) => {
                  let value: number | undefined;
                  if (row.dataKey) {
                    const stats = row.data[param.id];
                    value = stats ? stats[row.dataKey] : undefined;
                  } else {
                    value = row.data[param.id];
                  }

                  return (
                    <td
                      key={param.id}
                      className={`px-2 py-1.5 text-center font-mono text-xs tabular-nums border-r border-slate-200 dark:border-slate-800 ${getDataCellStyle(row)}`}
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

export default React.memo(CcrTableFooter);
