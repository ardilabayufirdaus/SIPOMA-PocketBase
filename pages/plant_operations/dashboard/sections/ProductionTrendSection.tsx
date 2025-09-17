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
  selectedProductionParameters: string[];
  selectedPlantCategory: string;
  selectedPlantUnit: string;
}

const ProductionTrendChart = memo<ProductionTrendChartProps>(
  ({
    data,
    parameters,
    selectedProductionParameters,
    selectedPlantCategory,
    selectedPlantUnit,
  }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const filteredParameters = useMemo(() => {
      return parameters.filter((param) => {
        const categoryMatch =
          selectedPlantCategory === 'all' || param.category === selectedPlantCategory;
        const unitMatch = selectedPlantUnit === 'all' || param.unit === selectedPlantUnit;
        return categoryMatch && unitMatch;
      });
    }, [parameters, selectedPlantCategory, selectedPlantUnit]);

    const displayParameters = useMemo(() => {
      return selectedProductionParameters.length === 0
        ? filteredParameters.slice(0, 5)
        : selectedProductionParameters
            .map((paramId) => {
              return parameters.find((p) => p.id === paramId);
            })
            .filter(Boolean);
    }, [selectedProductionParameters, filteredParameters, parameters]);

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = useMemo(() => {
      return data.slice(startIndex, endIndex);
    }, [data, startIndex, endIndex]);

    useEffect(() => {
      setCurrentPage(1);
    }, [selectedPlantCategory, selectedPlantUnit, selectedProductionParameters]);

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
            {displayParameters.map((param, index) => (
              <Line
                key={param.id}
                type="monotone"
                dataKey={param.parameter}
                stroke={`hsl(${index * 60}, 70%, 50%)`}
                strokeWidth={2}
                name={`${param.parameter} (${param.unit})`}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
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
  selectedProductionParameters: string[];
  selectedPlantCategory: string;
  selectedPlantUnit: string;
  isSuperAdmin: boolean;
  showProductionTrendSettings: boolean;
  setShowProductionTrendSettings: (show: boolean) => void;
  selectedProductionParametersState: string[];
  setSelectedProductionParameters: (params: string[]) => void;
  saveProductionParameters: (params: string[]) => void;
}

const ProductionTrendSection: React.FC<ProductionTrendSectionProps> = ({
  productionTrendData,
  parameters,
  selectedProductionParameters,
  selectedPlantCategory,
  selectedPlantUnit,
  isSuperAdmin,
  showProductionTrendSettings,
  setShowProductionTrendSettings,
  selectedProductionParametersState,
  setSelectedProductionParameters,
  saveProductionParameters,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Production Trend</h3>
        {isSuperAdmin && (
          <button
            onClick={() => setShowProductionTrendSettings(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            title="Configure Production Trend Parameters"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </button>
        )}
      </div>

      {productionTrendData.length > 0 ? (
        <LazyChart>
          <ProductionTrendChart
            data={productionTrendData}
            parameters={parameters}
            selectedProductionParameters={selectedProductionParameters}
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
