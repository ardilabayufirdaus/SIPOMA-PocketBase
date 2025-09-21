import React, { memo, useState, useMemo, useEffect } from 'react';
import LazyChart from '../../../../components/LazyChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface ProductionTrendChartProps {
  data: any[];
  parameters: any[];
  selectedPlantCategory: string;
  selectedPlantUnit: string;
}

const ProductionTrendChart = memo<ProductionTrendChartProps>(
  ({ data, parameters, selectedPlantCategory, selectedPlantUnit }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const filteredParameters = useMemo(() => {
      // Fixed parameters for Production Trend
      const fixedParameterIds = [
        'a3f7b380-1cad-41f3-b459-802d4c33da54', // CM 220
        'fb58e1a8-d808-46fc-8123-c3a33899dfcc', // CM 320
        '8d1d2e1e-b003-44f1-a946-50aed6b44fe8', // CM 419
        '14bf978b-5f5f-4279-b0c1-b91eb8a28e3a', // CM 420
        '0917556b-e2b7-466b-bc55-fc3a79bb9a25', // CM 552
        'fe1548c9-2ee5-44a8-9105-3fa2922438f4', // CM 552
      ];

      return parameters.filter((param) => {
        const categoryMatch =
          selectedPlantCategory === 'all' || param.category === selectedPlantCategory;
        const unitMatch = selectedPlantUnit === 'all' || param.unit === selectedPlantUnit;
        return categoryMatch && unitMatch && fixedParameterIds.includes(param.id);
      });
    }, [parameters, selectedPlantCategory, selectedPlantUnit]);

    const displayParameters = useMemo(() => {
      return filteredParameters;
    }, [filteredParameters]);

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = useMemo(() => {
      return data.slice(startIndex, endIndex);
    }, [data, startIndex, endIndex]);

    useEffect(() => {
      setCurrentPage(1);
    }, [selectedPlantCategory, selectedPlantUnit]);

    const handlePageChange = (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
      setItemsPerPage(newItemsPerPage);
      setCurrentPage(1);
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="items-per-page"
                className="text-sm font-medium text-gray-700 dark:text-slate-300"
              >
                Show:
              </label>
              <select
                id="items-per-page"
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              >
                <option value={5}>5 days</option>
                <option value={10}>10 days</option>
                <option value={15}>15 days</option>
                <option value={20}>20 days</option>
                <option value={31}>31 days</option>
              </select>
            </div>
            <div className="text-sm text-gray-600 dark:text-slate-400">
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} days
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={paginatedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                });
              }}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
              }}
            />
            <Legend />
            {displayParameters.map((param, index) => {
              // Map parameter IDs to CM names
              const cmNameMap: { [key: string]: string } = {
                'a3f7b380-1cad-41f3-b459-802d4c33da54': 'CM 220',
                'fb58e1a8-d808-46fc-8123-c3a33899dfcc': 'CM 320',
                '8d1d2e1e-b003-44f1-a946-50aed6b44fe8': 'CM 419',
                '14bf978b-5f5f-4279-b0c1-b91eb8a28e3a': 'CM 420',
                '0917556b-e2b7-466b-bc55-fc3a79bb9a25': 'CM 552',
                'fe1548c9-2ee5-44a8-9105-3fa2922438f4': 'CM 552',
              };

              const cmName = cmNameMap[param.id] || param.parameter;

              return (
                <Line
                  key={param.id}
                  type="monotone"
                  dataKey={param.parameter}
                  stroke={`hsl(${index * 60}, 70%, 50%)`}
                  strokeWidth={2}
                  name={cmName}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

ProductionTrendChart.displayName = 'ProductionTrendChart';

interface ProductionTrendSectionProps {
  productionTrendData: any[];
  parameters: any[];
  selectedPlantCategory: string;
  selectedPlantUnit: string;
}

const ProductionTrendSection: React.FC<ProductionTrendSectionProps> = ({
  productionTrendData,
  parameters,
  selectedPlantCategory,
  selectedPlantUnit,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Production Trend</h3>
      </div>

      {productionTrendData.length > 0 ? (
        <LazyChart>
          <ProductionTrendChart
            data={productionTrendData}
            parameters={parameters}
            selectedPlantCategory={selectedPlantCategory}
            selectedPlantUnit={selectedPlantUnit}
          />
        </LazyChart>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-lg font-medium">No Production Data</div>
            <div className="text-sm">No data available for the selected filters</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionTrendSection;
