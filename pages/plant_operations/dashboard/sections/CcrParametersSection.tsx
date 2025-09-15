import React, { useMemo, useState, useCallback } from "react";
import { formatNumber } from "../../../../utils/formatters";

interface CcrTableRowProps {
  item: {
    id: string;
    parameter: string;
    unit: string;
    category: string;
    avgValue: number;
    target: number;
    deviation: number;
  };
  index: number;
}

const CcrTableRow: React.FC<CcrTableRowProps> = ({ item, index }) => (
  <tr className="border-t">
    <td className="px-4 py-2">{item.parameter}</td>
    <td className="px-4 py-2">{item.unit}</td>
    <td className="px-4 py-2">{item.category}</td>
    <td className="px-4 py-2">{formatNumber(item.avgValue)}</td>
    <td className="px-4 py-2">{formatNumber(item.target)}</td>
    <td
      className={`px-4 py-2 ${
        item.deviation > 0 ? "text-red-600" : "text-green-600"
      }`}
    >
      {item.deviation > 0 ? "+" : ""}
      {formatNumber(item.deviation)}%
    </td>
  </tr>
);

// Virtual scrolling component for large tables
interface VirtualizedTableProps {
  data: any[];
  itemHeight: number;
  containerHeight: number;
}

const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  data,
  itemHeight,
  containerHeight,
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    data.length
  );

  const visibleItems = data.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      className="overflow-auto border border-gray-300 dark:border-slate-600 rounded-md"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <table className="min-w-full table-auto">
        <thead className="bg-gray-50 dark:bg-slate-700 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-2 text-left">Parameter</th>
            <th className="px-4 py-2 text-left">Unit</th>
            <th className="px-4 py-2 text-left">Category</th>
            <th className="px-4 py-2 text-left">Actual</th>
            <th className="px-4 py-2 text-left">Target</th>
            <th className="px-4 py-2 text-left">Deviation</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ height: offsetY }} />
          {visibleItems.map((item, index) => (
            <CcrTableRow key={item.id} item={item} index={startIndex + index} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface CcrParametersSectionProps {
  ccrTableData: any[];
  selectedPlantCategory: string;
  selectedPlantUnit: string;
}

const CcrParametersSection: React.FC<CcrParametersSectionProps> = ({
  ccrTableData,
  selectedPlantCategory,
  selectedPlantUnit,
}) => {
  const hasFilters =
    selectedPlantCategory !== "all" || selectedPlantUnit !== "all";

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">
        CCR Parameters{" "}
        {hasFilters && (
          <span className="text-sm font-normal text-gray-500">
            (
            {selectedPlantCategory !== "all"
              ? selectedPlantCategory
              : "All Categories"}
            {selectedPlantUnit !== "all" ? ` - ${selectedPlantUnit}` : ""})
          </span>
        )}
      </h3>

      {ccrTableData.length > 0 ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Showing {ccrTableData.length} parameters
          </div>
          <VirtualizedTable
            data={ccrTableData}
            itemHeight={48} // Approximate row height
            containerHeight={400} // Container height
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-lg font-medium">No CCR Parameters</div>
            <div className="text-sm">
              No CCR parameters found for the selected filters
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CcrParametersSection;
