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
    <div className="bg-white overflow-hidden h-full">
      <div className="p-4 border-b border-slate-200 bg-[#F9F9F9]">
        <h3 className="text-sm font-bold text-[#E95420] flex items-center gap-2 uppercase tracking-wider">
          <div className="w-1.5 h-4 bg-[#772953] rounded-full"></div>
          {t.operator_data || 'OPERATOR DATA'}
        </h3>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#772953] text-white">
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
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                } hover:bg-orange-50/50 transition-colors border-b border-slate-100 last:border-0`}
              >
                <td className="px-3 py-3 font-bold text-slate-800 border-r border-slate-200 align-middle text-xs">
                  {operator.shift}
                </td>
                <td className="px-3 py-3 text-slate-700 align-middle font-medium text-xs">
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
