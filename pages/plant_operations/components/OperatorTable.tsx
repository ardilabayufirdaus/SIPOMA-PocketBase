import React from 'react';

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
    <div className="bg-white dark:bg-slate-900 overflow-hidden h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
          <div className="w-1.5 h-4 bg-slate-800 dark:bg-slate-200 rounded-full"></div>
          {t.operator_data || 'OPERATOR DATA'}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary-800 text-white">
              <th className="px-3 py-3 text-left font-bold border-r border-white/20 align-middle text-xs uppercase">
                {t.shift}
              </th>
              <th className="px-3 py-3 text-left font-bold align-middle text-xs uppercase">
                {t.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {operatorData.map((operator, index) => (
              <tr
                key={operator.shift}
                className={`${
                  index % 2 === 0
                    ? 'bg-white dark:bg-slate-900'
                    : 'bg-slate-50 dark:bg-slate-800/40'
                } hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0`}
              >
                <td className="px-3 py-3 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 align-middle text-xs">
                  {operator.shift}
                </td>
                <td className="px-3 py-3 text-slate-700 dark:text-slate-300 align-middle font-medium text-xs">
                  {operator.name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
