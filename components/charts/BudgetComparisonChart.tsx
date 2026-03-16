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
import { formatRupiah } from '../../utils/formatters';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const whiteBackgroundPlugin = {
  id: 'customCanvasBackgroundColor',
  beforeDraw: (chart: any) => {
    const { ctx } = chart;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
};

interface BudgetComparisonChartProps {
  data: Array<{
    title: string;
    planned: number;
    actual: number;
  }>;
  t: Record<string, string>;
}

export const BudgetComparisonChart = React.forwardRef<any, BudgetComparisonChartProps>(
  ({ data, t }, ref) => {
    const chartData = {
      labels: data.map((item) =>
        item.title.length > 15 ? item.title.substring(0, 15) + '...' : item.title
      ),
      datasets: [
        {
          label: t.planned_budget || 'Planned',
          data: data.map((item) => item.planned),
          backgroundColor: 'rgba(119, 33, 111, 0.2)', // Ubuntu Light Aubergine (Transparent)
          borderColor: '#77216F',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: t.utilized_budget || 'Utilized (Est.)',
          data: data.map((item) => item.actual),
          backgroundColor: '#E95420', // Ubuntu Orange
          borderColor: '#E95420',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };

    const options = {
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: 8, // Higher DPI for PDF
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            padding: 10,
            usePointStyle: true,
            font: { size: 10 },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.x !== null) {
                label += formatRupiah(context.parsed.x);
              }
              return label;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10 },
            callback: function (value: any) {
              if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
              if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M';
              return value;
            },
          },
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 10 } },
        },
      },
    };

    return (
      <div className="h-full w-full">
        <Bar
          ref={ref}
          data={chartData}
          options={{ ...options, animation: false }}
          plugins={[whiteBackgroundPlugin]}
        />
      </div>
    );
  }
);
