import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface OeeLeaderboardProps {
  unitMetrics: any[]; // Array of { unit, oee, availability, performance, quality }
}

const OeeLeaderboard: React.FC<OeeLeaderboardProps> = ({ unitMetrics }) => {
  const chartData = useMemo(() => {
    // Sort by OEE descending
    const sorted = [...unitMetrics].sort((a, b) => b.oee - a.oee);
    const labels = sorted.map((m) => m.unit);

    return {
      labels,
      datasets: [
        {
          label: 'Availability',
          data: sorted.map((m) => m.availability),
          backgroundColor: '#3b82f6',
          borderRadius: 8,
          barThickness: 12,
        },
        {
          label: 'Performance',
          data: sorted.map((m) => m.performance),
          backgroundColor: '#f59e0b',
          borderRadius: 8,
          barThickness: 12,
        },
        {
          label: 'Quality',
          data: sorted.map((m) => m.quality),
          backgroundColor: '#10b981',
          borderRadius: 8,
          barThickness: 12,
        },
        {
          label: 'Overall OEE',
          data: sorted.map((m) => m.oee),
          backgroundColor: '#ef4444',
          borderRadius: 12,
          barThickness: 24,
          borderWidth: 0,
        },
      ],
    };
  }, [unitMetrics]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          font: { size: 10, weight: '900', family: "'Outfit', 'Inter', sans-serif" },
          usePointStyle: true,
          pointStyle: 'rectRounded',
          padding: 20,
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
        callbacks: {
          label: (context: any) => ` ${context.dataset.label}: ${context.raw.toFixed(1)}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(241, 245, 249, 0.5)',
          drawBorder: false,
        },
        ticks: {
          font: { size: 10, weight: '700' },
          color: '#94a3b8',
          padding: 10,
          callback: (value: any) => `${value}%`,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11, weight: '900' },
          color: '#475569',
          padding: 10,
        },
      },
    },
  };

  return (
    <div className="w-full h-[350px]">
      <Bar data={chartData as any} options={options as any} />
    </div>
  );
};

export default OeeLeaderboard;
