import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProjectStatusChartProps {
  projects: Array<{
    id: string;
    name: string;
    status: 'on_track' | 'at_risk' | 'delayed';
    progress: number;
  }>;
}

export const ProjectStatusChart: React.FC<ProjectStatusChartProps> = ({ projects }) => {
  const statusCounts = {
    on_track: projects.filter((p) => p.status === 'on_track').length,
    at_risk: projects.filter((p) => p.status === 'at_risk').length,
    delayed: projects.filter((p) => p.status === 'delayed').length,
  };

  const data = {
    labels: ['On Track', 'At Risk', 'Delayed'],
    datasets: [
      {
        data: [statusCounts.on_track, statusCounts.at_risk, statusCounts.delayed],
        backgroundColor: [
          '#10B981', // emerald-500 - On Track
          '#F59E0B', // amber-500 - At Risk
          '#EF4444', // red-500 - Delayed
        ],
        borderColor: ['#10B981', '#F59E0B', '#EF4444'],
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
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ${value} project${value !== 1 ? 's' : ''} (${percentage}%)`;
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
