import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { formatIndonesianNumber } from '../../utils/formatUtils';

ChartJS.register(ArcElement, Tooltip, Legend);

interface StockDistributionChartProps {
  stockData: Array<{
    area: string;
    currentStock: number;
    capacity: number;
  }>;
}

export const StockDistributionChart: React.FC<StockDistributionChartProps> = ({ stockData }) => {
  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#06B6D4', // cyan-500
    '#10B981', // emerald-500
    '#F97316', // orange-500
  ];

  const data = {
    labels: stockData.map((item) => item.area),
    datasets: [
      {
        data: stockData.map((item) => item.currentStock),
        backgroundColor: stockData.map((_, index) => colors[index % colors.length]),
        borderColor: stockData.map((_, index) => colors[index % colors.length]),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${formatIndonesianNumber(value)} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-full w-full">
      <Pie data={data} options={options} />
    </div>
  );
};

