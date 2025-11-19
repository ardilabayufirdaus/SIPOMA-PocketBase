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
    <div className="bg-gradient-to-br from-teal-50 via-white to-green-50 rounded-2xl shadow-2xl overflow-hidden border-2 border-teal-200/50 mt-4">
      <div className="p-3 border-b-2 border-teal-300/50 bg-gradient-to-r from-teal-500/10 via-green-500/10 to-emerald-500/10">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-teal-500 to-green-500 rounded-full"></div>
          {t.operator_data || 'Operator Data'}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-sm min-w-0">
          <thead>
            <tr className="bg-gradient-to-r from-teal-400 via-green-400 to-emerald-400 text-white">
              <th className="px-3 py-3 text-left font-bold border-r-2 border-white/30 align-middle">
                {t.shift}
              </th>
              <th className="px-3 py-3 text-left font-bold align-middle">{t.name}</th>
            </tr>
          </thead>
          <tbody>
            {operatorData.map((operator, index) => (
              <tr
                key={operator.shift}
                className={`${
                  index % 2 === 0
                    ? 'bg-gradient-to-r from-white to-teal-50/30'
                    : 'bg-gradient-to-r from-green-50/50 to-emerald-50/30'
                }`}
              >
                <td className="px-3 py-3 font-semibold text-slate-900 border-r-2 border-teal-200/50 align-middle">
                  {operator.shift}
                </td>
                <td className="px-3 py-3 text-slate-800 align-middle font-medium">
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
