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

  return (
    <div className="ccr-table-footer-container" ref={footerRef}>
      <table className="ccr-table" style={{ marginBottom: 0 }}>
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
            <tr key={rowIndex} className={row.className || ''} role="row">
              <td
                colSpan={3}
                className="px-3 py-3 text-right font-bold text-slate-700 border-r sticky left-0 bg-slate-100 z-30"
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
                    className="px-3 py-3 text-center font-semibold text-slate-800 border-r"
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
  );
};

export default CcrTableFooter;
