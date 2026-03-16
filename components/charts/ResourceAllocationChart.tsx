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

interface ResourceAllocationChartProps {
  data: Array<{
    month: string;
    active: number;
    overdue: number;
    completed: number;
  }>;
  t: Record<string, string>;
}

export const ResourceAllocationChart = React.forwardRef<any, ResourceAllocationChartProps>(
  ({ data }, ref) => {
    const chartData = {
      labels: data.map((item) => item.month),
      datasets: [
        {
          label: 'Active',
          data: data.map((item) => item.active),
          backgroundColor: '#E95420', // Ubuntu Orange
          borderColor: '#E95420',
          borderWidth: 1,
        },
        {
          label: 'Overdue',
          data: data.map((item) => item.overdue),
          backgroundColor: '#5E2750', // Ubuntu Aubergine (Lighter)
          borderColor: '#5E2750',
          borderWidth: 1,
        },
        {
          label: 'Completed',
          data: data.map((item) => item.completed),
          backgroundColor: '#0E8420', // Ubuntu Green
          borderColor: '#0E8420',
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: 8, // Higher DPI for PDF
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
      animation: false as const,
    };

    return (
      <div className="h-48 w-full">
        <Bar ref={ref} data={chartData} options={options} plugins={[whiteBackgroundPlugin]} />
      </div>
    );
  }
);
