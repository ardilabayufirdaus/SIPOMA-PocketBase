import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface ProgressTrendChartProps {
  data: Array<{
    id: string;
    data: Array<{
      x: string;
      y: number;
    }>;
  }>;
  t: (key: string) => string;
}

export const ProgressTrendChart: React.FC<ProgressTrendChartProps> = ({ data, t }) => {
  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
  ];

  const chartData = {
    labels: data[0]?.data.map((point) => point.x) || [],
    datasets: data.map((series, index) => ({
      label: series.id,
      data: series.data.map((point) => point.y),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.1,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#d1d5db',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          title: (context: any[]) => `Month: ${context[0]?.label || ''}`,
          label: (context: any) =>
            `${context.dataset?.label || ''}: ${context.parsed?.y?.toFixed(1) || 0}%`,
        },
      },
    },
    scales: {
      x: {
        display: true,
        ticks: {
          font: {
            size: 12,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        min: 0,
        max: 100,
        ticks: {
          font: {
            size: 12,
          },
          callback: (value: number | string) => `${value}%`,
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  return (
    <div className="h-32 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
};


