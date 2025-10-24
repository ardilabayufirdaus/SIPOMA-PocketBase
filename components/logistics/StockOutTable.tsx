import React from 'react';

interface TableData {
  headers: (string | number)[];
  rows: { area: string; dailyValues: number[]; total: number }[];
  footer: number[];
}

interface StockOutTableProps {
  tableData: TableData;
  selectedDay: number | null;
  setSelectedDay: (day: number | null) => void;
  formatNumber: (n: number) => string;
  t: any;
}

export const StockOutTable: React.FC<StockOutTableProps> = ({
  tableData,
  selectedDay,
  setSelectedDay,
  formatNumber,
  t,
}) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold text-slate-800 mb-4">{t.detailed_stock_out_table}</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {tableData.headers.map((header, i) => {
              const isSelected = typeof header === 'number' && header === selectedDay;
              const bgClass = isSelected ? 'bg-red-100' : 'bg-slate-50';
              const stickyClass = i === 0 ? 'sticky left-0 z-10' : '';
              const textAlign = i === 0 ? 'text-left' : 'text-center';
              return (
                <th
                  key={i}
                  scope="col"
                  className={`px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider transition-colors duration-200 ${bgClass} ${stickyClass} ${textAlign}`}
                >
                  {header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {tableData.rows.map(({ area, dailyValues, total }) => (
            <tr key={area} className="hover:bg-slate-50">
              <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900 sticky left-0 bg-white hover:bg-slate-50 z-10">
                {area}
              </td>
              {dailyValues.map((val, i) => {
                const day = i + 1;
                const isSelected = day === selectedDay;
                return (
                  <td
                    key={i}
                    className={`px-4 py-3 whitespace-nowrap text-slate-500 text-center transition-colors duration-200 ${
                      isSelected ? 'bg-red-50 font-medium text-slate-800' : ''
                    }`}
                  >
                    {val > 0 ? formatNumber(val) : '-'}
                  </td>
                );
              })}
              <td className="px-4 py-3 whitespace-nowrap text-slate-800 font-semibold text-center">
                {formatNumber(total)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-100">
          <tr>
            <th
              scope="row"
              className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase sticky left-0 bg-slate-100 z-10"
            >
              Total
            </th>
            {tableData.footer.map((total, i) => {
              const day = i + 1;
              const isLastCell = i === tableData.footer.length - 1;
              const isSelected = !isLastCell && day === selectedDay;
              return (
                <td
                  key={i}
                  className={`px-4 py-3 whitespace-nowrap font-bold text-slate-700 text-center transition-colors duration-200 ${
                    isSelected ? 'bg-red-100' : ''
                  }`}
                >
                  {formatNumber(total)}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
);
