import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ResourceAllocationChartProps {
  data: Array<{
    month: string;
    active: number;
    overdue: number;
    completed: number;
  }>;
  t: any;
}

export const ResourceAllocationChart: React.FC<ResourceAllocationChartProps> = ({ data, t }) => {
  const chartData = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        label: 'Active',
        data: data.map((item) => item.active),
        backgroundColor: '#3B82F6', // blue-500
        borderColor: '#3B82F6',
        borderWidth: 1,
      },
      {
        label: 'Overdue',
        data: data.map((item) => item.overdue),
        backgroundColor: '#EF4444', // red-500
        borderColor: '#EF4444',
        borderWidth: 1,
      },
      {
        label: 'Completed',
        data: data.map((item) => item.completed),
        backgroundColor: '#10B981', // emerald-500
        borderColor: '#10B981',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 10,
          usePointStyle: true,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + ' projects';
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Month',
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
        title: {
          display: true,
          text: 'Projects',
          font: {
            size: 12,
          },
        },
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          stepSize: 5,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className="h-32 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
};
