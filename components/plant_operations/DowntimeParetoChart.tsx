import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DowntimeParetoChartProps {
  data: any[];
  type: 'duration' | 'frequency';
}

const DowntimeParetoChart: React.FC<DowntimeParetoChartProps> = ({ data, type }) => {
  const chartData = useMemo(() => {
    // 1. Group data by remarks
    const groups: Record<string, { duration: number; frequency: number }> = {};

    data.forEach((record) => {
      const category = record.remarks || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = { duration: 0, frequency: 0 };
      }
      groups[category].duration += parseFloat(record.duration) || 0;
      groups[category].frequency += 1;
    });

    // 2. Sort and take top 10
    const sorted = Object.entries(groups)
      .map(([label, stats]) => ({
        label,
        value: type === 'duration' ? stats.duration : stats.frequency,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const labels = sorted.map((item) => item.label);
    const values = sorted.map((item) => item.value);

    // 3. Calculate cumulative percentage for Pareto line
    const total = values.reduce((sum, val) => sum + val, 0);
    let runningTotal = 0;
    const cumulative = values.map((val) => {
      runningTotal += val;
      return total > 0 ? (runningTotal / total) * 100 : 0;
    });

    return {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: type === 'duration' ? 'Duration (min)' : 'Frequency (times)',
          data: values,
          backgroundColor: '#ef4444',
          borderRadius: 8,
          barThickness: 24,
          yAxisID: 'y',
        },
        {
          type: 'line' as const,
          label: 'Cumulative %',
          data: cumulative,
          borderColor: '#8b5cf6',
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#fff',
          pointBorderWidth: 3,
          fill: true,
          backgroundColor: 'rgba(139, 92, 246, 0.05)',
          tension: 0.4,
          yAxisID: 'y1',
        },
      ],
    };
  }, [data, type]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { size: 10, weight: '900', family: "'Outfit', 'Inter', sans-serif" },
          usePointStyle: true,
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
        beginAtZero: true,
        grid: {
          color: 'rgba(241, 245, 249, 0.5)',
          drawBorder: false,
        },
        ticks: {
          font: { size: 10, weight: '700' },
          color: '#94a3b8',
        },
      },
      y1: {
        beginAtZero: true,
        max: 100,
        position: 'right' as const,
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 10, weight: '700' },
          color: '#8b5cf6',
          callback: (value: any) => `${value}%`,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 10, weight: '800' },
          color: '#475569',
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  return (
    <div className="w-full h-[300px]">
      <Bar data={chartData as any} options={options as any} />
    </div>
  );
};

export default DowntimeParetoChart;
