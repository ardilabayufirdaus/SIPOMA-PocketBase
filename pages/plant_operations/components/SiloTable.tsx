import React from 'react';
import { motion } from 'framer-motion';
import { formatNumberIndonesian } from '../../../utils/formatters';

interface SiloTableProps {
  siloData: Array<{
    master: {
      silo_name: string;
      capacity: number;
    };
    shift1: {
      emptySpace?: number;
      content?: number;
    };
    shift2: {
      emptySpace?: number;
      content?: number;
    };
    shift3: {
      emptySpace?: number;
      content?: number;
    };
  }>;
  t: Record<string, string>;
}

export const SiloTable: React.FC<SiloTableProps> = ({ siloData, t }) => {
  if (!siloData || siloData.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-white to-emerald-50/30 rounded-xl shadow-xl overflow-hidden border border-emerald-200/50 mt-6"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="p-4 border-b border-emerald-200/50 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
          {t.silo_stock_report_title || 'Silo Stock Report'}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-[6px] min-w-max">
          <thead>
            {/* Main Header */}
            <tr className="bg-gradient-to-r from-emerald-100 to-teal-100">
              <th
                rowSpan={2}
                className="px-1 py-1 text-left font-bold text-slate-800 border-r border-emerald-200 sticky left-0 bg-inherit z-10 min-w-24 align-middle text-[6px]"
              >
                {t.silo_name || 'Silo Name'}
              </th>
              <th
                colSpan={3}
                className="px-1 py-1 text-center font-semibold text-slate-800 border-r border-slate-200 align-middle text-[6px]"
              >
                {t.shift_1 || 'Shift 1'}
              </th>
              <th
                colSpan={3}
                className="px-1 py-1 text-center font-semibold text-slate-800 border-r border-slate-200 align-middle text-[6px]"
              >
                {t.shift_2 || 'Shift 2'}
              </th>
              <th
                colSpan={3}
                className="px-1 py-1 text-center font-semibold text-slate-800 align-middle text-[6px]"
              >
                {t.shift_3 || 'Shift 3'}
              </th>
            </tr>
            {/* Sub Header */}
            <tr className="bg-slate-100">
              {['shift1', 'shift2', 'shift3'].map((shiftKey) => (
                <React.Fragment key={shiftKey}>
                  <th className="px-1 py-1 text-center font-medium text-slate-600 border-r border-slate-200 align-middle">
                    <div className="text-[6px] leading-tight">{t.empty_space || 'Empty Space'}</div>
                  </th>
                  <th className="px-1 py-1 text-center font-medium text-slate-600 border-r border-slate-200 align-middle">
                    <div className="text-[6px] leading-tight">{t.content || 'Content'}</div>
                  </th>
                  <th className="px-1 py-1 text-center font-medium text-slate-600 border-r border-slate-200 last:border-r-0 align-middle">
                    <div className="text-[6px] leading-tight">{t.percentage || '%'}</div>
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {siloData.map((silo, index) => (
              <tr
                key={silo.master.silo_name}
                className={`${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                } hover:bg-slate-100 transition-colors`}
              >
                <td className="px-1 py-1 font-medium text-slate-900 border-r border-slate-200 sticky left-0 bg-inherit z-10 align-middle text-[6px]">
                  {silo.master.silo_name}
                </td>

                {['shift1', 'shift2', 'shift3'].map((shiftKey, shiftIndex) => {
                  const shiftData = silo[shiftKey as keyof typeof silo] as {
                    emptySpace?: number;
                    content?: number;
                  };
                  const content = shiftData?.content;
                  const capacity = silo.master.capacity;
                  const percentage =
                    capacity > 0 && typeof content === 'number' ? (content / capacity) * 100 : 0;

                  return (
                    <React.Fragment key={shiftKey}>
                      <td className="px-1 py-1 text-center text-slate-800 border-r border-slate-200 align-middle text-[6px]">
                        {formatNumberIndonesian(shiftData?.emptySpace) || '-'}
                      </td>
                      <td className="px-1 py-1 text-center text-slate-800 border-r border-slate-200 align-middle text-[6px]">
                        {formatNumberIndonesian(content) || '-'}
                      </td>
                      <td
                        className={`px-1 py-1 text-center text-slate-800 align-middle text-[6px] ${
                          shiftIndex === 2 ? '' : 'border-r border-slate-200'
                        }`}
                      >
                        {percentage > 0 ? `${percentage.toFixed(1)}%` : '-'}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
