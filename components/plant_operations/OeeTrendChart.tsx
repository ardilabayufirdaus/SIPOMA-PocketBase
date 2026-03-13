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
import { formatDate } from '../../utils/dateUtils';

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

interface OeeTrendChartProps {
  summaries: any[];
  unitId: string;
}

const OeeTrendChart: React.FC<OeeTrendChartProps> = ({ summaries, unitId }) => {
  const chartData = useMemo(() => {
    // Filter and sort summaries for this unit
    const unitData = summaries
      .filter((s) => s.unit === unitId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days

    const labels = unitData.map((s) => formatDate(new Date(s.date), 'dd/MM'));
    const oeeValues = unitData.map((s) => s.oee || 0);
    const availValues = unitData.map((s) => s.availability || 0);

    return {
      labels,
      datasets: [
        {
          label: 'OEE %',
          data: oeeValues,
          borderColor: '#E95420',
          backgroundColor: 'rgba(233, 84, 32, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          pointBorderWidth: 2,
          borderWidth: 3,
          z: 10,
        },
        {
          label: 'Availability %',
          data: availValues,
          borderColor: '#772953',
          borderDash: [5, 5],
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 1.5,
          z: 5,
        },
      ],
    };
  }, [summaries, unitId]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { size: 10, weight: '700' },
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 12,
        titleFont: { size: 13, weight: '900' },
        bodyFont: { size: 12, weight: '600' },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0,0,0,0.05)',
          drawBorder: false,
        },
        ticks: {
          font: { size: 10, weight: 'bold' },
          callback: (val: any) => `${val}%`,
        },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="w-full h-[250px]">
      <Line data={chartData as any} options={options as any} />
    </div>
  );
};

export default OeeTrendChart;
