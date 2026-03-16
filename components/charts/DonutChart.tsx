import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Plugin to draw white background
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

interface DonutChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  t: Record<string, string>;
}

export const DonutChart = React.forwardRef<any, DonutChartProps>(({ data }, ref) => {
  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: data.map((item) => item.color),
        borderColor: data.map((item) => item.color),
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBorderColor: data.map((item) => item.color),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 8, // Extreme high resolution for crisp PDF
    plugins: {
      legend: {
        display: false, // We show custom legend below
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value}`;
          },
        },
      },
    },
    animation: false, // Essential for sharp PDF capture
    cutout: '60%', // Creates donut effect
  };

  return (
    <div className="w-32 h-32 mx-auto">
      <Doughnut ref={ref} data={chartData} options={options} plugins={[whiteBackgroundPlugin]} />
    </div>
  );
});
