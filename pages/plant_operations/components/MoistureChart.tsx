import React from 'react';
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface MoistureChartProps {
  data: Array<{
    hour: number;
    gypsum: number | null;
    trass: number | null;
    limestone: number | null;
    total: number | null;
  }>;
  title?: string;
}

export const MoistureChart: React.FC<MoistureChartProps> = ({
  data,
  title = 'Moisture Content Trends',
}) => {
  const labels = data.map((item) => `Hour ${item.hour}`);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Gypsum (%)',
        data: data.map((item) => item.gypsum),
        borderColor: 'rgb(59, 130, 246)', // Bright blue
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Trass (%)',
        data: data.map((item) => item.trass),
        borderColor: 'rgb(16, 185, 129)', // Bright green
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Limestone (%)',
        data: data.map((item) => item.limestone),
        borderColor: 'rgb(245, 158, 11)', // Bright orange
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: 'rgb(245, 158, 11)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: '% Total Moisture Content',
        data: data.map((item) => item.total),
        borderColor: 'rgb(168, 85, 247)', // Bright purple
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        tension: 0.4,
        borderWidth: 4,
        pointBackgroundColor: 'rgb(168, 85, 247)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
        },
        color: '#1e293b',
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ffffff',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (value === null) return `${label}: No data`;
            return `${label}: ${value.toFixed(2)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#64748b',
        },
        title: {
          display: true,
          text: 'Moisture Content (%)',
          color: '#1e293b',
        },
      },
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#64748b',
        },
        title: {
          display: true,
          text: 'Hour',
          color: '#1e293b',
        },
      },
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutCubic' as const,
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 h-full"
    >
      <div className="h-full">
        <Line data={chartData} options={options} />
      </div>
    </motion.div>
  );
};

export default MoistureChart;


