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
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden mt-6">
      <div className="p-2 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t.operator_data || 'Operator Data'}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-xs min-w-max">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-600">
              <th className="px-2 py-2 text-left font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-600 align-middle">
                {t.shift}
              </th>
              <th className="px-2 py-2 text-left font-semibold text-slate-800 dark:text-slate-200 align-middle">
                {t.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {operatorData.map((operator, index) => (
              <tr
                key={operator.shift}
                className={`${
                  index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-700'
                } hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors`}
              >
                <td className="px-2 py-2 font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-600 align-middle">
                  {operator.shift}
                </td>
                <td className="px-2 py-2 text-slate-800 dark:text-slate-200 align-middle">
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
