import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface QualityStabilityChartProps {
  parameterData: any[]; // Data for a specific parameter
  settings: any; // min/max values
  label: string;
}

const QualityStabilityChart: React.FC<QualityStabilityChartProps> = ({
  parameterData,
  settings,
  label,
}) => {
  const chartData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i + 1);

    // Flatten data to hourly readings
    const values: (number | null)[] = [];
    hours.forEach((h) => {
      const val = parseFloat(parameterData[0]?.[`hour${h}`]);
      values.push(isNaN(val) ? null : val);
    });

    return {
      labels: hours.map((h) => `${String(h).padStart(2, '0')}`),
      datasets: [
        {
          label: 'Actual Reading',
          data: values,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          borderWidth: 4,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: '#fff',
          pointBorderWidth: 3,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Max Limit',
          data: Array(24).fill(settings?.max_value),
          borderColor: '#f43f5e',
          borderWidth: 1.5,
          borderDash: [8, 4],
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'Min Limit',
          data: Array(24).fill(settings?.min_value),
          borderColor: '#10b981',
          borderWidth: 1.5,
          borderDash: [8, 4],
          pointRadius: 0,
          fill: false,
        },
      ],
    };
  }, [parameterData, settings]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { size: 10, weight: '900', family: "'Outfit', 'Inter', sans-serif" },
          usePointStyle: true,
          pointStyle: 'rectRounded',
          padding: 24,
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        titleFont: { size: 13, weight: '900' },
        bodyColor: '#cbd5e1',
        bodyFont: { size: 11, weight: '600' },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 16,
        cornerRadius: 16,
        displayColors: true,
        usePointStyle: true,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(241, 245, 249, 0.5)',
          drawBorder: false,
        },
        ticks: {
          font: { size: 10, weight: '700' },
          color: '#94a3b8',
          padding: 8,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 10, weight: '800' },
          color: '#475569',
          padding: 8,
        },
      },
    },
  };

  return (
    <div className="w-full h-[220px]">
      <Line data={chartData as any} options={options as any} />
    </div>
  );
};

export default QualityStabilityChart;
