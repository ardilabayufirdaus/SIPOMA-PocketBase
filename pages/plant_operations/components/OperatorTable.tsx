import React from 'react';
import { motion } from 'framer-motion';

interface OperatorTableProps {
  operatorData: Array<{
    shift: string;
    name: string;
  }>;
  t: Record<string, string>;
}

export const OperatorTable: React.FC<OperatorTableProps> = ({ operatorData, t }) => {
  if (!operatorData || operatorData.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-blue-900/10 rounded-xl shadow-xl overflow-hidden border border-blue-200/50 dark:border-blue-800/50 mt-6"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="p-4 border-b border-blue-200/50 dark:border-blue-700/50 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
          {t.operator_data || 'Operator Data'}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-[8px] min-w-max">
          <thead>
            <tr className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
              <th className="px-4 py-3 text-left font-bold text-slate-800 dark:text-slate-200 border-r border-blue-200 dark:border-blue-700 align-middle text-[8px]">
                {t.shift}
              </th>
              <th className="px-4 py-3 text-left font-bold text-slate-800 dark:text-slate-200 align-middle text-[8px]">
                {t.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {operatorData.map((operator, index) => (
              <motion.tr
                key={operator.shift}
                className={`${
                  index % 2 === 0
                    ? 'bg-white/80 dark:bg-slate-800/80'
                    : 'bg-blue-50/50 dark:bg-blue-900/10'
                } hover:bg-gradient-to-r hover:from-blue-100/70 hover:to-cyan-100/70 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-all duration-200`}
                whileHover={{ scale: 1.005 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 border-r border-blue-200 dark:border-blue-700 align-middle text-[8px]">
                  {operator.shift}
                </td>
                <td className="px-4 py-3 text-slate-800 dark:text-slate-200 align-middle font-medium text-[8px]">
                  {operator.name}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

