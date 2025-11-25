import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ComboChartProps {
  data: Array<Record<string, any>>;
  height?: number;
  areas?: Array<{
    dataKey: string;
    stroke: string;
    fill: string;
    name: string;
  }>;
  bars?: Array<{
    dataKey: string;
    fill: string;
    name: string;
  }>;
  lines?: Array<{
    dataKey: string;
    stroke: string;
    name: string;
  }>;
}

const ComboChart: React.FC<ComboChartProps> = ({
  data,
  height = 400,
  areas = [],
  bars = [],
  lines = [],
}) => {
  const labels = data.map((item) => item.date || item.name || 'Unknown');

  const datasets = [
    ...areas.map((area, index) => ({
      type: 'line' as const,
      label: area.name,
      data: data.map((item) => Number(item[area.dataKey]) || 0),
      backgroundColor: area.fill,
      borderColor: area.stroke,
      fill: true,
      tension: 0.1,
    })),
    ...bars.map((bar, index) => ({
      type: 'bar' as const,
      label: bar.name,
      data: data.map((item) => Number(item[bar.dataKey]) || 0),
      backgroundColor: bar.fill,
      borderColor: bar.fill,
      borderWidth: 1,
    })),
    ...lines.map((line, index) => ({
      type: 'line' as const,
      label: line.name,
      data: data.map((item) => Number(item[line.dataKey]) || 0),
      backgroundColor: line.stroke,
      borderColor: line.stroke,
      borderWidth: 2,
      fill: false,
      tension: 0.1,
    })),
  ];

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
    },
  };

  const chartData = {
    labels,
    datasets,
  };

  return (
    <div style={{ height }}>
      <Chart type="bar" data={chartData} options={options} />
    </div>
  );
};

export default ComboChart;


